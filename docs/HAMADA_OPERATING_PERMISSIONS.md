# NEXUS MASTER CONTROL - HAMADA OPERATING PERMISSIONS

**Date:** 2026-05-21

## Allowed Projects
Only the following 3 projects are permitted to be opened, analyzed, or modified in this session:
1. **Omega Ops Dashboard**: `D:\NEXUS\PROJECTS\omega-ops-dashboard`
2. **Recruitment Hub**: `D:\NEXUS\PROJECTS\recruitment-hub`
3. **Nexus Command Center**: `D:\NEXUS\PROJECTS\nexus-command-center`

## Default Mode
- **Read-only Audit:** Default operation is to only read files, analyze architecture, and check code.
- No code changes will be made by default.

## Allowed Only with Explicit Approval
The following actions require the exact phrase **"نفذ تعديل"** (Execute modification), **"اعمل commit"** (Do commit), or similar explicit approval:
- Modifying any code or configuration file.
- Performing `git commit`.
- Performing database migrations.
- Performing Supabase write operations.

## Never Allowed
- **Pushing code:** `git push` is completely forbidden unless explicitly authorized by Mohamed.
- **Reading or printing secrets:** No reading, echoing, or printing of `.env` files or other secret tokens.
- **Opening unlisted/duplicate projects:** E.g., `omega-ops-dashboard 10`.
- **Production writes:** Interacting with production DBs/systems to write data.
- **Deleting files:** Removing any file from the disk.
- **Adding dependencies:** Running `npm install <pkg>` or `yarn add`.
- **External API calls:** Unless explicitly part of the allowed NEXUS architecture and approved.

## Project-Specific Rules
- Adhere strictly to the `NEXUS BUILD SYSTEM — GLOBAL PRODUCTION RULES`.
- All dashboard data must be read from Supabase.
- Strict TypeScript must be enforced.
- Dark NEXUS UI principles only.

## Reporting Rules
- Always audit first, explain the existing state, identify the problem, propose the minimal fix, and wait for approval.
- Before modification, report risk levels and current git status.
- After execution, report files changed, what changed, verification commands run, remaining risks, and next step.
