// Nova Personality Config — persisted to localStorage
// Loaded automatically by NovaPage and injected into nova-backend via chat request body

export interface NovaPersonality {
  style: 'executive' | 'technical' | 'concise' | 'egyptian';
  length: 'short' | 'medium' | 'detailed';
  customInstructions: string;
}

const STORAGE_KEY = 'nexus_nova_personality';

export const DEFAULT_PERSONALITY: NovaPersonality = {
  style: 'egyptian',
  length: 'medium',
  customInstructions: '',
};

export function loadPersonality(): NovaPersonality {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERSONALITY };
    return { ...DEFAULT_PERSONALITY, ...JSON.parse(raw) } as NovaPersonality;
  } catch {
    return { ...DEFAULT_PERSONALITY };
  }
}

export function savePersonality(p: NovaPersonality): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export function buildPersonalityInstruction(p: NovaPersonality): string {
  const styleInstructions: Record<NovaPersonality['style'], string> = {
    executive:  'Respond like a senior executive briefing — concise, high-level, action-oriented. No technical jargon unless needed.',
    technical:  'Respond with full technical details — include ports, paths, error codes, and diagnostic steps.',
    concise:    'Respond in the shortest possible form. One sentence per point. No padding.',
    egyptian:   'Respond naturally in Egyptian Arabic dialect. Warm but professional. Use local expressions naturally.',
  };
  const lengthInstructions: Record<NovaPersonality['length'], string> = {
    short:    'Keep total response under 5 lines.',
    medium:   'Keep total response between 5-15 lines.',
    detailed: 'Be thorough — explain reasoning, include all steps, full context.',
  };

  const parts = [
    `Response Style: ${styleInstructions[p.style]}`,
    `Response Length: ${lengthInstructions[p.length]}`,
    p.customInstructions ? `Custom Instructions from operator: ${p.customInstructions}` : '',
  ].filter(Boolean);

  return `\n## NOVA Personality Configuration\n${parts.join('\n')}`;
}
