import { globalRuntimeBus } from '../bus/runtimeBus';
import type { RuntimeEvent } from '../contracts/runtimeEvent';
import { fileRegistry } from '../evidence/fileRegistry';

export const intakeProcessor = {
  processManualUpload(
    type: 'CSV' | 'PDF' | 'NOTE' | 'WHATSAPP',
    fileName: string,
    rawContent: string,
    workspace = 'omega-ops'
  ): RuntimeEvent {
    // Defensive input normalization to prevent thread crashes
    const safeType = (type || 'NOTE').toUpperCase() as 'CSV' | 'PDF' | 'NOTE' | 'WHATSAPP';
    const safeFileName = fileName || `unnamed-${Date.now()}`;
    const safeRawContent = rawContent || '';
    const safeWorkspace = workspace || 'omega-ops';

    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    let eventType = '';
    let payload: Record<string, unknown> = {};
    let confidence = 1.0;
    
    switch (safeType) {
      case 'CSV':
        eventType = `${safeWorkspace}.csv.uploaded`;
        payload = { 
          file_name: safeFileName, 
          raw_rows: safeRawContent ? safeRawContent.split('\n').length - 1 : 0, 
          size_bytes: safeRawContent ? safeRawContent.length : 0 
        };
        confidence = 0.98;
        break;
      case 'PDF':
        eventType = `${safeWorkspace}.pdf.uploaded`;
        payload = { 
          file_name: safeFileName, 
          parsed_metadata: 'INGESTION PENDING', 
          size_bytes: safeRawContent ? safeRawContent.length : 0 
        };
        confidence = 0.95;
        break;
      case 'NOTE':
        eventType = `${safeWorkspace}.note.created`;
        payload = { 
          note_snippet: safeRawContent ? safeRawContent.slice(0, 100) : '', 
          word_count: safeRawContent ? safeRawContent.split(' ').length : 0 
        };
        confidence = 1.0;
        break;
      case 'WHATSAPP':
        eventType = `${safeWorkspace}.whatsapp.received`;
        payload = { 
          message_text: safeRawContent, 
          sender: 'Operator Terminal' 
        };
        confidence = 0.99;
        break;
      default:
        eventType = `${safeWorkspace}.generic.uploaded`;
        payload = { content_snippet: safeRawContent.slice(0, 50) };
        confidence = 0.70;
        break;
    }

    const event: RuntimeEvent = {
      event_id: eventId,
      workspace: safeWorkspace,
      event_type: eventType,
      timestamp,
      source: `Intake Processor: Manual ${safeType} Ingestion`,
      payload,
      confidence,
      evidence_refs: [safeFileName || `scratch-${eventId}`]
    };

    // Publish normalized event to bus
    globalRuntimeBus.publish(event);
    return event;
  },

  processRealCSV(
    fileName: string,
    fileContent: string,
    category: 'attendance' | 'fleet' | 'supplier' | 'recruitment' | 'housing',
    workspace = 'omega',
    onRowProcessed?: (status: 'SUCCESS' | 'SKIPPED', rowNumber: number, eventType: string, summary: string) => void
  ): { uploadId: string; parsedCount: number; publishedCount: number; skippedCount: number } {
    const rawRows = fileContent ? fileContent.split(/\r?\n/).map(r => r.trim()).filter(r => r.length > 0) : [];
    
    if (rawRows.length === 0) {
      const uploadId = fileRegistry.registerUpload(fileName, category, workspace, 0);
      return { uploadId, parsedCount: 0, publishedCount: 0, skippedCount: 0 };
    }

    // Parse header columns defensively
    const headers = rawRows[0].split(',').map(h => h.trim().toLowerCase());
    const dataLines = rawRows.slice(1);

    // Register spreadsheet metadata persistently inside LocalStorage File Registry
    const uploadId = fileRegistry.registerUpload(fileName, category, workspace, dataLines.length);

    let publishedCount = 0;
    let skippedCount = 0;

    dataLines.forEach((rowStr, idx) => {
      const rowNumber = idx + 2; // header is row 1
      const cols = rowStr.split(',').map(c => c.trim());

      // Skip empty or severely malformed lines
      if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) {
        skippedCount++;
        if (onRowProcessed) {
          onRowProcessed('SKIPPED', rowNumber, 'N/A', 'Empty row');
        }
        return;
      }

      // Compile payload values dynamically based on CSV columns headers
      const payload: Record<string, unknown> = {};
      headers.forEach((headerKey, colIndex) => {
        const rawVal = cols[colIndex] || '';
        
        // Dynamic primitive extraction
        if (rawVal === '') {
          payload[headerKey] = undefined;
        } else if (!isNaN(Number(rawVal)) && rawVal !== '') {
          payload[headerKey] = Number(rawVal);
        } else if (rawVal.toLowerCase() === 'true' || rawVal.toLowerCase() === 'false') {
          payload[headerKey] = rawVal.toLowerCase() === 'true';
        } else {
          payload[headerKey] = rawVal;
        }
      });

      // Map spreadsheet types to appropriate Event namespaces
      let eventType = '';
      let confidence = 0.95;

      switch (category) {
        case 'attendance':
          eventType = 'omega.attendance.uploaded';
          confidence = 0.98;
          break;
        case 'fleet':
          eventType = 'fleet.refuel.logged';
          confidence = 0.92;
          break;
        case 'supplier':
          eventType = 'supplier.invoice.created';
          confidence = 0.95;
          break;
        case 'recruitment':
          eventType = 'recruitment.cv.detected';
          confidence = 0.94;
          break;
        case 'housing':
          eventType = 'housing.issue.reported';
          confidence = 0.88;
          break;
        default:
          eventType = 'nexus.intake.unknown_row';
          confidence = 0.70;
          break;
      }

      // Generate type-safe RuntimeEvent complete with granular row evidence links
      const event: RuntimeEvent = {
        event_id: `evt-row-${Date.now()}-${idx}-${Math.floor(Math.random() * 100)}`,
        workspace,
        event_type: eventType,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: `CSV Ingestion Stream: ${fileName}`,
        payload,
        confidence,
        evidence_refs: [
          `upload_id: ${uploadId}`,
          `row_number: ${rowNumber}`,
          `original_source: ${fileName}`
        ]
      };

      try {
        globalRuntimeBus.publish(event);
        publishedCount++;
        if (onRowProcessed) {
          onRowProcessed('SUCCESS', rowNumber, eventType, `Row parsed successfully`);
        }
      } catch (err: any) {
        console.warn(`Intake Processor: Failed to process row ${rowNumber}:`, err);
        skippedCount++;
        if (onRowProcessed) {
          onRowProcessed('SKIPPED', rowNumber, eventType, err?.message || String(err));
        }
      }
    });

    return {
      uploadId,
      parsedCount: dataLines.length,
      publishedCount,
      skippedCount
    };
  }
};
export default intakeProcessor;
