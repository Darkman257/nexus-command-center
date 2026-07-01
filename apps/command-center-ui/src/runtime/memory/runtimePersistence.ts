import type { MemoryObservation } from './runtimeMemoryEngine';

const STORAGE_KEY = 'nexus::runtime::observations';

export const runtimePersistence = {
  saveObservations(observations: MemoryObservation[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
      return true;
    } catch (err) {
      console.warn('Runtime Persistence: LocalStorage write denied or full:', err);
      return false;
    }
  },

  loadObservations(): MemoryObservation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed as MemoryObservation[];
        }
      }
    } catch (err) {
      console.warn('Runtime Persistence: LocalStorage read failed:', err);
    }
    return [];
  },

  clearObservations(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Runtime Persistence: LocalStorage clear failed:', err);
    }
  }
};

export default runtimePersistence;
