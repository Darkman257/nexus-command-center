import type { NovaMemoryState } from './memoryTypes';
import { PROJECT_PROFILES } from './operationalSummary';

export function buildMemoryContext(state: NovaMemoryState): {
  currentMission: string;
  activeProjectContext: string;
  unresolvedAlerts: string[];
  lastHamadaCommand: string;
  memorySummary: string;
} {
  const currentMission = state.owner.currentOperationalFocus;
  
  // Format details for each project profile
  const activeProjectContext = Object.values(state.projects)
    .map(p => {
      const profile = PROJECT_PROFILES[p.id];
      return `Project: ${p.name}
- Stage: ${profile?.currentStage || 'N/A'}
- Purpose: ${profile?.purpose || ''}
- Objective: ${p.currentObjective}
- Status: ${p.currentStatus}
- Active Issues: ${p.activeIssues.join(', ') || 'None'}
- Next Step: ${p.recommendedNextStep}
- Advise Scope: ${profile?.allowedAdvice.join(', ') || 'General'}
- Forbidden Executions: ${profile?.forbiddenExecution.join(', ') || 'Direct execution'}`;
    })
    .join('\n\n');

  const unresolvedAlerts = state.operational.unresolvedAlerts;
  const lastHamadaCommand = state.session.generatedCommands.length > 0
    ? state.session.generatedCommands[state.session.generatedCommands.length - 1]
    : 'None generated in this session.';

  const memorySummary = `Current Focus: ${state.owner.currentOperationalFocus} (Phase: ${state.owner.currentPhase})
Last requested goal: ${state.owner.lastRequestedGoal}
Pinned Objectives: ${state.pinnedItems.join(', ') || 'None'}
Last actions: ${state.session.lastActions.slice(-3).join(' -> ') || 'None'}`;

  return {
    currentMission,
    activeProjectContext,
    unresolvedAlerts,
    lastHamadaCommand,
    memorySummary
  };
}
