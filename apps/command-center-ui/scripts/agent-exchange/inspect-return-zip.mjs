import { mkdir, readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';

async function inspectPatch() {
  const [,, extractedDir, taskPackDir] = process.argv;
  
  if (!extractedDir || !taskPackDir) {
    console.error("Usage: node inspect-return-zip.mjs <extractedDir> <taskPackDir>");
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '').slice(0, 14);
  let status = 'SAFE TO REVIEW';
  const risks = [];
  
  try {
    const manifestPath = join(extractedDir, 'patch_manifest.json');
    let manifestData = '';
    try {
      manifestData = await readFile(manifestPath, 'utf8');
    } catch(e) {
      risks.push("patch_manifest.json missing or unreadable.");
      status = 'REJECTED';
    }

    let allowedFiles = [];
    try {
      const allowedData = await readFile(join(taskPackDir, 'allowed_files.json'), 'utf8');
      allowedFiles = JSON.parse(allowedData);
    } catch(e) {
      risks.push("Could not read allowed_files.json from task pack.");
      status = 'REJECTED';
    }

    let changedFiles = [];
    try {
      const changedDir = join(extractedDir, 'changed_files');
      changedFiles = await readdir(changedDir, { recursive: true });
    } catch(e) {
      risks.push("changed_files folder missing.");
      status = 'REJECTED';
    }

    for (const f of changedFiles) {
      const lower = f.toLowerCase();
      if (lower.includes('.env') || lower.includes('secret') || lower.includes('token') || lower.includes('key')) {
         risks.push("Forbidden pattern in file name: \");
         status = 'REJECTED';
      }
      if (lower.includes('..') || lower.startsWith('/') || lower.startsWith('\\') || lower.includes(':')) {
         risks.push("Path traversal or absolute path detected: \");
         status = 'REJECTED';
      }
      if (lower.endsWith('.exe') || lower.endsWith('.dll') || lower.endsWith('.bin')) {
         risks.push("Binary file detected: \");
         status = 'REJECTED';
      }
      
      const isAllowed = allowedFiles.some(af => f.includes(af) || af.includes(f));
      if (!isAllowed) {
         risks.push("File outside allowed_files.json: \");
         status = 'REJECTED';
      }
    }

    const finalDir = status === 'REJECTED' 
      ? "D:\\NEXUS\\AGENT_REJECTED\\RUN_\" 
      : "D:\\NEXUS\\AGENT_REVIEW\\RUN_\";

    await mkdir(finalDir, { recursive: true });
    
    await rename(extractedDir, join(finalDir, 'patch_data'));
    
    const reviewReport = "# Review Report\n- Status: \\n- Run: \";
    await writeFile(join(finalDir, 'review_report.md'), reviewReport);
    
    const riskReport = "# Risk Report\n\";
    await writeFile(join(finalDir, 'risk_report.md'), riskReport);
    
    await writeFile(join(finalDir, 'apply_plan.md'), "# Apply Plan\n- Requires OWNER APPROVAL.\n- Auto Apply is FORBIDDEN.\n- To apply, manually copy files from \ to destination project.");
    
    console.log("INSPECTION \. Files moved to \");

  } catch (err) {
    console.error("Critical error during inspection:", err);
    process.exit(1);
  }
}

inspectPatch().catch(console.error);
