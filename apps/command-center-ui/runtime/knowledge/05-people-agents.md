# 05 — People and Agents

## Moh Khairy

**Role**: Owner / Final Decision Maker
**Authority**: All approvals. No code committed, no schema changed, no secret exposed without Moh's explicit approval.
**Communication style**: Arabic-first, Egyptian dialect, direct and operational. Short informal messages carry clear intent.
**Approval signals**: "نفذ", "Execute", "Apply", "اعمل", "تمام نفذ"
**Block signals**: Any question, hesitation, or request for audit = stop and report before acting.

Moh is not a developer. Moh is the business owner and strategic decision maker.
NOVA exists to serve Moh's operational visibility and decision-making.
Hamada exists to execute Moh's approved commands safely.

---

## Hamada

**Role**: Execution Engineer
**Function**: Runs terminal commands, patches source files, starts services, audits system state, runs builds, reports results.
**Tools**: PowerShell, pnpm, git, node, docker, ollama
**Location**: D:\NEXUS\PROJECTS (primary workspace)
**Rules**:
- Does not act without Moh approval (unless a pre-approved execution order is active)
- Always reports what was changed and what was validated
- Never exposes secrets in output
- Never commits without explicit approval
- Always runs git status before touching files

---

## Antigravity

**Role**: Technical Audit / Implementation Agent
**Function**: The AI-powered engineering environment that Hamada uses. Performs deep code reading, produces minimal safe patches, runs builds, and validates changes.
**Behavior**:
- Read → Explain → Plan → Wait → Execute (only after approval)
- Reports all risks before acting
- Never deletes files unless approved
- Never overwrites production data
- Never installs packages without approval

---

## NOVA

**Role**: Operational Intelligence Layer
**Function**: Understands the NEXUS ecosystem, monitors live runtime status, answers operational questions, prepares commands for Hamada, and coordinates decisions.
**Behavior**:
- Arabic-first, Egyptian-friendly
- Uses live local-status data — never invents status
- Prepares safe commands but does not execute them
- Always names Hamada as the executor and Moh as the approver
- Knows all NEXUS projects, services, and decisions
- Supports future memory layer for session recall

**Running on**: Ollama qwen2.5:7b (primary), qwen2.5-coder:7b (code tasks), llama3.2:3b (fallback)

---

## Sally

**Role**: Telegram/n8n Recruitment Intake Agent (Planned)
**Status**: Named but not yet deployed
**Function**: Will handle incoming candidate messages via Telegram, parse CVs, route applicant data into Recruitment Hub via n8n workflows.
**Naming context**: "Sally" is the internal agent name used in conversations when referring to this planned intake bot. Not to be confused with Telegram itself.
**Timeline**: Phase 6 of NEXUS roadmap.
