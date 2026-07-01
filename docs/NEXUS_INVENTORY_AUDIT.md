# NEXUS SYSTEM INVENTORY AUDIT
**Generated:** 2026-05-30  
**Scope:** `D:\NEXUS\PROJECTS`  
**Author:** Antigravity — Audit Only, No Commits

---

## 1. PROJECTS TABLE

| Project ID | Name | Type | Path | Status | Stack |
|---|---|---|---|---|---|
| nexus-command-center | NEXUS Command Center | Control Panel UI | `D:\NEXUS\PROJECTS\nexus-command-center` | Active | React + Vite + TypeScript + Tailwind |
| omega-ops-dashboard | Omega Ops Dashboard | Operations Frontend | `D:\NEXUS\PROJECTS\omega-ops-dashboard` | Active | React + Vite + Supabase |
| omega-ops-api | Omega Gateway (API Server) | Backend API | `D:\NEXUS\PROJECTS\omega-ops-dashboard\artifacts\api-server` | Active | Node.js / Express |
| recruitment-hub | Recruitment Hub | HR + ATS App | `D:\NEXUS\PROJECTS\recruitment-hub` | Active | React + Vite + Supabase |
| nexus-launcher | NEXUS Launcher Scripts | Infra Scripts | `D:\NEXUS\PROJECTS\.nexus-launcher` | Active | PowerShell |
| el-sebaie-dashboard | EL SEbaie Dashboard | Asset Management | `D:\NEXUS\PROJECTS\EL SEbaie Dashboard` | Unknown | Unknown |
| powershield-server | PowerShield Server | Security Proxy | `D:\NEXUS\PROJECTS\powershield-server` | Not Started | Unknown |
| sally-cc | Sally Recruitment Command Center | External | `D:\NEXUS\PROJECTS\sally-recruitment-command-center` | Unknown | Unknown |

---

## 2. SERVICES TABLE

| Service ID | Name | Port | URL | Health Endpoint | Launchable | Status | Type |
|---|---|---|---|---|---|---|---|
| command-center | NEXUS Command Center | 5173 | http://localhost:5173 | /api/nova/local-status | Yes | Active | UI + Backend |
| nova-backend | NOVA Backend (Vite plugin) | 5173 | http://localhost:5173/api/nova/* | Inline with dev server | No (embedded) | Active | Embedded API |
| omega-dashboard | Omega Ops Dashboard | 3000 | http://localhost:3000 | http://localhost:3000 | Yes | Active | Frontend |
| omega-gateway | Omega Gateway (API) | 5001 | http://localhost:5001 | /api/healthz | Yes | Active | Backend API |
| recruitment-hub | Recruitment Hub | 5174 | http://localhost:5174 | http://localhost:5174 | Yes | Active | Frontend |
| omega-bridge | Omega Local Bridge | 5057 | http://localhost:5057 | /health | Yes | Offline | Local Bridge |
| ollama | Ollama Local LLM | 11434 | http://localhost:11434 | /api/tags | No | Active | LLM Engine |
| bridge-daemon | NEXUS Bridge Daemon (Legacy) | 9999 | http://localhost:9999 | /api/ping | No | Offline | Legacy Daemon |
| docker-legacy | Docker Legacy Call Center | 8501 | http://localhost:8501 | - | No | Unknown | Legacy App |

---

## 3. PORT MAP TABLE

| Port | Service | Status | Protocol |
|---|---|---|---|
| 3000 | Omega Ops Dashboard | Online | HTTP |
| 5001 | Omega Gateway API | Online | HTTP/REST |
| 5057 | Omega Local Bridge | Offline | HTTP |
| 5173 | NEXUS Command Center (Dev) | Online | HTTP/WS |
| 5174 | Recruitment Hub | Online | HTTP |
| 8501 | Docker Legacy App | Unknown | HTTP |
| 9999 | Legacy Bridge Daemon | Offline | HTTP |
| 11434 | Ollama LLM | Online | HTTP |

---

## 4. DATA SOURCES TABLE

| Data Source | Type | Location | Who Reads It | Live? |
|---|---|---|---|---|
| Supabase DB | Cloud PostgreSQL | Cloud (env: VITE_SUPABASE_URL) | Omega Dashboard, Recruitment Hub | Yes |
| NOVA Memory | Local JSONL | `runtime/memory/nexus-memory.jsonl` | NOVA Brain Engine | Yes |
| NOVA Knowledge Core | Markdown files | `runtime/knowledge/` | NOVA LLM Context (deprecated) | Yes |
| Brain Registry: Projects | JSON | `runtime/brain/projects.registry.json` | NOVA Brain Engine | Yes |
| Brain Registry: Services | JSON | `runtime/brain/services.registry.json` | NOVA Brain Engine | Yes |
| Brain Registry: Repos | JSON | `runtime/brain/repos.registry.json` | NOVA Brain Engine | Yes |
| Brain Registry: Decisions | JSON | `runtime/brain/decisions.registry.json` | NOVA Brain Engine | Yes |
| Runtime Logs | Text Logs | `.nexus-launcher/logs/*.log` | Manual / Bridge | Passive |
| Repo Files | TypeScript / JSON | `D:\NEXUS\PROJECTS\*` | Antigravity (execution only) | Read-only |
| Local Status (Telemetry) | HTTP probe | All service ports | `/api/nova/local-status` endpoint | Yes — every poll |

