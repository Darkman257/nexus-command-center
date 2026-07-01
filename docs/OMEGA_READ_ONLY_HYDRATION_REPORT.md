# OMEGA READ-ONLY HYDRATION REPORT

## Architecture Decision
- **Bridge Mode Chosen**: Local Backend Bridge (`apps/omega-local-bridge`).
- **NEXUS now uses Local Backend Bridge Mode for Omega hydration. The browser never talks directly to Supabase using privileged keys. Omega operational rows are sanitized server-side and converted into safe runtime events before entering the NEXUS event bus.**
- **Reason**: The `VITE_SUPABASE_ANON_KEY` permission test failed. The anon key allowed an `INSERT` on the `vehicles` table, meaning it is not strictly read-only.
- **Safety**: The frontend hydration adapter was removed. NEXUS `command-center-ui` now only contacts `http://127.0.0.1:5057` via GET requests. The Supabase service role key is strictly isolated in the local backend bridge `.env`.


## Data Mapping & Connected Streams
The following streams are mapped from Omega production to NEXUS Runtime Events:

| Source Table | Mapped Event Type | Mapped Workspace | Severity Logic |
| :--- | :--- | :--- | :--- |
| `projects` | `SYSTEM_STATUS` | `omega` | Default Low |
| `attendance_logs` | `OPERATIONAL_EVENT` / `SECURITY_ALERT` | `omega` | Medium if status is 'absent' or 'late' |
| `vehicles` | `FLEET_EVENT` / `RISK_EVENT` | `omega` | High if status is 'maintenance' or 'issue' |

- **Excluded Data**: Finance, payroll, private HR files, CVs, and supplier contracts remain strictly disconnected.
- **Sanitization**: Raw private payloads are never sent to the frontend. All data is normalized with `source_table`, `record_id`, and `last_seen_at`.

## System States
- **MOCK / LOCAL MODE**: Active by default when the bridge is disabled or offline.
- **READ-ONLY ACTIVE**: Active when the local bridge is successfully polled.

## Remaining Risks
- The Omega production database `vehicles` table has an unsafe RLS policy allowing anonymous inserts. This should be fixed at the database level by the Omega Ops team.
- The local bridge relies on port 5057 availability.

## Next Recommended Stabilization Step
- Finalize the Data Intake Hub mapping with real data limits to prepare for supplier/contract ingestion workflows safely.
