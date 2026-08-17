import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';
const RECONNECT_DELAY = 3000;

export default function useJarvisSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState({
    cpu: 0,
    memory: 0,
    latency: 0,
    uptime: '0d 0h 0m',
    network: { download: '0 B/s', upload: '0 B/s', status: 'CONNECTING...' }
  });
  const [nlu, setNlu] = useState({
    intent: 'awaiting_input',
    slots: {},
    confidence: 0
  });
  const [assistantStatus, setAssistantStatus] = useState('IDLE');
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[JARVIS HUD] WebSocket connected');
      setIsConnected(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'telemetry':
            setTelemetry(msg.data);
            break;

          case 'nlu_parsed':
            setNlu(msg.data);
            break;

          case 'status_change':
            setAssistantStatus(msg.data.status);
            break;

          case 'jarvis_response':
            setMessages(prev => [...prev, {
              type: 'jarvis',
              text: msg.data.text,
              time: new Date(msg.data.timestamp).toLocaleTimeString('en-US', { hour12: false })
            }]);
            break;

          case 'system':
            setMessages(prev => [...prev, {
              type: 'system',
              text: msg.data.message,
              time: new Date(msg.data.timestamp).toLocaleTimeString('en-US', { hour12: false })
            }]);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('[JARVIS HUD] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[JARVIS HUD] WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;
      // Auto-reconnect
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = (err) => {
      console.error('[JARVIS HUD] WebSocket error');
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendMessage = useCallback((type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  const sendTranscript = useCallback((text) => {
    // Add user message to local messages
    setMessages(prev => [...prev, {
      type: 'user',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour12: false })
    }]);
    sendMessage('transcript', { text });
  }, [sendMessage]);

  return {
    isConnected,
    telemetry,
    nlu,
    assistantStatus,
    messages,
    sendMessage,
    sendTranscript,
  };
}
