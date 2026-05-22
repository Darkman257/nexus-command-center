# NEXUS BRAIN INTEGRATION — STEP 1 PLAN

## 1. Hand-off Confirmation
- **Handoff Document Read:** YES
- **Source of Authority:** `NEXUS_COMMAND_CENTER_BRAIN_ANTIGRAVITY_HANDOFF.md`

## 2. ZIP Inventory
The `nexus-research-report.zip` package has been inventoried.

### Reusable Data/Models/Docs
These files represent safe data, structured models, and specifications to be used as final implementation guides:
- `nexus_md_index.json`
- `nexus_md_search.sqlite`
- `nexus_memory.db`
- `nexus_capabilities.json`
- `nexus_capabilities.sqlite`
- `nexus_capability_schema.sql`
- `NEXUS_CAPABILITY_ENGINE.md`
- `NEXUS_PROJECT_LEARNING_PROTOCOL.md`
- `NEXUS_COMMANDER_CAPABILITY_UI_SPEC.md`

### Reference-Only Items
These items are for reading or structural understanding. They will not be deployed into production or executed:
- `NEXUS-MD-*.xlsx` and `.docx` raw files
- `*.py` reference scripts (e.g., `import_nexus_md.py`, `capability_registry.py`, `search_nexus_md.py`)
- `user_prompt-*.md` raw logs
- Report documents (`NEXUS_MD_SEARCH_REPORT.md`, `NEXUS_CAPABILITY_ENGINE_INTEGRATION_REPORT.md`)

### Unsafe/Unknown Items
These items must not be used or extracted to the UI codebase:
- `generate.js`
- `package.json` & `package-lock.json`
- `NEXUS_MD_SEARCH_ENGINE_PACKAGE.zip` (nested archives)

## 3. Module-by-Module Integration Plan

| Module | Target UI Placement | Data Source | Safety & Backend Requirements |
|---|---|---|---|
| Ask NEXUS Memory | `src/kernel/panels/MemoryPanel.tsx` | `nexus_md_search.sqlite` / `nexus_md_index.json` | Mock/Safe first. Later requires `/api/nexus-memory/search` backend. |
| Capability Registry | `src/kernel/panels/CapabilityRegistryPanel.tsx` | `nexus_capabilities.sqlite` / `nexus_capabilities.json` | Mock/Safe first. Later requires `/api/nexus-capabilities/search`. |
| Business Intake Advisor | `src/kernel/panels/BusinessIntakePanel.tsx` | UI State / Future LLM | Mock first. Later requires `/api/nexus-business/intake`. |
| Analyze Uploaded Files | `src/kernel/panels/FileAnalyzerPanel.tsx` | Local selection | Mock first. File preview only, no direct DB write. |
| Project Learning Intake | `src/kernel/panels/LearningIntakePanel.tsx` | Form Inputs -> JSON | Mock first. Will classify to `Pending Patches` via `/api/nexus-learning/ingest`. |
| Pending Patches | `src/kernel/panels/PendingPatchesPanel.tsx` | Memory + Capabilities | Mock first. Requires human approval before DB write. |
| Developer Guardrails | `src/kernel/panels/DeveloperGuardrailsPanel.tsx` | Hardcoded Checklists | Safe read-only UI first. |
| Agent Console (Antigravity Bridge) | `src/kernel/panels/AgentConsolePanel.tsx` | `nexus_projects.json` | UI composer only. Generates task packs. NO execution. |
| Product Launcher | `src/kernel/panels/ProductLauncherPanel.tsx` | Local workspace | UI only first. Shell execution forbidden from UI directly. |

## 4. File-by-File Implementation Plan

**UI modifications inside `apps/command-center-ui`:**
- `src/App.tsx`: Modify to add the NEXUS Brain sections / navigation.
- `src/kernel/NexusBrainLayout.tsx`: New container layout for the 9 new modules.
- `src/kernel/panels/*`: Create the 9 specific React components for each mode.
- `src/kernel/mockData.ts`: Create mock bridges representing the future API responses.

**Configuration & Docs:**
- Add `nexus_projects.json` configuration file to represent available workspaces.

## 5. Safe Execution Phases

1. **Phase 1: UI Scaffolding (Mock State)**
   - Build all layout components and panels using standard local data.
   - Connect UI to `mockData.ts` structures matching expected backend schema.
   - Implement Agent Task pack generation (string building, clipboard copy only).
2. **Phase 2: Local Read-Only Backend Wiring**
   - Import `.sqlite` databases safely into a read-only endpoint via NEXUS API Gateway (when ready).
3. **Phase 3: Write Capabilities (Approval Guarded)**
   - Enable pending patch flows through API Gateway.

## 6. Risk Points
- Blindly using Node/Python scripts from the ZIP might compromise host system or execute unsafe code. (Mitigated by treating as reference only).
- Agent execution triggered prematurely from UI could cause unwanted changes. (Mitigated by limiting Agent Bridge to a "prompt composer" in UI).
- Reading/writing outside boundaries. (Mitigated by strict project paths and keeping Command Center separated from Omega logic).

## 7. Recommended Next Step
Proceed to **STEP 2: Code Integration (Phase 1 UI Scaffolding)** using local mock data derived from the SQLite/JSON datasets, entirely avoiding backend execution logic at this stage. Waiting for explicit approval to begin.
