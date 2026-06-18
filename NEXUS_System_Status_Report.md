# NEXUS & Omega System Status Report

This document outlines the current architectural layout, module status, containerization, and AI Agent integrations of the NEXUS / Omega project workspace based on the audited codebase.

---

## 1. System Architecture
The workspace consists of three core projects connected by a unified database backend and automated workflow layers:

1. **NEXUS Command Center** (`nexus-command-center`)
   * **Frontend (`command-center-ui`)**: A premium Vite-React-TypeScript dashboard featuring a vertical launcher rail, collapsible bottom tactical dock, and a Three.js 3D hologram core for system status telemetry.
   * **Daemon (`omega-local-bridge`)**: Node.js service daemon that provides process and port status tracking back to the UI.
2. **Omega Operations Dashboard** (`omega-ops-dashboard`)
   * **Frontend (`omega-dashboard`)**: Vite-React-TypeScript dashboard that tracks operational metrics. Communicates with Supabase using `AppContext` across tables: `projects`, `staff`, `documents`, `payroll_records`, `vehicles`, `housing_units`, `housing_assignments`, `site_admin_tasks`, `contracts`, and `payments`.
3. **Recruitment Hub** (`recruitment-hub`)
   * **Frontend**: React application for candidate pipeline tracking. Interacts with Supabase tables: `recruitment_candidates`, `recruitment_onboarding_queue`, `recruitment_interviews`, and `recruitment_call_logs`.

### Shared Database Layer
Both frontend apps share the identical Supabase project instance:
* **Host**: `kbdvcrjifqlunzawkobg.supabase.co`

---

## 2. Core Modules

### A. Payroll Builder (`Payroll.tsx`)
* **Status**: Deployed and fully functional.
* **Logic & Sizing**: Exposes compensation tracking interface (Basic Salary, Site Allowance, Overtime Pay, and Deductions in EGP). 
* **Calculations**: Computes net salaries dynamically. Handles adding and editing records using React Hook Form and Zod schemas.
* **Integration**: Reads/writes from `payroll_records` Supabase table. Integrates with an external Org Payroll Planner service (local storage base URL defaulting to `http://127.0.0.1:8000` and workspace `default-company`).

### B. Recruitment Hub
* **Status**: Deployed with core pages and placeholders.
* **Active Pages**:
  * `Candidates.tsx`: Inserts and reads from `recruitment_candidates` table (default status `screening`, call status `pending`, screening score `0`).
  * `CallCenter.tsx`: WhatsApp logs integration and interview queue management (`recruitment_interviews`, `recruitment_call_logs`).
  * `Dashboard.tsx`: Compiles active interview statuses and candidate pipeline steps.
  * `OnboardingQueue.tsx`: Manages transitional onboarding queue table.
* **Placeholders**:
  * `JobsCatalog.tsx`: Visually under construction (placeholder card).

---

## 3. Deployment & DevOps
The system containerizes its automated tasks via n8n under `powershield-server\malik-runtime\docker-compose.yml`:
* **n8n Container**: Runs n8n under container `malik-n8n-runtime` utilizing the image `docker.n8n.io/n8nio/n8n:latest`.
* **Port mapping**: Exposes port `5678` (`N8N_PORT`).
* **Runtime**: Runs with `--tunnel` parameter to enable local webhooks exposure.
* **Environment Configuration**: Exposes environment variables for:
  * Supabase URL & Service Role Key
  * Telegram bot token and owner chat ID
  * Groq & Tavily API Keys
* **Volumes**: Local persistence mapping `n8n_data` to `/home/node/.n8n`.
* **Frontend Services**: No custom Dockerfiles exist; the dashboards run directly on node runtimes/dev environments.

---

## 4. AI Agents Integration (Malik Assistant)

The Telegram AI Assistant ("Malik") is powered by a polling script bridging to an n8n webhook:

```
[Telegram Bot API]
       │ (getUpdates every 1s)
       ▼
[telegram-polling-bridge.cjs]
       │ (Filters for Owner ID: 813956170)
       ▼
[n8n Webhook Router] (Port 5678)
       │ (Routes based on keywords/commands)
       ├─► save_memory / forget_memory ──► Supabase `notes`
       ├─► save_task ────────────────────► Supabase `nexus_tasks`
       └─► owner / omega context ────────► Execute ECB & LLM Response
```

### A. Polling Bridge (`telegram-polling-bridge.cjs`)
* **Updates Loop**: Calls `https.get` updates from Telegram bot API at 1-second intervals.
* **Owner Authentication**: Filters message sender ID, restricting processing to Owner ID `813956170`, ignoring unauthorized queries.
* **Forwarding failover**: Posts updates to production webhook `/webhook/1/webhook/sally-webhook-unique-id`, falling back to `/webhook-test/` if inactive.

### B. Context & LLM Routing (`malik-04-telegram-webhook.json`)
* **Routing logic**: Inspects incoming text for route flags.
  * Tasks matching keywords (e.g., call, write, update) target `save_task`.
  * Memory phrases (e.g., "remember that...") target `save_memory` / `forget_memory`.
  * General owner inquiries target `owner`.
  * Operational project/fleet/staff questions target `omega`.
* **Executive Context Builder (ECB)**:
  * Pulls active contexts from Supabase in parallel:
    * Active profile: `/rest/v1/owner_profile?is_active=eq.true`
    * Recent history: `/rest/v1/conversation_history` (last 20 messages)
    * Tasks: `/rest/v1/nexus_tasks?status=neq.completed`
    * Memories: `/rest/v1/notes?category=eq.memory`
  * Logs transaction to `brain_events` (with fallback to `nexus_tasks`).
* **Omega Context**:
  * Detects query domain (projects, fleet, staff, assets, finance, attendance, audit).
  * Direct queries to target tables using Supabase REST interface.
  * Processes metrics inside n8n (e.g. counting pending approvals total amount, listing vehicle issues, calculating absent rates).
* **LLM Engine**:
  * Posts combined context (ECB + Omega Context) to Groq API.
  * **Model**: `llama-3.1-8b-instant`
  * **System Instructions**: Configures the agent to respond as "Malik", the executive assistant of Moh Khairy, in an Egyptian Arabic business tone (concise, professional).
