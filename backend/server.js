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
  res.json({
    status: 'online',
    version: '4.7.1-OMEGA',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
  });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Instantiate Services
const telemetry = new TelemetryService();
const aiEngine = new AIEngine();
const executor = new Executor();

// Track latest telemetry metrics in memory
let latestTelemetry = { cpu: 30, memory: 50, latency: 12 };

// Track connected WebSocket clients
const clients = new Set();

// Active processing state for barge-in cancellation
let isInterrupted = false;

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
let telemetryInterval = telemetry.startPolling((metrics) => {
  if (metrics && metrics.data) {
    latestTelemetry = metrics.data;
  }
  broadcast(metrics);
}, 2000);

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[JARVIS] Client connected. Active clients: ${clients.size}`);

  // Send initial welcome & handshake
  ws.send(JSON.stringify({
    type: 'system',
    data: {
      message: 'JARVIS Core initialized. WebSocket link established. Voice & NLU subsystems ready.',
      version: '4.7.1-OMEGA',
      timestamp: new Date().toISOString()
    }
  }));

  // Handle incoming messages from HUD frontend
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      console.log(`[JARVIS] Received message event: ${msg.type}`, msg.data || '');

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
          console.log('[JARVIS] >>> BARGE-IN INTERRUPT RECEIVED from client <<<');
          isInterrupted = true;
          broadcast({ type: 'status_change', data: { status: 'LISTENING' } });
          break;
        }

        case 'transcript': {
          isInterrupted = false;
          const userText = msg.data?.text || '';

          if (!userText.trim()) break;

          console.log(`[JARVIS] Executing command: "${userText}"`);

          // 1. Set assistant state to THINKING
          broadcast({ type: 'status_change', data: { status: 'THINKING' } });

          // 2. Process via AI Engine (Gemini Function Calling or Local Fallback)
          const result = await aiEngine.processCommand(userText, latestTelemetry);

          if (isInterrupted) {
            console.log('[JARVIS] Request was cancelled by user interrupt.');
            break;
          }

          console.log(`[JARVIS] Generated Response: "${result.spokenResponse}"`);

          // 3. Broadcast parsed NLU data to update HUD telemetry display
          broadcast({
            type: 'nlu_parsed',
            data: {
              intent: result.intent,
              slots: result.slots,
              confidence: result.confidence,
            }
          });

          // 4. Set state to SPEAKING
          broadcast({ type: 'status_change', data: { status: 'SPEAKING' } });

          // 5. Send JARVIS verbal response and action result to HUD
          broadcast({
            type: 'jarvis_response',
            data: {
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
          console.log(`[JARVIS] Unhandled event type: ${msg.type}`);
      }
    } catch (err) {
      console.error('[JARVIS] Error processing client message:', err.message);
      broadcast({ type: 'status_change', data: { status: 'IDLE' } });
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[JARVIS] Client disconnected. Remaining: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[JARVIS] WebSocket error:', err.message);
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║        ⚡ J.A.R.V.I.S BACKEND ONLINE ⚡          ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║  HTTP:        http://localhost:${PORT}              ║`);
  console.log(`  ║  WebSocket:   ws://localhost:${PORT}                ║`);
  console.log('  ║  NLU Engine:  @google/genai Native Function Calling║');
  console.log('  ║  Sandbox:     Hardcoded Whitelist Enabled        ║');
  console.log('  ║  Status:      ALL SUBSYSTEMS OPERATIONAL         ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
});

// Clean shutdown
process.on('SIGINT', () => {
  console.log('\n[JARVIS] Initiating graceful shutdown sequence...');
  telemetry.stopPolling(telemetryInterval);
  wss.close();
  server.close();
  process.exit(0);
});
