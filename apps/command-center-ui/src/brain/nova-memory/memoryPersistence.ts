import type { NovaMemoryState } from './memoryTypes';

const STORAGE_KEY = 'nexus_nova_memory';

export const memoryPersistence = {
  save(state: NovaMemoryState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save memory to localStorage', e);
    }
  },

  load(): NovaMemoryState | undefined {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : undefined;
    } catch (e) {
      console.warn('Failed to load memory from localStorage', e);
      return undefined;
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
