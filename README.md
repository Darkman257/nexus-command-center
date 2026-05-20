# NEXUS Command Center

A centralized telemetry and operational control cockpit for the NEXUS ecosystem.

## Project Structure
- `apps/command-center-ui`: Dark telemetry frontend shell (React + Vite + TS).
- `packages/shared-types`: Common types for agents and subsystems.
- `packages/connectors`: Subsystem API client definitions.
- `docs`: Design drafts and architecture plans.
- `scripts`: Local utility and daemon configurations.

## Running Locally (Phase 1 UI)
```bash
cd apps/command-center-ui
pnpm install
pnpm run dev
```
