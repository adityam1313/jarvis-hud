import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';
const RECONNECT_DELAY = 2500;

export default function useJarvisSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState({
    cpu: 0,
    memory: 0,
    latency: 0,
    uptime: '0d 0h 0m',
    network: { download: '0.00 MB/s', upload: '0.00 MB/s', status: 'INITIALIZING' }
  });
  const [nlu, setNlu] = useState({
    intent: 'awaiting_input',
    slots: {},
    confidence: 0
  });
  const [assistantStatus, setAssistantStatus] = useState('IDLE');
  const [messages, setMessages] = useState([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const recognitionRef = useRef(null);
  const isMicActiveRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  // Send message over WebSocket
  const sendMessage = useCallback((type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  // Barge-In interrupt function
  const triggerBargeIn = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      console.log('[JARVIS Voice] Barge-in triggered! Halting TTS playback.');
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    sendMessage('interrupt');
  }, [sendMessage]);

  // Text-To-Speech function
  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;

    // Cancel any current utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    // Pick best British or English robotic voice
    const voices = window.speechSynthesis.getVoices();
    const jarvisVoice = voices.find(v =>
      v.lang.includes('en-GB') ||
      v.name.includes('George') ||
      v.name.includes('Oliver') ||
      v.name.includes('David') ||
      v.name.includes('Daniel') ||
      v.name.includes('Google UK English Male') ||
      v.name.includes('Natural')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (jarvisVoice) {
      utterance.voice = jarvisVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      sendMessage('speech_finished');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      sendMessage('speech_finished');
    };

    window.speechSynthesis.speak(utterance);
  }, [sendMessage]);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[JARVIS HUD] WebSocket link established with backend.');
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

          case 'jarvis_response': {
            const respText = msg.data.text;
            setMessages(prev => [...prev, {
              type: 'jarvis',
              text: respText,
              action: msg.data.action,
              time: new Date(msg.data.timestamp).toLocaleTimeString('en-US', { hour12: false })
            }]);
            // Play TTS audio response
            speakText(respText);
            break;
          }

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
        console.error('[JARVIS HUD] Failed to parse WebSocket packet:', err);
      }
    };

    ws.onclose = () => {
      console.log('[JARVIS HUD] WebSocket disconnected. Retrying in 2.5s...');
      setIsConnected(false);
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [speakText]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // Initialize Speech-to-Text Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[JARVIS Voice] Web Speech API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[JARVIS Voice] Microphone listening started.');
      setIsMicActive(true);
    };

    recognition.onspeechstart = () => {
      // Barge-in: if user starts speaking while JARVIS is talking, interrupt immediately!
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        triggerBargeIn();
      }
      sendMessage('speech_start');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }

      if (final.trim()) {
        const cleanFinal = final.trim();
        console.log(`[JARVIS Voice] Final Recognized Speech: "${cleanFinal}"`);
        setInterimTranscript('');

        // Add user message to UI
        setMessages(prev => [...prev, {
          type: 'user',
          text: cleanFinal,
          time: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);

        // Send transcript to backend AI Engine
        sendMessage('transcript', { text: cleanFinal });
      }
    };

    recognition.onerror = (err) => {
      console.error('[JARVIS Voice] Speech recognition error:', err.error);
      if (err.error === 'not-allowed') {
        setIsMicActive(false);
      }
    };

    recognition.onend = () => {
      console.log('[JARVIS Voice] Recognition ended.');
      // Auto-restart if user left mic active
      if (isMicActiveRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // ignore
        }
      } else {
        setIsMicActive(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
    };
  }, [sendMessage, triggerBargeIn]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome, Edge, or a Webkit-compatible browser.');
      return;
    }

    if (isMicActive) {
      setIsMicActive(false);
      isMicActiveRef.current = false;
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
      sendMessage('speech_end');
    } else {
      setIsMicActive(true);
      isMicActiveRef.current = true;
      try {
        // If JARVIS is currently speaking when user clicks mic, stop TTS
        triggerBargeIn();
        recognition.start();
      } catch (e) {
        console.warn('[JARVIS Voice] Recognition start warning:', e.message);
      }
    }
  }, [isMicActive, sendMessage, triggerBargeIn]);

  // Send Manual Text Transcript
  const sendTranscript = useCallback((text) => {
    if (!text || !text.trim()) return;

    // Barge-in check
    triggerBargeIn();

    setMessages(prev => [...prev, {
      type: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour12: false })
    }]);

    sendMessage('transcript', { text: text.trim() });
  }, [sendMessage, triggerBargeIn]);

  return {
    isConnected,
    telemetry,
    nlu,
    assistantStatus,
    messages,
    isMicActive,
    interimTranscript,
    isSpeaking,
    toggleMic,
    triggerBargeIn,
    sendTranscript,
    sendMessage,
    voiceSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  };
}
