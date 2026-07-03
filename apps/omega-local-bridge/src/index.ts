import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import net from 'net';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

// Event-Sourced & CQRS Architecture Modules
import { registerAllCommands } from './commands/registerAllCommands';
import { globalCommandBus } from './commands/CommandBus';
import { globalEventBroker } from './event-bus/LocalEventBroker';
import { globalMemoryRepository } from './memory/MemoryRepository';
import { globalAgentRegistry } from './agents/AgentRegistry';
import { globalProjectionEngine } from './projections/ProjectionEngine';
import { globalDecisionEngine } from './decision-engine/DecisionEngine';

dotenv.config();

// Initialize registrations
registerAllCommands();

// Event-Sourced Bootstrapper
async function bootstrapEventStore() {
  const eventsFile = path.join(__dirname, '..', 'data', 'nexus-events.jsonl');
  if (fs.existsSync(eventsFile) && fs.readFileSync(eventsFile, 'utf8').trim()) {
    console.log('Event store contains events. Performing Projection Engine replay...');
    await globalProjectionEngine.replay();
    return;
  }

  console.log('Event store is empty. Bootstrapping seed events...');
  const seedSrcDir = path.join(__dirname, '..', '..', 'command-center-ui', 'runtime', 'memory-kernel');

  const publishSeedEvents = async (filename: string, eventType: string) => {
    const srcFile = path.join(seedSrcDir, filename);
    if (fs.existsSync(srcFile)) {
      try {
        const content = fs.readFileSync(srcFile, 'utf8');
        const items = JSON.parse(content);
        if (Array.isArray(items)) {
          for (const item of items) {
            let entityId = item.id;
            if (!entityId && item.from && item.to) {
              entityId = `${item.from}_${item.to}`;
            }
            const entityName = item.name || item.title || item.relation || 'Seed';
            const entityType = item.type || (item.from ? 'relationship' : 'seed');

            await globalEventBroker.publish({
              workspace: 'system',
              source: 'bootstrap',
              type: eventType,
              entity: {
                type: entityType,
                id: String(entityId),
                name: entityName,
              },
              payload: item,
              severity: 'info',
              correlationId: 'bootstrap-corr-id',
              version: 1,
              metadata: {
                environment: 'local',
                tenantId: 'default-tenant',
                sessionId: 'bootstrap-session',
                traceId: 'bootstrap-trace-id',
              }
            });
          }
        }
      } catch (err: any) {
        console.error(`Failed to publish bootstrap seed for ${filename}:`, err.message);
      }
    }
  };

  await publishSeedEvents('entities.json', 'EntityCreated');
  await publishSeedEvents('relationships.json', 'RelationshipCreated');
  await publishSeedEvents('timeline.json', 'TimelineMilestoneCreated');

  // Trigger Projection Engine Replay to build the Read Models (Memory Kernel)
  await globalProjectionEngine.replay();
}

bootstrapEventStore().catch(err => console.error('Bootstrap Error:', err));

const app = express();
const port = parseInt(process.env.OMEGA_BRIDGE_PORT || '5057', 10);
const host = process.env.OMEGA_BRIDGE_HOST || '127.0.0.1';

app.use(express.json());

// Strict CORS
app.use(cors({
  origin: [
    'http://localhost:5173', 'http://127.0.0.1:5173',
    'http://localhost:5174', 'http://127.0.0.1:5174',
    'http://localhost:5175', 'http://127.0.0.1:5175',
    'http://localhost:5176', 'http://127.0.0.1:5176',
    'http://localhost:5177', 'http://127.0.0.1:5177'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// Block non-GET/POST/OPTIONS methods
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Method Not Allowed', mode: 'local-bridge' });
  }
  // No-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    mode: "omega-local-read-only-bridge",
    mutations: "disabled"
  });
});

