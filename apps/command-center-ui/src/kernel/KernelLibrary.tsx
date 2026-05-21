import { useState, useMemo } from 'react';
import type { KernelTool, KernelPriority, KernelStatus } from './kernelData';
import { KERNEL_TOOLS } from './kernelData';

// ──────────────────────────────────────────────────────────
// Priority badge colors
// ──────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<KernelPriority, string> = {
  P0: '#ff1744',
  P1: '#00d2ff',
  P2: '#ffab00',
  P3: '#5b7089',
};

// Status badge colors
const STATUS_COLOR: Record<KernelStatus, string> = {
  backlog:    '#5b7089',
  review:     '#ffab00',
  experiment: '#00d2ff',
  approved:   '#00e676',
  rejected:   '#ff1744',
};

// ──────────────────────────────────────────────────────────
// Pill Badge
// ──────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: '3px',
      border: `1px solid ${color}40`,
      background: `${color}12`,
      color,
      fontSize: '0.42rem',
      fontWeight: 700,
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────
// Detail Drawer
// ──────────────────────────────────────────────────────────
function KernelDrawer({ tool, onClose }: { tool: KernelTool; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tool.implementation_prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '420px',
          maxWidth: '95vw',
          height: '100vh',
          background: 'rgba(6,14,26,0.97)',
          border: '1px solid rgba(0,210,255,0.18)',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '20px 18px',
          gap: '14px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#00d2ff', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1.5px' }}>
              {tool.name}
            </div>
            <div style={{ color: '#5b7089', fontSize: '0.44rem', marginTop: '3px' }}>{tool.category}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(0,210,255,0.2)',
              color: '#5b7089',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: '0.5rem',
              borderRadius: '3px',
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Pills row */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Pill label={tool.priority} color={PRIORITY_COLOR[tool.priority]} />
          <Pill label={tool.status} color={STATUS_COLOR[tool.status]} />
          <Pill label={tool.target_module} color="#d500f9" />
        </div>

        {/* URL */}
        <div style={{ fontSize: '0.44rem', color: '#5b7089' }}>
          URL:{' '}
          <span style={{ color: '#00d2ff', wordBreak: 'break-all' }}>{tool.url}</span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,210,255,0.08)' }} />

        {/* Extracted Value */}
        <div>
          <div style={{ color: '#00e676', fontSize: '0.44rem', fontWeight: 700, marginBottom: '5px', letterSpacing: '1px' }}>
            ▸ EXTRACTED VALUE
          </div>
          <div style={{ color: '#c0cfe0', fontSize: '0.5rem', lineHeight: 1.6 }}>{tool.extracted_value}</div>
        </div>

        {/* Risks */}
        <div>
          <div style={{ color: '#ff1744', fontSize: '0.44rem', fontWeight: 700, marginBottom: '5px', letterSpacing: '1px' }}>
            ⚠ RISKS
          </div>
          <div style={{ color: '#c0cfe0', fontSize: '0.5rem', lineHeight: 1.6 }}>{tool.risks}</div>
        </div>

        {/* Next Action */}
        <div>
          <div style={{ color: '#ffab00', fontSize: '0.44rem', fontWeight: 700, marginBottom: '5px', letterSpacing: '1px' }}>
            → NEXT ACTION
          </div>
          <div style={{ color: '#c0cfe0', fontSize: '0.5rem', lineHeight: 1.6 }}>{tool.next_action}</div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,210,255,0.08)' }} />

        {/* Implementation Prompt */}
        <div>
          <div style={{ color: '#d500f9', fontSize: '0.44rem', fontWeight: 700, marginBottom: '5px', letterSpacing: '1px' }}>
            ⚡ IMPLEMENTATION PROMPT
          </div>
          <div
            style={{
              background: 'rgba(213,0,249,0.05)',
              border: '1px solid rgba(213,0,249,0.15)',
              borderRadius: '4px',
              padding: '10px',
              color: '#c0cfe0',
              fontSize: '0.48rem',
              lineHeight: 1.7,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
            }}
          >
            {tool.implementation_prompt}
          </div>
          <button
            id={`copy-prompt-${tool.id}`}
            onClick={handleCopy}
            style={{
              marginTop: '8px',
              padding: '6px 14px',
              background: copied ? 'rgba(0,230,118,0.08)' : 'rgba(213,0,249,0.06)',
              border: `1px solid ${copied ? 'rgba(0,230,118,0.35)' : 'rgba(213,0,249,0.3)'}`,
              color: copied ? '#00e676' : '#d500f9',
              cursor: 'pointer',
              fontSize: '0.48rem',
              fontWeight: 700,
              letterSpacing: '0.8px',
              borderRadius: '3px',
              width: '100%',
              transition: 'all 0.2s',
            }}
          >
            {copied ? '✓ COPIED TO CLIPBOARD' : '⧉ COPY IMPLEMENTATION PROMPT'}
          </button>
        </div>

        {/* Metadata */}
        <div style={{ marginTop: 'auto', color: '#334455', fontSize: '0.4rem' }}>
          Created: {tool.created_at} · Updated: {tool.updated_at}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Tool Card
