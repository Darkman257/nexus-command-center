# NEXUS BUSINESS MEMORY SYNC PLAN

This document outlines the strategic roadmap for fully syncing the NEXUS Command Center's Memory Kernel with live operational data from the Omega Ops Dashboard and Recruitment Hub.

## Objective
To replace static JSON seed domains (`omega.memory.json`, `recruitment.memory.json`) with automated, real-time ingestion pipelines that reflect live Supabase metrics.

## Phase Order & Implementation Strategy

### Phase 1: Omega Read-Only Aggregation (Read-Only)
- **What to sync:** Project statuses, vehicle locations, asset conditions, and task tracking.
- **How:** The Omega Local Bridge (`:5057`) will expose a `/api/memory/sync` endpoint.
- **Mechanism:** The Command Center will periodically (or manually via NOVA) fetch this endpoint. The Bridge uses an elevated Supabase service key to perform read-only aggregations across `projects`, `vehicles`, `tasks` tables, filtering out PII.

### Phase 2: Recruitment Pipeline Summarization (Read-Only)
- **What to sync:** Candidate pipelines, upcoming interviews, delayed follow-ups.
- **How:** Recruitment Hub (`:5174`) exposes a `/api/stats/pipeline` endpoint.
- **Mechanism:** Since CVs and candidate profiles contain highly sensitive PII, the endpoint will strictly return aggregated numbers, roles, and sanitized identifiers for tasks (e.g., "Candidate #1042 needs technical interview follow-up").

### Phase 3: Automated n8n Hooks (Write & Notify)
- **What to sync:** Critical alerts (e.g., failed deployments, urgent recruitment tasks).
- **How:** Configure n8n workflows to monitor database triggers.
- **Mechanism:** When a high-priority event occurs, n8n will POST directly to the Command Center's incoming memory webhook, appending to the `timeline.json` and notifying the `NovaFloatingAssistant`.

### Phase 4: Execution Bridge (Requires Approval)
- **What to sync:** Actionable events (e.g., approving a vehicle request, creating a new project).
- **How:** The `/api/services/action` endpoint on the `nova-backend.ts` router.
- **Mechanism:** NOVA prepares the payload (e.g., `Update Status to APPROVED`), but **MUST** prompt the Project Owner (Moh) for explicit approval before forwarding the request to the Omega Gateway (`:5001`).

## Security Rules
- **No Direct Frontend DB Access:** The Command Center UI will never hold Supabase keys.
- **Read-Only Default:** All memory syncing pipelines operate as Read-Only.
- **Explicit Approval for Writes:** Any modification (Execution Bridge) is gated by user permission (`نفذ`).
