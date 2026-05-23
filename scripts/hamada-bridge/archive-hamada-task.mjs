import { rename, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

async function archiveTask() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: node archive-hamada-task.mjs <taskFolderName>");
    process.exit(1);
  }

  const [taskFolder] = args;
  const sourcePath = join('D:\\NEXUS\\HAMADA_OUTBOX', taskFolder);
  const archivePath = join('D:\\NEXUS\\HAMADA_ARCHIVE', taskFolder);

  await mkdir('D:\\NEXUS\\HAMADA_ARCHIVE', { recursive: true });
  
  try {
    await rename(sourcePath, archivePath);
    console.log(`Archived task ${taskFolder} successfully.`);
  } catch (err) {
    console.error(`Failed to archive: ${err.message}`);
  }
}

archiveTask().catch(console.error);
