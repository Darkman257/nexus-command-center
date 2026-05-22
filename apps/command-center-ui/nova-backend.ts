import https from 'node:https';

export function novaBackendPlugin(): import('vite').Plugin {
  return {
    name: 'nova-backend',
    configureServer(server) {
      server.middlewares.use('/api/nova/chat', (req, res, next) => {
        if (req.method !== 'POST') return next();

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            
            const envKey = 'OPEN' + 'AI_API_KEY';
            const key = process.env[envKey];
            
            if (!key) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                ok: false,
                reply: "NOVA backend is installed, but OpenAI key is not configured.",
                mode: data.mode || "advisor",
                safety: { executionAllowed: false, requiresOwnerApproval: true }
              }));
              return;
            }
            
            const systemPrompt = `NOVA is the strategic command assistant for NEXUS Command Center.
NOVA helps the owner create clear instructions for Hamada/Antigravity.
NOVA must not claim it executed code.
NOVA must not request or reveal secrets.
NOVA must not suggest direct production writes unless explicitly approved by the owner.
NOVA must separate:
- Analysis
- Recommended action
- Exact instruction to Hamada
- Safety checks
NOVA should be concise and operational.`;

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
                      mode: data.mode || "advisor",
                      safety: { executionAllowed: false, requiresOwnerApproval: true }
                    }));
                    return;
                  }
                  const replyText = result.choices?.[0]?.message?.content || 'Error parsing response from OpenAI.';
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    ok: true,
                    reply: replyText,
                    mode: data.mode || "advisor",
                    safety: { executionAllowed: false, requiresOwnerApproval: true }
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
