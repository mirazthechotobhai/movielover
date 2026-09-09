import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface RoomState {
  roomCode: string;
  isPlaying: boolean;
  currentTime: number;
  action: string;
  actionTimestamp?: number;
  volume: number;
  status: 'waiting' | 'connected' | 'disconnected';
  media?: any;
  lastUpdated: number;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory room store for real-time synchronization
const rooms = new Map<string, RoomState>();
// Active Server-Sent Events connections grouped by roomCode
const sseClients = new Map<string, Set<Response>>();

// Broadcast updated room state to all listeners (Player & Remote)
function broadcastToRoom(roomCode: string, state: RoomState | null) {
  const clients = sseClients.get(roomCode);
  if (clients && clients.size > 0) {
    const payload = JSON.stringify(state);
    clients.forEach((res) => {
      try {
        res.write(`data: ${payload}\n\n`);
      } catch (err) {
        // Client disconnected
        clients.delete(res);
      }
    });
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

// SSE Stream endpoint for instantaneous real-time sync across any device
app.get('/api/rooms/:code/stream', (req: Request, res: Response) => {
  const { code } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!sseClients.has(code)) {
    sseClients.set(code, new Set());
  }
  sseClients.get(code)!.add(res);

  // Send current state immediately if exists
  const current = rooms.get(code);
  if (current) {
    res.write(`data: ${JSON.stringify(current)}\n\n`);
  }

  // Heartbeat keep-alive every 15 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = sseClients.get(code);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(code);
      }
    }
  });
});

// Get room state
app.get('/api/rooms/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json(room);
});

// Create or update room state
app.post('/api/rooms/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const updates = req.body || {};

  const existing = rooms.get(code) || {
    roomCode: code,
    isPlaying: false,
    currentTime: 0,
    action: 'none',
    actionTimestamp: Date.now(),
    volume: 1,
    status: 'waiting',
    lastUpdated: Date.now(),
  };

  const updated: RoomState = {
    ...existing,
    ...updates,
    roomCode: code,
    lastUpdated: Date.now(),
  };

  rooms.set(code, updated);
  broadcastToRoom(code, updated);

  return res.json({ success: true, room: updated });
});

// Delete room
app.delete('/api/rooms/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  rooms.delete(code);
  broadcastToRoom(code, null);
  return res.json({ success: true });
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StreamCast Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