app.get('/omega/snapshot', async (req, res) => {
  try {
    const fetchLimit = 10;
    const [proj, staff, att, veh, tasks] = await Promise.all([
      supabase.from('projects').select('id, project_name, status, created_at').order('created_at', { ascending: false }).limit(fetchLimit),
      supabase.from('staff').select('id, internal_code, position, clearance_status').limit(fetchLimit),
      supabase.from('attendance_logs').select('id, internal_code, status, date').order('date', { ascending: false }).limit(fetchLimit),
      supabase.from('vehicles').select('id, car_name, status').limit(fetchLimit),
      supabase.from('site_admin_tasks').select('id, title, status').limit(fetchLimit)
    ]);

    const sanitize = (data: any[], table: string) => (data || []).map(r => ({
      ...r,
      source_table: table,
      record_id: r.id,
      last_seen_at: new Date().toISOString()
    }));

    res.json({
      projects: sanitize(proj.data || [], 'projects'),
      staff: sanitize(staff.data || [], 'staff'),
      attendance: sanitize(att.data || [], 'attendance_logs'),
      vehicles: sanitize(veh.data || [], 'vehicles'),
      site_admin_tasks: sanitize(tasks.data || [], 'site_admin_tasks')
    });
  } catch (error) {
    console.error('Snapshot Error:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot' });
  }
});

