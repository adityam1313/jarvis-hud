import { exec, spawn } from 'child_process';
import os from 'os';

class Executor {
  // Aliases and known applications dictionary
  static KNOWN_APPS = {
    // Coding & Development
    'vscode': { windows: 'code', name: 'Visual Studio Code' },
    'code': { windows: 'code', name: 'Visual Studio Code' },
    'vs code': { windows: 'code', name: 'Visual Studio Code' },
    'visual studio code': { windows: 'code', name: 'Visual Studio Code' },
    'visual studio': { windows: 'devenv', name: 'Visual Studio' },
    'sublime': { windows: 'subl', name: 'Sublime Text' },
    'git': { windows: 'git-bash', name: 'Git Bash' },
    'git bash': { windows: 'git-bash', name: 'Git Bash' },

    // Browsers
    'chrome': { windows: 'chrome', name: 'Google Chrome' },
    'google chrome': { windows: 'chrome', name: 'Google Chrome' },
    'edge': { windows: 'msedge', name: 'Microsoft Edge' },
    'microsoft edge': { windows: 'msedge', name: 'Microsoft Edge' },
    'brave': { windows: 'brave', name: 'Brave Browser' },
    'firefox': { windows: 'firefox', name: 'Mozilla Firefox' },
    'opera': { windows: 'opera', name: 'Opera' },

    // Utilities & System
    'calculator': { windows: 'calc', name: 'Calculator' },
    'calc': { windows: 'calc', name: 'Calculator' },
    'notepad': { windows: 'notepad', name: 'Notepad' },
    'notepad++': { windows: 'notepad++', name: 'Notepad++' },
    'paint': { windows: 'mspaint', name: 'Paint' },
    'mspaint': { windows: 'mspaint', name: 'Paint' },
    'terminal': { windows: 'powershell', name: 'PowerShell Terminal' },
    'powershell': { windows: 'powershell', name: 'PowerShell' },
    'cmd': { windows: 'cmd', name: 'Command Prompt' },
    'command prompt': { windows: 'cmd', name: 'Command Prompt' },
    'explorer': { windows: 'explorer', name: 'File Explorer' },
    'files': { windows: 'explorer', name: 'File Explorer' },
    'file explorer': { windows: 'explorer', name: 'File Explorer' },
    'settings': { windows: 'start ms-settings:', name: 'System Settings' },
    'system settings': { windows: 'start ms-settings:', name: 'System Settings' },
    'taskmanager': { windows: 'taskmgr', name: 'Task Manager' },
    'task manager': { windows: 'taskmgr', name: 'Task Manager' },
    'taskmgr': { windows: 'taskmgr', name: 'Task Manager' },
    'control panel': { windows: 'control', name: 'Control Panel' },
    'snipping tool': { windows: 'snippingtool', name: 'Snipping Tool' },
    'snip': { windows: 'snippingtool', name: 'Snipping Tool' },
    'camera': { windows: 'start microsoft.windows.camera:', name: 'Camera' },

    // Productivity & Office
    'word': { windows: 'winword', name: 'Microsoft Word' },
    'microsoft word': { windows: 'winword', name: 'Microsoft Word' },
    'excel': { windows: 'excel', name: 'Microsoft Excel' },
    'microsoft excel': { windows: 'excel', name: 'Microsoft Excel' },
    'powerpoint': { windows: 'powerpnt', name: 'Microsoft PowerPoint' },
    'microsoft powerpoint': { windows: 'powerpnt', name: 'Microsoft PowerPoint' },
    'teams': { windows: 'teams', name: 'Microsoft Teams' },
    'slack': { windows: 'slack', name: 'Slack' },
    'discord': { windows: 'discord', name: 'Discord' },
    'steam': { windows: 'steam', name: 'Steam' },
    'spotify': { url: 'https://open.spotify.com', name: 'Spotify' },
    'vlc': { windows: 'vlc', name: 'VLC Media Player' },
    'obs': { windows: 'obs64', name: 'OBS Studio' },
    'whatsapp': { windows: 'start whatsapp:', url: 'https://web.whatsapp.com', name: 'WhatsApp' },
    'telegram': { windows: 'telegram', url: 'https://web.telegram.org', name: 'Telegram' },

    // Web Destinations
    'youtube': { url: 'https://www.youtube.com', name: 'YouTube' },
    'google': { url: 'https://www.google.com', name: 'Google' },
    'github': { url: 'https://www.github.com', name: 'GitHub' },
    'reddit': { url: 'https://www.reddit.com', name: 'Reddit' },
    'twitter': { url: 'https://www.x.com', name: 'X (Twitter)' },
    'x': { url: 'https://www.x.com', name: 'X' },
    'chatgpt': { url: 'https://chatgpt.com', name: 'ChatGPT' },
    'claude': { url: 'https://claude.ai', name: 'Claude AI' },
    'gemini': { url: 'https://gemini.google.com', name: 'Google Gemini' },
    'maps': { url: 'https://maps.google.com', name: 'Google Maps' },
    'gmail': { url: 'https://mail.google.com', name: 'Gmail' },
    'netflix': { url: 'https://www.netflix.com', name: 'Netflix' },
    'amazon': { url: 'https://www.amazon.com', name: 'Amazon' },
    'figma': { url: 'https://www.figma.com', name: 'Figma' },
    'instagram': { url: 'https://www.instagram.com', name: 'Instagram' },
    'linkedin': { url: 'https://www.linkedin.com', name: 'LinkedIn' },
    'twitch': { url: 'https://www.twitch.tv', name: 'Twitch' },
    'wikipedia': { url: 'https://www.wikipedia.org', name: 'Wikipedia' }
  };

