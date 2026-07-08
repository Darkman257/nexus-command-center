export interface ITelemetryService {
  log(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, err?: Error, context?: Record<string, unknown>): void;
  metric(name: string, value: number, tags?: Record<string, string>): void;
}

export class ConsoleTelemetry implements ITelemetryService {
  log(message: string, context?: Record<string, unknown>): void {
    console.log(`[LOG] ${message}`, context ? JSON.stringify(context) : '');
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
  }

  error(message: string, err?: Error, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, err?.message || '', context ? JSON.stringify(context) : '');
  }

  metric(name: string, value: number, tags?: Record<string, string>): void {
    console.log(`[METRIC] ${name}: ${value}`, tags ? JSON.stringify(tags) : '');
  }
}

export const globalTelemetry: ITelemetryService = new ConsoleTelemetry();
