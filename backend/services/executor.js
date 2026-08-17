import { exec, spawn } from 'child_process';
import os from 'os';

class Executor {
  // Hardcoded dictionary whitelist of authorized applications and web destinations
  static APP_WHITELIST = {
    // Desktop Applications
    'calculator': {
      windows: 'calc.exe',
      darwin: 'open -a Calculator',
      linux: 'gnome-calculator',
      name: 'Calculator'
    },
    'calc': {
      windows: 'calc.exe',
      darwin: 'open -a Calculator',
      linux: 'gnome-calculator',
      name: 'Calculator'
    },
    'notepad': {
      windows: 'notepad.exe',
      darwin: 'open -a TextEdit',
      linux: 'gedit',
      name: 'Notepad'
    },
    'paint': {
      windows: 'mspaint.exe',
      darwin: 'open -a Paintbrush',
      linux: 'drawing',
      name: 'Paint'
    },
    'terminal': {
      windows: 'powershell.exe',
      darwin: 'open -a Terminal',
      linux: 'gnome-terminal',
      name: 'Terminal'
    },
    'powershell': {
      windows: 'powershell.exe',
      darwin: 'open -a Terminal',
      linux: 'gnome-terminal',
      name: 'PowerShell'
    },
    'cmd': {
      windows: 'cmd.exe',
      darwin: 'open -a Terminal',
      linux: 'gnome-terminal',
      name: 'Command Prompt'
    },
    'explorer': {
      windows: 'explorer.exe',
      darwin: 'open .',
      linux: 'nautilus .',
      name: 'File Explorer'
    },
    'files': {
      windows: 'explorer.exe',
      darwin: 'open .',
      linux: 'nautilus .',
      name: 'File Explorer'
    },
    'vscode': {
      windows: 'code',
      darwin: 'open -a "Visual Studio Code"',
      linux: 'code',
      name: 'Visual Studio Code'
    },
    'code': {
      windows: 'code',
      darwin: 'open -a "Visual Studio Code"',
      linux: 'code',
      name: 'Visual Studio Code'
    },
    'settings': {
      windows: 'ms-settings:',
      darwin: 'open -a "System Preferences"',
      linux: 'gnome-control-center',
      name: 'System Settings'
    },
    'taskmanager': {
      windows: 'taskmgr.exe',
      darwin: 'open -a "Activity Monitor"',
      linux: 'gnome-system-monitor',
      name: 'Task Manager'
    },

    // Web Destinations
    'spotify': {
      url: 'https://open.spotify.com',
      name: 'Spotify Web'
    },
    'youtube': {
      url: 'https://www.youtube.com',
      name: 'YouTube'
    },
    'google': {
      url: 'https://www.google.com',
      name: 'Google Search'
    },
    'github': {
      url: 'https://www.github.com',
      name: 'GitHub'
    },
    'reddit': {
      url: 'https://www.reddit.com',
      name: 'Reddit'
    },
    'twitter': {
      url: 'https://www.x.com',
      name: 'X / Twitter'
    },
    'x': {
      url: 'https://www.x.com',
      name: 'X'
    },
    'chatgpt': {
      url: 'https://chatgpt.com',
      name: 'ChatGPT'
    },
    'maps': {
      url: 'https://maps.google.com',
      name: 'Google Maps'
    },
    'gmail': {
      url: 'https://mail.google.com',
      name: 'Gmail'
    },
    'wikipedia': {
      url: 'https://www.wikipedia.org',
      name: 'Wikipedia'
    }
  };

  /**
   * Safely opens a URL in the user's default browser (detached, non-blocking)
   */
  static openUrl(url) {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return resolve({ success: false, error: 'Protocol not permitted' });
        }
      } catch (e) {
        return resolve({ success: false, error: 'Invalid URL format' });
      }

      const platform = os.platform();

      if (platform === 'win32') {
        try {
          const child = spawn('cmd.exe', ['/c', 'start', '', url], {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
          console.log(`[Executor] Launched URL in browser: ${url}`);
          return resolve({ success: true, message: `Opened ${url}` });
        } catch (err) {
          console.error(`[Executor] Error opening URL:`, err.message);
          return resolve({ success: false, error: err.message });
        }
      }

      let cmd = platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
      exec(cmd, (err) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true, message: `Opened ${url}` });
      });
    });
  }

  /**
   * Execute application launch by strictly verifying against whitelist (detached, non-blocking)
   */
  async launchApp(appName) {
    if (!appName || typeof appName !== 'string') {
      return {
        success: false,
        sandboxed: true,
        message: 'Invalid application identifier provided.'
      };
    }

    const key = appName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check against strict whitelist
    const target = Executor.APP_WHITELIST[key];
    if (!target) {
      console.warn(`[Executor] SANDBOX BLOCKED: App "${appName}" is not in the whitelist.`);
      return {
        success: false,
        sandboxed: true,
        message: `Security Sandbox: "${appName}" is not in the authorized whitelist.`
      };
    }

    // Handle Web URL destination
    if (target.url) {
      console.log(`[Executor] Launching Web Destination: ${target.name} (${target.url})`);
      const result = await Executor.openUrl(target.url);
      return {
        success: result.success,
        sandboxed: false,
        name: target.name,
        message: result.success ? `Opened ${target.name}` : `Failed to launch ${target.name}`
      };
    }

    // Handle Native OS Desktop App
    const platform = os.platform();

    if (platform === 'win32') {
      const winTarget = target.windows;
      console.log(`[Executor] Launching Windows App detached: ${winTarget} for ${target.name}`);
      try {
        const child = spawn('cmd.exe', ['/c', 'start', '', winTarget], {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        console.log(`[Executor] Windows App successfully spawned: ${target.name}`);
        return {
          success: true,
          sandboxed: false,
          name: target.name,
          message: `Successfully launched ${target.name}.`
        };
      } catch (err) {
        console.error(`[Executor] Error spawning ${target.name}:`, err.message);
        return {
          success: false,
          sandboxed: false,
          message: `Could not launch ${target.name}: ${err.message}`
        };
      }
    }

    let commandToRun = target[platform];
    if (!commandToRun) {
      return {
        success: false,
        sandboxed: false,
        message: `Application ${target.name} is not configured for platform: ${platform}`
      };
    }

    return new Promise((resolve) => {
      exec(commandToRun, (err) => {
        if (err) {
          return resolve({
            success: false,
            sandboxed: false,
            message: `Could not launch ${target.name}: ${err.message}`
          });
        }
        resolve({
          success: true,
          sandboxed: false,
          name: target.name,
          message: `Successfully launched ${target.name}.`
        });
      });
    });
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
