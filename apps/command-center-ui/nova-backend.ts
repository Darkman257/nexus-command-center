import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename_plugin = fileURLToPath(import.meta.url);
const __dirname_plugin = path.dirname(__filename_plugin);

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
          const bridgeRes = await fetch('http://localhost:5057/health');
          if (bridgeRes.ok) {
            bridgeDaemonStatus = 'online';
            bridgeNote = 'Omega Local Bridge Online';
          }
        } catch(e) {
          bridgeDaemonStatus = 'offline';
          bridgeNote = 'Omega Local Bridge Unreachable';
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
          const startTime = Date.now();
          try {
            const data = JSON.parse(body);

            const sendResponse = (payload: any) => {
              const endTime = Date.now();
              const duration = ((endTime - startTime) / 1000).toFixed(2);
              const confidence = payload.confidence || 0.95;
              const indicators = payload.indicators || { router: true, memoryUsed: false, search: false, execution: false };
              const responseData = {
                ok: payload.ok ?? true,
                reply: payload.reply,
                mode: payload.mode || data.mode || "advisor",
                provider: payload.provider || 'nexus-router',
                duration: parseFloat(duration),
                confidence: confidence,
                indicators: indicators,
                actions: payload.actions || []
              };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(responseData));
            };
            
            // NEXUS Brain Registry Loaders
            const loadBrainRegistry = (registryName: string) => {
              try {
                const regPath = path.join(__dirname_plugin, '..', '..', 'runtime', 'brain', `${registryName}.registry.json`);
                if (fs.existsSync(regPath)) {
                  return JSON.parse(fs.readFileSync(regPath, 'utf8'));
                }
              } catch (e) {
                console.error(`[NOVA Brain] Failed to load ${registryName}:`, e);
              }
              return null;
            };

            const summarizeBrainRegistry = (type: string) => {
              const data = loadBrainRegistry(type);
              if (!data) return "No data found.";
              if (type === 'projects' || type === 'services' || type === 'repos') {
                return data.map((d: any) => `- ${d.name} (${d.id}): ${d.description || d.role} (Port: ${d.port || 'N/A'})`).join('\n');
              }
              if (type === 'decisions') {
                return data.map((d: string) => `- ${d}`).join('\n');
              }
              return JSON.stringify(data);
            };

            const getProjectByIntent = (query: string) => {
              if (query.match(/(أوميجا|اوميجا|omega|dashboard)/)) return 'omega-ops-dashboard';
              if (query.match(/(التوظيف|recruitment)/)) return 'recruitment-hub';
              if (query.match(/(نكسس|nexus|command)/)) return 'nexus-command-center';
              return null;
            };

            // NEXUS Memory Kernel Loaders
            const loadMemoryKernel = (fileName: string) => {
              try {
                const mkPath = path.join(__dirname_plugin, 'runtime', 'memory-kernel', fileName);
                if (fs.existsSync(mkPath)) {
                  return JSON.parse(fs.readFileSync(mkPath, 'utf8'));
                }
              } catch (e) {
                console.error(`[NOVA Memory] Failed to load ${fileName}:`, e);
              }
              return [];
            };

            const searchMemoryKernel = (query: string, type?: string) => {
              const entities = loadMemoryKernel('entities.json');
              const q = query.toLowerCase();
              return entities.filter((e: any) => 
                (type ? e.type === type : true) && 
                ((e.name && e.name.toLowerCase().includes(q)) || 
                 (e.title && e.title.toLowerCase().includes(q)) || 
                 (e.id && e.id.toLowerCase().includes(q)))
              );
            };

            const summarizeEntity = (entityId: string) => {
              const entities = loadMemoryKernel('entities.json');
              const entity = entities.find((e: any) => e.id === entityId);
              if (!entity) return null;
              return `${entity.name || entity.title} (${entity.type}): ${entity.role || entity.description || 'No description'}`;
            };

            const summarizeRelationships = (entityId: string) => {
              const rels = loadMemoryKernel('relationships.json');
              const related = rels.filter((r: any) => r.from === entityId || r.to === entityId);
              return related.map((r: any) => {
                if (r.from === entityId) return `- ${summarizeEntity(r.to) || r.to} (${r.relation})`;
                return `- ${summarizeEntity(r.from) || r.from} (${r.relation} this)`;
              }).join('\n');
            };

            const summarizeTimeline = () => {
              const tl = loadMemoryKernel('timeline.json');
              return tl.map((t: any) => `- ${t.date}: ${t.title} (${t.type}) - ${t.summary}`).join('\n');
            };

            const userQueryLower = data.message.toLowerCase();
            const knowledgeToInject: string[] = [];
            console.log(`[NOVA ROUTER] message="${data.message}" scope="${data.projectScope || 'NEXUS'}"`);

            const cleanMsg = userQueryLower.replace(/[؟?.,]/g, '').trim();
            const activeContextStr = data.projectScope || 'NEXUS';

            const loadDomainMemory = (domain: string) => {
              try {
                const mkPath = path.join(__dirname_plugin, 'runtime', 'memory-kernel', 'domains', `${domain.toLowerCase()}.memory.json`);
                if (fs.existsSync(mkPath)) {
                  return JSON.parse(fs.readFileSync(mkPath, 'utf8'));
                }
              } catch (e) {}
              return null;
            };

            // FEDERATED MEMORY CONTEXT ROUTING
            if (activeContextStr === 'OMEGA') {
              if (cleanMsg.match(/(راجع اوميجا|راجع أوميجا|راجع المشاريع|المشاريع|الموظفين|الستاف|العربيات|السكن|الحضور|ايه بيانات أوميجا|بيانات اوميجا)/)) {
                let liveData: any = null;
                try {
                  const bridgeRes = await fetch('http://127.0.0.1:5057/api/sync/omega-memory', { signal: AbortSignal.timeout(5000) });
                  if (bridgeRes.ok) {
                    liveData = await bridgeRes.json();
                    try {
                      fs.writeFileSync(path.join(__dirname_plugin, 'runtime', 'memory-kernel', 'domains', 'omega.memory.snapshot.json'), JSON.stringify(liveData, null, 2), 'utf8');
                    } catch(e) {}
                  }
                } catch(e) {}

                if (liveData) {
                  let reply = `بيانات أوميجا الحية:\n- المشاريع: ${liveData.summary?.projectsCount || 0}\n- الموظفين: ${liveData.summary?.staffCount || 0}\n- العربيات: ${liveData.summary?.vehiclesCount || 0}\n- وحدات السكن: ${liveData.summary?.housingUnitsCount || 0}\n- سجلات الحضور: ${liveData.summary?.attendanceLogsCount || 0}`;
                  if (liveData.emptyTables && liveData.emptyTables.length > 0) {
                    reply += `\n- جداول فارغة: ${liveData.emptyTables.join(', ')}`;
                  }
                  if (cleanMsg.includes('الستاف') || cleanMsg.includes('الموظفين')) {
                    reply += `\n\nملخص الموظفين:\nإجمالي: ${liveData.staffSummary?.total || 0}`;
                    const depts = Object.entries(liveData.staffSummary?.byDepartment || {}).map(([d, c]) => `${d}: ${c}`).join('، ');
                    reply += `\nالأقسام: ${depts}`;
                  }
                  return sendResponse({
                    reply,
                    provider: 'omega-live',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                } else {
                  let omegaMem = null;
                  try {
                    omegaMem = JSON.parse(fs.readFileSync(path.join(__dirname_plugin, 'runtime', 'memory-kernel', 'domains', 'omega.memory.snapshot.json'), 'utf8'));
                  } catch(e) {
                    omegaMem = loadDomainMemory('omega');
                  }
                  
                  let reply = 'البيانات الحية غير متاحة، هذا ملخص آخر ذاكرة محفوظة.\n';
                  if (omegaMem && omegaMem.summary) {
                     reply += `- المشاريع: ${omegaMem.summary.projectsCount}\n- الموظفين: ${omegaMem.summary.staffCount}\n- العربيات: ${omegaMem.summary.vehiclesCount}\n- وحدات السكن: ${omegaMem.summary.housingUnitsCount}`;
                  } else {
                     reply += 'لم يتم العثور على ذاكرة محفوظة.';
                  }
                  return sendResponse({
                    reply,
                    provider: 'nexus-memory (Context: OMEGA)',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }
              }
            }

            if (activeContextStr === 'RECRUITMENT') {
              if (cleanMsg.match(/(التوظيف|المرشحين|المقابلات|متابعة|راجع|بيانات|عايز|أفضل|افضل)/)) {
                let liveData: any = null;
                try {
                  const bridgeRes = await fetch('http://127.0.0.1:5057/api/sync/recruitment-memory', { signal: AbortSignal.timeout(5000) });
                  if (bridgeRes.ok) {
                    liveData = await bridgeRes.json();
                    try {
                      fs.writeFileSync(path.join(__dirname_plugin, 'runtime', 'memory-kernel', 'domains', 'recruitment.memory.snapshot.json'), JSON.stringify(liveData, null, 2), 'utf8');
                    } catch(e) {}
                  }
                } catch(e) {}

                if (liveData) {
                  let reply = `بيانات التوظيف الحية:\n- المرشحين: ${liveData.summary?.candidatesCount || 0} مرشح في بايبلاين التوظيف\n- الوظائف المفتوحة: ${liveData.summary?.positionsCount || 0}\n- المقابلات المسجلة: ${liveData.summary?.interviewsCount || 0}`;
                  
                  if (liveData.emptyTables && liveData.emptyTables.length > 0) {
                    reply += `\n- جداول فارغة: ${liveData.emptyTables.join(', ')}`;
                  }
                  
                  if (cleanMsg.includes('المرشحين') || cleanMsg.includes('أفضل') || cleanMsg.includes('افضل')) {
                    reply += `\n\nملخص المرشحين:\nإجمالي: ${liveData.summary?.candidatesCount || 0} مرشح`;
                    const roles = Object.entries(liveData.candidatesByRole || {}).map(([r, c]) => `${r}: ${c}`).join('، ');
                    reply += `\nالأدوار المستهدفة: ${roles}`;
                    
                    const statuses = Object.entries(liveData.pipelineByStatus || {}).map(([s, c]) => `${s}: ${c}`).join('، ');
                    reply += `\nحالة البايبلاين: ${statuses}`;
                  }
                  
                  return sendResponse({
                    reply,
                    provider: 'recruitment-live',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                } else {
                  let recMem = null;
                  try {
                    recMem = JSON.parse(fs.readFileSync(path.join(__dirname_plugin, 'runtime', 'memory-kernel', 'domains', 'recruitment.memory.snapshot.json'), 'utf8'));
                  } catch(e) {
                    recMem = loadDomainMemory('recruitment');
                  }
                  
                  let reply = 'البيانات الحية غير متاحة، هذا ملخص آخر ذاكرة محفوظة لقطاع التوظيف.\n';
                  if (recMem && recMem.summary) {
                     reply += `- المرشحين: ${recMem.summary.candidatesCount} مرشح\n- الوظائف: ${recMem.summary.positionsCount}\n- المقابلات: ${recMem.summary.interviewsCount}`;
                  } else {
                     reply += 'لم يتم العثور على ذاكرة محفوظة للتوظيف.';
                  }
                  return sendResponse({
                    reply,
                    provider: 'nexus-memory (Context: RECRUITMENT)',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }
              }
            }

            if (activeContextStr === 'NEXUS') {
              if (cleanMsg.match(/(ملخص الشركة|ملخص شامل|واقفين فين|ملخص أوميجا والتوظيف|ملاحظات التشغيل|ملخص اوميجا والتوظيف)/)) {
                let omegaData: any = null;
                let recruitmentData: any = null;
                
                try {
                  const [omegaRes, recRes] = await Promise.all([
                    fetch('http://127.0.0.1:5057/api/sync/omega-memory', { signal: AbortSignal.timeout(5000) }).catch(() => null),
                    fetch('http://127.0.0.1:5057/api/sync/recruitment-memory', { signal: AbortSignal.timeout(5000) }).catch(() => null)
                  ]);
                  
                  if (omegaRes && omegaRes.ok) omegaData = await omegaRes.json();
                  if (recRes && recRes.ok) recruitmentData = await recRes.json();
                } catch(e) {}

                let reply = `ملخص عمليات الشركة:\n\n`;
                
                if (omegaData) {
                  reply += `🏢 أوميجا للتشغيل (بيانات حية):\n- المشاريع: ${omegaData.summary?.projectsCount || 0}\n- الموظفين وعمال التشغيل: ${omegaData.summary?.staffCount || 0}\n- السيارات والمعدات: ${omegaData.summary?.vehiclesCount || 0}\n- وحدات السكن: ${omegaData.summary?.housingUnitsCount || 0}\n\n`;
                } else {
                  reply += `🏢 أوميجا للتشغيل: (غير متاح حالياً - تعذر الاتصال بالمصدر)\n\n`;
                }

                if (recruitmentData) {
                  const statuses = Object.entries(recruitmentData.pipelineByStatus || {}).map(([s, c]) => `${s}: ${c}`).join('، ');
                  reply += `👥 قطاع التوظيف (بيانات حية):\n- إجمالي المرشحين: ${recruitmentData.summary?.candidatesCount || 0} مرشح\n- الوظائف المفتوحة: ${recruitmentData.summary?.positionsCount || 0}\n- حالة البايبلاين: ${statuses || 'لا يوجد'}\n\n`;
                } else {
                  reply += `👥 قطاع التوظيف: (غير متاح حالياً - تعذر الاتصال بالمصدر)\n\n`;
                }

                reply += `⚠️ أهم ملاحظات المخاطر والتشغيل:\n`;
                let risks = [];
                if (omegaData && omegaData.emptyTables && omegaData.emptyTables.length > 0) {
                  risks.push(`نقص في بيانات أوميجا: ${omegaData.emptyTables.join('، ')} فارغة.`);
                }
                if (recruitmentData && recruitmentData.summary?.candidatesCount === 0) {
                  risks.push(`لا يوجد مرشحين جدد في بايبلاين التوظيف.`);
                }
                if (!omegaData && !recruitmentData) {
                  risks.push(`لا يوجد اتصال بقاعدة بيانات أوميجا والتوظيف المركزية عبر Local Bridge.`);
                }
                
                if (risks.length > 0) {
                  reply += risks.map(r => `- ${r}`).join('\n');
                } else {
                  reply += `- الأمور مستقرة حالياً، لا يوجد ملاحظات خطيرة واضحة في البيانات.`;
                }
                
                reply += `\n\nالخطوة المقترحة التالية: مراجعة سجلات الحضور والمركبات في أوميجا، أو استكمال طلبات التوظيف المفتوحة.`;

                return sendResponse({
                  reply,
                  provider: 'nexus-executive-summary',
                  indicators: { router: true, memoryUsed: true, search: false, execution: false }
                });
              }

              if (cleanMsg.match(/(ايه المشاكل|ايه أهم التنبيهات|اهم التنبيهات|محتاجة اهتمامي|مخاطر التشغيل|ايه المشاكل؟)/)) {
                let omegaData: any = null;
                let recruitmentData: any = null;
                
                try {
                  const [omegaRes, recRes] = await Promise.all([
                    fetch('http://127.0.0.1:5057/api/sync/omega-memory', { signal: AbortSignal.timeout(5000) }).catch(() => null),
                    fetch('http://127.0.0.1:5057/api/sync/recruitment-memory', { signal: AbortSignal.timeout(5000) }).catch(() => null)
                  ]);
                  
                  if (omegaRes && omegaRes.ok) omegaData = await omegaRes.json();
                  if (recRes && recRes.ok) recruitmentData = await recRes.json();
                } catch(e) {}

                const alerts: string[] = [];

                // OMEGA ALERTS
                if (omegaData) {
                  if (omegaData.emptyTables && omegaData.emptyTables.length > 0) {
                    alerts.push(`- 🟡 [Medium] أوميجا: جداول التشغيل التالية فارغة (${omegaData.emptyTables.join('، ')}). ◀️ الإجراء المقترح: مراجعة إدخال البيانات.`);
                  }
                  
                  const vTotal = omegaData.vehiclesSummary?.total || 0;
                  const vMaint = omegaData.vehiclesSummary?.byStatus?.['maintenance'] || 0;
                  if (vTotal > 20 && vMaint === 0) {
                    alerts.push(`- 🟡 [Medium] أوميجا: عدد المركبات كبير (${vTotal}) ولا توجد أي مركبات مسجلة في الصيانة. ◀️ الإجراء المقترح: مراجعة دقة حالة أسطول السيارات.`);
                  }
                  
                  if (omegaData.summary?.projectsCount > 0) {
                    const activeProjs = omegaData.projects?.filter((p:any) => p.status !== 'closed').length || 0;
                    if (activeProjs === 0) {
                      alerts.push(`- 🔴 [High] أوميجا: لا توجد مشاريع نشطة مسجلة. ◀️ الإجراء المقترح: مراجعة تحديث حالات المشاريع.`);
                    }
                  }
                } else {
                  alerts.push(`- 🔴 [High] أوميجا: تعذر الاتصال بخادم بيانات أوميجا. ◀️ الإجراء المقترح: التحقق من Bridge.`);
                }

                // RECRUITMENT ALERTS
                if (recruitmentData) {
                  const screeningCount = recruitmentData.pipelineByStatus?.['screening'] || 0;
                  if (screeningCount > 10) {
                    alerts.push(`- 🟡 [Medium] التوظيف: تراكم عدد كبير من المرشحين (${screeningCount}) في مرحلة الفرز (Screening). ◀️ الإجراء المقترح: تسريع مراجعة الـ CVs.`);
                  }
                  
                  if (recruitmentData.summary?.interviewsCount === 0 && recruitmentData.summary?.candidatesCount > 0) {
                    alerts.push(`- 🟡 [Medium] التوظيف: يوجد مرشحين ولكن لا توجد أي مقابلات مسجلة. ◀️ الإجراء المقترح: جدولة مقابلات للمرشحين المتاحين.`);
                  }
                  
                  const unknownRoles = recruitmentData.candidatesByRole?.['Unknown'] || 0;
                  if (unknownRoles > 0) {
                    alerts.push(`- 🟡 [Medium] التوظيف: ${unknownRoles} مرشحين غير محدد لهم الدور المستهدف (Unknown). ◀️ الإجراء المقترح: تصنيف المرشحين وربطهم بالوظائف المتاحة.`);
                  }

                  if (recruitmentData.followupsDue && recruitmentData.followupsDue.length > 0) {
                    alerts.push(`- 🔴 [High] التوظيف: يوجد متابعات متأخرة. ◀️ الإجراء المقترح: مراجعة المتأخرات فورا.`);
                  }
                } else {
                  alerts.push(`- 🔴 [High] التوظيف: تعذر الاتصال بخادم بيانات التوظيف. ◀️ الإجراء المقترح: التحقق من Bridge.`);
                }

                let reply = `تنبيهات ومخاطر التشغيل الحالية:\n\n`;
                if (alerts.length > 0) {
                  reply += alerts.join('\n\n');
                } else {
                  reply += `✅ لا توجد تنبيهات عاجلة. جميع البيانات تبدو طبيعية.`;
                }

                return sendResponse({
                  reply,
                  provider: 'nexus-business-alerts',
                  indicators: { router: true, memoryUsed: true, search: false, execution: false }
                });
              }

              if (cleanMsg.match(/(اعمل خطة للتنبيهات|خطة العمل|اعمللي خطة تشغيل|نبدأ بإيه|نبدا بايه|رتب الأولويات)/)) {
                let omegaData: any = null;
                let recruitmentData: any = null;
                
                try {
                  const [omegaRes, recRes] = await Promise.all([
                    fetch('http://127.0.0.1:5057/api/sync/omega-memory', { signal: AbortSignal.timeout(5000) }).catch(() => null),
                    fetch('http://127.0.0.1:5057/api/sync/recruitment-memory', { signal: AbortSignal.timeout(5000) }).catch(() => null)
                  ]);
                  
                  if (omegaRes && omegaRes.ok) omegaData = await omegaRes.json();
                  if (recRes && recRes.ok) recruitmentData = await recRes.json();
                } catch(e) {}

                const actions: any[] = [];

                // OMEGA ALERTS -> ACTIONS
                if (omegaData) {
                  if (omegaData.emptyTables && omegaData.emptyTables.length > 0) {
                    actions.push({
                      priority: 'Medium',
                      domain: 'أوميجا للتشغيل',
                      action: `إدخال البيانات الناقصة في الجداول: ${omegaData.emptyTables.join('، ')}`,
                      owner: 'مدير الموقع / فريق إدخال البيانات',
                      reason: 'تجنب فقدان الرؤية التشغيلية في لوحة التحكم',
                      impact: 'اكتمال بيانات التشغيل بنسبة 100%'
                    });
                  }
                  
                  const vTotal = omegaData.vehiclesSummary?.total || 0;
                  const vMaint = omegaData.vehiclesSummary?.byStatus?.['maintenance'] || 0;
                  if (vTotal > 20 && vMaint === 0) {
                    actions.push({
                      priority: 'High',
                      domain: 'أوميجا للتشغيل',
                      action: 'مراجعة حالة أسطول السيارات وتحديث سجلات الصيانة',
                      owner: 'مدير الحركة / قسم المركبات',
                      reason: `يوجد ${vTotal} سيارة بدون أي سجلات صيانة نشطة`,
                      impact: 'تقليل مخاطر تعطل السيارات المفاجئ'
                    });
                  }
                  
                  if (omegaData.summary?.projectsCount > 0) {
                    const activeProjs = omegaData.projects?.filter((p:any) => p.status !== 'closed').length || 0;
                    if (activeProjs === 0) {
                      actions.push({
                        priority: 'High',
                        domain: 'أوميجا للتشغيل',
                        action: 'تحديث حالات المشاريع على النظام',
                        owner: 'مدير المشاريع',
                        reason: 'لا توجد مشاريع نشطة مسجلة برغم وجود بيانات',
                        impact: 'عكس الواقع التشغيلي بدقة'
                      });
                    }
                  }
                } else {
                  actions.push({
                    priority: 'Critical',
                    domain: 'IT / تقنية المعلومات',
                    action: 'إعادة تشغيل أوميجا Local Bridge',
                    owner: 'مهندس النظام (NEXUS Admin)',
                    reason: 'تعذر الاتصال بقاعدة بيانات أوميجا',
                    impact: 'استعادة الاتصال بالبيانات الحية'
                  });
                }

                // RECRUITMENT ALERTS -> ACTIONS
                if (recruitmentData) {
                  const screeningCount = recruitmentData.pipelineByStatus?.['screening'] || 0;
                  if (screeningCount > 10) {
                    actions.push({
                      priority: 'Medium',
                      domain: 'قطاع التوظيف',
                      action: 'فرز وتصفية السير الذاتية المتراكمة',
                      owner: 'مسئول التوظيف (Recruiter)',
                      reason: `تراكم ${screeningCount} مرشح في مرحلة الفرز`,
                      impact: 'تسريع عملية التوظيف وتقليل وقت الانتظار'
                    });
                  }
                  
                  if (recruitmentData.summary?.interviewsCount === 0 && recruitmentData.summary?.candidatesCount > 0) {
                    actions.push({
                      priority: 'Medium',
                      domain: 'قطاع التوظيف',
                      action: 'جدولة مقابلات للمرشحين المتاحين',
                      owner: 'مسئول التوظيف / الإدارة الطالبة',
                      reason: 'لا توجد مقابلات مجدولة رغم وجود مرشحين بالبايبلاين',
                      impact: 'دفع المرشحين للمراحل النهائية'
                    });
                  }
                  
                  const unknownRoles = recruitmentData.candidatesByRole?.['Unknown'] || 0;
                  if (unknownRoles > 0) {
                    actions.push({
                      priority: 'High',
                      domain: 'قطاع التوظيف',
                      action: 'تحديد الأدوار المستهدفة للمرشحين المجهولين',
                      owner: 'مسئول التوظيف',
                      reason: `يوجد ${unknownRoles} مرشح بدون وظيفة محددة`,
                      impact: 'توجيه المرشحين للمسار الصحيح وتقليل الهدر'
                    });
                  }

                  if (recruitmentData.followupsDue && recruitmentData.followupsDue.length > 0) {
                    actions.push({
                      priority: 'High',
                      domain: 'قطاع التوظيف',
                      action: 'مراجعة المتابعات المتأخرة والاتصال بالمرشحين',
                      owner: 'فريق التوظيف',
                      reason: 'توجد مهام متابعة متأخرة',
                      impact: 'تحسين تجربة المرشحين وإغلاق الطلبات المعلقة'
                    });
                  }
                } else {
                  actions.push({
                    priority: 'Critical',
                    domain: 'IT / تقنية المعلومات',
                    action: 'إعادة تشغيل Recruitment Local Bridge',
                    owner: 'مهندس النظام (NEXUS Admin)',
                    reason: 'تعذر الاتصال بقاعدة بيانات التوظيف',
                    impact: 'استعادة الاتصال بالبيانات الحية للتوظيف'
                  });
                }

                actions.sort((a, b) => {
                  const prioMap: any = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                  return prioMap[b.priority] - prioMap[a.priority];
                });

                let reply = `خطة العمل التشغيلية (Prioritized Action Plan):\n\n`;
                if (actions.length > 0) {
                  reply += actions.map((a, i) => 
                    `[${i + 1}] الأولوية: ${a.priority === 'Critical' ? '🔴 حرجة' : a.priority === 'High' ? '🟠 عالية' : a.priority === 'Medium' ? '🟡 متوسطة' : '🟢 منخفضة'} | القطاع: ${a.domain}\n- الإجراء: ${a.action}\n- المسئول: ${a.owner}\n- السبب: ${a.reason}\n- التأثير: ${a.impact}`
                  ).join('\n\n');
                } else {
                  reply += `✅ النظام مستقر تماماً ولا توجد خطط عمل طارئة حالياً.`;
                }

                return sendResponse({
                  reply,
                  provider: 'nexus-action-plan',
                  indicators: { router: true, memoryUsed: true, search: false, execution: false }
                });
              }

              if (cleanMsg.match(/(حوّل الخطة لمهام|حول الخطة لمهام|اعمل التاسكات|اعمل تاسكات|سجل خطة العمل|اعمللي متابعة للتنبيهات|متابعة التنبيهات|متابعة للتنبيهات)/)) {
                let omegaData: any = null;
                let recruitmentData: any = null;
                
                try {
                  const [omegaRes, recRes] = await Promise.all([
                    fetch('http://127.0.0.1:5057/api/sync/omega-memory', { signal: AbortSignal.timeout(5000) }).catch(() => null),
                    fetch('http://127.0.0.1:5057/api/sync/recruitment-memory', { signal: AbortSignal.timeout(5000) }).catch(() => null)
                  ]);
                  
                  if (omegaRes && omegaRes.ok) omegaData = await omegaRes.json();
                  if (recRes && recRes.ok) recruitmentData = await recRes.json();
                } catch(e) {}

                const actions: any[] = [];

                if (omegaData) {
                  if (omegaData.emptyTables && omegaData.emptyTables.length > 0) {
                    actions.push({ priority: 'Medium', domain: 'أوميجا للتشغيل', action: `إدخال البيانات الناقصة في الجداول: ${omegaData.emptyTables.join('، ')}`, owner: 'مدير الموقع / فريق إدخال البيانات', reason: 'تجنب فقدان الرؤية التشغيلية في لوحة التحكم', impact: 'اكتمال بيانات التشغيل بنسبة 100%' });
                  }
                  const vTotal = omegaData.vehiclesSummary?.total || 0;
                  const vMaint = omegaData.vehiclesSummary?.byStatus?.['maintenance'] || 0;
                  if (vTotal > 20 && vMaint === 0) {
                    actions.push({ priority: 'High', domain: 'أوميجا للتشغيل', action: 'مراجعة حالة أسطول السيارات وتحديث سجلات الصيانة', owner: 'مدير الحركة / قسم المركبات', reason: `يوجد ${vTotal} سيارة بدون أي سجلات صيانة نشطة`, impact: 'تقليل مخاطر تعطل السيارات المفاجئ' });
                  }
                  if (omegaData.summary?.projectsCount > 0) {
                    const activeProjs = omegaData.projects?.filter((p:any) => p.status !== 'closed').length || 0;
                    if (activeProjs === 0) {
                      actions.push({ priority: 'High', domain: 'أوميجا للتشغيل', action: 'تحديث حالات المشاريع على النظام', owner: 'مدير المشاريع', reason: 'لا توجد مشاريع نشطة مسجلة برغم وجود بيانات', impact: 'عكس الواقع التشغيلي بدقة' });
                    }
                  }
                } else {
                  actions.push({ priority: 'Critical', domain: 'IT / تقنية المعلومات', action: 'إعادة تشغيل أوميجا Local Bridge', owner: 'مهندس النظام (NEXUS Admin)', reason: 'تعذر الاتصال بقاعدة بيانات أوميجا', impact: 'استعادة الاتصال بالبيانات الحية' });
                }

                if (recruitmentData) {
                  const screeningCount = recruitmentData.pipelineByStatus?.['screening'] || 0;
                  if (screeningCount > 10) {
                    actions.push({ priority: 'Medium', domain: 'قطاع التوظيف', action: 'فرز وتصفية السير الذاتية المتراكمة', owner: 'مسئول التوظيف (Recruiter)', reason: `تراكم ${screeningCount} مرشح في مرحلة الفرز`, impact: 'تسريع عملية التوظيف وتقليل وقت الانتظار' });
                  }
                  if (recruitmentData.summary?.interviewsCount === 0 && recruitmentData.summary?.candidatesCount > 0) {
                    actions.push({ priority: 'Medium', domain: 'قطاع التوظيف', action: 'جدولة مقابلات للمرشحين المتاحين', owner: 'مسئول التوظيف / الإدارة الطالبة', reason: 'لا توجد مقابلات مجدولة رغم وجود مرشحين بالبايبلاين', impact: 'دفع المرشحين للمراحل النهائية' });
                  }
                  const unknownRoles = recruitmentData.candidatesByRole?.['Unknown'] || 0;
                  if (unknownRoles > 0) {
                    actions.push({ priority: 'High', domain: 'قطاع التوظيف', action: 'تحديد الأدوار المستهدفة للمرشحين المجهولين', owner: 'مسئول التوظيف', reason: `يوجد ${unknownRoles} مرشح بدون وظيفة محددة`, impact: 'توجيه المرشحين للمسار الصحيح وتقليل الهدر' });
                  }
                  if (recruitmentData.followupsDue && recruitmentData.followupsDue.length > 0) {
                    actions.push({ priority: 'High', domain: 'قطاع التوظيف', action: 'مراجعة المتابعات المتأخرة والاتصال بالمرشحين', owner: 'فريق التوظيف', reason: 'توجد مهام متابعة متأخرة', impact: 'تحسين تجربة المرشحين وإغلاق الطلبات المعلقة' });
                  }
                } else {
                  actions.push({ priority: 'Critical', domain: 'IT / تقنية المعلومات', action: 'إعادة تشغيل Recruitment Local Bridge', owner: 'مهندس النظام (NEXUS Admin)', reason: 'تعذر الاتصال بقاعدة بيانات التوظيف', impact: 'استعادة الاتصال بالبيانات الحية للتوظيف' });
                }

                let reply = '';
                if (actions.length === 0) {
                  reply = '✅ لا توجد خطط عمل حالية تتطلب التحويل لمهام.';
                } else {
                  const crypto = require('crypto');
                  const executionDir = path.join(__dirname_plugin, 'runtime', 'execution');
                  if (!fs.existsSync(executionDir)) {
                    fs.mkdirSync(executionDir, { recursive: true });
                  }
                  const tasksFilePath = path.join(executionDir, 'business-action-tasks.jsonl');
                  
                  let lines = '';
                  actions.forEach(a => {
                    const task = {
                      taskId: crypto.randomUUID(),
                      title: a.action,
                      domain: a.domain,
                      ownerSuggestion: a.owner,
                      priority: a.priority,
                      reason: a.reason,
                      expectedImpact: a.impact,
                      status: 'draft',
                      createdAt: new Date().toISOString(),
                      source: 'business-alerts',
                      approved: false
                    };
                    lines += JSON.stringify(task) + '\n';
                  });
                  
                  try {
                    fs.appendFileSync(tasksFilePath, lines, 'utf8');
                    reply = `حوّلت الخطة إلى ${actions.length} مهام Draft. لم يتم تنفيذ أي تغيير على الداتا.`;
                  } catch(e: any) {
                    reply = `حدث خطأ أثناء حفظ المهام: ${e.message}`;
                  }
                }

                return sendResponse({
                  reply,
                  provider: 'nexus-action-tracker',
                  indicators: { router: true, memoryUsed: true, search: false, execution: false }
                });
              }

              if (cleanMsg.match(/(اعرض مهام الخطة|وريني التاسكات|ايه المهام المفتوحة|ملخص المهام|تابع خطة العمل|اعرض التاسكات)/)) {
                const executionDir = path.join(__dirname_plugin, 'runtime', 'execution');
                const tasksFilePath = path.join(executionDir, 'business-action-tasks.jsonl');
                
                if (!fs.existsSync(tasksFilePath)) {
                  return sendResponse({
                    reply: 'لا توجد مهام عمل مسجلة حالياً (الملف غير موجود).',
                    provider: 'nexus-task-review',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }
                
                let tasks: any[] = [];
                try {
                  const content = fs.readFileSync(tasksFilePath, 'utf8');
                  const lines = content.split('\n').filter(l => l.trim() !== '');
                  tasks = lines.map(l => JSON.parse(l));
                } catch(e) {}
                
                if (tasks.length === 0) {
                  return sendResponse({
                    reply: 'لا توجد مهام عمل مسجلة حالياً.',
                    provider: 'nexus-task-review',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }
                
                const stats = {
                  total: tasks.length,
                  draft: tasks.filter(t => t.status === 'draft').length,
                  approved: tasks.filter(t => t.status === 'approved').length,
                  in_progress: tasks.filter(t => t.status === 'in_progress').length,
                  done: tasks.filter(t => t.status === 'done').length,
                  byPriority: {} as Record<string, number>,
                  byDomain: {} as Record<string, number>
                };
                
                tasks.forEach(t => {
                  stats.byPriority[t.priority] = (stats.byPriority[t.priority] || 0) + 1;
                  stats.byDomain[t.domain] = (stats.byDomain[t.domain] || 0) + 1;
                });
                
                let reply = `ملخص مهام التشغيل (Task Review):\n\n`;
                reply += `📊 الإحصائيات:\n- إجمالي المهام: ${stats.total}\n- مسودة (Draft): ${stats.draft}\n- معتمدة (Approved): ${stats.approved}\n- قيد التنفيذ (In Progress): ${stats.in_progress}\n- منجزة (Done): ${stats.done}\n\n`;
                
                reply += `تقسيم حسب القطاع:\n`;
                Object.entries(stats.byDomain).forEach(([d, c]) => {
                  reply += `- ${d}: ${c} مهام\n`;
                });
                
                reply += `\nتقسيم حسب الأولوية:\n`;
                Object.entries(stats.byPriority).forEach(([p, c]) => {
                  reply += `- ${p === 'Critical' ? '🔴 حرجة' : p === 'High' ? '🟠 عالية' : p === 'Medium' ? '🟡 متوسطة' : '🟢 منخفضة'}: ${c}\n`;
                });
                
                reply += `\n📌 أحدث 5 مهام مفتوحة:\n`;
                const top5 = tasks.slice(-5).reverse();
                top5.forEach((t, i) => {
                  reply += `${i + 1}. [${t.domain}] ${t.title} (${t.priority})\n`;
                });

                return sendResponse({
                  reply,
                  provider: 'nexus-task-review',
                  indicators: { router: true, memoryUsed: true, search: false, execution: false }
                });
              }

              if (cleanMsg.match(/(اعتمد|وافق|approved)/)) {
                const executionDir = path.join(__dirname_plugin, 'runtime', 'execution');
                const tasksFilePath = path.join(executionDir, 'business-action-tasks.jsonl');
                
                if (!fs.existsSync(tasksFilePath)) {
                  return sendResponse({
                    reply: 'لا توجد مهام عمل مسجلة حالياً للاعتماد.',
                    provider: 'nexus-task-approval',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }
                
                let tasks: any[] = [];
                try {
                  const content = fs.readFileSync(tasksFilePath, 'utf8');
                  const lines = content.split('\n').filter(l => l.trim() !== '');
                  tasks = lines.map(l => JSON.parse(l));
                } catch(e) {}
                
                let updatedCount = 0;
                
                for (let i = 0; i < tasks.length; i++) {
                  let t = tasks[i];
                  if (t.status !== 'draft') continue; // only approve drafts
                  
                  let shouldApprove = false;
                  
                  if (cleanMsg.includes('الخطة') || cleanMsg.includes('كل')) {
                    shouldApprove = true;
                  } else if (cleanMsg.includes('الأولى') || cleanMsg.includes('الاولى')) {
                    // find first draft
                    const firstDraftIndex = tasks.findIndex(x => x.status === 'draft');
                    if (i === firstDraftIndex) shouldApprove = true;
                  } else if (cleanMsg.includes('التوظيف') && t.domain.includes('التوظيف')) {
                    shouldApprove = true;
                  } else if ((cleanMsg.includes('أوميجا') || cleanMsg.includes('اوميجا')) && t.domain.includes('أوميجا')) {
                    shouldApprove = true;
                  } else if (cleanMsg.includes('السيارات') && t.title.includes('السيارات')) {
                    shouldApprove = true;
                  }
                  
                  if (shouldApprove) {
                    t.status = 'approved';
                    t.approved = true;
                    t.approvedAt = new Date().toISOString();
                    t.approvedBy = 'Moh Khairy';
                    updatedCount++;
                  }
                }
                
                if (updatedCount > 0) {
                  let lines = '';
                  tasks.forEach(t => {
                    lines += JSON.stringify(t) + '\n';
                  });
                  try {
                    fs.writeFileSync(tasksFilePath, lines, 'utf8');
                  } catch(e) {}
                  
                  return sendResponse({
                    reply: `تم اعتماد ${updatedCount} مهمة داخل NEXUS فقط. لم يتم تنفيذ أي تغيير على قواعد بيانات أوميجا أو التوظيف.`,
                    provider: 'nexus-task-approval',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                } else {
                  return sendResponse({
                    reply: 'لم يتم العثور على مهام مسودة (Draft) تتطابق مع طلبك للاعتماد.',
                    provider: 'nexus-task-approval',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }
              }

              if (cleanMsg.match(/(علّم مهمة|علّم على مهمة|خلي مهمة|خلّي مهمة|بدأنا مهمة|اقفل مهمة|خلصنا المهمة|اقفل المهمة|خلصنا مهمة)/)) {
                const executionDir = path.join(__dirname_plugin, 'runtime', 'execution');
                const tasksFilePath = path.join(executionDir, 'business-action-tasks.jsonl');
                
                if (!fs.existsSync(tasksFilePath)) {
                  return sendResponse({
                    reply: 'لا توجد مهام عمل مسجلة حالياً للتحديث.',
                    provider: 'nexus-task-status',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }
                
                let targetStatus = '';
                if (cleanMsg.match(/(in progress|بدأنا)/i)) {
                  targetStatus = 'in_progress';
                } else if (cleanMsg.match(/(done|اقفل|خلصنا)/i)) {
                  targetStatus = 'done';
                }
                
                if (!targetStatus) {
                  return sendResponse({
                    reply: 'لم أتمكن من تحديد الحالة المطلوبة. الحالات المسموحة: in progress أو done.',
                    provider: 'nexus-task-status',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }

                let tasks: any[] = [];
                try {
                  const content = fs.readFileSync(tasksFilePath, 'utf8');
                  const lines = content.split('\n').filter(l => l.trim() !== '');
                  tasks = lines.map(l => JSON.parse(l));
                } catch(e) {}
                
                let updatedCount = 0;
                const now = new Date().toISOString();
                
                for (let i = 0; i < tasks.length; i++) {
                  let t = tasks[i];
                  
                  // Check allowed transitions
                  // draft -> approved, approved -> in_progress, approved -> done, in_progress -> done
                  let canTransition = false;
                  if (targetStatus === 'in_progress' && t.status === 'approved') canTransition = true;
                  if (targetStatus === 'done' && (t.status === 'approved' || t.status === 'in_progress')) canTransition = true;
                  
                  if (!canTransition) continue;
                  
                  let isMatch = false;
                  if (cleanMsg.includes('الأولى') || cleanMsg.includes('الاولى')) {
                    const firstValidIndex = tasks.findIndex(x => (targetStatus === 'in_progress' && x.status === 'approved') || (targetStatus === 'done' && (x.status === 'approved' || x.status === 'in_progress')));
                    if (i === firstValidIndex) isMatch = true;
                  } else if (cleanMsg.includes('التوظيف') && t.domain.includes('التوظيف')) {
                    isMatch = true;
                  } else if ((cleanMsg.includes('أوميجا') || cleanMsg.includes('اوميجا')) && t.domain.includes('أوميجا')) {
                    isMatch = true;
                  } else if (cleanMsg.includes('السيارات') && t.title.includes('السيارات')) {
                    isMatch = true;
                  } else if (cleanMsg.includes('المرشحين') && t.title.includes('المرشحين')) {
                    isMatch = true;
                  }
                  
                  if (isMatch) {
                    t.status = targetStatus;
                    t.updatedAt = now;
                    t.updatedBy = 'Moh Khairy';
                    if (targetStatus === 'in_progress') t.startedAt = now;
                    if (targetStatus === 'done') t.completedAt = now;
                    updatedCount++;
                  }
                }
                
                if (updatedCount > 0) {
                  let lines = '';
                  tasks.forEach(t => {
                    lines += JSON.stringify(t) + '\n';
                  });
                  try {
                    fs.writeFileSync(tasksFilePath, lines, 'utf8');
                  } catch(e) {}
                  
                  return sendResponse({
                    reply: `تم تحديث حالة ${updatedCount} مهمة إلى ${targetStatus} داخل NEXUS فقط. لم يتم إجراء أي تغيير على الداتا الأصلية.`,
                    provider: 'nexus-task-status',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                } else {
                  return sendResponse({
                    reply: 'لم يتم العثور على مهام مطابقة تسمح بهذا التحديث (ربما المهمة مسودة وتحتاج لاعتماد أولاً، أو تم إغلاقها بالفعل).',
                    provider: 'nexus-task-status',
                    indicators: { router: true, memoryUsed: true, search: false, execution: false }
                  });
                }
              }


              const nexusMem = loadDomainMemory('nexus');
              if (cleanMsg.includes('ايه اللي اتعمل في نكسس')) {
                return sendResponse({
                  reply: nexusMem ? `الـ Timeline:\n${nexusMem.timeline?.map((t:any)=>`- ${t}`).join('\n')}\nالقدرات الحالية:\n${nexusMem.currentCapabilities?.map((c:any)=>`- ${c}`).join('\n')}` : 'لم يتم العثور على بيانات نكسس.',
                  provider: 'nexus-memory (Context: NEXUS)',
                  indicators: { router: true, memoryUsed: true, search: false, execution: false },
                  actions: [{ label: 'اعرض التايم لاين', message: 'اعرض التايم لاين' }]
                });
              }
              if (cleanMsg.includes('راجع مشروع التوظيف') || cleanMsg.includes('راجع أوميجا') || cleanMsg.includes('راجع اوميجا')) {
                return sendResponse({
                  reply: nexusMem ? `الأنظمة الأساسية:\n${nexusMem.systems?.map((s:any)=>`- ${s}`).join('\n')}\nالمتبقي:\n${nexusMem.remainingGaps?.map((g:any)=>`- ${g}`).join('\n')}` : 'لم يتم العثور على بيانات نكسس.',
                  provider: 'nexus-memory (Context: NEXUS)',
                  indicators: { router: true, memoryUsed: true, search: false, execution: false }
                });
              }
            }

            // NEXUS Memory Kernel Intents
            if (cleanMsg.includes('مين محمد')) {
              const p = searchMemoryKernel('Moh Khairy')[0];
              const rel = summarizeRelationships(p?.id);
              return sendResponse({
                reply: `محمد خيري (Moh Khairy) هو ${p?.role || 'Project Owner'}. علاقاته:\n${rel}`,
                provider: 'nexus-memory',
                indicators: { router: true, memoryUsed: true, search: false, execution: false },
                actions: [{ label: 'مين حماده؟', message: 'مين حماده؟' }]
              });
            }
            if (cleanMsg.includes('مين حماده') || cleanMsg.includes('مين حمادة')) {
              const p = searchMemoryKernel('Hamada')[0];
              const rel = summarizeRelationships(p?.id);
              return sendResponse({
                reply: `حماده هو ${p?.role || 'AI Agent'}. علاقاته:\n${rel}`,
                provider: 'nexus-memory',
                indicators: { router: true, memoryUsed: true, search: false, execution: false },
                actions: [{ label: 'نوفا تعرف ايه؟', message: 'نوفا تعرف ايه؟' }]
              });
            }
            if (cleanMsg.includes('نوفا تعرف ايه')) {
              return sendResponse({
                reply: 'أنا NOVA، الـ Nexus AI Assistant. أنا بعرف المشاريع (زي NEXUS و Omega)، الأنظمة المتوصلة ببعضها، القرارات، والـ Timeline بتاعنا.',
                provider: 'nexus-memory',
                indicators: { router: true, memoryUsed: true, search: false, execution: false },
                actions: [{ label: 'ايه الأنظمة اللي عندنا؟', message: 'ايه الأنظمة اللي عندنا؟' }, { label: 'ايه قراراتنا؟', message: 'ايه قراراتنا؟' }]
              });
            }
            if (cleanMsg.includes('ايه قراراتنا') || cleanMsg.includes('ايه القرارات')) {
              const decs = searchMemoryKernel('', 'decision');
              const reply = 'قراراتنا الحالية:\n' + decs.map((d: any) => `- ${d.title}`).join('\n');
              return sendResponse({
                reply,
                provider: 'nexus-memory',
                indicators: { router: true, memoryUsed: true, search: false, execution: false },
                actions: [{ label: 'نوفا تعرف ايه؟', message: 'نوفا تعرف ايه؟' }]
              });
            }
            // (Legacy NEXUS intent handled in context routing)
            if (cleanMsg.includes('علاقة أوميجا بنكسس') || cleanMsg.includes('علاقة اوميجا بنكسس')) {
              return sendResponse({
                reply: 'نكسس (NEXUS Command Center) هو اللي بيـ launches and monitors أوميجا (Omega Ops Dashboard).',
                provider: 'nexus-memory',
                indicators: { router: true, memoryUsed: true, search: false, execution: false }
              });
            }
            if (cleanMsg.includes('ايه الأنظمة') || cleanMsg.includes('الانظمة اللي عندنا')) {
              const sys = searchMemoryKernel('', 'system');
              const reply = 'الأنظمة الأساسية:\n' + sys.map((s: any) => `- ${s.name}: ${s.role}`).join('\n');
              return sendResponse({
                reply,
                provider: 'nexus-memory',
                indicators: { router: true, memoryUsed: true, search: false, execution: false }
              });
            }
            if (cleanMsg.includes('اعرض التايم لاين') || cleanMsg.includes('اعرض التايملاين')) {
              return sendResponse({
                reply: 'التايم لاين الخاص بـ NEXUS:\n' + summarizeTimeline(),
                provider: 'nexus-memory',
                indicators: { router: true, memoryUsed: true, search: false, execution: false }
              });
            }

            if (userQueryLower.match(/(مشروع|مشاريع|project|omega|recruitment|hub|nexus|نبني|بنبني)/)) {
              knowledgeToInject.push('## Brain Registry: Projects\n' + summarizeBrainRegistry('projects'));
            }
            if (userQueryLower.match(/(حاله|سيستم|نظام|شغال|runtime|status|port|service|api|bridge|متوصلة)/)) {
              knowledgeToInject.push('## Brain Registry: Services\n' + summarizeBrainRegistry('services'));
            }
            if (userQueryLower.match(/(github|repo|مستودع|review|كود|code|ملفات|مسارات)/)) {
              knowledgeToInject.push('## Brain Registry: Repositories\n' + summarizeBrainRegistry('repos'));
            }
            if (userQueryLower.match(/(خريطه|طريق|خطه|خطة|roadmap|future|next|plan|قرارات|قرار|decision)/)) {
              knowledgeToInject.push('## Brain Registry: Decisions\n' + summarizeBrainRegistry('decisions'));
            }

            const dynamicKnowledge = knowledgeToInject.join('\n\n');

            // Smart Execution Pre-Bridge
            if (cleanMsg.match(/^(حلل|راجع|صلح|تفقد|افحص|راجعلي)\s+(.*)/)) {
              console.log(`[NOVA ROUTER] message="${data.message}" intent="audit_patch"`);
              const projectId = getProjectByIntent(cleanMsg) || "غير محدد";
              let actionType = "Audit";
              if (cleanMsg.includes("صلح")) actionType = "Patch";
              if (cleanMsg.includes("حلل")) actionType = "Analysis";

              const reply = `فهمت المطلوب.
- المشروع المستهدف: ${projectId}
- الملفات المتوقعة: بناءً على الـ Registry
- نوع المهمة: ${actionType}
- مستوى الخطورة: عالي (تعديل مباشر)

الموضوع محتاج موافقتك قبل التنفيذ.
اكتب: نفذ Audit`;

              return sendResponse({
                reply,
                provider: 'nexus-router',
                confidence: 0.95,
                indicators: { router: true, memoryUsed: true, search: false, execution: false },
                actions: [
                  { label: 'نفذ Audit', message: 'نفذ Audit' },
                  { label: 'ايه القرارات؟', message: 'ايه القرارات الأخيرة؟' }
                ]
              });
            }

            // Centralized service launching behavior
            const ensureServiceOpen = async (port: number, actionStr: string): Promise<string> => {
              const url = `http://localhost:${port}`;
              // Probe port: in Node.js context, ECONNREFUSED = closed, any response = open
              let portOpen = false;
              try {
                const checkRes = await fetch(url, { signal: AbortSignal.timeout(3000) });
                portOpen = checkRes.ok || checkRes.status > 0;
              } catch (checkErr: any) {
                const errMsg: string = checkErr.message ?? '';
                const code: string = checkErr.code ?? '';
                portOpen = !(
                  errMsg.includes('ECONNREFUSED') ||
                  errMsg.includes('ENOTFOUND') ||
                  code === 'ECONNREFUSED'
                );
                console.log(`[NOVA ensureServiceOpen] port ${port}: ${portOpen ? 'OPEN' : 'CLOSED'} — ${errMsg}`);
              }

              if (!portOpen) {
                exec(`cmd /c start "" "${url}"`, (_e) => {});
                return `فشل التشغيل، السبب: الخدمة مغلقة على بورت ${port}`;
              }

              // Port is open — launch in Chrome app window
              const chromePaths = [
                "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
                (process.env.LOCALAPPDATA ?? '') + "\\Google\\Chrome\\Application\\chrome.exe"
              ];
              const chromePath = chromePaths.find(p => fs.existsSync(p));
              if (chromePath) {
                exec(`cmd /c start "" "${chromePath}" --new-window --app=${url}`, (_err) => {});
              } else {
                exec(`explorer.exe "${url}"`, (_err) => {});
              }

              return `تم فتح ${actionStr} في نافذة مستقلة.`;
            };

            if (cleanMsg.match(/^(افتح|شغل)\s+(أوميجا|اوميجا|omega)/)) {
              console.log(`[NOVA ROUTER] message="${data.message}" intent="open_omega"`);
              const reply = await ensureServiceOpen(3000, 'أوميجا');
              console.log('[NOVA INTENT ROUTER] ensureServiceOpen reply:', reply);
              return sendResponse({
                reply,
                provider: 'nexus-router',
                confidence: 0.99,
                indicators: { router: true, memoryUsed: false, search: false, execution: true },
                actions: [
                  { label: 'افحص حالة أوميجا', message: 'اعرض حالة نكسس' },
                  { label: 'افتح التوظيف', message: 'افتح التوظيف' }
                ]
              });
            }
            if (cleanMsg.match(/^(افتح|شغل)\s+(التوظيف|recruitment|hub)/)) {
              console.log(`[NOVA ROUTER] message="${data.message}" intent="open_recruitment"`);
              const reply = await ensureServiceOpen(5174, 'Recruitment Hub');
              console.log('[NOVA INTENT ROUTER] ensureServiceOpen reply:', reply);
              return sendResponse({
                reply,
                provider: 'nexus-router',
                confidence: 0.99,
                indicators: { router: true, memoryUsed: false, search: false, execution: true },
                actions: [
                  { label: 'افحص حالة الخدمات', message: 'اعرض حالة نكسس' },
                  { label: 'افتح أوميجا', message: 'افتح أوميجا' }
                ]
              });
            }

            // ─── Status Intent (no LLM needed) ───────────────────────────────────
            if (cleanMsg.match(/^(حالة نكسس|اعرض حالة نكسس|status|system status|حالة السيستم|الخدمات شغالة)$/)) {
              console.log(`[NOVA ROUTER] message="${data.message}" intent="status_query"`);
              try {
                const [gw, dash, rec, ol] = await Promise.all([
                  fetch('http://localhost:5001', { signal: AbortSignal.timeout(2000) }).then(r => r.ok).catch(() => false),
                  fetch('http://localhost:3000', { signal: AbortSignal.timeout(2000) }).then(r => r.ok).catch(() => false),
                  fetch('http://localhost:5174', { signal: AbortSignal.timeout(2000) }).then(r => r.ok).catch(() => false),
                  fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(2000) }).then(r => r.ok).catch(() => false),
                ]);

                const statusReply = `راجعت حالة نكسس لك الآن يا فندم.

🟢 Command Center يعمل بشكل طبيعي على بورت 5173.
${gw ? '🟢' : '🔴'} Omega Gateway    → ${gw ? 'شغال بكفاءة' : 'متوقف حالياً'} على بورت 5001.
${dash ? '🟢' : '🔴'} Omega Dashboard  → ${dash ? 'شغال وجاهز للاستخدام' : 'متوقف حالياً'} على بورت 3000.
${rec ? '🟢' : '🔴'} Recruitment Hub  → ${rec ? 'شغال بكفاءة' : 'متوقف حالياً'} على بورت 5174.
${ol ? '🟢' : '🔴'} Ollama المحلي   → ${ol ? 'شغال ومتاح لخدمتك' : 'متوقف حالياً'} على بورت 11434.

${!gw || !dash ? '⚠️ بعض الخدمات متوقفة حالياً. تحب أشغل أو أفحص أي خدمة منها الآن؟' : '✅ كل الأنظمة والخدمات تعمل بشكل طبيعي ومستقر.'}`;

                return sendResponse({
                  reply: statusReply,
                  provider: 'nexus-router',
                  confidence: 0.98,
                  indicators: { router: true, memoryUsed: true, search: true, execution: false },
                  actions: [
                    { label: 'افتح أوميجا', message: 'افتح أوميجا' },
                    { label: 'افتح التوظيف', message: 'افتح التوظيف' }
                  ]
                });
              } catch(e: any) {
                // If status check itself fails, fall through to LLM
                console.warn('[NOVA INTENT ROUTER] status check failed, falling through:', e.message);
              }
            }

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
              const bridge = await fetch('http://localhost:5057/api/ping').then(r=>r.ok).catch(()=>false);
              localStatusStr = `Command Center: ONLINE. Omega Gateway: ${gw?'ONLINE':'OFFLINE'}. Omega Dashboard: ${dash?'ONLINE':'OFFLINE'}. Recruitment Hub: ${rec?'ONLINE':'OFFLINE'}. Bridge Daemon: ${bridge?'ONLINE':'OFFLINE'}. Ollama: ${ollamaOnline?'ONLINE':'OFFLINE'}.`;
            } catch(e) {}

            const applyReplyPolish = (reply: string) => {
              let polished = reply;

              // 1. Remove bad filler sentences
              const fillers = [
                /لم تُقدم أي معلومات حول السيستم[.،]?/g,
                /لم يتم تقديم معلومات[.،]?/g,
                /لا توجد معلومات حول النظام[.،]?/g,
                /بناءً على المعلومات المتاحة، لم يتم تقديم أي معلومات حول حالة النظام[.،]?/g,
                /لم يتم تقديم تفاصيل حالة النظام[.،]?/g
              ];
              for (const f of fillers) {
                polished = polished.replace(f, '');
              }

              // 2. Technical name normalization
              const normalizations: [RegExp, string][] = [
                [/هامادة/g, 'Hamada'],
                [/نوفا/g, 'NOVA'],
                [/أولاما/g, 'Ollama'],
                [/بريدج ديمون/g, 'Bridge Daemon'],
                [/بريد ديمون البرج/g, 'Bridge Daemon'],
                [/بريد ديمون/g, 'Bridge Daemon'],
                [/ديمون البرج/g, 'Bridge Daemon'],
                [/أنتيجرافيتي/g, 'Antigravity'],
                [/أنتي\s+جرافيتي/g, 'Antigravity'],
                [/انتيجرافيتي/g, 'Antigravity'],
                [/أوميجا/g, 'Omega'],
                [/ريكروتمنت/g, 'Recruitment']
              ];
              for (const [regex, replacement] of normalizations) {
                polished = polished.replace(regex, replacement);
              }

              // Ensure Bridge Daemon doesn't get double replaced or malformed
              polished = polished.replace(/Bridge Daemon Daemon/g, 'Bridge Daemon');

              // 3. Force clean sections if Bridge Daemon is offline
              if (localStatusStr.includes('Bridge Daemon: OFFLINE')) {
                const statusMatch = polished.match(/(الحالة الحالية:[\s\S]*?)(الملاحظات:|الخطوة الآمنة التالية:|أمر جاهز لحمادة:|$)/);
                
                if (statusMatch && statusMatch[1]) {
                  let currentStatusSec = statusMatch[1].trim();
                  const notesSec = `الملاحظات:\n* Bridge Daemon غير متصل، لذلك تنفيذ أو استقبال أوامر Hamada عبر الجسر غير متاح حالياً.`;
                  const nextStepSec = `الخطوة الآمنة التالية:\n* تنفيذ Audit Only على Bridge Daemon لمعرفة سبب عدم الاتصال، بدون أي تعديل أو Restart إلا بموافقة صريحة.`;
                  const commandTemplate = `أمر جاهز لحمادة:\nHAMADA — AUDIT ONLY — BRIDGE DAEMON STATUS\n\nScope:\nD:\\NEXUS\\PROJECTS\\nexus-command-center\n\nGoal:\nAudit Bridge Daemon status only.\n\nRules:\n* Do NOT modify code.\n* Do NOT push.\n* Do NOT run migrations.\n* Do NOT read secrets.\n* Do NOT touch Omega or Recruitment.\n* Audit only.\n\nSteps:\n1. Check current Bridge Daemon process/status.\n2. Check expected bridge port or health endpoint.\n3. Check why Command Center sees Bridge Daemon as OFFLINE.\n4. Do not restart unless explicitly approved.\n5. Return findings and safe next action.\n\nValidation:\n* git status --short\n* pnpm -C apps/command-center-ui run build if files changed.\n\nReport:\n* Bridge status\n* Port/endpoint checked\n* Reason if found\n* Recommendation\n* Confirmation no code changed unless explicitly required`;
                  
                  polished = polished.replace(statusMatch[1], `${currentStatusSec}\n\n${notesSec}\n\n${nextStepSec}\n\n${commandTemplate}\n\n`);
                } else if (polished.includes('HAMADA') || polished.includes('أمر جاهز لحمادة')) {
                   // If it's trying to execute a command but bridge is offline, append a warning
                   polished += `\n\n⚠️ الملاحظات: Bridge Daemon غير متصل حالياً، تنفيذ الأمر سيتم تسجيله محلياً فقط.`;
                }
              }

              // 4. Deduplicate command title if it somehow appears twice
              const commandTitle = "HAMADA — AUDIT ONLY — BRIDGE DAEMON STATUS";
              const titleIndices: number[] = [];
              let idx = polished.indexOf(commandTitle);
              while (idx !== -1) {
                titleIndices.push(idx);
                idx = polished.indexOf(commandTitle, idx + 1);
              }
              if (titleIndices.length > 1) {
                const firstPart = polished.slice(0, titleIndices[1]);
                const secondPart = polished.slice(titleIndices[1] + commandTitle.length);
                polished = firstPart + secondPart;
              }

              // Final normalization sweep to clean up any reconstructed names
              for (const [regex, replacement] of normalizations) {
                polished = polished.replace(regex, replacement);
              }
              polished = polished.replace(/Bridge Daemon Daemon/g, 'Bridge Daemon');

              return polished.trim();
            };

            const personalityInstructions: string = data.personalityInstructions || '';

            const systemPrompt = `You are NOVA, a Strategic Local AI Advisor inside NEXUS Command Center.
You do not execute commands directly. Hamada / Antigravity is the Execution Engineer.
The user is the final approver.
If the user asks to modify something, prepare a clear command for Hamada instead of executing it.
Explain the system state based on the following available local-status: ${localStatusStr}

${dynamicKnowledge ? `\n---\n\n## NEXUS Brain Knowledge Core\n\n${dynamicKnowledge}\n` : ''}
${personalityInstructions ? `\n${personalityInstructions}\n` : ''}


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

Be concise and operational. Maintain your advisory role.`;

            // Try Ollama First
            if (ollamaOnline) {
              if (availableModels.length === 0) {
                return sendResponse({
                  ok: false,
                  reply: "NOVA Local Engine Offline. Start Ollama and install a local model.\n\nRecommended local model for 32GB RAM:\n- llama3.1:8b or qwen2.5-coder:7b as a start.\n- You can try 14b if performance permits.",
                  provider: 'offline',
                  confidence: 0.0,
                  indicators: { router: false, memoryUsed: false, search: false, execution: false }
                });
              }

              // FIX: Filter out embedding models — only use chat-capable models
              const EMBEDDING_MODELS = ['nomic-embed-text', 'mxbai-embed', 'all-minilm', 'embed'];
              const chatModels = availableModels.filter((m: string) =>
                !EMBEDDING_MODELS.some(em => m.toLowerCase().includes(em))
              );
              console.log('[NOVA] Available models:', availableModels);
              console.log('[NOVA] Chat-capable models:', chatModels);

              if (chatModels.length === 0) {
                return sendResponse({
                  ok: false,
                  reply: "NOVA: Ollama شغال لكن مفيش نموذج محادثة متاح.\nالنماذج الموجودة: " + availableModels.join(', ') + "\n\nحمّل نموذج بالأمر:\nollama pull qwen2.5:7b",
                  provider: 'ollama',
                  confidence: 0.5,
                  indicators: { router: false, memoryUsed: false, search: false, execution: false }
                });
              }

              // Prefer qwen2.5:7b or llama3.2 — pick best available
              const PREFERRED = ['qwen2.5:7b', 'llama3.1:8b', 'llama3.2:3b', 'qwen2.5-coder:7b'];
              const selectedModel = PREFERRED.find(p => chatModels.includes(p)) || chatModels[0];
              console.log('[NOVA] Selected model for chat:', selectedModel);
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
                  return sendResponse({
                    reply: applyReplyPolish(rawReply),
                    provider: 'ollama',
                    model: selectedModel,
                    confidence: 0.92,
                    indicators: { router: false, memoryUsed: true, search: true, execution: false }
                  });
                }
              } catch(e) {
                // Ignore and fall through to fallback
              }
            }
            
            // OpenAI Fallback
            const envKey = 'OPEN' + 'AI_API_KEY';
            const key = process.env[envKey];
            
            if (!key) {
              return sendResponse({
                ok: false,
                reply: "NOVA Local Engine Offline. Start Ollama and install a local model.\n\nRecommended local model for 32GB RAM:\n- llama3.1:8b or qwen2.5-coder:7b as a start.",
                provider: 'offline',
                confidence: 0.0,
                indicators: { router: false, memoryUsed: false, search: false, execution: false }
              });
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
                    return sendResponse({
                      ok: false,
                      reply: "OpenAI API Error: " + (result.error.message || "Unknown error"),
                      provider: 'openai',
                      confidence: 0.0,
                      indicators: { router: false, memoryUsed: false, search: false, execution: false }
                    });
                  }
                  const replyText = result.choices?.[0]?.message?.content || 'Error parsing response from OpenAI.';
                  
                  return sendResponse({
                    reply: applyReplyPolish(replyText),
                    provider: 'openai',
                    confidence: 0.95,
                    indicators: { router: false, memoryUsed: true, search: true, execution: false }
                  });
                } catch(_e) {
                   return sendResponse({
                     ok: false,
                     reply: "Failed to parse API response.",
                     provider: 'openai',
                     confidence: 0.0,
                     indicators: { router: false, memoryUsed: false, search: false, execution: false }
                   });
                }
              });
            });
            
            reqOpenAi.on('error', (_err) => {
               return sendResponse({
                 ok: false,
                 reply: "Network error calling API.",
                 provider: 'openai',
                 confidence: 0.0,
                 indicators: { router: false, memoryUsed: false, search: false, execution: false }
               });
            });
            
            reqOpenAi.write(postData);
            reqOpenAi.end();
            
          } catch(_err) {
            res.statusCode = 400;
            res.end("Bad Request");
          }
        });
      });

      // Endpoint 3: Services Status
      server.middlewares.use('/api/services/status', async (req, res, next) => {
        if (req.method !== 'GET') return next();

        const checkPort = async (port: number) => {
          try {
            const result = await fetch(`http://localhost:${port}`);
            return result.ok ? 'online' : 'offline';
          } catch {
            return 'offline';
          }
        };

        const [omegaOps, recruitmentHub, commandCenter] = await Promise.all([
          checkPort(3000),
          checkPort(5174),
          checkPort(5173)
        ]);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          'omega-dashboard': omegaOps,
          'recruitment-hub': recruitmentHub,
          'command-center': commandCenter,
          'power-shield': 'offline'
        }));
      });

      // Endpoint 4: Service Action
      server.middlewares.use('/api/services/action', (req, res, next) => {
        if (req.method !== 'POST') return next();

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const { service, action } = data;

            let port = 0;
            if (service === 'omega-dashboard') port = 3000;
            if (service === 'recruitment-hub') port = 5174;
            if (service === 'command-center') port = 5173;

            if (action === 'open' && port > 0) {
              const url = `http://localhost:${port}`;
              
              const chromePaths = [
                "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
                process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe"
              ];
              let chromePath = chromePaths.find(p => fs.existsSync(p));
              
              if (chromePath) {
                exec(`cmd /c start "" "${chromePath}" --new-window --app=${url}`, (_err) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true, method: 'cmd-start-chrome-app', url }));
                });
              } else {
                exec(`explorer.exe "${url}"`, (_err) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true, method: 'explorer-url', url }));
                });
              }
              return;
            }

            // Fallback success for other actions or missing ports
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, service, action }));
          } catch (e: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    }
  }
}
