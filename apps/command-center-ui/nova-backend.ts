import https from 'node:https';

export function novaBackendPlugin(): import('vite').Plugin {
  return {
    name: 'nova-backend',
    configureServer(server) {
      
      // Endpoint 1: Local Status
      server.middlewares.use('/api/nova/local-status', async (req, res, next) => {
        if (req.method !== 'GET') return next();

        let ollamaOnline = false;
        let availableModels: string[] = [];
        let omegaGatewayStatus = false;
        let omegaDashboardStatus = false;
        let recruitmentHubStatus = false;

        try {
          const ollamaRes = await fetch('http://127.0.0.1:11434/api/tags');
          if (ollamaRes.ok) {
            ollamaOnline = true;
            const data = await ollamaRes.json() as any;
            availableModels = data.models?.map((m: any) => m.name) || [];
          }
        } catch(e) {}

        try {
          const gwRes = await fetch('http://localhost:5001/api/healthz');
          if (gwRes.ok) omegaGatewayStatus = true;
        } catch(e) {}

        try {
          const dashRes = await fetch('http://localhost:3000');
          if (dashRes.ok) omegaDashboardStatus = true;
        } catch(e) {}

        try {
          const recRes = await fetch('http://localhost:3820');
          if (recRes.ok) recruitmentHubStatus = true;
        } catch(e) {}

        let bridgeDaemonStatus = 'unknown';
        let bridgeNote = 'No health endpoint configured';
        try {
          const bridgeRes = await fetch('http://localhost:9999/api/ping');
          if (bridgeRes.ok) {
            bridgeDaemonStatus = 'online';
            bridgeNote = 'Bridge Core Online';
          }
        } catch(e) {
          bridgeDaemonStatus = 'offline';
          bridgeNote = 'Bridge Core Unreachable';
        }

        const selectedProvider = ollamaOnline ? 'ollama' : 'offline';
        const selectedModel = availableModels.length > 0 ? availableModels[0] : null;

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          ollamaOnline,
          availableModels,
          selectedProvider,
          selectedModel,
          commandCenterOnline: true,
          omegaGatewayStatus,
          omegaDashboardStatus,
          recruitmentHubStatus,
          bridgeStatus: bridgeDaemonStatus,
          bridgeNote
        }));
      });

      // Endpoint 2: Chat
      server.middlewares.use('/api/nova/chat', (req, res, next) => {
        if (req.method !== 'POST') return next();

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            
            // Gather system status for context
            let ollamaOnline = false;
            let availableModels: string[] = [];
            let localStatusStr = 'Command Center Online.';
            
            try {
              const ollamaRes = await fetch('http://127.0.0.1:11434/api/tags');
              if (ollamaRes.ok) {
                ollamaOnline = true;
                const oData = await ollamaRes.json() as any;
                availableModels = oData.models?.map((m: any) => m.name) || [];
              }
              const gw = await fetch('http://localhost:5001/api/healthz').then(r=>r.ok).catch(()=>false);
              const dash = await fetch('http://localhost:3000').then(r=>r.ok).catch(()=>false);
              const rec = await fetch('http://localhost:3820').then(r=>r.ok).catch(()=>false);
              const bridge = await fetch('http://localhost:9999/api/ping').then(r=>r.ok).catch(()=>false);
              localStatusStr = `Command Center: ONLINE. Omega Gateway: ${gw?'ONLINE':'OFFLINE'}. Omega Dashboard: ${dash?'ONLINE':'OFFLINE'}. Recruitment Hub: ${rec?'ONLINE':'OFFLINE'}. Bridge Daemon: ${bridge?'ONLINE':'OFFLINE'}. Ollama: ${ollamaOnline?'ONLINE':'OFFLINE'}.`;
            } catch(e) {}

            const applyReplyPolish = (reply: string) => {
              let polished = reply;
              if (localStatusStr.includes('Bridge Daemon: OFFLINE') && !polished.includes('Audit Bridge Daemon status only.')) {
                if (!polished.includes('أمر جاهز لحمادة:')) {
                  polished += '\n\nأمر جاهز لحمادة:\n';
                } else {
                  polished += '\n';
                }
                polished += `HAMADA — AUDIT ONLY — BRIDGE DAEMON STATUS

Scope:
D:\\NEXUS\\PROJECTS\\nexus-command-center

Goal:
Audit Bridge Daemon status only.

Rules:
* Do NOT modify code.
* Do NOT push.
* Do NOT run migrations.
* Do NOT read secrets.
* Do NOT touch Omega or Recruitment.
* Audit only.

Steps:
1. Check current Bridge Daemon process/status.
2. Check expected bridge port or health endpoint.
3. Check why Command Center sees Bridge Daemon as OFFLINE.
4. Do not restart unless explicitly approved.
5. Return findings and safe next action.

Validation:
* git status --short
* pnpm -C apps/command-center-ui run build if files changed.

Report:
* Bridge status
* Port/endpoint checked
* Reason if found
* Recommendation
* Confirmation no code changed unless explicitly required`;
              }
              return polished;
            };

            const systemPrompt = `You are NOVA, a Strategic Local AI Advisor inside NEXUS Command Center.
You do not execute commands directly. Hamada / Antigravity is the Execution Engineer.
The user is the final approver.
If the user asks to modify something, prepare a clear command for Hamada instead of executing it.
Explain the system state based on the following available local-status: ${localStatusStr}

CRITICAL RULES:
1. If the user writes Arabic, reply in clean Egyptian-friendly Arabic.
2. Technical names must remain English exactly:
   Command Center
   Omega Gateway
   Omega Dashboard
   Recruitment Hub
   Bridge Daemon
   Ollama
   NOVA
   Hamada
   Antigravity
3. Never translate service names.
4. Never invent status.
5. If status unknown: say "غير مؤكد".
6. If offline: say "غير متصل".
7. If online: say "شغال".
8. Do not say all systems are green if any status is offline/unknown.
9. You MUST include ALL 4 sections in the response, using the exact headers below. Never omit the "أمر جاهز لحمادة:" section.

Standard Arabic response format (MUST match this layout exactly):
الحالة الحالية:
* Command Center: [شغال / غير متصل / غير مؤكد]
* Omega Gateway: [شغال / غير متصل / غير مؤكد]
* Omega Dashboard: [شغال / غير متصل / غير مؤكد]
* Recruitment Hub: [شغال / غير متصل / غير مؤكد]
* Bridge Daemon: [شغال / غير متصل / غير مؤكد]
* Ollama: [شغال / غير متصل / غير مؤكد]

الملاحظات:
* [ملاحظة مختصرة وواضحة]

الخطوة الآمنة التالية:
* [خطوة واحدة فقط]

أمر جاهز لحمادة:
[If Bridge Daemon is offline (which is "غير متصل"), you MUST copy the exact text below into this section. Do not modify it. If Bridge Daemon is online, generate a relevant safe command block.]
HAMADA — AUDIT ONLY — BRIDGE DAEMON STATUS

Scope:
D:\\NEXUS\\PROJECTS\\nexus-command-center

Goal:
Audit Bridge Daemon status only.

Rules:
* Do NOT modify code.
* Do NOT push.
* Do NOT run migrations.
* Do NOT read secrets.
* Do NOT touch Omega or Recruitment.
* Audit only.

Steps:
1. Check current Bridge Daemon process/status.
2. Check expected bridge port or health endpoint.
3. Check why Command Center sees Bridge Daemon as OFFLINE.
4. Do not restart unless explicitly approved.
5. Return findings and safe next action.

Validation:
* git status --short
* pnpm -C apps/command-center-ui run build if files changed.

Report:
* Bridge status
* Port/endpoint checked
* Reason if found
* Recommendation
* Confirmation no code changed unless explicitly required

Be concise and operational. Maintain your advisory role.`;

            // Try Ollama First
            if (ollamaOnline) {
              if (availableModels.length === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  ok: false,
                  reply: "NOVA Local Engine Offline. Start Ollama and install a local model.\n\nRecommended local model for 32GB RAM:\n- llama3.1:8b or qwen2.5-coder:7b as a start.\n- You can try 14b if performance permits.",
                  mode: data.mode || "advisor"
                }));
                return;
              }

              const selectedModel = availableModels[0];
              try {
                const chatRes = await fetch('http://127.0.0.1:11434/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    model: selectedModel,
                    stream: false,
                    messages: [
                      { role: 'system', content: systemPrompt },
                      { role: 'user', content: `Scope: ${data.projectScope || 'Global'}\nMessage: ${data.message}` }
                    ],
                    options: {
                      num_predict: 1024,
                      temperature: 0.1
                    }
                  })
                });

                if (chatRes.ok) {
                  const chatData = await chatRes.json() as any;
                  const rawReply = chatData.message?.content || "No content returned from local model.";
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    ok: true,
                    reply: applyReplyPolish(rawReply),
                    mode: data.mode || "advisor",
                    provider: 'ollama',
                    model: selectedModel
                  }));
                  return;
                }
              } catch(e) {
                // Ignore and fall through to fallback
              }
            }
            
            // OpenAI Fallback
            const envKey = 'OPEN' + 'AI_API_KEY';
            const key = process.env[envKey];
            
            if (!key) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                ok: false,
                reply: "NOVA Local Engine Offline. Start Ollama and install a local model.\n\nRecommended local model for 32GB RAM:\n- llama3.1:8b or qwen2.5-coder:7b as a start.",
                mode: data.mode || "advisor"
              }));
              return;
            }
            
            const postData = JSON.stringify({
              model: "gpt-4o",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Scope: ${data.projectScope}\nContext: ${data.contextSummary || 'none'}\nMessage: ${data.message}` }
              ]
            });

            const options = {
              hostname: 'api.openai.com',
              port: 443,
              path: '/v1/chat/completions',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'Content-Length': Buffer.byteLength(postData)
              }
            };

            const reqOpenAi = https.request(options, (resOpenAi) => {
              let responseBody = '';
              resOpenAi.on('data', (d) => { responseBody += d; });
              resOpenAi.on('end', () => {
                try {
                  const result = JSON.parse(responseBody);
                  if (result.error) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      ok: false,
                      reply: "OpenAI API Error: " + (result.error.message || "Unknown error"),
                      mode: data.mode || "advisor"
                    }));
                    return;
                  }
                  const replyText = result.choices?.[0]?.message?.content || 'Error parsing response from OpenAI.';
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    ok: true,
                    reply: applyReplyPolish(replyText),
                    mode: data.mode || "advisor",
                    provider: 'openai'
                  }));
                } catch(_e) {
                   res.statusCode = 500;
                   res.end(JSON.stringify({ok: false, reply: "Failed to parse API response."}));
                }
              });
            });
            
            reqOpenAi.on('error', (_err) => {
               res.statusCode = 500;
               res.end(JSON.stringify({ok: false, reply: "Network error calling API."}));
            });
            
            reqOpenAi.write(postData);
            reqOpenAi.end();
            
          } catch(_err) {
            res.statusCode = 400;
            res.end("Bad Request");
          }
        });
      });
    }
  }
}
