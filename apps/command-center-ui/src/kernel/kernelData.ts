// NEXUS Intelligence Kernel v0 — Local Tool Library
// No external API calls. All data is local metadata only.

export type KernelPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type KernelStatus = 'backlog' | 'review' | 'experiment' | 'approved' | 'rejected';
export type KernelTargetModule =
  | 'Command Center'
  | 'Omega'
  | 'Recruitment'
  | 'Asset Hub'
  | 'Agent Core'
  | 'Dev Core';

export interface KernelTool {
  id: string;
  name: string;
  url: string;
  category: string;
  priority: KernelPriority;
  target_module: KernelTargetModule;
  extracted_value: string;
  risks: string;
  next_action: string;
  status: KernelStatus;
  implementation_prompt: string;
  created_at: string;
  updated_at: string;
}

export const KERNEL_TOOLS: KernelTool[] = [
  {
    id: 'codegraph',
    name: 'Codegraph',
    url: 'https://codegraph.dev',
    category: 'Repo Intelligence',
    priority: 'P1',
    target_module: 'Dev Core',
    extracted_value:
      'Visual dependency graph and codebase navigator. Enables cross-repo impact analysis before any change.',
    risks: 'May expose internal repo structure if connected to external services. Use offline/local mode only.',
    next_action: 'Evaluate local-only mode. Check if it can run against nexus-command-center and omega-ops-dashboard without cloud upload.',
    status: 'review',
    implementation_prompt:
      'Integrate Codegraph as a local dev tool inside nexus-command-center. Run against /src and /packages to generate a static dependency map. No cloud sync. Output: static HTML report saved to docs/codegraph-report.html.',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
  {
    id: 'freellmapi',
    name: 'Free LLM API',
    url: 'https://github.com/cheahjs/free-llm-api-resources',
    category: 'AI Gateway',
    priority: 'P2',
    target_module: 'Agent Core',
    extracted_value:
      'Catalog of free/low-cost LLM endpoints. Can provide fallback inference for Telegram Agent when Gemini is offline.',
    risks: 'External API dependency. Must never receive private NEXUS data. Use only for dry-run / classification tasks.',
    next_action: 'Assess which endpoints support Arabic text classification. Define strict data boundary before any integration.',
    status: 'backlog',
    implementation_prompt:
      'Evaluate free LLM endpoints for Arabic task classification fallback inside telegram-personal-agent. Integration must be opt-in, sandboxed, and never receive user PII or internal NEXUS operational data.',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
  {
    id: 'hermes-agent',
    name: 'Hermes Agent',
    url: 'https://huggingface.co/NousResearch/Hermes-3-Llama-3.1-8B',
    category: 'Local LLM',
    priority: 'P1',
    target_module: 'Agent Core',
    extracted_value:
      'Local open-weight LLM with strong instruction-following and tool-use capability. Can replace cloud dependency for Agent Core tasks.',
    risks: 'Requires significant VRAM (8B model). Needs local GPU or CPU fallback. Model weights must be stored offline — not committed to repo.',
    next_action: 'Benchmark Arabic task parsing quality vs current regex parser. Run on local WSL/GPU environment only.',
    status: 'experiment',
    implementation_prompt:
      'Deploy Hermes-3-Llama-3.1-8B locally via Ollama or llama.cpp inside WSL. Wire as optional inference backend in telegram-personal-agent app.py. Triggered only when GEMINI_OFFLINE=true. Parse Arabic task intent. Output must match existing KernelTask schema.',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
  {
    id: 'uipath-agentic',
    name: 'UiPath Agentic Automation',
    url: 'https://www.uipath.com/product/agentic-automation',
    category: 'RPA / Automation',
    priority: 'P3',
    target_module: 'Omega',
    extracted_value:
      'Enterprise RPA platform with agentic orchestration. Could automate Omega data entry and approval routing workflows.',
    risks: 'Enterprise licensing cost. Cloud-first architecture conflicts with NEXUS local-first principle. Significant integration overhead.',
    next_action: 'Hold. Evaluate only if n8n cannot cover required automation workflows. Do not invest time in v0.',
    status: 'backlog',
    implementation_prompt:
      'Before evaluating UiPath, document all automation workflows currently missing from n8n in Omega. Only proceed to UiPath assessment if n8n integration gap is confirmed and approved by Mohamed.',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
  {
    id: 'sonarsource-ai',
    name: 'SonarSource AI Code Assurance',
    url: 'https://www.sonarsource.com/solutions/ai-code-assurance/',
    category: 'Code Quality / Security',
    priority: 'P1',
    target_module: 'Dev Core',
    extracted_value:
      'Static analysis with AI-enhanced detection of security vulnerabilities, code smells, and coverage gaps. Prevents production regressions.',
    risks: 'Cloud analysis sends code to SonarCloud unless self-hosted. Self-hosted SonarQube requires server infrastructure.',
    next_action: 'Evaluate SonarQube Community Edition for local self-hosted deployment. Run against nexus-command-center and api-server first.',
    status: 'review',
    implementation_prompt:
      'Deploy SonarQube Community Edition locally via Docker (or standalone JAR). Configure analysis for: nexus-command-center (TypeScript), omega-ops-dashboard/artifacts/api-server (Node.js/TypeScript). Run as pre-commit gate. No cloud upload permitted.',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
  {
    id: 'kiro',
    name: 'Kiro',
    url: 'https://kiro.dev',
    category: 'AI Dev Tool',
    priority: 'P2',
    target_module: 'Dev Core',
    extracted_value:
      'AI-powered IDE with spec-driven development and automated hook execution. May accelerate feature delivery inside Command Center.',
    risks: 'New tool — stability unknown. May conflict with existing Antigravity + VSCode workflow. Evaluate before adopting.',
    next_action: 'Trial on a non-critical feature branch inside nexus-command-center. Do not use on Omega or Recruitment codebase.',
    status: 'review',
    implementation_prompt:
      'Trial Kiro IDE on a new isolated branch of nexus-command-center (e.g. feat/kiro-trial). Build one isolated UI component using Kiro spec-driven workflow. Compare output quality and speed vs standard Antigravity flow. Report findings.',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
  {
    id: 'tadween',
    name: 'Tadween',
    url: 'https://tadween.app',
    category: 'Arabic NLP / Documentation',
    priority: 'P2',
    target_module: 'Agent Core',
    extracted_value:
      'Arabic-first writing and documentation tool. Could complement the Telegram Arabic task parser with richer NLP capabilities.',
    risks: 'Limited API documentation available. Unclear data residency. Must not process private operational data.',
    next_action: 'Research Tadween API capabilities. Check if an offline/self-hosted option exists for Arabic text processing.',
    status: 'backlog',
    implementation_prompt:
      'Evaluate Tadween for Arabic NLP enhancement of telegram-personal-agent parse_arabic_task() function. Assess: offline mode availability, API response schema, privacy posture. Do not integrate until data boundary is confirmed safe.',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
  {
    id: 'portify',
    name: 'Portify',
    url: 'https://portify.dev',
    category: 'Dev Tooling / Port Management',
    priority: 'P3',
    target_module: 'Command Center',
    extracted_value:
      'Port management and service visibility tool. Could complement NEXUS Bridge for local service discovery and conflict detection.',
    risks: 'Low risk — dev-only tooling. No production dependency. May overlap with existing Bridge health monitoring.',
    next_action: 'Evaluate as optional dev utility. Check if it provides value beyond what NEXUS Bridge already does.',
    status: 'backlog',
    implementation_prompt:
      'Evaluate Portify as a local dev utility for NEXUS service port management. Compare its feature set against NEXUS Bridge /api/ping and /api/*-status endpoints. Only adopt if it provides clear operational value not covered by existing tools.',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
];