app.get('/omega/events', async (req, res) => {
  try {
    const events: any[] = [];
    const fetchLimit = 3; // Keep it small to avoid flooding

    // Fetch projects
    const { data: proj } = await supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(fetchLimit);
    if (proj) {
      proj.forEach(p => {
        events.push({
          id: `omega-proj-${p.id}`,
          timestamp: p.created_at || new Date().toISOString(),
          workspace: 'omega',
          category: 'project_activity',
          type: 'SYSTEM_STATUS',
          severity: 'low',
          summary: `Project ${p.project_name} status: ${p.status}`,
          payload: { status: p.status, name: p.project_name },
          evidence_refs: ['omega_bridge:read_only', 'source_table:projects', `record_id:${p.id}`]
        });
      });
    }

    // Fetch attendance
    const { data: att } = await supabase.from('attendance_logs').select('*').order('date', { ascending: false }).limit(fetchLimit);
    if (att) {
      att.forEach(a => {
        const isAbnormal = a.status === 'absent' || a.status === 'late';
        events.push({
          id: `omega-att-${a.id}`,
          timestamp: a.date || new Date().toISOString(),
          workspace: 'omega',
          category: 'attendance_issues',
          type: isAbnormal ? 'SECURITY_ALERT' : 'OPERATIONAL_EVENT',
          severity: isAbnormal ? 'medium' : 'low',
          summary: `Staff ${a.internal_code} attendance: ${a.status}`,
          payload: { internal_code: a.internal_code, status: a.status },
          evidence_refs: ['omega_bridge:read_only', 'source_table:attendance_logs', `record_id:${a.id}`]
        });
      });
    }

    // Fetch vehicles
    const { data: veh } = await supabase.from('vehicles').select('*').limit(fetchLimit);
    if (veh) {
      veh.forEach(v => {
        const needsMaint = v.status === 'maintenance' || v.status === 'issue';
        events.push({
          id: `omega-veh-${v.id}`,
          timestamp: new Date().toISOString(),
          workspace: 'omega',
          category: 'fleet_issues',
          type: needsMaint ? 'RISK_EVENT' : 'FLEET_EVENT',
          severity: needsMaint ? 'high' : 'low',
          summary: `Vehicle ${v.car_name} status: ${v.status}`,
          payload: { car_name: v.car_name, status: v.status },
          evidence_refs: ['omega_bridge:read_only', 'source_table:vehicles', `record_id:${v.id}`]
        });
      });
    }

    res.json({ events });
  } catch (error) {
    console.error('Events Error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/sync/omega-memory', async (req, res) => {
  try {
    const fetchLimit = 10;
    
    // Count queries
    const getCount = async (table: string) => {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      return count || 0;
    };

    const [
      projectsCount, staffCount, vehiclesCount, housingUnitsCount, housingAssignmentsCount,
      attendanceCount, attendanceLogsCount, approvalsCount, applicantsCount,
      onboardingQueueCount, tasksCount, assetsCount, documentsCount
    ] = await Promise.all([
      getCount('projects'), getCount('staff'), getCount('vehicles'), getCount('housing_units'), getCount('housing_assignments'),
      getCount('attendance'), getCount('attendance_logs'), getCount('approvals'), getCount('applicants'),
      getCount('recruitment_onboarding_queue'), getCount('site_admin_tasks'), getCount('assets'), getCount('documents')
    ]);

    // Data queries
    const [staffData, projectsData, vehiclesData, housingData] = await Promise.all([
      supabase.from('staff').select('id, full_name, internal_code, position, department, job_title, current_site, status, assigned_vehicle, housing_unit'),
      supabase.from('projects').select('id, project_name, status, created_at').limit(fetchLimit),
      supabase.from('vehicles').select('id, plate_number, car_name, status, driver').limit(fetchLimit),
      supabase.from('housing_units').select('id, unit_name, status, capacity').limit(fetchLimit)
    ]);

    const staffList = staffData.data || [];

    // Aggregations
    const byDepartment = staffList.reduce((acc: any, s: any) => {
      const dept = s.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const byRole = staffList.reduce((acc: any, s: any) => {
      const role = s.position || s.job_title || 'Unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const byStaffStatus = staffList.reduce((acc: any, s: any) => {
      const st = s.status || 'Unknown';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});

    const bySite = staffList.reduce((acc: any, s: any) => {
      const site = s.current_site || 'Unknown';
      acc[site] = (acc[site] || 0) + 1;
      return acc;
    }, {});

    const sanitizeStaff = (row: any) => {
      return {
        id: row.id,
        full_name: row.full_name,
        internal_code: row.internal_code,
        position: row.position,
        department: row.department,
        job_title: row.job_title,
        current_site: row.current_site,
        status: row.status,
        assigned_vehicle: row.assigned_vehicle,
        housing_unit: row.housing_unit
      };
    };

    const emptyTables = [
      ...(tasksCount === 0 ? ['site_admin_tasks', 'nexus_tasks'] : []),
      ...(assetsCount === 0 ? ['assets'] : []),
      ...(documentsCount === 0 ? ['documents'] : [])
    ];

    res.json({
      ok: true,
      source: "omega-supabase",
      syncedAt: new Date().toISOString(),
      summary: {
        projectsCount,
        staffCount,
        vehiclesCount,
        housingUnitsCount,
        housingAssignmentsCount,
        attendanceCount,
        attendanceLogsCount,
        approvalsCount,
        applicantsCount,
        onboardingQueueCount,
        tasksCount,
        assetsCount,
        documentsCount
      },
      staffSummary: {
        total: staffCount,
        byDepartment,
        byRole,
        byStatus: byStaffStatus,
        bySite,
        sample: staffList.slice(0, 10).map(sanitizeStaff)
      },
      projects: projectsData.data || [],
      vehiclesSummary: {
        total: vehiclesCount,
        byStatus: (vehiclesData.data || []).reduce((acc: any, v: any) => {
          const st = v.status || 'Unknown';
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        }, {}),
        sample: vehiclesData.data || []
      },
      housingSummary: {
        unitsTotal: housingUnitsCount,
        assignmentsTotal: housingAssignmentsCount,
        sampleUnits: housingData.data || []
      },
      attendanceSummary: {
        total: attendanceCount,
        logsTotal: attendanceLogsCount
      },
      recruitmentOpsSummary: {
        applicantsTotal: applicantsCount,
        onboardingQueueTotal: onboardingQueueCount
      },
      emptyTables,
      warnings: []
    });

  } catch (error) {
    console.error('Omega Memory Sync Error:', error);
    res.status(500).json({ error: 'Failed to sync memory' });
  }
});

app.get('/api/sync/recruitment-memory', async (req, res) => {
  try {
    const fetchLimit = 10;
    
    const getCount = async (table: string) => {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      return count || 0;
    };

    const [
      candidatesCount, positionsCount, interviewsCount, onboardingQueueCount, callLogsCount, statusHistoryCount, documentsCount
    ] = await Promise.all([
      getCount('recruitment_candidates'), getCount('recruitment_job_positions'), getCount('recruitment_interviews'),
      getCount('recruitment_onboarding_queue'), getCount('recruitment_call_logs'), getCount('recruitment_status_history'),
      getCount('recruitment_documents')
    ]);

    const { data: candidatesData } = await supabase
      .from('recruitment_candidates')
      .select(`
        id, full_name, status, call_status, source, screening_score,
        recruitment_job_positions(title)
      `);

    const candidatesList = candidatesData || [];

    const pipelineByStatus = candidatesList.reduce((acc: any, c: any) => {
      const st = c.status || 'Unknown';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});

    const candidatesByRole = candidatesList.reduce((acc: any, c: any) => {
      const role = c.recruitment_job_positions?.title || 'Unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const sanitizeCandidate = (row: any) => {
      return {
        id: row.id,
        full_name: row.full_name,
        target_role: row.recruitment_job_positions?.title || 'Unknown',
        status: row.status,
        stage: row.call_status,
        source: row.source,
        screening_score: row.screening_score
      };
    };

    res.json({
      ok: true,
      source: "recruitment-supabase",
      syncedAt: new Date().toISOString(),
      summary: {
        candidatesCount,
        positionsCount,
        interviewsCount,
        onboardingQueueCount,
        callLogsCount,
        statusHistoryCount,
        documentsCount
      },
      pipelineByStatus,
      candidatesByRole,
      followupsDue: [], // Mocked for now, can be fetched if needed
      interviewsSummary: { total: interviewsCount },
      safeSample: candidatesList.slice(0, 10).map(sanitizeCandidate),
      emptyTables: [],
      warnings: []
    });

  } catch (error) {
    console.error('Recruitment Memory Sync Error:', error);
    res.status(500).json({ error: 'Failed to sync recruitment memory' });
  }
});
import os from 'os';

const execAsync = util.promisify(exec);

const isPortListening = (portNum: number, hostName = '127.0.0.1'): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.setTimeout(1000);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(portNum, hostName, () => {
      socket.end();
      resolve(true);
    });
  });
};

app.get('/api/ping', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.end('SYSTEM ONLINE');
});

app.get('/api/sys', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = ((totalMem - freeMem) / totalMem) * 100;
  res.setHeader('Content-Type', 'text/plain');
  res.end(usedPercent.toFixed(1));
});

app.get('/api/recruit-status', async (req, res) => {
  const isRunning = await isPortListening(3820);
  res.json({
    project: "recruitment-hub",
    path: "D:\\NEXUS\\PROJECTS\\recruitment-hub",
    port: 3820,
    isRunning,
    url: "http://localhost:3820/candidates",
    lastKnownStatus: isRunning ? "ONLINE" : "IDLE"
  });
});

app.get('/api/api-server-status', async (req, res) => {
  const isRunning = await isPortListening(5001);
  res.json({
    project: "omega-api-server",
    path: "D:\\NEXUS\\PROJECTS\\omega-ops-dashboard",
    port: 5001,
    isRunning,
    url: "http://localhost:5001/api/healthz",
    lastKnownStatus: isRunning ? "ONLINE" : "IDLE"
  });
});

app.get('/api/telegram-status', async (req, res) => {
  let running = false;
  let pidVal = '';
  const agentPath = 'D:\\NEXUS\\AGENTS\\telegram-personal-agent';
  const pidFile = path.join(agentPath, 'agent.pid');
  
  try {
    if (fs.existsSync(pidFile)) {
      pidVal = fs.readFileSync(pidFile, 'utf8').trim();
      if (/^\d+$/.test(pidVal)) {
        const { stdout } = await execAsync(`wsl ps -p ${pidVal}`);
        if (stdout.includes(pidVal)) {
          running = true;
        }
      }
    }
  } catch (err) {
    // ignore process check errors
  }
  
  const logsArr: string[] = [];
  const logFile = path.join(agentPath, 'logs', 'agent.log');
  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      const lastLines = lines.slice(-10);
      lastLines.forEach(line => {
        const cleanLine = line.replace(/\d{8,10}:[A-Za-z0-9_-]{35,45}/g, '<REDACTED_TELEGRAM_TOKEN>');
        logsArr.push(cleanLine);
      });
    }
  } catch (err) {
    // ignore log read errors
  }
  
  res.json({
    running,
    pid: pidVal ? parseInt(pidVal, 10) : null,
    last_log_lines: logsArr,
    agent_path: agentPath
  });
});