  /**
   * Helper to spawn a detached Windows process or URL via Start-Process
   */
  static launchWindowsTarget(target) {
    return new Promise((resolve) => {
      try {
        const ps = spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process '${target}'`], {
          stdio: 'ignore',
          detached: true
        });
        ps.unref();
        console.log(`[Executor] Launched Windows Target via Start-Process: ${target}`);
        resolve({ success: true });
      } catch (err) {
        console.error(`[Executor] Error launching target ${target}:`, err.message);
        resolve({ success: false, error: err.message });
      }
    });
  }

  /**
   * Safely opens a URL in the default browser
   */
  static async openUrl(url) {
    try {
      let fullUrl = url;
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = `https://${fullUrl}`;
      }
      const parsed = new URL(fullUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { success: false, error: 'Protocol not permitted' };
      }

      const platform = os.platform();

      if (platform === 'win32') {
        const result = await Executor.launchWindowsTarget(fullUrl);
        return { success: result.success, message: result.success ? `Opened ${fullUrl}` : result.error };
      }

      return new Promise((resolve) => {
        const cmd = platform === 'darwin' ? `open "${fullUrl}"` : `xdg-open "${fullUrl}"`;
        exec(cmd, (err) => {
          if (err) return resolve({ success: false, error: err.message });
          resolve({ success: true, message: `Opened ${fullUrl}` });
        });
      });
    } catch (e) {
      return { success: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Execute application or website launch with intelligent multi-word resolution
   */
  async launchApp(rawAppName) {
    if (!rawAppName || typeof rawAppName !== 'string') {
      return {
        success: false,
        sandboxed: true,
        message: 'Invalid application identifier.'
      };
    }

    const trimmed = rawAppName.trim().toLowerCase();
    const cleanKey = trimmed.replace(/[^a-z0-9\s_\-\.]/g, '');

    // Malicious shell injection security check
    if (cleanKey.includes('rm -rf') || cleanKey.includes('format c') || cleanKey.includes('del /') || cleanKey.includes('drop table')) {
      return {
        success: false,
        sandboxed: true,
        message: 'Command blocked by security sandbox protocol.'
      };
    }

    // 1. Direct match or alias in KNOWN_APPS dictionary
    let target = Executor.KNOWN_APPS[cleanKey];
    if (!target) {
      const stripped = cleanKey.replace(/\s+/g, '');
      target = Executor.KNOWN_APPS[stripped];
    }

    // 2. Check if the user specified a website domain (e.g. "netflix.com", "claude.ai", "google.com")
    if (!target && (cleanKey.includes('.com') || cleanKey.includes('.org') || cleanKey.includes('.net') || cleanKey.includes('.io') || cleanKey.includes('.ai') || cleanKey.includes('.dev') || cleanKey.includes('.tv'))) {
      const url = `https://${cleanKey}`;
      const result = await Executor.openUrl(url);
      return {
        success: result.success,
        sandboxed: false,
        name: cleanKey,
        message: result.success ? `Opened ${cleanKey}` : `Could not open ${cleanKey}`
      };
    }

    // 3. Known web URL destination
    if (target && target.url) {
      console.log(`[Executor] Launching Web Destination: ${target.name} (${target.url})`);
      const result = await Executor.openUrl(target.url);
      return {
        success: result.success,
        sandboxed: false,
        name: target.name,
        message: result.success ? `Opened ${target.name}` : `Failed to launch ${target.name}`
      };
    }

    // 4. Known Native OS Desktop App
    if (target) {
      const platform = os.platform();
      if (platform === 'win32') {
        const winTarget = target.windows || cleanKey;
        console.log(`[Executor] Launching Windows App: ${winTarget} for ${target.name}`);
        const result = await Executor.launchWindowsTarget(winTarget);
        return {
          success: result.success,
          sandboxed: false,
          name: target.name,
          message: result.success ? `Successfully launched ${target.name}.` : `Could not launch ${target.name}`
        };
      }
    }

    // 5. Dynamic Custom Native App Launch (for any installed software on user's PC)
    const platform = os.platform();
    if (platform === 'win32') {
      console.log(`[Executor] Attempting dynamic Windows launch for: ${cleanKey}`);
      const result = await Executor.launchWindowsTarget(cleanKey);
      return {
        success: result.success,
        sandboxed: false,
        name: rawAppName,
        message: result.success ? `Launching ${rawAppName}.` : `Could not launch ${rawAppName}`
      };
    }

    return {
      success: false,
      sandboxed: false,
      message: `Unable to open ${rawAppName}`
    };
  }

  /**
   * Safely execute web search
   */
  async searchWeb(query) {
    if (!query || typeof query !== 'string') {
      return { success: false, message: 'Invalid search query' };
    }
    const cleanQuery = encodeURIComponent(query.trim().slice(0, 100));
    const url = `https://www.google.com/search?q=${cleanQuery}`;
    return await Executor.openUrl(url);
  }
}

export default Executor;
