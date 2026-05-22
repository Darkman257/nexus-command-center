import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function createPack() {
  const [,, projectId, taskTitle, allowedFilesStr, instructions] = process.argv;
  if (!projectId || !taskTitle || !allowedFilesStr || !instructions) {
    console.error("Usage: node create-task-pack.mjs <projectId> <taskTitle> <allowedFiles> <instructions>");
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '').slice(0, 14);
  const packName = "TASK_\_\";
  const packDir = "D:\\NEXUS\\AGENT_TASK_PACKS\\\";

  await mkdir(packDir, { recursive: true });

  const allowedFiles = allowedFilesStr.split(',').map(s => s.trim());

  await writeFile(join(packDir, 'task.md'), "# Task: \\n\n## Instructions\n\\n");
  await writeFile(join(packDir, 'project_scope.json'), JSON.stringify({ projectId, packName, timestamp }, null, 2));
  await writeFile(join(packDir, 'allowed_files.json'), JSON.stringify(allowedFiles, null, 2));
  await writeFile(join(packDir, 'forbidden_files.json'), JSON.stringify(['.env', '*.secret', 'keys/*', 'tokens.json'], null, 2));
  await writeFile(join(packDir, 'safety_rules.md'), "# Safety Rules\n1. No secrets.\n2. No production db writes.\n3. Keep within allowed files.\n");
  await writeFile(join(packDir, 'expected_output.md'), "# Expected Output\n1. patch_manifest.json\n2. run_report.md\n3. changed_files/\n");
  await writeFile(join(packDir, 'return_patch_format.md'), "# Format\nReturn a ZIP containing patch_manifest.json and changed_files folder.\n");

  console.log("Task Pack created at: \");
  console.log("\nReady ZIP command:");
  console.log("powershell -Command "Compress-Archive -Path '\\\*' -DestinationPath 'D:\\NEXUS\\AGENT_TASK_PACKS\\\.zip' -Force"");
}

createPack().catch(console.error);
