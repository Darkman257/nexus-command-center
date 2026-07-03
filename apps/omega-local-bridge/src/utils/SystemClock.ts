export interface Clock {
  now(): string; // Returns ISO timestamp
}

export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

export const systemClock = new SystemClock();
