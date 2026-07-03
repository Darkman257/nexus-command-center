import { Response } from 'express';
import type { NexusEvent } from '../event-bus/EventContracts';

export class NotificationService {
  private clients: Response[] = [];

  registerClient(res: Response) {
    this.clients.push(res);
    res.on('close', () => {
      this.clients = this.clients.filter(c => c !== res);
    });
  }

  broadcast(event: NexusEvent) {
    const data = JSON.stringify(event);
    this.clients.forEach(res => {
      try {
        res.write(`data: ${data}\n\n`);
      } catch (err) {
        // Client connection already closed or broken
      }
    });
  }
}

export const globalNotificationService = new NotificationService();
