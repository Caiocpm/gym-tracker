import type { Response } from 'express';

// In-memory map of userId → SSE response
const clients = new Map<string, Response>();

export const sseService = {
  addClient(userId: string, res: Response): void {
    clients.set(userId, res);
  },

  removeClient(userId: string): void {
    clients.delete(userId);
  },

  send(userId: string, event: string, data: unknown): void {
    const res = clients.get(userId);
    if (res) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  },

  broadcast(event: string, data: unknown): void {
    for (const res of clients.values()) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  },
};
