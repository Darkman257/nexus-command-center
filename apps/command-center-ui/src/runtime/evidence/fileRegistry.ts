export interface IngestedFileRecord {
  upload_id: string;
  filename: string;
  category: string;
  workspace: string;
  row_count: number;
  uploaded_at: string;
}

const UPLOADS_KEY = 'nexus::runtime::uploads';

export const fileRegistry = {
  registerUpload(
    filename: string,
    category: string,
    workspace: string,
    rowCount: number
  ): string {
    const uploadId = `upl-${Date.now()}`;
    const timestampStr = new Date().toISOString();

    const record: IngestedFileRecord = {
      upload_id: uploadId,
      filename,
      category,
      workspace,
      row_count: rowCount,
      uploaded_at: timestampStr
    };

    try {
      const existingRaw = localStorage.getItem(UPLOADS_KEY) || '[]';
      const existing: IngestedFileRecord[] = JSON.parse(existingRaw);
      existing.unshift(record);
      
      // Capped at the latest 20 uploads to preserve localStorage footprint limits
      const capped = existing.slice(0, 20);
      localStorage.setItem(UPLOADS_KEY, JSON.stringify(capped));
    } catch (err) {
      console.warn('File Registry: LocalStorage register failed:', err);
    }

    return uploadId;
  },

  getUploads(): IngestedFileRecord[] {
    try {
      const data = localStorage.getItem(UPLOADS_KEY);
      if (data) {
        return JSON.parse(data) as IngestedFileRecord[];
      }
    } catch (err) {
      console.warn('File Registry: LocalStorage read failed:', err);
    }
    return [];
  },

  clearUploads() {
    try {
      localStorage.removeItem(UPLOADS_KEY);
    } catch (err) {
      console.warn('File Registry: LocalStorage clear failed:', err);
    }
  }
};

export default fileRegistry;
