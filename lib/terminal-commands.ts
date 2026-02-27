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

export const HELP_TEXT = `[SYSTEM_MANUAL]
AVAILABLE EXECUTABLES AND DIRECTIVES:

Navigation:
  open feed           Load real-time thought stream
  open projects       View deployed engineering architectures
  open thoughts       Read structured philosophy
  open experiments    Access volatile test modules
  open manifold       Enter the intersection node
  open about          Load core identity and context

Network:
  twitter             Establish connection to X
  github              Access code repository
  email               Initiate direct comms protocol

Utility:
  system              Print kernel status and modules
  mode bright         Force high-clarity render mode
  mode dark           Force deep-focus render mode
  mode normal         Revert to standard cinematic render
  explain             Display operational system motives
  clear               Flush terminal history buffer
  home                Minimize the secure shell`;
