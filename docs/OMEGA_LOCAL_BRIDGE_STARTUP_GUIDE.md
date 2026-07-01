# OMEGA LOCAL BRIDGE — STARTUP & ARCHITECTURE GUIDE

This document serves as the official operational guide for starting, configuring, and verifying the **NEXUS Omega Read-Only Hydration Local Bridge**.

---

## 1. Architectural Purpose & Security Context

### The Anon Key Security Gate
Originally, NEXUS attempted to read database records from the Omega Ops production tables using the standard client-side `VITE_SUPABASE_ANON_KEY`. During stabilization verification, a controlled permission check was conducted against selected Omega tables:
- **`projects`**: RLS rules blocked direct SELECT/INSERT (Secure).
- **`vehicles`**: **FAILED SAFETY TEST**. The table permitted anonymous `INSERT` queries directly from the client.

Because the `VITE_SUPABASE_ANON_KEY` is not verified read-only and allows write mutations on critical fleet assets, **direct frontend Supabase hydration is strictly forbidden**. 

### The Security Pivot: Local Backend Bridge Mode
To uphold strict system separation and prevent any accidental database writes or credential leakage, NEXUS implements the **Local Backend Bridge Mode**:
1. **Zero Client-Side Supabase Direct Access**: The Vite application (`command-center-ui`) contains absolutely no Supabase client instances, anon keys, or database endpoint URLs.
2. **Server-Side Credentials**: The privileged database connection is handled exclusively by a backend server running locally.
3. **Strict Isolation**: The highly privileged `SUPABASE_SERVICE_ROLE_KEY` resides strictly in the bridge's local server environment (`.env`), which is explicitly gitignored and never bundled in any browser assets.
4. **Data Sanitization**: RAW production columns (e.g. employee details, payroll logs, CVs) are excluded or sanitized server-side. Only safe telemetry metadata is translated into standardized `RuntimeEvent` nodes before entering the NEXUS strategic event bus.

---

## 2. Bridge Specifications

- **Local Address Binding**: Binds strictly to `127.0.0.1` (loopback only) on port `5057`. It is inaccessible to any external incoming networks.
- **Strict CORS Policy**: Restricted strictly to browser clients originating from:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
- **GET-Only Rule**: Only HTTP `GET` verbs are processed. Any `POST`, `PATCH`, `PUT`, or `DELETE` attempt immediately terminates with an HTTP `405 Method Not Allowed` payload.
- **Cache Suppression**: Appends no-store headers to guarantee that polled operational intelligence is fresh, bypassing any proxy caching.

### Endpoint Telemetry Map

#### 1. `GET /health`
- **Function**: Health check confirming that the bridge is online and operations are running under read-only rules.
- **Response Shape**:
  ```json
  {
    "ok": true,
    "mode": "omega-local-read-only-bridge",
    "mutations": "disabled"
  }
  ```

#### 2. `GET /omega/snapshot`
- **Function**: Returns a sanitized, lightweight snapshot of the latest 10 rows from the primary Omega operational tables for manual diagnostic reviews.
- **Tracked Tables**: `projects`, `staff`, `attendance_logs`, `vehicles`, `site_admin_tasks`.
- **Sanitization**: Adds `source_table`, `record_id`, and `last_seen_at` metadata fields to each row while stripping raw private payload records.

#### 3. `GET /omega/events`
- **Function**: Queries recent database updates, transforms them into safe `RuntimeEvent` schemas, and prepares them to be polled and published into the NEXUS event conduit.
- **Event Mapping Telemetry**:
  - `projects` -> `SYSTEM_STATUS` (Low severity)
  - `attendance_logs` -> `SECURITY_ALERT` (Medium severity if status is absent/late)
  - `vehicles` -> `RISK_EVENT` (High severity if vehicle status is maintenance/issue)

---

## 3. Local Execution Guide

Follow these steps to spin up the bridge and the Command Center frontend concurrently on your local machine.

### A. Environment Configuration
Create a local-only, gitignored `.env` file inside the bridge directory:

`apps/omega-local-bridge/.env`
```env
# Omega Production Database Config (Local Bridge Server Use Only)
SUPABASE_URL=https://kbdvcrjifqlunzawkobg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVILEGED_SERVICE_ROLE_KEY_HERE

# Server Port and Interface Bind
OMEGA_BRIDGE_PORT=5057
OMEGA_BRIDGE_HOST=127.0.0.1
```
*Note: Never share this file or commit it to GitHub.*

### B. Launching the Local Hydration Bridge
1. Open a new terminal window in the project root.
2. Change directory into the bridge workspace or use the workspace script wrapper:
   ```bash
   pnpm --filter omega-local-bridge install
   pnpm --filter omega-local-bridge run dev
   ```
3. Look for the startup log confirmation:
   ```text
   Omega Local Bridge running at http://127.0.0.1:5057
   ```

### C. Launching the Command Center UI
1. Open a separate terminal window in the project root.
2. Spin up the Vite development server:
   ```bash
   pnpm -C apps/command-center-ui run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

---

## 4. Verification Procedures

To confirm that the bridge is running securely and the hydration path is healthy, run the following verification checks:

### 1. Security Isolation Test (GET-Only & CORS Guard)
Attempt to send a mock POST write request using curl:
```bash
curl -X POST http://127.0.0.1:5057/omega/events
```
**Expected Secure Response**:
```json
{
  "error": "Method Not Allowed",
  "mode": "read-only-bridge"
}
```

### 2. Live Telemetry Polling Test
Use a web browser or curl to fetch real events:
```bash
curl http://127.0.0.1:5057/omega/events
```
**Expected Response**: A JSON payload containing a series of `events` mapped to the `omega` workspace, complete with real production project and staff identifiers.

### 3. UI Status Verification
1. Access the Command Center UI, navigate to the **Runtime Memory** compartment or the **Settings Panel**.
2. Examine the **Omega Bridge Control Console**:
   - Status Indicator: Shows `READ-ONLY ACTIVE` (when the local bridge is responsive) or `DISABLED` (fallback mock mode when offline).
   - Core Hydration Mode: Shows `OMEGA READ-ONLY` or `MOCK / LOCAL`.
   - Local Bridge Port: Verified active on port `5057`.
3. Toggle the **Enable Omega Read-Only Bridge** controls. The dashboard will cease simulating events and start reading real, sanitized production ticks from the Express bridge server.

---
*NEXUS Strategic Bridge Stabilization Documentation Sealed — Maintained by Operations*