// ──────────────────────────────────────────────────────────
function KernelCard({ tool, onClick }: { tool: KernelTool; onClick: () => void }) {
  return (
    <div
      id={`kernel-card-${tool.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        background: 'rgba(6,14,26,0.7)',
        border: '1px solid rgba(0,210,255,0.12)',
        borderRadius: '6px',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,210,255,0.35)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 18px rgba(0,210,255,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,210,255,0.12)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: PRIORITY_COLOR[tool.priority],
        boxShadow: `0 0 8px ${PRIORITY_COLOR[tool.priority]}60`,
      }} />

      <div style={{ paddingLeft: '8px' }}>
        {/* Name + category */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div>
            <div style={{ color: '#e8f4ff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.8px' }}>
              {tool.name}
            </div>
            <div style={{ color: '#5b7089', fontSize: '0.42rem', marginTop: '2px' }}>{tool.category}</div>
          </div>
          <Pill label={tool.priority} color={PRIORITY_COLOR[tool.priority]} />
        </div>

        {/* Value preview */}
        <div style={{
          color: '#8a99ad',
          fontSize: '0.44rem',
          lineHeight: 1.5,
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {tool.extracted_value}
        </div>

        {/* Pills row */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <Pill label={tool.status} color={STATUS_COLOR[tool.status]} />
          <Pill label={tool.target_module} color="#d500f9" />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Select Filter
// ──────────────────────────────────────────────────────────
function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <label htmlFor={id} style={{ color: '#5b7089', fontSize: '0.4rem', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'rgba(6,14,26,0.8)',
          border: '1px solid rgba(0,210,255,0.15)',
          color: '#c0cfe0',
          fontSize: '0.48rem',
          padding: '4px 8px',
          borderRadius: '3px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main KernelLibrary component
// ──────────────────────────────────────────────────────────
export function KernelLibrary({ onClose }: { onClose: () => void }) {
  const [selectedTool, setSelectedTool] = useState<KernelTool | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const priorities = Array.from(new Set(KERNEL_TOOLS.map((t) => t.priority))).sort();
  const modules = Array.from(new Set(KERNEL_TOOLS.map((t) => t.target_module))).sort();
  const statuses = Array.from(new Set(KERNEL_TOOLS.map((t) => t.status))).sort();

  const filtered = useMemo(() => {
    return KERNEL_TOOLS.filter((t) => {
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterModule && t.target_module !== filterModule) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [filterPriority, filterModule, filterStatus]);

  return (
    <>
      {/* Full-screen overlay panel */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8000,
          background: 'rgba(0,4,12,0.92)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={onClose}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxWidth: '1100px',
            margin: '0 auto',
            width: '100%',
            padding: '20px 24px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ color: '#00d2ff', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '2px' }}>
                ⚡ NEXUS INTELLIGENCE KERNEL v0
              </div>
              <div style={{ color: '#5b7089', fontSize: '0.45rem', marginTop: '4px' }}>
                LOCAL TOOL LIBRARY — {KERNEL_TOOLS.length} ENTRIES · NO EXTERNAL API
              </div>
            </div>
            <button
              id="kernel-close-btn"
              onClick={onClose}
              style={{
                background: 'rgba(255,23,68,0.05)',
                border: '1px solid rgba(255,23,68,0.25)',
                color: '#ff1744',
                cursor: 'pointer',
                padding: '6px 14px',
                fontSize: '0.48rem',
                borderRadius: '3px',
                fontWeight: 700,
              }}
            >
              ✕ CLOSE KERNEL
            </button>
          </div>

          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'rgba(6,14,26,0.6)',
            border: '1px solid rgba(0,210,255,0.1)',
            borderRadius: '5px',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}>
            <FilterSelect
              id="filter-priority"
              label="Priority"
              value={filterPriority}
              onChange={setFilterPriority}
              options={priorities}
            />
            <FilterSelect
              id="filter-module"
              label="Target Module"
              value={filterModule}
              onChange={setFilterModule}
              options={modules}
            />
            <FilterSelect
              id="filter-status"
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={statuses}
            />
            <div style={{ color: '#5b7089', fontSize: '0.44rem', marginLeft: 'auto', alignSelf: 'flex-end' }}>
              Showing {filtered.length} / {KERNEL_TOOLS.length} tools
            </div>
          </div>

          {/* Card Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
            overflowY: 'auto',
            flex: 1,
            paddingRight: '4px',
          }}>
            {filtered.map((tool) => (
              <KernelCard
                key={tool.id}
                tool={tool}
                onClick={() => setSelectedTool(tool)}
              />
            ))}
            {filtered.length === 0 && (
              <div style={{ color: '#5b7089', fontSize: '0.55rem', gridColumn: '1/-1', textAlign: 'center', paddingTop: '40px' }}>
                No tools match the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedTool && (
        <KernelDrawer tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
    </>
  );
}
