# 02 — Runtime Services

All services run locally on the developer machine.
NOVA checks them live via /api/nova/local-status at each chat request.

## Service Registry

| Service | Port | Protocol | Endpoint | Expected Status |
|---|---|---|---|---|
| NEXUS Command Center | 5174 | HTTP | http://localhost:5174 | Always online when dev server running |
| Recruitment Hub | 5173 | HTTP | http://localhost:5173 | Online when pnpm dev running |
| Omega Dashboard | 3000 | HTTP | http://localhost:3000 | Online when pnpm dev running |
| Omega Gateway API | 5001 | HTTP | http://localhost:5001/api/healthz | Online when api-server started |
| Omega Local Bridge | 5057 | HTTP | http://127.0.0.1:5057/health | Online when omega-local-bridge running |
| Ollama AI Runtime | 11434 | HTTP | http://127.0.0.1:11434/api/tags | Online when ollama serve running |
| Streamlit Call Center | 8501 | HTTP | http://localhost:8501 | Optional — only if Docker container active |

---

## Ollama Models

| Model | Priority | Use Case |
|---|---|---|
| qwen2.5:7b | 1st (PRIMARY) | Arabic + English chat, operational reasoning, NEXUS intelligence |
| qwen2.5-coder:7b | 2nd | Code analysis, TypeScript, debugging |
| llama3.2:3b | 3rd (fallback) | Lightweight fast responses |
| nomic-embed-text:latest | Embeddings only | Future semantic memory search — NOT used for chat |

Model selection logic: priority list checked in order → first found wins → embed-only models never selected for chat.

---

## How to Start Each Service

### Command Center (port 5174)
```
cd D:\NEXUS\PROJECTS\nexus-command-center
pnpm --filter dnexusprojectsnexus-command-centerappscommand-center-ui dev
```

### Recruitment Hub (port 5173)
```
cd D:\NEXUS\PROJECTS\recruitment-hub
pnpm dev
```

### Omega Dashboard (port 3000)
```
cd D:\NEXUS\PROJECTS\omega-ops-dashboard
pnpm --filter @workspace/omega-dashboard dev
```

### Omega Gateway API Server (port 5001)
```
cd D:\NEXUS\PROJECTS\omega-ops-dashboard\artifacts\api-server
node --enable-source-maps --env-file=.\.env .\dist\index.mjs
```
Note: requires .env with PORT=5001 and Supabase credentials.

### Omega Local Bridge (port 5057)
```
cd D:\NEXUS\PROJECTS\nexus-command-center\apps\omega-local-bridge
pnpm run dev
```

### Ollama (background service)
```
ollama serve
ollama list
```

### Streamlit Container (optional, port 8501)
```
docker start nexus_call_center
```

---

## Desktop Launcher

Script: D:\NEXUS\PROJECTS\Launch-NEXUS-Command-Center.ps1
Shortcut: C:\Users\mkhai\OneDrive\Desktop\NEXUS Command Center.lnk

The launcher:
- Checks each port before starting
- Starts only services not already running
- Opens each UI as Chrome --app window
- Prints final status table

---

## Health Check Responses

### Omega Gateway /api/healthz
```json
{ "status": "ok" }
```

### Omega Local Bridge /health
```json
{ "ok": true, "mode": "omega-local-read-only-bridge", "mutations": "disabled" }
```

### NOVA /api/nova/local-status
```json
{
  "ollamaOnline": true,
  "availableModels": ["nomic-embed-text:latest", "llama3.2:3b", "qwen2.5:7b", "qwen2.5-coder:7b"],
  "selectedProvider": "ollama",
  "selectedModel": "qwen2.5:7b",
  "commandCenterOnline": true,
  "omegaGatewayStatus": true,
  "omegaDashboardStatus": true,
  "recruitmentHubStatus": true,
  "bridgeStatus": "online",
  "bridgeNote": "Bridge Core Online"
}
```
