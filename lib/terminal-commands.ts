/**
 * TERMINAL_COMMAND_ENGINE
 * Centralized logic for system shell commands.
 */

export interface CommandDefinition {
    id: string;
    description: string;
    execute: (args: string[]) => string | { response: string, action?: string, payload?: any };
}

export const NAV_COMMANDS: Record<string, string> = {
    'about': '/about',
    'work': '/category/projects',
    'interests': '/category/thoughts',
    'connect': 'mailto:tensorthrottleX@proton.me',
    'feed': '/feed',
    'thoughts': '/category/thoughts',
    'projects': '/category/projects',
    'experiments': '/category/experiments',
    'manifold': '/category/manifold',
    'twitter': 'https://x.com/TensorThrottleX',
    'x': 'https://x.com/TensorThrottleX',
    'github': 'https://github.com/TensorThrottleX',
    'gh': 'https://github.com/TensorThrottleX',
    'email': 'mailto:tensorthrottleX@proton.me'
};

export const SYSTEM_MOTIVES = `System Motives:

1. FEED
   To capture raw, transient ideas in real-time.

2. PROJECTS
   Tangible proof of engineering and execution.

3. THOUGHTS
   Structured analysis and long-form philosophy.

4. EXPERIMENTS
   Volatile prototypes and unstable code.

5. MANIFOLD
   The intersection of AI, systems, and design.

6. ABOUT
   Core identity and operator context.`;

export const HELP_TEXT = `Available Commands:

Navigation:
  open [target]   (e.g., open feed, open about)
  
Social:
  twitter, github, email

System:
  home            Minimize terminal
  explain         View system motives
  system          Check system status
  mode [type]     Change render (normal|bright|dark)
  clear           Flush console history`;