app.get('/api/repo-library', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'repo-library.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    } else {
      res.status(404).json({ error: 'Repo library file not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read repo library' });
  }
});

app.get('/api/repo-library/search', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'repo-library.json');
  const q = req.query.q ? String(req.query.q).trim().toLowerCase() : '';
  if (!q) {
    return res.json([]);
  }
  try {
    if (fs.existsSync(filePath)) {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const matched = existing.filter((repo: any) => {
        let matchFound = false;
        if (repo.name && repo.name.toLowerCase().includes(q)) matchFound = true;
        else if (repo.system_layer && repo.system_layer.toLowerCase().includes(q)) matchFound = true;
        else if (repo.architecture_type && repo.architecture_type.toLowerCase().includes(q)) matchFound = true;
        else if (repo.knowledge_value && repo.knowledge_value.toLowerCase().includes(q)) matchFound = true;
        else if (repo.notes && repo.notes.toLowerCase().includes(q)) matchFound = true;
        else {
          if (repo.domain && repo.domain.some((d: string) => d.toLowerCase().includes(q))) matchFound = true;
          if (repo.runtime_patterns && repo.runtime_patterns.some((p: string) => p.toLowerCase().includes(q))) matchFound = true;
          if (repo.agent_patterns && repo.agent_patterns.some((p: string) => p.toLowerCase().includes(q))) matchFound = true;
          if (repo.workflow_patterns && repo.workflow_patterns.some((p: string) => p.toLowerCase().includes(q))) matchFound = true;
          if (repo.governance_notes && repo.governance_notes.some((n: string) => n.toLowerCase().includes(q))) matchFound = true;
        }
        return matchFound;
      });
      res.json(matched);
    } else {
      res.status(404).json({ error: 'Repo library file not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/repo-library/upsert', (req, res) => {
  const dataDir = path.join(__dirname, '..', 'data');
  const filePath = path.join(dataDir, 'repo-library.json');
  const indexFilePath = path.join(dataDir, 'repo-library.index.json');
  const localBackupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(localBackupDir)) {
    fs.mkdirSync(localBackupDir, { recursive: true });
  }

  try {
    const newEntry = req.body;
    if (!newEntry || !newEntry.id || !newEntry.name || !newEntry.source_type || !newEntry.priority || !newEntry.status) {
      return res.status(400).json({ error: "Missing required fields: id, name, source_type, priority, status" });
    }

    let existing: any[] = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      existing = JSON.parse(raw);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(localBackupDir, `repo-library-${timestamp}.json`);
      fs.writeFileSync(backupPath, raw, 'utf8');
    }

    const idx = existing.findIndex((item: any) => item.id === newEntry.id);
    if (idx !== -1) {
      existing[idx] = newEntry;
    } else {
      existing.push(newEntry);
    }

    const updatedJson = JSON.stringify(existing, null, 2);
    fs.writeFileSync(filePath, updatedJson, 'utf8');

    const flatIndex = existing.map((item: any) => {
      let txt = `${item.id} ${item.name} ${item.source_type} ${item.priority} ${item.status} ${item.system_layer || ''}`;
      if (item.domain) txt += ' ' + item.domain.join(' ');
      if (item.architecture_type) txt += ' ' + item.architecture_type;
      if (item.knowledge_value) txt += ' ' + item.knowledge_value;
      if (item.notes) txt += ' ' + item.notes;
      return { id: item.id, name: item.name, text: txt };
    });
    fs.writeFileSync(indexFilePath, JSON.stringify(flatIndex), 'utf8');

    res.json({ status: "SUCCESS", id: newEntry.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/operational-intelligence', async (req, res) => {
  try {
    const [vehRes, tripRes, attRes, appRes, projRes] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('vehicle_trips').select('*'),
      supabase.from('attendance_logs').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('approvals').select('*'),
      supabase.from('projects').select('*')
    ]);

    const vehicles = vehRes.data || [];
    const trips = tripRes.data || [];
    const attendance = attRes.data || [];
    const approvals = appRes.data || [];
    const projects = projRes.data || [];

    // 1. Fleet Analytics
    const totalTripsCost = trips.reduce((sum, t) => sum + (Number(t.trip_cost) || 0), 0);
    const maintenanceVehicles = vehicles.filter(v => v.status === 'In Service' || v.status === 'Out of Service').length;
    const activeVehiclesNoDriver = vehicles.filter(v => v.status === 'Active' && !v.driver).length;

    // 2. Attendance Analytics
    const recentLogsCount = attendance.length;
    const absentOrLate = attendance.filter(a => a.status === 'absent' || a.status === 'late').length;
    const attendanceFrictionRate = recentLogsCount > 0 ? (absentOrLate / recentLogsCount) * 100 : 0;

    // 3. Approval bottlenecks
    const pendingApprovals = approvals.filter(a => a.status === 'pending' || a.status === 'Pending').length;

    // 4. Project status
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'Active').length;
    const delayedProjects = projects.filter(p => p.status === 'delayed' || p.status === 'Delayed' || p.status === 'paused' || p.status === 'Paused').length;

    // 5. Risk Index calculation
    let riskIndex = 10; // baseline
    const alerts: string[] = [];

    if (maintenanceVehicles > 0) {
      riskIndex += Math.min(maintenanceVehicles * 8, 24);
      alerts.push(`FLEET: ${maintenanceVehicles} vehicle(s) currently under service/maintenance.`);
    }
    if (activeVehiclesNoDriver > 0) {
      riskIndex += Math.min(activeVehiclesNoDriver * 12, 36);
      alerts.push(`FLEET: ${activeVehiclesNoDriver} active vehicle(s) without an assigned driver.`);
    }
    if (attendanceFrictionRate > 15) {
      riskIndex += 15;
      alerts.push(`ATTENDANCE: High absenteeism/lateness rate of ${attendanceFrictionRate.toFixed(1)}% detected in recent logs.`);
    }
    if (pendingApprovals > 0) {
      riskIndex += Math.min(pendingApprovals * 6, 24);
      alerts.push(`APPROVALS: ${pendingApprovals} request(s) pending approval, potential bottleneck.`);
    }
    if (delayedProjects > 0) {
      riskIndex += Math.min(delayedProjects * 10, 30);
      alerts.push(`PROJECTS: ${delayedProjects} project(s) currently marked as delayed or paused.`);
    }

    const finalRiskIndex = Math.min(Math.max(riskIndex, 0), 100);

    // Risk category
    let riskLevel = 'LOW';
    let riskColor = 'text-green-400';
    if (finalRiskIndex > 60) {
      riskLevel = 'CRITICAL';
      riskColor = 'text-red-400';
    } else if (finalRiskIndex > 35) {
      riskLevel = 'MEDIUM';
      riskColor = 'text-amber-400';
    }

    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      analytics: {
        riskIndex: finalRiskIndex,
        riskLevel,
        riskColor,
        fleet: {
          totalTripsCost,
          maintenanceVehicles,
          activeVehiclesNoDriver,
          totalVehicles: vehicles.length
        },
        attendance: {
          recentLogsCount,
          absentOrLateCount: absentOrLate,
          frictionRate: Number(attendanceFrictionRate.toFixed(2))
        },
        approvals: {
          pendingCount: pendingApprovals
        },
        projects: {
          activeCount: activeProjects,
          delayedCount: delayedProjects,
          totalCount: projects.length
        },
        alerts
      }
    });
  } catch (error: any) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to calculate operational intelligence: ' + error.message });
  }
});

