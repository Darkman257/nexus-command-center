import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function createHamadaTask() {
  const args = process.argv.slice(2);
  if (args.length < 6) {
    console.error("Usage: node create-hamada-task.mjs <project> <taskType> <goal> <scope> <strictRules> <steps>");
    process.exit(1);
  }

  const [project, taskType, goal, scope, strictRules, steps] = args;
  
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '').slice(0, 14);
  const safeProject = project.replace(/\W+/g, '_');
  const safeType = taskType.replace(/\W+/g, '_');
  const taskName = `HAMADA_TASK_${timestamp}_${safeProject}_${safeType}`;
  const taskDir = join('D:\\NEXUS\\HAMADA_OUTBOX', taskName);

  await mkdir(taskDir, { recursive: true });

  const hamadaTaskMd = `# HAMADA - ${project} - ${taskType}

## Scope
${scope}

## Goal
${goal}

## Strict Rules
${strictRules}
- No Push
- No Production Writes
- No Secrets
- No Auto Apply
- Owner Approval Required

## Steps
${steps}

## Validation
- pnpm run build
- git diff --check
- Safety scan

## Expected Final Report
- Required Final Report
`;
  await writeFile(join(taskDir, 'HAMADA_TASK.md'), hamadaTaskMd);
  
  const taskJson = JSON.stringify({ project, taskType, goal, scope, strictRules, steps, timestamp }, null, 2);
  await writeFile(join(taskDir, 'task.json'), taskJson);
  
  await writeFile(join(taskDir, 'OWNER_RULES.md'), "# Owner Rules\n1. Owner is the only execution authority.\n2. Do NOT run production DB migrations without explicit approval.\n3. Do NOT execute shell commands from UI.\n");
  await writeFile(join(taskDir, 'EXPECTED_REPORT.md'), "# Expected Report\nReturn a comprehensive markdown report into HAMADA_INBOX.\n");
  await writeFile(join(taskDir, 'CONTEXT_SUMMARY.md'), "# Context\nGenerated via NEXUS Command Center Bridge V1.\n");

  console.log(`Hamada Task created successfully at:\n${taskDir}`);
}

createHamadaTask().catch(console.error);
