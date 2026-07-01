export interface ProjectProfile {
  id: string;
  name: string;
  purpose: string;
  currentStage: string;
  allowedAdvice: string[];
  forbiddenExecution: string[];
  knownIntegrations: string[];
  currentRisks: string[];
  nextActions: string[];
}

export const PROJECT_PROFILES: Record<string, ProjectProfile> = {
  cc: {
    id: 'cc',
    name: 'NEXUS Command Center',
    purpose: 'Central operational monitoring deck, tactical AI bridge runtime (NOVA), and owner control layer.',
    currentStage: 'Phase 1E: Establishing local memory kernel and localized operations deck.',
    allowedAdvice: [
      'Audit project repositories and files',
      'Generate safe execution command blocks for Hamada',
      'Summarize local statuses and telemetry metrics',
      'Validate build scripts and git statuses'
    ],
    forbiddenExecution: [
      'Direct file mutations without owner review',
      'Executing commands directly on host system (NOVA is advisory only)',
      'Automated git pushes or remote deployments'
    ],
    knownIntegrations: [
      'Ollama Local AI API',
      'Antigravity Execution Bridge',
      'Bridge Daemon ping endpoint (port 9999)'
    ],
    currentRisks: [
      'Bridge Daemon is offline',
      'Temporary local storage context loss'
    ],
    nextActions: [
      'Conduct local process audit on Bridge Daemon status',
      'Verify Ollama model tags loading latency'
    ]
  },
  omega: {
    id: 'omega',
    name: 'Omega Ops Dashboard',
    purpose: 'Operations management system coordinating staff, fleet tracking, housing units, payroll, and clearance engines.',
    currentStage: 'Phase 1E: UI layout complete, pending API integration and database schema audit.',
    allowedAdvice: [
      'Formulate layout components and CSS styling patterns',
      'Recommend mock telemetry states and clearances rules',
      'Inspect payroll structures and attendance flows'
    ],
    forbiddenExecution: [
      'Modifying any database rows directly',
      'Applying database migrations without explicit owner confirmation',
      'Bypassing client-side validation logic'
    ],
    knownIntegrations: [
      'Supabase Database & Auth (Read-only status checks)',
      'n8n Workflows (Automation triggers)'
    ],
    currentRisks: [
      'Unchecked database migration scripts execution',
      'Omega Dashboard portal unreachable / port conflict'
    ],
    nextActions: [
      'Verify port 3000 status and gateway API routes config',
      'Review pending DB clearance items rules'
    ]
  },
  recruit: {
    id: 'recruit',
    name: 'Recruitment Hub',
    purpose: 'Supplier portal and candidate onboarding system with media asset ingestion pipelines.',
    currentStage: 'Onboarding verification: Safe candidate media importer verified.',
    allowedAdvice: [
      'Onboarding document processing and extraction flows advice',
      'Media asset upload storage path structures',
      'Ingestion mapping rules and metadata schemas'
    ],
    forbiddenExecution: [
      'Writing candidate PDFs or sensitive CV assets to repository files',
      'Exposing private signed URLs or candidate CVs publicly',
      'Modifying supabase storage bucket permissions'
    ],
    knownIntegrations: [
      'Supabase Private Storage (Signed URLs)',
      'WhatsApp Ingestion Webhooks'
    ],
    currentRisks: [
      'Sensitive file leaks on repository commits',
      'Invalid WhatsApp webhooks parser validation'
    ],
    nextActions: [
      'Scan local mail-intake folders for untracked CVs',
      'Validate whatsapp webhook payload sanitization'
    ]
  }
};
