# 01 — NEXUS Projects

## NEXUS Command Center

**Repo**: D:\NEXUS\PROJECTS\nexus-command-center
**Stack**: React + Vite + TypeScript + Tailwind
**Port**: 5174 (dev)
**Purpose**: Central control room for the NEXUS ecosystem.
Contains NOVA chat interface, local runtime status, service launcher, and future operational modules.
Includes the NOVA backend plugin (Vite middleware) at apps/command-center-ui/nova-backend.ts.

**Sub-packages**:
- command-center-ui: Main React UI
- omega-local-bridge: Read-only bridge to Omega Supabase data

---

## Recruitment Hub

**Repo**: D:\NEXUS\PROJECTS\recruitment-hub
**Stack**: React + Vite + TypeScript + Tailwind + Supabase
**Port**: 5173 (dev)
**Purpose**: Full candidate and hiring management system.
Handles CVs, applicant tracking, call center workflows, Supabase-backed records.
Connected to nexus_call_center Streamlit container for extended call center tooling.

---

## Omega Ops Dashboard

**Repo**: D:\NEXUS\PROJECTS\omega-ops-dashboard
**Stack**: React + Vite + TypeScript + Tailwind + Supabase
**Port**: 3000 (dev)
**Branch**: feat/project-scoped-work-control
**Purpose**: Operational dashboard for Omega business workflows.
Covers staff, fleet, housing, payroll, documents, approvals, attendance, clearance, recruitment, missions.
This is a live production-connected operational system. Real data. No mock fallbacks.

**Key modules**:
- Dashboard
- Staff
- Fleet / Vehicles
- Housing
- Payroll
- Documents
- Approvals
- Recruitment
- Mission Modules
- Site Admin Tasks
- Employee In / Out
- Clearance Engine

**Key Supabase tables**:
- projects, staff, vehicles, payroll_records, documents
- housing_units, approvals, attendance, attendance_logs
- employee_clearance_items, site_admin_tasks
- applicants, recruitment_media_assets

---

## Omega Gateway API Server

**Repo**: D:\NEXUS\PROJECTS\omega-ops-dashboard\artifacts\api-server
**Stack**: Node.js + Fastify + TypeScript
**Port**: 5001
**Health endpoint**: GET /api/healthz → { "status": "ok" }
**Purpose**: REST API layer for Omega operations.
Connects to Supabase using service role key.
Started via: node --enable-source-maps --env-file=.\.env .\dist\index.mjs

---

## Omega Local Bridge

**Repo**: D:\NEXUS\PROJECTS\nexus-command-center\apps\omega-local-bridge
**Port**: 5057
**Health endpoint**: GET http://127.0.0.1:5057/health → { "ok": true, "mode": "omega-local-read-only-bridge", "mutations": "disabled" }
**Purpose**: Read-only bridge between NEXUS Command Center / NOVA and Omega live Supabase data.
Mutations are disabled by design.
Old stale endpoint (now removed): http://localhost:9999/api/ping

---

## nexus_call_center (Streamlit Docker Container)

**Docker container name**: nexus_call_center
**Port**: 8501
**Stack**: Python + Streamlit
**Purpose**: Call center tooling built earlier in the NEXUS lifecycle.
Runs via Docker. WSL2 required.
Kept active unless Moh explicitly asks to stop it.
Accessed via: http://localhost:8501

---

## Telegram Agent / Sally

**Status**: Planned
**Tech**: n8n automation + Telegram Bot API
**Sally** is the internal naming for the Telegram/n8n-based recruitment intake agent.
It will handle incoming CV messages, WhatsApp intake, and alert routing into NEXUS.
Not yet deployed. Documented here for NOVA awareness.
