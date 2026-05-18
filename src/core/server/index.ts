import express from 'express';
import { BrowserWindow } from 'electron';
import type { ClawbotInbound, ClawbotOutbound } from '../../types';

let server: any = null;
let mainWindow: BrowserWindow | null = null;
const PORT = 18011;

export function startServer(window: BrowserWindow): void {
  mainWindow = window;

  const app_express = express();
  app_express.use(express.json());

  app_express.post('/clawbot/message', async (req, res) => {
    try {
      const inbound: ClawbotInbound = req.body;
      if (!inbound.session_id || !inbound.message) {
        res.status(400).json({ error: 'Invalid message format' });
        return;
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clawbot:message', inbound);
      }

      const outbound: ClawbotOutbound = {
        reply: 'Message received',
        status: 'ok',
      };
      res.json(outbound);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app_express.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  server = app_express.listen(PORT, () => {
    console.log(`Clawbot server listening on port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use. Clawbot server not started.`);
      server = null;
    } else {
      console.error('Server error:', err);
    }
  });
}

export function stopServer(): void {
  if (server) {
    server.close();
    server = null;
  }
}
