import { exec } from 'child_process';
import os from 'os';

class Executor {
  // Hardcoded dictionary whitelist of authorized applications and web destinations
  static APP_WHITELIST = {
    // Desktop Applications
    'calculator': {
      windows: 'start calc:',
      darwin: 'open -a Calculator',
      linux: 'gnome-calculator',
      name: 'Calculator'
    },
    'calc': {
      windows: 'start calc:',
      darwin: 'open -a Calculator',
      linux: 'gnome-calculator',
      name: 'Calculator'
    },
    'notepad': {
      windows: 'notepad',
      darwin: 'open -a TextEdit',
      linux: 'gedit',
      name: 'Notepad'
    },
    'paint': {
      windows: 'mspaint',
      darwin: 'open -a Paintbrush',
      linux: 'drawing',
      name: 'Paint'
    },
    'terminal': {
      windows: 'start powershell',
      darwin: 'open -a Terminal',
      linux: 'gnome-terminal',
      name: 'Terminal'
    },
    'cmd': {
      windows: 'start cmd',
      darwin: 'open -a Terminal',
      linux: 'gnome-terminal',
      name: 'Command Prompt'
    },
    'explorer': {
      windows: 'explorer',
      darwin: 'open .',
      linux: 'nautilus .',
      name: 'File Explorer'
    },
    'files': {
      windows: 'explorer',
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
    'settings': {
      windows: 'start ms-settings:',
      darwin: 'open -a "System Preferences"',
      linux: 'gnome-control-center',
      name: 'System Settings'
    },
    'taskmanager': {
      windows: 'start taskmgr',
      darwin: 'open -a "Activity Monitor"',
      linux: 'gnome-system-monitor',
      name: 'Task Manager'
    },

    // Web Destinations
    'youtube': {
      url: 'https://www.youtube.com',
      name: 'YouTube'
    },
    'google': {
      url: 'https://www.google.com',
      name: 'Google Search'
    },
    'spotify': {
      url: 'https://open.spotify.com',
      name: 'Spotify Web'
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
   * Safely opens a URL in the user's default browser across OSes
   */
  static openUrl(url) {
    return new Promise((resolve) => {
      // Validate that URL is well-formed https/http to prevent injection
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return resolve({ success: false, error: 'Protocol not permitted' });
        }
      } catch (e) {
        return resolve({ success: false, error: 'Invalid URL format' });
      }

      const platform = os.platform();
      let cmd = `start "" "${url}"`;
      if (platform === 'darwin') {
        cmd = `open "${url}"`;
      } else if (platform === 'linux') {
        cmd = `xdg-open "${url}"`;
      }

      exec(cmd, (err) => {
        if (err) {
          console.error(`[Executor] Failed to open URL ${url}:`, err.message);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true, message: `Opened ${url}` });
      });
    });
  }

  /**
   * Execute application launch by strictly verifying against the whitelist dictionary
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
      console.log(`[Executor] Launching Web App: ${target.name} (${target.url})`);
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
    let commandToRun = target[platform] || target.windows;

    if (!commandToRun) {
      return {
        success: false,
        sandboxed: false,
        message: `Application ${target.name} is not configured for platform: ${platform}`
      };
    }

    console.log(`[Executor] Executing whitelisted command: ${commandToRun} for ${target.name}`);
    return new Promise((resolve) => {
      exec(commandToRun, (err) => {
        if (err) {
          console.error(`[Executor] Error launching ${target.name}:`, err.message);
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
