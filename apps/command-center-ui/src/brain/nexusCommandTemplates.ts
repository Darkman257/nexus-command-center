export function generateHamadaCommand(project: string, action: string, context: string = ''): string {
  const scopeMap: Record<string, string> = {
    'Omega Ops Dashboard': 'D:\\NEXUS\\PROJECTS\\omega-ops-dashboard',
    'Recruitment Hub': 'D:\\NEXUS\\PROJECTS\\recruitment-hub',
    'Nexus Command Center': 'D:\\NEXUS\\PROJECTS\\nexus-command-center',
    'All Projects / Master Control': 'ALL'
  };

  const scope = scopeMap[project] || 'D:\\NEXUS\\PROJECTS';

  return `HAMADA — ${project.toUpperCase()} — ${action.toUpperCase()}

Scope:
${scope}

Goal:
${action}
${context}

STRICT RULES:
- Work only inside ${project}
- Do NOT push.
- Do NOT read or print .env/secrets.
- Do NOT run production DB migrations without explicit approval.
- Follow global NEXUS rules.

Steps:
1. Audit current files related to the goal.
2. Formulate minimal safe plan.
3. Wait for approval before executing changes.

Validation:
- pnpm run build
- git diff --check
- Safety scan against forbidden patterns.

Report required after execution.
`;
}