---

## 5. UI PAGES TABLE

| Page ID | Route Key | Name | Sidebar Visible | Status |
|---|---|---|---|---|
| cc | cc | Situation Room | Yes | Active |
| workspaces | workspaces | Workspaces | Yes | Active |
| intelligence-feed | intelligence-feed | Intelligence Feed | Yes | Active |
| data-intake | data-intake | Data Intake | Yes | Active |
| signals | signals | Signals & Alerts | Yes | Active |
| reports | reports | Reports | Yes | Active |
| automations | automations | Automations | Yes | Active |
| runtime-memory | runtime-memory | Runtime Memory | Yes | Active |
| operational-graph | operational-graph | Operational Graph | Yes | Active |
| settings | settings | Settings | Yes | Active |
| runtime-services | runtime-services | Runtime Services | **Hidden** (URL only `/runtime-services`) | Technical Backup |
| system-graph | system-graph | System Graph 3D | **To be added** | Created this session |

---

## 6. NOVA COMMAND TABLE

| Intent Type | Example Command (Arabic) | Handler | Status |
|---|---|---|---|
| open_app (Omega) | افتح أوميجا | Intent Router → ensureServiceOpen(3000) | ✅ Live |
| open_app (Recruitment) | افتح التوظيف | Intent Router → ensureServiceOpen(5174) | ✅ Live |
| status | اعرض حالة نكسس | Intent Router → localStatusStr | ✅ Live |
| project_list | ايه المشاريع عندنا؟ | Brain Registry → projects.registry.json | ✅ Live |
| service_list | ايه السيستمات المتوصلة؟ | Brain Registry → services.registry.json | ✅ Live |
| repo_query | فين ملفات أوميجا؟ | Brain Registry → repos.registry.json | ✅ Live |
| decision_query | ايه قراراتنا؟ | Brain Registry → decisions.registry.json | ✅ Live |
| audit_request | راجع مشروع التوظيف | Execution Pre-Bridge → ask for approval | ✅ Live (safe gate) |
| patch_request | صلح المشكلة دي | Execution Pre-Bridge → ask for approval | ✅ Live (safe gate) |
| analysis_request | حلل أوميجا | Execution Pre-Bridge → ask for approval | ✅ Live (safe gate) |
| llm_fallback | (any other query) | Ollama → selected model → reply polish | ✅ Live via Ollama |
| openai_fallback | (if Ollama offline) | OpenAI API → gpt-4o | ✅ Live (env key required) |

---

## 7. GAPS TABLE

| Gap | What It Is | What NOVA Can Do Now | What Needs Bridge |
|---|---|---|---|
| Real code execution | Moh says "صلح المشكلة" → NOVA needs to modify files | Can detect intent and request approval | Requires Antigravity / Hamada execution chain |
| Repo file reading | Read actual .ts/.tsx files from Omega/Recruitment | Cannot yet — only reads Brain Registry paths | Needs sandboxed file reader in backend |
| Supabase live data | Read actual records from Supabase tables | Cannot — only proxies to UI components | Needs Supabase server-side client in NOVA backend |
| Logs streaming | Read recent entries from .nexus-launcher/logs/*.log | Cannot yet | Needs log reader endpoint |
| Port discovery | Automatically detect which services are online | Partially — probes known ports via telemetry | Needs dynamic port scanner |
| Git status awareness | Know current branch, changes, untracked files | Cannot yet | Needs `exec('git status')` endpoint behind approval gate |
| Cross-project memory | Remember context across sessions | Partially — nexus-memory.jsonl is appended but not searched semantically | Needs embeddings or vector search |
| Execution confirmation | After "نفذ Audit" — actually trigger Hamada | Detects command, blocks, asks for approval | Phase 2: Build `/api/nova/execute` endpoint |
| Docker legacy monitoring | Understand what runs on port 8501 | Unknown | Needs manual documentation and health probe |
| PowerShield | Blocked — app not built | Not available | Future phase |

---

## 8. RECOMMENDED NEXT PHASE

### Phase A — Execution Bridge (Most Critical)
- Build `/api/nova/execute` endpoint behind strict approval token
- NOVA returns a task token → Antigravity listens and executes only with confirmed token
- No file changes until explicit `/api/nova/execute` confirmation is received

### Phase B — Log Reader
- Add `/api/nova/logs?service=omega-gateway` endpoint
- Reads `.nexus-launcher/logs/*.log` (no secrets)
- NOVA can answer: "ايه اخر لوق لأوميجا جيتواي؟"

### Phase C — Git Status Endpoint
- Add `/api/nova/git-status` — runs `git status` in a given repo
- Returns modified/untracked file count only (no content)
- NOVA can answer: "فيه تعديلات غير محفوظة؟"

### Phase D — Cross-Session Vector Memory
- Replace JSONL linear scan with lightweight semantic search
- Enable: "فين اخر مرة تكلمنا عن أوميجا بريدج؟"

---
*End of Audit. No code was modified. No secrets were read.*
