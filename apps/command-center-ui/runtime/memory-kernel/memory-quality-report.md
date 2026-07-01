# NEXUS Memory Quality Report

## What NOVA Knows
- **NEXUS:** System timeline, launcher responsibilities, architecture, active services, port mappings, recent decisions.
- **OMEGA:** General structure of projects, tasks, vehicles, and assets.
- **RECRUITMENT:** Candidate intake structure, interview stages, roles.

## What NOVA Does Not Know
- **OMEGA Live Data:** Real-time metrics from the Supabase `projects`, `tasks`, and `vehicles` tables.
- **RECRUITMENT Live Data:** The actual list of candidates, their CVs, phone numbers, and interview outcomes.
- **NEXUS Automation States:** Real-time n8n hook failures or successes.

## What Data Source is Needed Next
1. **Omega Live Sync Bridge:** A read-only query module that extracts metrics from Supabase without exposing secret keys to the frontend.
2. **Recruitment Storage Index:** An index of processed CVs and candidate pipeline statuses synced nightly.
3. **Automated Intent Embeddings:** Moving away from hardcoded regex matching towards NLP/vector-based intent matching for complex business queries.
