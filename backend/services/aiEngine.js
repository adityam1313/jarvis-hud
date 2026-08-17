import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import Executor from './executor.js';

dotenv.config();

class AIEngine {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.executor = new Executor();
    this.chatHistory = [];
    this.maxHistory = 10;

    if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here') {
      try {
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        console.log('[AIEngine] Initialized Google GenAI SDK with native tool calling & audio processing.');
      } catch (err) {
        console.error('[AIEngine] Failed to initialize Google GenAI SDK:', err.message);
        this.ai = null;
      }
    } else {
      console.log('[AIEngine] Operating in Local Smart Rule Engine mode.');
      this.ai = null;
    }

    // Define function declarations for native tool calling
    this.tools = [
      {
        functionDeclarations: [
          {
            name: 'open_application',
            description: 'Opens any local application or website such as VS Code, Chrome, Spotify, YouTube, Discord, Steam, Calculator, Notepad, etc.',
            parameters: {
              type: 'OBJECT',
              properties: {
                appName: {
                  type: 'STRING',
                  description: 'Name of the app or website to open (e.g. vs code, chrome, spotify, youtube, discord, notepad, calculator, etc.)'
                }
              },
              required: ['appName']
            }
          },
          {
            name: 'search_web',
            description: 'Searches the web for a specified query or topic in default browser',
            parameters: {
              type: 'OBJECT',
              properties: {
                query: {
                  type: 'STRING',
                  description: 'The query to search for'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'query_system_telemetry',
            description: 'Queries current computer system status, CPU load, memory utilization, or uptime',
            parameters: {
              type: 'OBJECT',
              properties: {
                metric: {
                  type: 'STRING',
                  description: 'Target metric: cpu, memory, network, uptime, or all'
                }
              },
              required: ['metric']
            }
          }
        ]
      }
    ];

    this.systemInstruction = `You are J.A.R.V.I.S., a sophisticated, hyper-intelligent AI assistant created by Tony Stark.
Speak in a calm, confident, British, polite yet precise tone.
Keep verbal responses concise (1 to 2 sentences max).
Always call the provided tools when the user requests to launch apps, open websites, search the web, or check system metrics.
If a command is destructive (e.g. system wipe, rm -rf), politely refuse.`;
  }

  /**
   * Process raw microphone audio via Gemini 2.5 Flash multimodal audio engine
   */
  async processVoiceAudio(base64Audio, mimeType = 'audio/webm', telemetryData = {}) {
    if (!this.ai) {
      console.log('[AIEngine] Raw audio received. GEMINI_API_KEY required for native audio transcription.');
      return {
        intent: 'voice_input',
        slots: {},
        confidence: 0.9,
        spokenResponse: 'I received your voice transmission, sir. Please configure your GEMINI_API_KEY in backend/.env for cloud neural speech transcription, or use the command terminal below.',
        action: null,
        transcript: '[Voice Transmission Received]'
      };
    }

    try {
      console.log('[AIEngine] Transcribing and interpreting live voice audio with Gemini 2.5 Flash...');
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Audio
                }
              },
              {
                text: 'Listen to this voice directive. Identify what the user said, output the transcription, and call the appropriate tool if the user wants to open an app, website, or search.'
              }
            ]
          }
        ],
        config: {
          systemInstruction: this.systemInstruction,
          tools: this.tools,
          temperature: 0.2
        }
      });

      const candidate = response.candidates?.[0];
      const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall);

      let parsedIntent = 'general_chat';
      let parsedSlots = {};
      let spokenResponse = '';
      let actionExecuted = null;
      let transcriptText = response.text?.() || '';

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0].functionCall;
        const fnName = call.name;
        const fnArgs = call.args || {};

        parsedIntent = fnName;
        parsedSlots = fnArgs;

        if (fnName === 'open_application') {
          const appName = fnArgs.appName;
          const toolResult = await this.executor.launchApp(appName);
          actionExecuted = { action: 'launch', target: appName, result: toolResult };
          spokenResponse = `Right away, sir. Launching ${toolResult.name || appName}.`;
        } else if (fnName === 'search_web') {
          const query = fnArgs.query;
          const toolResult = await this.executor.searchWeb(query);
          actionExecuted = { action: 'search', query, result: toolResult };
          spokenResponse = `Searching the web for "${query}", sir.`;
        } else if (fnName === 'query_system_telemetry') {
          const cpu = telemetryData.cpu ?? 35;
          const mem = telemetryData.memory ?? 58;
          spokenResponse = `All core systems operational. CPU load is at ${cpu}%, memory utilization is ${mem}%.`;
        }
      } else {
        spokenResponse = transcriptText || 'Understood, sir.';
      }

      return {
        intent: parsedIntent,
        slots: parsedSlots,
        confidence: 0.98,
        spokenResponse,
        action: actionExecuted,
        transcript: transcriptText
      };
    } catch (err) {
      console.error('[AIEngine] Gemini Voice processing error:', err.message);
      return {
        intent: 'error',
        slots: {},
        confidence: 0.5,
        spokenResponse: 'I had difficulty decoding that audio packet, sir. Please try again or type directly into the terminal.',
        action: null,
        transcript: '[Audio Error]'
      };
    }
  }

  /**
   * Main entry point to process a user command transcript
   */
  async processCommand(text, telemetryData = {}) {
    if (!text || typeof text !== 'string') {
      return {
        intent: 'unknown',
        slots: {},
        confidence: 0.0,
        spokenResponse: 'I did not catch that, sir. Could you repeat?'
      };
    }

    // Try Gemini with native function calling if SDK is configured
    if (this.ai) {
      try {
        return await this.processWithGemini(text, telemetryData);
      } catch (err) {
        console.error('[AIEngine] Gemini API error, falling back to local engine:', err.message);
      }
    }

    // Fallback: Local rule-based NLU & tool execution
    return await this.processWithLocalEngine(text, telemetryData);
  }

  /**
   * Native Function Calling using @google/genai
   */
  async processWithGemini(text, telemetryData) {
    this.chatHistory.push({ role: 'user', parts: [{ text }] });
    if (this.chatHistory.length > this.maxHistory) {
      this.chatHistory.shift();
    }

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: this.chatHistory,
      config: {
        systemInstruction: this.systemInstruction,
        tools: this.tools,
        temperature: 0.3
      }
    });

    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall);

    let parsedIntent = 'general_chat';
    let parsedSlots = {};
    let spokenResponse = '';
    let actionExecuted = null;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0].functionCall;
      const fnName = call.name;
      const fnArgs = call.args || {};

      parsedIntent = fnName;
      parsedSlots = fnArgs;

      console.log(`[AIEngine] Native Function Call Triggered: ${fnName}`, fnArgs);

      let toolResult = {};

      if (fnName === 'open_application') {
        const appName = fnArgs.appName;
        toolResult = await this.executor.launchApp(appName);
        actionExecuted = { action: 'launch', target: appName, result: toolResult };

        if (toolResult.sandboxed) {
          spokenResponse = `Security protocol active. "${appName}" was blocked.`;
        } else if (toolResult.success) {
          spokenResponse = `Right away, sir. Launching ${toolResult.name || appName}.`;
        } else {
          spokenResponse = `I encountered an issue opening ${appName}: ${toolResult.message}`;
        }
      } else if (fnName === 'search_web') {
        const query = fnArgs.query;
        toolResult = await this.executor.searchWeb(query);
        actionExecuted = { action: 'search', query, result: toolResult };
        spokenResponse = `Searching the web for "${query}", sir.`;
      } else if (fnName === 'query_system_telemetry') {
        const metric = fnArgs.metric;
        parsedSlots = { metric };
        const cpu = telemetryData.cpu ?? 35;
        const mem = telemetryData.memory ?? 58;
        spokenResponse = `All core systems operational. CPU load is at ${cpu}%, memory utilization is ${mem}%.`;
      }
    } else {
      spokenResponse = response.text?.() || candidate?.content?.parts?.[0]?.text || 'At your service, sir.';
    }

    this.chatHistory.push({
      role: 'model',
      parts: [{ text: spokenResponse }]
    });

    return {
      intent: parsedIntent,
      slots: parsedSlots,
      confidence: 0.98,
      spokenResponse,
      action: actionExecuted
    };
  }

  /**
   * Deterministic local parser with multi-word app & custom command support
   */
  async processWithLocalEngine(text, telemetryData) {
    const lower = text.toLowerCase().trim();
    let intent = 'general_chat';
    let slots = {};
    let confidence = 0.94;
    let spokenResponse = '';
    let action = null;

    // Pattern 1: Malicious / Destructive command detection
    if (lower.includes('rm -rf') || lower.includes('format c:') || lower.includes('drop table') || lower.includes('del /f') || lower.includes('kill -9')) {
      intent = 'security_alert';
      confidence = 0.99;
      spokenResponse = 'Access denied. The requested command violates core security protocols.';
      return { intent, slots: { payload: 'sandboxed_violation' }, confidence, spokenResponse, action: null };
    }

    // Pattern 2: Math and calculations (e.g. "what is 2+2", "calculate 15 * 4")
    const mathMatch = lower.match(/(?:what(?:'s|\s+is)?|calculate|eval)?\s*([0-9\s\+\-\*\/\.\(\)\^]+)/i);
    if (mathMatch && /[0-9]/.test(mathMatch[1]) && /[\+\-\*\/]/.test(mathMatch[1])) {
      const expr = mathMatch[1].trim();
      try {
        const sanitized = expr.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '');
        const val = Function(`'use strict'; return (${sanitized})`)();
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          return {
            intent: 'calculation',
            slots: { expression: expr, result: String(val) },
            confidence: 0.99,
            spokenResponse: `The result of ${expr} is ${val}, sir.`,
            action: null
          };
        }
      } catch (e) {
        // fallback
      }
    }

    // Pattern 3: Open / Launch Application or Website (Multi-word support)
    const openMatch = lower.match(/^(?:open|launch|start|run|go to)\s+(?:the\s+)?(.+)/i);
    if (openMatch || Executor.KNOWN_APPS[lower] || Executor.KNOWN_APPS[lower.replace(/\s+/g, '')]) {
      const rawApp = openMatch ? openMatch[1].trim() : lower;
      intent = 'open_application';
      slots = { appName: rawApp };
      confidence = 0.98;

      const execResult = await this.executor.launchApp(rawApp);
      action = { action: 'launch', target: rawApp, result: execResult };

      if (execResult.sandboxed) {
        spokenResponse = `Security protocol active. "${rawApp}" was blocked.`;
      } else if (execResult.success) {
        spokenResponse = `Right away, sir. Launching ${execResult.name || rawApp}.`;
      } else {
        spokenResponse = `I attempted to launch ${rawApp}, sir.`;
      }
      return { intent, slots, confidence, spokenResponse, action };
    }

    // Pattern 4: Web Search
    const searchMatch = lower.match(/(?:search|google|look up|find)\s+(?:for\s+)?(.+)/i);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      intent = 'search_web';
      slots = { query };
      confidence = 0.95;

      const execResult = await this.executor.searchWeb(query);
      action = { action: 'search', query, result: execResult };
      spokenResponse = `Searching the web for "${query}", sir.`;
      return { intent, slots, confidence, spokenResponse, action };
    }

    // Pattern 5: System Diagnostics / Telemetry
    if (lower.includes('status') || lower.includes('diagnostic') || lower.includes('system') || lower.includes('cpu') || lower.includes('memory') || lower.includes('telemetry')) {
      intent = 'query_system_telemetry';
      slots = { metric: 'all' };
      confidence = 0.97;
      const cpu = telemetryData.cpu ?? 34;
      const mem = telemetryData.memory ?? 62;
      const latency = telemetryData.latency ?? 12;
      spokenResponse = `Diagnostics complete. CPU at ${cpu}%, Memory at ${mem}%, latency ${latency} milliseconds. All systems nominal.`;
      return { intent, slots, confidence, spokenResponse, action };
    }

    // Pattern 6: Greetings and identity
    if (lower.includes('hello') || lower.includes('hi jarvis') || lower.includes('hey jarvis') || lower.includes('good morning') || lower.includes('good evening')) {
      intent = 'greeting';
      confidence = 0.98;
      spokenResponse = 'Good day, Aditya. All systems are online and awaiting your directives.';
      return { intent, slots, confidence, spokenResponse, action };
    }

    if (lower.includes('who are you') || lower.includes('what are you')) {
      intent = 'identify';
      confidence = 0.99;
      spokenResponse = 'I am J.A.R.V.I.S., your autonomous intelligence interface and home system coordinator.';
      return { intent, slots, confidence, spokenResponse, action };
    }

    // Default conversational response
    spokenResponse = `Understood, sir. Processing: "${text}". Standing by for further directives.`;
    return {
      intent: 'general_chat',
      slots: { query: text },
      confidence: 0.90,
      spokenResponse,
      action: null
    };
  }
}

export default AIEngine;
