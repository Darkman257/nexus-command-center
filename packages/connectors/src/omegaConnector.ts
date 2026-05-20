import type { SystemStatus } from '../../shared-types/src/systemStatus';

export async function checkOmegaStatus(baseUrl: string = 'http://127.0.0.1:5001'): Promise<SystemStatus> {
  const startTime = Date.now();
  const checkedAt = new Date().toISOString();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    let response;
    try {
      response = await fetch(`${baseUrl}/api/healthz`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Not OK');
      }
    } catch {
      response = await fetch(`${baseUrl}/healthz`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
    }
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const responseMs = Date.now() - startTime;
      
      if (data && data.status === 'ok') {
        return {
          systemId: 'omega-ops',
          label: 'Omega Ops',
          status: 'online',
          responseMs,
          checkedAt,
          message: 'System is fully operational'
        };
      }
      
      return {
        systemId: 'omega-ops',
        label: 'Omega Ops',
        status: 'degraded',
        responseMs,
        checkedAt,
        message: `Unexpected health response: ${JSON.stringify(data)}`
      };
    }
    
    return {
      systemId: 'omega-ops',
      label: 'Omega Ops',
      status: 'degraded',
      responseMs: Date.now() - startTime,
      checkedAt,
      message: `HTTP Error: ${response.status} ${response.statusText}`
    };
  } catch (error: any) {
    const responseMs = Date.now() - startTime;
    return {
      systemId: 'omega-ops',
      label: 'Omega Ops',
      status: 'offline',
      responseMs,
      checkedAt,
      message: error.name === 'AbortError' ? 'Connection timed out' : 'System is unreachable'
    };
  }
}
