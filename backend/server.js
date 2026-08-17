import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import TelemetryService from './services/telemetry.js';
import AIEngine from './services/aiEngine.js';
import Executor from './services/executor.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', version: '4.7.1-OMEGA', timestamp: new Date().toISOString() });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Services
const telemetry = new TelemetryService();
const aiEngine = new AIEngine();
const executor = new Executor();

// Track connected clients
const clients = new Set();

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((ws) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(message);
    }
  });
}

// Start telemetry polling - broadcast every 2 seconds
let telemetryInterval = telemetry.startPolling(broadcast, 2000);

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[JARVIS] Client connected. Total: ${clients.size}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'system',
    data: {
      message: 'JARVIS Backend connected. All systems nominal.',
      version: '4.7.1-OMEGA',
      timestamp: new Date().toISOString()
    }
  }));

  // Handle incoming messages from frontend
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      console.log(`[JARVIS] Received: ${msg.type}`);

      switch (msg.type) {
        case 'transcript': {
          // User sent a text command
          // Broadcast thinking state
          broadcast({ type: 'status_change', data: { status: 'THINKING' } });

          // Process through AI engine (placeholder for now)
          const result = await aiEngine.processCommand(msg.data.text);

          // Broadcast NLU result
          broadcast({
            type: 'nlu_parsed',
            data: {
              intent: result.intent,
              slots: result.slots,
              confidence: result.confidence,
            }
          });

          // Broadcast JARVIS response
          broadcast({
            type: 'jarvis_response',
            data: {
              text: result.spokenResponse,
              timestamp: new Date().toISOString()
            }
          });

          // Return to idle
          broadcast({ type: 'status_change', data: { status: 'IDLE' } });
          break;
        }

        case 'speech_start': {
          broadcast({ type: 'status_change', data: { status: 'LISTENING' } });
          break;
        }

        case 'speech_end': {
          broadcast({ type: 'status_change', data: { status: 'IDLE' } });
          break;
        }

        case 'interrupt': {
          console.log('[JARVIS] Barge-in interrupt received');
          // Cancel any ongoing TTS stream (Stage 5)
          broadcast({ type: 'status_change', data: { status: 'LISTENING' } });
          break;
        }

        default:
          console.log(`[JARVIS] Unknown message type: ${msg.type}`);
      }
    } catch (err) {
      console.error('[JARVIS] Error processing message:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[JARVIS] Client disconnected. Total: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[JARVIS] WebSocket error:', err.message);
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║     ⚡ J.A.R.V.I.S BACKEND ONLINE ⚡     ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  HTTP:      http://localhost:${PORT}        ║`);
  console.log(`  ║  WebSocket: ws://localhost:${PORT}          ║`);
  console.log('  ║  Status:    ALL SYSTEMS NOMINAL          ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[JARVIS] Shutting down...');
  telemetry.stopPolling(telemetryInterval);
  wss.close();
  server.close();
  process.exit(0);
});
