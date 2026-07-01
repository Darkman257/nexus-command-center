import { useState } from 'react';
import { Settings as SettingsIcon, Shield, RefreshCw, Cpu, Sparkles, Save, RotateCcw } from 'lucide-react';
import { loadPersonality, savePersonality, DEFAULT_PERSONALITY } from '../lib/novaPersonality';
import type { NovaPersonality } from '../lib/novaPersonality';

export function Settings() {
  const [telemetryPolling, setTelemetryPolling] = useState(true);
  const [hwAcceleration, setHwAcceleration] = useState(true);
  const [quarantineMode, setQuarantineMode] = useState(true);
  const [refreshRate, setRefreshRate] = useState('15s');
  const [intelligenceMode, setIntelligenceMode] = useState('advisor');

  // NOVA Personality
  const [personality, setPersonality] = useState<NovaPersonality>(() => loadPersonality());
  const [personalitySaved, setPersonalitySaved] = useState(false);

  const handleSavePersonality = () => {
    savePersonality(personality);
    setPersonalitySaved(true);
    setTimeout(() => setPersonalitySaved(false), 2000);
  };

  const handleRestoreDefault = () => {
    setPersonality({ ...DEFAULT_PERSONALITY });
    savePersonality({ ...DEFAULT_PERSONALITY });
  };

  return (
    <section className="nova-center-core" style={{
      gridColumn: 'center / span 2',
      background: 'rgba(3, 8, 16, 0.4)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '1.2fr 0.8fr',
      gap: '24px',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Column: Toggles and preferences */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="compartment-label">[DECK-10 SECURE CONTROL ROOM]</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <SettingsIcon size={18} style={{ color: 'var(--cyan)' }} />
            <h2 style={{ color: 'var(--text-bright)', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
              COMMAND CENTER PREFERENCES
            </h2>
          </div>
        </div>

        {/* Spacious Toggle Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Preference Item 1 */}
          <div className="glass" style={{
            padding: '14px',
            background: 'rgba(5, 12, 24, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>
                TELEMETRY AUTO-POLLING LOOP
              </span>
              <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>
                Queries bridge daemon status and OMEGA gateways in background intervals
              </span>
            </div>
            <input
              type="checkbox"
              checked={telemetryPolling}
              onChange={() => setTelemetryPolling(!telemetryPolling)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--cyan)',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Preference Item 2 */}
          <div className="glass" style={{
            padding: '14px',
            background: 'rgba(5, 12, 24, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>
                HARDWARE 3D ACCELERATION
              </span>
              <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>
                Enables WebGL rendering for the central rotating Situation Room 3D core
              </span>
            </div>
            <input
              type="checkbox"
              checked={hwAcceleration}
              onChange={() => setHwAcceleration(!hwAcceleration)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--cyan)',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Preference Item 3 */}
          <div className="glass" style={{
            padding: '14px',
            background: 'rgba(5, 12, 24, 0.2)',
            display: 'flex',
            justifyContent: 'space-between' as any,
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>
                FILE SANITIZER QUARANTINE
              </span>
              <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>
                Auto-censors OpenAI/Telegram keys during intake scan operations
              </span>
            </div>
            <input
              type="checkbox"
              checked={quarantineMode}
              onChange={() => setQuarantineMode(!quarantineMode)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--cyan)',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* ─── NOVA Personality Section ─── */}
        <div style={{
          background: 'rgba(213,0,249,0.04)', border: '1px solid rgba(213,0,249,0.2)',
          borderRadius: 6, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={13} style={{ color: '#d500f9' }} />
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#d500f9', fontFamily: 'var(--mono)', letterSpacing: 1 }}>NOVA PERSONALITY</span>
          </div>

          {/* Style */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>STYLE</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['executive', 'technical', 'concise', 'egyptian'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setPersonality(p => ({ ...p, style: s }))}
                  style={{
                    padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontSize: '0.4rem', textTransform: 'uppercase', letterSpacing: 1,
                    background: personality.style === s ? 'rgba(213,0,249,0.18)' : 'transparent',
                    border: personality.style === s ? '1px solid #d500f9' : '1px solid rgba(255,255,255,0.08)',
                    color: personality.style === s ? '#d500f9' : 'var(--text-muted)',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Response Length */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>RESPONSE LENGTH</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['short', 'medium', 'detailed'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setPersonality(p => ({ ...p, length: l }))}
                  style={{
                    padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontSize: '0.4rem', textTransform: 'uppercase', letterSpacing: 1,
                    background: personality.length === l ? 'rgba(0,210,255,0.12)' : 'transparent',
                    border: personality.length === l ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.08)',
                    color: personality.length === l ? '#00d2ff' : 'var(--text-muted)',
                  }}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>CUSTOM INSTRUCTIONS</span>
            <textarea
              value={personality.customInstructions}
              onChange={e => setPersonality(p => ({ ...p, customInstructions: e.target.value }))}
              placeholder="e.g. Always lead with action items. Focus on Omega operations."
              rows={3}
              style={{
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 4, color: 'var(--text-bright)', fontFamily: 'var(--font)',
                fontSize: '0.44rem', padding: '8px 10px', outline: 'none', resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={handleRestoreDefault}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '0.4rem',
              }}
            >
              <RotateCcw size={10} /> Restore Default
            </button>
            <button
              onClick={handleSavePersonality}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 14px', borderRadius: 4, cursor: 'pointer',
                background: personalitySaved ? 'rgba(0,230,118,0.15)' : 'rgba(213,0,249,0.15)',
                border: personalitySaved ? '1px solid #00e676' : '1px solid #d500f9',
                color: personalitySaved ? '#00e676' : '#d500f9',
                fontFamily: 'var(--mono)', fontSize: '0.4rem',
                transition: 'all 0.2s',
              }}
            >
              <Save size={10} /> {personalitySaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        </div>

        {/* Environmental Parameter Sync Trace */}
        <div className="glass" style={{
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(0, 210, 255, 0.15)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
            <span style={{ fontSize: '0.4rem', fontFamily: 'var(--mono)', color: 'var(--cyan)', fontWeight: 800 }}>
              &gt; COCKPIT ENV CONFIGURATION AUDIT TRACE
            </span>
            <span style={{ fontSize: '0.36rem', fontFamily: 'var(--mono)', color: 'var(--green)' }}>STATE: LOCKED</span>
          </div>
          <div className="hex-dump-matrix" style={{ maxHeight: '64px', overflowY: 'hidden', opacity: 0.75 }}>
            [05-27 12:28] CONFIG_SYNC: TELEMETRY POLLING IS ACTIVE (REFRESH_RATE: 15S){"\n"}
            [05-27 12:28] SYS_ACCEL: WEBGL HARDWARE ACCELERATION FULLY ENGAGED{"\n"}
            [05-27 12:28] SECURE_SHIELD: FILE QUARANTINE MODE ACTIVE (0 SECRETS DISCLOSED)
          </div>
        </div>
      </div>

      {/* Right Column: Spacious environmental stats and select controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1px solid var(--border)', paddingLeft: '24px', height: '100%', overflowY: 'auto' }}>
        <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
          ENVIRONMENT PARAMETERS
        </span>

        {/* Telemetry rate dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.42rem', color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
            <RefreshCw size={10} />
            <span>TELEMETRY UPDATE INTERVAL</span>
          </div>
          <select
            value={refreshRate}
            onChange={e => setRefreshRate(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
              color: 'var(--text-bright)',
              fontSize: '0.46rem',
              padding: '6px 8px',
              fontFamily: 'var(--font)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="15s">15 Seconds (Nominal)</option>
            <option value="30s">30 Seconds (Calm)</option>
            <option value="manual">Manual Pull Only</option>
          </select>
        </div>

        {/* LLM Mode dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.42rem', color: 'var(--purple)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
            <Cpu size={10} />
            <span>NOVA INTELLIGENCE PROTOCOL</span>
          </div>
          <select
            value={intelligenceMode}
            onChange={e => setIntelligenceMode(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
              color: 'var(--text-bright)',
              fontSize: '0.46rem',
              padding: '6px 8px',
              fontFamily: 'var(--font)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="advisor">Strategic Advisor Mode (Local)</option>
            <option value="autonomous">Full Autonomy (Restricted)</option>
            <option value="offline">Offline / Sandboxed</option>
          </select>
        </div>

        {/* Security Policy Brief */}
        <div className="glass" style={{ padding: '12px', background: 'rgba(0,210,255,0.01)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.42rem', color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
            <Shield size={10} />
            <span>SANDBOX REGULATION</span>
          </div>
          <p style={{ fontSize: '0.44rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
            System locks are auto-armed locally. No environmental variables are publicly parsed or stored in untracked repositories.
          </p>
        </div>
      </div>
    </section>
  );
}
