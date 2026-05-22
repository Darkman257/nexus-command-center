import { generateHamadaCommand } from './nexusCommandTemplates';
import { KNOWN_PROJECT_STATES } from './nexusAdvisorData';

export function getLocalResponse(query: string, project: string): { type: 'text' | 'command', content: string }[] {
  const q = query.toLowerCase();
  const responses: { type: 'text' | 'command', content: string }[] = [];

  if (q.includes('خطوة') || q.includes('next step') || q.includes('إيه')) {
    responses.push({ type: 'text', content: `Current state for ${project}:\n${KNOWN_PROJECT_STATES[project as keyof typeof KNOWN_PROJECT_STATES] || KNOWN_PROJECT_STATES['All Projects / Master Control']}` });
    responses.push({ type: 'text', content: `Recommended next step: Proceed with cautious mock UI/wiring implementation or review pending DB migrations.` });
  } else if (q.includes('command') || q.includes('أمر') || q.includes('hamada')) {
    responses.push({ type: 'text', content: `I have prepared a draft command for you to copy:` });
    responses.push({ type: 'command', content: generateHamadaCommand(project, 'Generated Action', query) });
  } else if (q.includes('risk') || q.includes('مخاطر')) {
    responses.push({ type: 'text', content: `Risks identified:\n1. Unapproved DB Migrations.\n2. Accidental exposure of secrets.\n3. Running unsafe extracted UI patterns.\nEnsure you audit before generating code.` });
    responses.push({ type: 'command', content: generateHamadaCommand(project, 'Risk Audit', 'Scan project for forbidden API, secrets, or migration risks.') });
  } else if (q.includes('audit') || q.includes('مراجعة') || q.includes('review')) {
    responses.push({ type: 'text', content: `Preparing an audit command for ${project}...` });
    responses.push({ type: 'command', content: generateHamadaCommand(project, 'Full Project Audit', 'Audit the latest changes, build status, and uncommitted git diffs.') });
  } else if (q.includes('ui')) {
    responses.push({ type: 'command', content: generateHamadaCommand(project, 'UI Review', 'Review visual components and wiring for the current feature phase without changing logic.') });
  } else {
    responses.push({ type: 'text', content: `I am a V0 local advisor. I recognized your input: "${query}". I can generate audit, risk, and action commands for ${project}. Try using the Quick Action buttons.` });
  }

  return responses;
}
