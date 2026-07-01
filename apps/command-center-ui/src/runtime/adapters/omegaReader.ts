import type { RuntimeEvent } from '../contracts/runtimeEvent';

/**
 * READ-ONLY ADAPTER FOR OMEGA PRODUCTION DB
 * - Now strictly fetches from local backend bridge (127.0.0.1:5057).
 * - Avoids anon key usage in frontend completely.
 */
export async function fetchRecentOmegaEvents(): Promise<RuntimeEvent[]> {
  try {
    const res = await fetch('http://127.0.0.1:5057/omega/events');
    if (!res.ok) {
      console.warn('Omega Local Bridge unavailable or returned error:', res.status);
      return [];
    }
    const data = await res.json();
    return data.events || [];
  } catch (error) {
    console.error('OmegaReader Network Exception:', error);
    return [];
  }
}

