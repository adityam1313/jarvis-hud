import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';
const HTTP_API_URL = 'http://localhost:3001/api/command';
const HTTP_VOICE_URL = 'http://localhost:3001/api/voice';
const RECONNECT_DELAY = 2000;

export default function useJarvisSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState({
    cpu: 0,
    memory: 0,
    latency: 0,
    uptime: '0d 0h 0m',
    network: { download: '0.00 MB/s', upload: '0.00 MB/s', status: 'ONLINE' }
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
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const recognitionRef = useRef(null);
  const isMicActiveRef = useRef(false);
  const processedMsgIdsRef = useRef(new Set());

  // Hardware Audio Recording Refs
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  // Send message over WebSocket
  const sendMessage = useCallback((type, data = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }, []);

  // Barge-In interrupt function
  const triggerBargeIn = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      sendMessage('interrupt');
    }
  }, [sendMessage]);

  // Helper to execute action locally on desktop via Electron IPC
  const triggerClientAction = useCallback((action) => {
    if (!action) return;
    const urlMap = {
      spotify: 'https://open.spotify.com',
      youtube: 'https://www.youtube.com',
      google: 'https://www.google.com',
      github: 'https://www.github.com',
      reddit: 'https://www.reddit.com',
      twitter: 'https://www.x.com',
      x: 'https://www.x.com',
      chatgpt: 'https://chatgpt.com',
      claude: 'https://claude.ai',
      gemini: 'https://gemini.google.com',
      maps: 'https://maps.google.com',
      gmail: 'https://mail.google.com',
      netflix: 'https://www.netflix.com',
      amazon: 'https://www.amazon.com',
      figma: 'https://www.figma.com',
      instagram: 'https://www.instagram.com',
      linkedin: 'https://www.linkedin.com',
      twitch: 'https://www.twitch.tv',
      wikipedia: 'https://www.wikipedia.org'
    };

    const target = (action.target || '').toLowerCase().trim();
    const query = action.query;

    console.log('[JARVIS HUD] Executing client action:', action);

    if (window.jarvisDesktop) {
      if (action.action === 'launch') {
        if (urlMap[target]) {
          window.jarvisDesktop.openUrl(urlMap[target]);
        } else {
          window.jarvisDesktop.launchApp(target);
        }
      } else if (action.action === 'search' && query) {
        window.jarvisDesktop.openUrl(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
      }
    } else {
      if (action.action === 'launch' && urlMap[target]) {
        window.open(urlMap[target], '_blank');
      } else if (action.action === 'search' && query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      }
    }
  }, []);

  // Text-To-Speech function
  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

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

  // Handle incoming JARVIS response
  const handleIncomingJarvisResponse = useCallback((respData) => {
    const msgId = respData.id || (respData.text + '_' + respData.timestamp);
    if (processedMsgIdsRef.current.has(msgId)) {
      return;
    }
    processedMsgIdsRef.current.add(msgId);

    const respText = respData.text;
    setMessages(prev => [...prev, {
      type: 'jarvis',
      text: respText,
      action: respData.action,
      time: new Date(respData.timestamp || Date.now()).toLocaleTimeString('en-US', { hour12: false })
    }]);

    if (respData.action) {
      triggerClientAction(respData.action);
    }

    speakText(respText);
  }, [speakText, triggerClientAction]);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
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
              handleIncomingJarvisResponse(msg.data);
              break;
            }

            case 'system': {
              const sysId = 'sys_' + msg.data.message;
              if (!processedMsgIdsRef.current.has(sysId)) {
                processedMsgIdsRef.current.add(sysId);
                setMessages(prev => [...prev, {
                  type: 'system',
                  text: msg.data.message,
                  time: new Date(msg.data.timestamp).toLocaleTimeString('en-US', { hour12: false })
                }]);
              }
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.error('[JARVIS HUD] WebSocket packet parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }, [handleIncomingJarvisResponse]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // Guaranteed Send Transcript Function
  const sendTranscript = useCallback(async (text) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    triggerBargeIn();

    setMessages(prev => [...prev, {
      type: 'user',
      text: cleanText,
      time: new Date().toLocaleTimeString('en-US', { hour12: false })
    }]);

    const sentWs = sendMessage('transcript', { text: cleanText });

    if (!sentWs) {
      try {
        setAssistantStatus('THINKING');
        const res = await fetch(HTTP_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText })
        });
        const data = await res.json();
        if (data.success && data.result) {
          setNlu({
            intent: data.result.intent,
            slots: data.result.slots,
            confidence: data.result.confidence
          });
          setAssistantStatus('SPEAKING');
          handleIncomingJarvisResponse({
            id: data.id,
            text: data.result.spokenResponse,
            action: data.result.action,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('[JARVIS HUD] HTTP fallback error:', err);
        setAssistantStatus('IDLE');
      }
    }
  }, [sendMessage, triggerBargeIn, handleIncomingJarvisResponse]);

  // Send Recorded Audio to Backend
  const sendRecordedAudio = useCallback(async (audioBlob) => {
    if (!audioBlob || audioBlob.size < 100) return;

    setAssistantStatus('THINKING');
    setMessages(prev => [...prev, {
      type: 'user',
      text: '🎙️ [Voice Directive Transmitted]',
      time: new Date().toLocaleTimeString('en-US', { hour12: false })
    }]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        const mimeType = audioBlob.type || 'audio/webm';

        // Try WebSocket first
        const sent = sendMessage('voice_audio', { audio: base64Data, mimeType });
        if (!sent) {
          // HTTP Fallback
          const res = await fetch(HTTP_VOICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Data, mimeType })
          });
          const data = await res.json();
          if (data.success && data.result) {
            handleIncomingJarvisResponse({
              id: data.id,
              text: data.result.spokenResponse,
              action: data.result.action,
              timestamp: new Date().toISOString()
            });
          }
        }
      };
    } catch (err) {
      console.error('[JARVIS HUD] Failed to send voice audio:', err);
      setAssistantStatus('IDLE');
    }
  }, [sendMessage, handleIncomingJarvisResponse]);

  // Start Hardware Mic Audio Recording
  const startRecording = useCallback(async () => {
    try {
      triggerBargeIn();
      sendMessage('speech_start');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      // Setup audio analysis for live orb frequency
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }

      // Setup MediaRecorder
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        sendRecordedAudio(audioBlob);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsMicActive(true);
      setAssistantStatus('LISTENING');

      // Also try Web Speech API in parallel
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) final += event.results[i][0].transcript;
              else interim += event.results[i][0].transcript;
            }
            if (interim) setInterimTranscript(interim);
            if (final.trim()) {
              setInterimTranscript('');
              sendTranscript(final.trim());
            }
          };
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[JARVIS Voice] Microphone access failed:', err.message);
      alert('Microphone access was denied. Please allow microphone permissions or type directly into the terminal!');
      setIsMicActive(false);
    }
  }, [triggerBargeIn, sendMessage, sendRecordedAudio, sendTranscript]);

  // Stop Hardware Mic Audio Recording
  const stopRecording = useCallback(() => {
    setIsMicActive(false);
    sendMessage('speech_end');
    setAudioLevel(0);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  }, [sendMessage]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (isMicActive) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isMicActive, startRecording, stopRecording]);

  return {
    isConnected,
    telemetry,
    nlu,
    assistantStatus,
    messages,
    isMicActive,
    interimTranscript,
    isSpeaking,
    audioLevel,
    toggleMic,
    triggerBargeIn,
    sendTranscript,
    sendMessage,
    voiceSupported: true
  };
}