app.get('/api/open-vscode', (req, res) => {
  exec('cmd /c start vscode://file/D:/NEXUS/PROJECTS/omega-ops-dashboard', (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.end('IDE TRIGGERED');
    }
  });
});

app.get('/api/open-folder', (req, res) => {
  exec('explorer.exe D:\\NEXUS\\PROJECTS\\omega-ops-dashboard', (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.end('FS TRIGGERED');
    }
  });
});

app.get('/api/git-check', async (req, res) => {
  const paths = [
    'D:\\NEXUS\\PROJECTS\\omega-ops-dashboard',
    'D:\\NEXUS\\PROJECTS\\sally-recruitment-command-center',
    'D:\\NEXUS\\PROJECTS\\recruitment-hub'
  ];
  let output = '';
  for (const p of paths) {
    if (fs.existsSync(p)) {
      output += `\n--[ Checking ${p} ]--\n`;
      try {
        const { stdout } = await execAsync('git status --short', { cwd: p });
        output += stdout || 'CLEAN\n';
      } catch (err: any) {
        output += `Error: ${err.message}\n`;
      }
    }
  }
  res.setHeader('Content-Type', 'text/plain');
  res.end(output);
});

// ─── Event-Sourced & CQRS Endpoints ──────────────────────────────────────────

