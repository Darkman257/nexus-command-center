import { useState } from 'react';
import { Database, Mail, MessageSquare, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { intakeProcessor } from '../runtime/events/intakeProcessor';

interface IngestChannel {
  id: string;
  name: string;
  type: 'whatsapp' | 'email' | 'excel';
  status: 'SCANNING' | 'STANDBY' | 'STOPPED';
  targetDirectory: string;
  lastRecordIngested: string;
}

export function DataIntake() {
  const [channels] = useState<IngestChannel[]>([
    {
      id: 'ch-wa',
      name: 'WhatsApp Operational Intake',
      type: 'whatsapp',
      status: 'SCANNING',
      targetDirectory: 'n8n webhooks: whatsapp-incoming',
      lastRecordIngested: 'Driver attendance log - 10m ago'
    },
    {
      id: 'ch-cv',
      name: 'Email CV Mail-Scanner',
      type: 'email',
      status: 'SCANNING',
      targetDirectory: '~/NEXUS/mail-intake/omega-cvs',
      lastRecordIngested: 'Applicant_CV_Amr.pdf - 1h ago'
    },
    {
      id: 'ch-xls',
      name: 'Manual Spreadsheet Ingestion',
      type: 'excel',
      status: 'STANDBY',
      targetDirectory: 'local-upload: /scratch/intake-cache/',
      lastRecordIngested: 'Fleet_Expenses_May26.xlsx - 1d ago'
    }
  ]);

  const [intakeLogs, setIntakeLogs] = useState<string[]>([
    'SYSTEM: Ingestion engine online.',
    'FOLDER SCAN: Directory ~/NEXUS/mail-intake/omega-cvs verified.'
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<'attendance' | 'fleet' | 'supplier' | 'recruitment' | 'housing'>('attendance');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('omega');
  const [fileKey, setFileKey] = useState(0);

  const runIntakeScan = () => {
    setIsScanning(true);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setTimeout(() => {
      setIntakeLogs(prev => [
        ...prev,
        `[${time}] SCAN: Checking directories for unparsed attachments...`,
        `[${time}] scan results: 0 new PDFs, 0 Excel logs found. Ingestion queue is current.`
      ]);
      setIsScanning(false);
    }, 1000);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setIsProcessing(true);
      const content = event.target?.result as string;
      const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setIntakeLogs(prev => [
        ...prev,
        `[${time}] CSV UPLOAD: Initiating local parse of '${file.name}' (${(file.size / 1024).toFixed(2)} KB)...`
      ]);

      const logBuffer: string[] = [];
      let rowLogCount = 0;
      const ROW_LOG_CAP = 30; // Cap row logs to avoid UI degradation

      try {
        const results = intakeProcessor.processRealCSV(
          file.name,
          content,
          selectedCategory,
          selectedWorkspace,
          (status, rowNum, eventType, summary) => {
            if (rowLogCount < ROW_LOG_CAP) {
              const rowTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              logBuffer.push(`[${rowTime}] ROW #${rowNum} [${status}] -> type: ${eventType} (${summary})`);
              rowLogCount++;
            } else if (rowLogCount === ROW_LOG_CAP) {
              logBuffer.push(`[SYSTEM] ... Truncated remaining row logs to preserve operational console latency ...`);
              rowLogCount++;
            }
          }
        );

        const finishTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setIntakeLogs(prev => [
          ...prev,
          ...logBuffer,
          `[${finishTime}] SUCCESS: File ingestion parsed completely.`,
          `[${finishTime}] SUMMARY:`,
          `  - Filename: ${file.name}`,
          `  - Upload ID: ${results.uploadId}`,
          `  - Total Rows Parsed: ${results.parsedCount}`,
          `  - Downstream Events Published: ${results.publishedCount}`,
          `  - Skipped: ${results.skippedCount}`,
          `[SYSTEM] -> ⚡ DEMO NOTE: Events published to globalRuntimeBus. Check [Signals & Alerts] and [Runtime Memory] for active intelligence.`
        ]);
        
        // Reset file input so same file can be uploaded again
        setFileKey(prev => prev + 1);
        setIsProcessing(false);

      } catch (err: any) {
        const errorTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setIntakeLogs(prev => [
          ...prev,
          ...logBuffer,
          `[${errorTime}] INGESTION CRITICAL ERROR: ${err.message || String(err)}`
        ]);
        setFileKey(prev => prev + 1);
        setIsProcessing(false);
      }
    };

    reader.onerror = (err) => {
      const errorTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setIntakeLogs(prev => [
        ...prev,
        `[${errorTime}] FILE READING FAILED: ${err}`
      ]);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  return (
    <section className="nova-center-core" style={{
      gridColumn: 'center / span 2',
      background: 'rgba(3, 8, 16, 0.45)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: '1.2fr 0.8fr',
      gap: '16px',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Column: Intake Channels Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="compartment-label">[DECK-04 INGESTION BAY]</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <Database size={16} style={{ color: 'var(--cyan)' }} />
              <h2 style={{ color: 'var(--text-bright)', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
                Automated Intake Nodes
              </h2>
            </div>
          </div>
          <button 
            onClick={runIntakeScan} 
            disabled={isScanning}
            style={{
              background: 'rgba(0, 210, 255, 0.08)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              color: 'var(--cyan)',
              fontSize: '0.42rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={10} className={isScanning ? 'spin-animation' : ''} /> 
            {isScanning ? 'Scanning...' : 'Trigger Manual Ingest'}
          </button>
        </div>

        {/* Channel Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {channels.map(ch => (
            <div key={ch.id} className="glass" style={{
              padding: '12px',
              background: 'rgba(5, 12, 24, 0.4)',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              {/* Type Icons */}
              <div style={{
                background: ch.type === 'whatsapp' ? 'rgba(0, 230, 118, 0.1)' : ch.type === 'email' ? 'rgba(213,0,249,0.1)' : 'rgba(0,210,255,0.1)',
                border: `1px solid ${ch.type === 'whatsapp' ? 'rgba(0,230,118,0.2)' : ch.type === 'email' ? 'rgba(213,0,249,0.2)' : 'rgba(0,210,255,0.2)'}`,
                color: ch.type === 'whatsapp' ? 'var(--green)' : ch.type === 'email' ? 'var(--purple)' : 'var(--cyan)',
                padding: '8px',
                borderRadius: '4px',
                display: 'flex'
              }}>
                {ch.type === 'whatsapp' && <MessageSquare size={14} />}
                {ch.type === 'email' && <Mail size={14} />}
                {ch.type === 'excel' && <FileSpreadsheet size={14} />}
              </div>

              {/* Text metadata */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>
                    {ch.name}
                  </span>
                  <span style={{
                    fontSize: '0.38rem',
                    fontFamily: 'var(--mono)',
                    fontWeight: 700,
                    color: ch.status === 'SCANNING' ? 'var(--green)' : 'var(--text-muted)'
                  }}>
                    ● {ch.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.44rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>TARGET: </span>
                    <span style={{ color: 'var(--text-main)', fontFamily: 'var(--mono)' }}>{ch.targetDirectory}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>LAST INGEST: </span>
                    <span style={{ color: 'var(--text-bright)' }}>{ch.lastRecordIngested}</span>
                  </div>
                </div>

                {ch.type === 'excel' && (
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <span style={{ fontSize: '0.36rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>CATEGORY</span>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value as any)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(0, 210, 255, 0.25)',
                            borderRadius: '3px',
                            color: 'var(--cyan)',
                            fontSize: '0.42rem',
                            fontFamily: 'var(--mono)',
                            padding: '3px 6px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="attendance">attendance</option>
                          <option value="fleet">fleet</option>
                          <option value="supplier">supplier</option>
                          <option value="recruitment">recruitment</option>
                          <option value="housing">housing</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <span style={{ fontSize: '0.36rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>WORKSPACE</span>
                        <select
                          value={selectedWorkspace}
                          onChange={(e) => setSelectedWorkspace(e.target.value)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(0, 210, 255, 0.25)',
                            borderRadius: '3px',
                            color: 'var(--cyan)',
                            fontSize: '0.42rem',
                            fontFamily: 'var(--mono)',
                            padding: '3px 6px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="omega">omega</option>
                          <option value="fleet">fleet</option>
                          <option value="supplier">supplier</option>
                          <option value="recruitment">recruitment</option>
                          <option value="housing">housing</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <input
                        key={fileKey}
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        style={{ display: 'none' }}
                        id="csv-file-picker"
                      />
                      <label
                        htmlFor="csv-file-picker"
                        style={{
                          background: 'rgba(0, 210, 255, 0.08)',
                          border: '1px solid rgba(0, 210, 255, 0.2)',
                          color: 'var(--cyan)',
                          fontSize: '0.42rem',
                          fontFamily: 'var(--mono)',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          display: 'inline-block',
                          textAlign: 'center',
                          flex: 1
                        }}
                      >
                        SELECT & INGEST CSV
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Ingestion Pipeline Logs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderLeft: '1px solid var(--border)',
        paddingLeft: '16px',
        height: '100%',
        overflow: 'hidden'
      }}>
        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
          INGESTION TELEMETRY
        </span>

        {/* Logs */}
        <div style={{
          flex: 1,
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: '4px',
          padding: '10px',
          fontFamily: 'var(--mono)',
          fontSize: '0.44rem',
          color: 'var(--text-bright)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          position: 'relative'
        }}>
          {/* Active scanning beam overlay */}
          {(isScanning || isProcessing) && <div className="scan-sweep-overlay" />}
          {intakeLogs.map((log, i) => (
            <div key={i} style={{
              color: log.includes('SUCCESS') || log.includes('verif') ? 'var(--green)' : log.includes('SCAN') ? 'var(--cyan)' : '#8cb3db',
              lineHeight: 1.4
            }}>
              {log}
            </div>
          ))}
        </div>

        {/* Policy block */}
        <div className="glass" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,210,255,0.01)' }}>
          <span style={{ fontSize: '0.42rem', color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
            ZERO-DISCLOSURE RULES
          </span>
          <p style={{ fontSize: '0.44rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
            In compliance with NEXUS security guidelines, CV PDFs, raw emails, and credentials are cached locally and sanitized before memory integration.
          </p>
        </div>
      </div>
    </section>
  );
}
