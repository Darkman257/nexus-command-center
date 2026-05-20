export interface SystemStatus {
  systemId: string;
  label: string;
  status: 'online' | 'offline' | 'degraded';
  responseMs?: number;
  checkedAt: string;
  message?: string;
}
