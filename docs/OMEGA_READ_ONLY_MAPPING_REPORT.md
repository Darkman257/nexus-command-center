# OMEGA READ-ONLY MAPPING REPORT

## 1. Environment & Schema Audit Result
- **Env check:** `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STAFF_ACTIVATION_ALLOWED_EMAILS`, `NEXUS_INTERNAL_AGENT_KEY` were located in the neighboring `omega-ops-dashboard` configuration.
- **Security Check:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be securely ported into `apps/command-center-ui/.env`. The service-role key is absolutely **NOT** included in the frontend bundle.

## 2. Table Discovery (Limit 3)
During the audit phase, the following schema mapping was verified safely:
- **`projects`**: FOUND (Columns: `id, project_name, owner_name, consultant, scope_of_work, role, start_date, end_date, contract_value, completion_rate, status, created_at, spent`)
- **`staff`**: FOUND (Columns: `id, full_name, position, email, phone, hire_date, salary, status, created_at, project_id, housing_id, job_title, internal_code, vacation_balance...`)
- **`vehicles`**: FOUND (Columns: `id, car_name, plate_number, driver, fuel_balance, created_at, last_service, maintenance_cost, status, notes...`)
- **`attendance`**: FOUND (Columns: `id, employee_id, date, status, source, created_at...`)
- **`site_admin_tasks`**: FOUND (0 rows, schema active)

## 3. Mapped Event Types in `omegaReader.ts`
Raw Omega rows are now adapted into standard `RuntimeEvent` objects on the fly:
- **`SYSTEM_STATUS`**: Extracted from `projects` (tracking `status` and `completion_rate`).
- **`SECURITY_ALERT`**: Extracted from `staff` (tracking `clearance_status` and anomalous movement).
- **`LOGISTICS`**: Extracted from `vehicles` (tracking fleet `status` and allocations).

## 4. Read-Only Guarantees
- The `omegaReader.ts` adapter utilizes exclusively `.select()` methods.
- No `insert`, `update`, `upsert`, or `delete` imports exist within the adapter.
- Evidence references are strictly appended natively (`omega_table:staff`, `row_id:XX`, `read_timestamp:YY`).
- The Omega Bridge is decoupled behind a manual toggle (`isEnabled = false` by default).
- Fallback to `mockRuntimeFeed` automatically occurs if the Omega Bridge is disabled.

## 5. Build Result
- `tsc -b && vite build` executed successfully. 
- TypeScript enforced strict interface contracts on the `RuntimeEvent` translations without schema mismatch errors.

## 6. Known Risks
- **Rate Limiting:** Pulling intervals too frequently (currently set to 15s) might trigger Supabase rate limits on production.
- **Frontend Keys:** The Anon Key still needs to be manually injected into the UI `.env` before enabling the bridge to ensure RLS compliance.
- **Unmapped Fields:** Some heavy text fields (like `offboarding_notes` or `address`) are excluded from the `select()` filter to conserve bandwidth.

## 7. Next Recommended Safe Step
Initialize the frontend `.env` with the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and perform a live read-only verification inside the local dev server by temporarily enabling the `omegaRuntimeBridge`.
