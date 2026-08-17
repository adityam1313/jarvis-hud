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

// Services
const telemetry = new TelemetryService();
const aiEngine = new AIEngine();
const executor = new Executor();

let latestTelemetry = { cpu: 30, memory: 50, latency: 12 };
const clients = new Set();
let isInterrupted = false;

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((ws) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(message);
    }
  });
}

// Start telemetry polling
telemetry.startPolling((metrics) => {
  if (metrics && metrics.data) {
    latestTelemetry = metrics.data;
  }
  broadcast(metrics);
}, 2000);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '4.7.1-OMEGA',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
  });
});

// Guaranteed HTTP command execution endpoint
app.post('/api/command', async (req, res) => {
  try {
    const userText = req.body?.text || '';
    if (!userText.trim()) {
      return res.status(400).json({ error: 'Text command is required' });
    }

    console.log(`[JARVIS HTTP API] Processing command: "${userText}"`);

    broadcast({ type: 'status_change', data: { status: 'THINKING' } });
    const result = await aiEngine.processCommand(userText, latestTelemetry);
    const msgId = 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    broadcast({
      type: 'nlu_parsed',
      data: {
        intent: result.intent,
        slots: result.slots,
        confidence: result.confidence,
      }
    });

    broadcast({ type: 'status_change', data: { status: 'SPEAKING' } });

    broadcast({
      type: 'jarvis_response',
      data: {
        id: msgId,
        text: result.spokenResponse,
        action: result.action,
        timestamp: new Date().toISOString()
      }
    });

    res.json({ success: true, result, id: msgId });
  } catch (err) {
    console.error('[JARVIS HTTP API] Error executing command:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[JARVIS WS] Client connected. Total active clients: ${clients.size}`);

  ws.send(JSON.stringify({
    type: 'system',
    data: {
      message: 'JARVIS Core initialized. WebSocket link established. Voice & NLU subsystems ready.',
      version: '4.7.1-OMEGA',
      timestamp: new Date().toISOString()
    }
  }));

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      console.log(`[JARVIS WS] Received event: ${msg.type}`, msg.data || '');

      switch (msg.type) {
        case 'speech_start': {
          broadcast({ type: 'status_change', data: { status: 'LISTENING' } });
          break;
        }

        case 'speech_end': {
          broadcast({ type: 'status_change', data: { status: 'THINKING' } });
          break;
        }

        case 'interrupt': {
          console.log('[JARVIS WS] >>> BARGE-IN INTERRUPT RECEIVED <<<');
          isInterrupted = true;
          broadcast({ type: 'status_change', data: { status: 'LISTENING' } });
          break;
        }

        case 'transcript': {
          isInterrupted = false;
          const userText = msg.data?.text || '';
          if (!userText.trim()) break;

          console.log(`[JARVIS WS] Executing transcript: "${userText}"`);

          broadcast({ type: 'status_change', data: { status: 'THINKING' } });
          const result = await aiEngine.processCommand(userText, latestTelemetry);

          if (isInterrupted) {
            console.log('[JARVIS WS] Request cancelled by user interrupt.');
            break;
          }

          const msgId = 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

          broadcast({
            type: 'nlu_parsed',
            data: {
              intent: result.intent,
              slots: result.slots,
              confidence: result.confidence,
            }
          });

          broadcast({ type: 'status_change', data: { status: 'SPEAKING' } });

          broadcast({
            type: 'jarvis_response',
            data: {
              id: msgId,
              text: result.spokenResponse,
              action: result.action,
              timestamp: new Date().toISOString()
            }
          });

          break;
        }

        case 'speech_finished': {
          broadcast({ type: 'status_change', data: { status: 'IDLE' } });
          break;
        }

        default:
          console.log(`[JARVIS WS] Unhandled event: ${msg.type}`);
      }
    } catch (err) {
      console.error('[JARVIS WS] Error processing message:', err.message);
      broadcast({ type: 'status_change', data: { status: 'IDLE' } });
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[JARVIS WS] Client disconnected. Total active clients: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[JARVIS WS] WebSocket error:', err.message);
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║        ⚡ J.A.R.V.I.S BACKEND ONLINE ⚡          ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║  HTTP API:    http://localhost:${PORT}              ║`);
  console.log(`  ║  WebSocket:   ws://localhost:${PORT}                ║`);
  console.log('  ║  NLU Engine:  @google/genai Native Function Calling║');
  console.log('  ║  Sandbox:     Hardcoded Whitelist Enabled        ║');
  console.log('  ║  Status:      ALL SUBSYSTEMS OPERATIONAL         ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
});

process.on('SIGINT', () => {
  wss.close();
  server.close();
  process.exit(0);
});
