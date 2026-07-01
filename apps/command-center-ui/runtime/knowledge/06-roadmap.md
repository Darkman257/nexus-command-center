# 06 — NEXUS Roadmap

## Phase 1: Runtime Stabilization ✅ DONE

**Goal**: Get all local services running cleanly on Windows.
**Completed**:
- Diagnosed Windows elevation / admin issue
- Enabled Hyper-V, WSL2, Virtual Machine Platform
- Started Docker Desktop successfully
- Validated Ollama runtime with 4 models
- Confirmed Recruitment Hub on port 5173
- Confirmed Command Center on port 5174
- Confirmed Omega Dashboard on port 3000
- Confirmed Omega Gateway on port 5001
- Confirmed Omega Local Bridge on port 5057
- Fixed stale endpoint: 9999/api/ping → 5057/health
- Fixed stale endpoint: 3820 → 5173

---

## Phase 2: NOVA Identity ✅ DONE

**Goal**: Give NOVA a proper operational identity, correct model, and grounded system prompt.
**Completed**:
- Replaced blind model selection (first-available) with priority list
- qwen2.5:7b confirmed as primary NOVA chat model
- nomic-embed-text excluded from chat model selection
- nova-system-prompt.md created with identity, rules, project knowledge, runtime history
- NOVA responds correctly in Arabic, identifies Hamada and Moh Khairy, uses live status
- Build passing: tsc -b + vite build clean

---

## Phase 3: Knowledge Core ✅ NOW IN PROGRESS

**Goal**: Give NOVA structured, editable knowledge about the full NEXUS ecosystem.
**In progress**:
- runtime/knowledge/ folder created
- 00-nexus-architecture.md: full architecture layers
- 01-projects.md: all NEXUS projects documented
- 02-runtime-services.md: port registry + startup commands
- 03-decisions.md: all key decisions logged
- 04-github-repos-review.md: external repo evaluations
- 05-people-agents.md: all people and agent roles
- 06-roadmap.md: this file
- nova-backend.ts updated to load all knowledge files into NOVA system prompt

---

## Phase 4: Searchable Memory (PLANNED)

**Goal**: NOVA can recall past sessions, decisions, and conversations semantically.
**Design**:
- Use nomic-embed-text to embed session logs, conversation summaries, and decision records
- Store embeddings locally (file-based or SQLite)
- Allow NOVA to answer "what did we decide last week?" with semantic search
- Reference: rohitg00/agentmemory architecture pattern

**Prerequisites**:
- Phase 3 stable
- Local embedding pipeline using Ollama /api/embeddings
- Session logging infrastructure

---

## Phase 5: Repo Intelligence (PLANNED)

**Goal**: NOVA can reason about the actual code in NEXUS repos.
**Design**:
- Index key files from nexus-command-center, omega-ops-dashboard, recruitment-hub
- Embed function signatures, module summaries, schema extracts
- Allow NOVA to answer "what does AppContext.tsx export?" or "how is payroll loaded?"
- Reference: gemini-cli agent architecture

**Prerequisites**:
- Phase 4 complete
- Incremental file indexer built by Hamada

---

## Phase 6: Telegram / Sally Workflow (PLANNED)

**Goal**: NOVA receives real-time updates from Telegram and can route tasks to Hamada.
**Design**:
- n8n workflow connects Telegram → NEXUS
- Sally (Telegram bot) receives CVs, messages, alerts
- Parsed data flows into Recruitment Hub / Supabase
- NOVA gets notified of new candidates or alerts

**Prerequisites**:
- n8n instance running (local or cloud)
- Telegram bot token (private, stored in .env only)
- Recruitment Hub intake endpoint stable

---

## Phase 7: Voice / Mobile / Desktop Packaging (PLANNED)

**Goal**: NEXUS accessible beyond the browser.
**Design options**:
- Voice: Web Speech API → NOVA chat (reference: microsoft/Copilot-Studio-Chat-PCF-Control-with-Voice)
- Mobile: iOS app via PakePlus-iOS (requires macOS + Xcode)
- Desktop: Tauri or Pake wrapper for Command Center
- Electron considered but rejected for size — Tauri preferred

**Prerequisites**:
- All previous phases stable
- Hardware/platform access for mobile build