app.post('/api/commands', async (req, res) => {
  try {
    const result = await globalCommandBus.dispatch(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/events/history', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const since = req.query.since as string | undefined;
    const events = await globalEventBroker.getHistory(limit, since);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agents/register', (req, res) => {
  try {
    const agent = globalAgentRegistry.register(req.body);
    res.json(agent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/agents/heartbeat', (req, res) => {
  try {
    const { id } = req.body;
    const agent = globalAgentRegistry.heartbeat(id);
    res.json(agent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/agents', (req, res) => {
  try {
    const agents = globalAgentRegistry.getAgents();
    res.json(agents);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/memory/kernel', (req, res) => {
  try {
    const domain = req.query.domain as string | undefined;
    if (domain === 'entities') return res.json(globalMemoryRepository.getEntities());
    if (domain === 'relationships') return res.json(globalMemoryRepository.getRelationships());
    if (domain === 'timeline') return res.json(globalMemoryRepository.getTimeline());
    if (domain === 'policies') return res.json(globalMemoryRepository.getPolicies());
    if (domain === 'decisions') return res.json(globalMemoryRepository.getDecisions());
    if (domain === 'tasks') return res.json(globalMemoryRepository.getTasks());
    if (domain === 'facts') return res.json(globalMemoryRepository.getFacts());

    res.json({
      entities: globalMemoryRepository.getEntities(),
      relationships: globalMemoryRepository.getRelationships(),
      timeline: globalMemoryRepository.getTimeline(),
      policies: globalMemoryRepository.getPolicies(),
      decisions: globalMemoryRepository.getDecisions(),
      tasks: globalMemoryRepository.getTasks(),
      facts: globalMemoryRepository.getFacts(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memory/kernel', (req, res) => {
  try {
    const { domain, data } = req.body;
    if (!domain || !data) throw new Error('domain and data are required');

    if (domain === 'entities') globalMemoryRepository.saveEntity(data);
    else if (domain === 'relationships') globalMemoryRepository.saveRelationship(data);
    else if (domain === 'timeline') globalMemoryRepository.saveTimeline(data);
    else if (domain === 'policies') globalMemoryRepository.savePolicy(data);
    else if (domain === 'decisions') globalMemoryRepository.saveDecision(data);
    else if (domain === 'tasks') globalMemoryRepository.saveTask(data);
    else if (domain === 'facts') globalMemoryRepository.saveFact(data);
    else throw new Error(`Unknown memory domain: ${domain}`);

    res.json({ status: 'SUCCESS' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/recommendations', (req, res) => {
  try {
    const recommendations = globalDecisionEngine.evaluate();
    res.json(recommendations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projections/replay', async (req, res) => {
  try {
    await globalProjectionEngine.replay();
    res.json({ status: 'SUCCESS' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, host, () => {
  console.log(`Omega Local Bridge running at http://${host}:${port}`);
});
