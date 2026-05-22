import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

async function scanInbox() {
  const inboxPath = 'D:\\NEXUS\\HAMADA_INBOX';
  try {
    const items = await readdir(inboxPath);
    const reports = [];
    
    for (const item of items) {
      const itemPath = join(inboxPath, item);
      const s = await stat(itemPath);
      if (s.isDirectory()) {
        reports.push({
          folder: item,
          project: 'Unknown Project',
          status: 'Needs Owner Review',
          date: s.mtime.toISOString(),
          needsOwnerApproval: true
        });
      }
    }
    
    console.log(JSON.stringify({ latestReports: reports }, null, 2));
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(JSON.stringify({ latestReports: [] }, null, 2));
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}

scanInbox().catch(console.error);
