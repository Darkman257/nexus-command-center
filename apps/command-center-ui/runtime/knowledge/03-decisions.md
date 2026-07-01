# 03 — Decisions Log

Decisions made by Moh Khairy and executed by Hamada/Antigravity.
NOVA must respect these decisions and not suggest reversing them without explicit discussion.

---

## AI Model Decisions

| Decision | Rationale | Date |
|---|---|---|
| Use Ollama as primary AI runtime | Local privacy, no cloud costs, Arabic support | 2026-05 |
| qwen2.5:7b as primary chat model | Best Arabic+English general reasoning in available models | 2026-05-29 |
| qwen2.5-coder:7b for code tasks | Specialized code analysis, TypeScript debugging | 2026-05-29 |
| nomic-embed-text reserved for embeddings only | Not a chat model — using it for chat gives empty/wrong responses | 2026-05-29 |
| Model priority list instead of first-available | Prevents embed-only model from being selected for chat | 2026-05-29 |
| OpenAI as fallback only | Used if Ollama offline and OPENAI_API_KEY present | Existing |

---

## Bridge & Connectivity Decisions

| Decision | Old Value | New Value | Date |
|---|---|---|---|
| Bridge health endpoint | http://localhost:9999/api/ping | http://127.0.0.1:5057/health | 2026-05-29 |
| Recruitment Hub URL | http://localhost:3820 | http://localhost:5173 | 2026-05-29 |
| Bridge mode | Mutations enabled | Read-only, mutations disabled | Existing |

---

## Engineering Decisions

| Decision | Rule |
|---|---|
| No commit without Moh approval | Explicit verbal/written نفذ or Execute required |
| Audit before patch | Read files, explain state, identify problem, then fix |
| No schema changes without approval | Never ALTER TABLE / DROP / RLS without explicit OK |
| No mock data in production | All data must come from Supabase via real queries |
| No secrets in code or output | .env values never printed, never committed |
| No packages installed without approval | pnpm install blocked until Moh agrees |
| TypeScript strict mode | No `any`, no @ts-ignore without justification |
| File size limit | No file over 300 lines unless pre-existing |

---

## Infrastructure Decisions

| Decision | Rationale | Date |
|---|---|---|
| WSL2 enabled | Required for Docker Desktop on Windows | 2026-05-29 |
| Hyper-V enabled | Required for WSL2 | 2026-05-29 |
| Docker Desktop kept | nexus_call_center container dependency | 2026-05 |
| nexus_call_center kept running | Recruitment/call-center tooling still in use | 2026-05 |
| Desktop launcher created | Allow Moh to start full NEXUS runtime without terminal | 2026-05-29 |
| Chrome --app mode for UIs | App-like windows without browser chrome, cleaner UX | 2026-05-29 |

---

## Security Decisions

| Decision |
|---|
| Never print .env file contents |
| Never log Supabase service role keys |
| Never expose API keys in reports |
| Never commit CVs, PDFs, images, or candidate data |
| Never push to GitHub without explicit approval |
| Recruitment media goes to private Supabase Storage only |
