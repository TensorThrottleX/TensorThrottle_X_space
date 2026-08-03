// Module metadata for the Activity Center.
//
// The center renders ANY module id — known ids get curated metadata
// (display name, icon key, accent), unknown ids fall back to a generic
// presentation. New modules therefore never require edits here.

export interface ActivityModuleMeta {
  name: string
  iconKey: string
  accent: string
}

const MODULE_META: Record<string, ActivityModuleMeta> = {
  feed: { name: 'Feed', iconKey: 'feed', accent: '#f59e0b' },
  thoughts: { name: 'Thought', iconKey: 'thoughts', accent: '#f59e0b' },
  projects: { name: 'Project', iconKey: 'projects', accent: '#a78bfa' },
  experiments: { name: 'Experiment', iconKey: 'experiments', accent: '#34d399' },
  manifold: { name: 'Manifold', iconKey: 'manifold', accent: '#22d3ee' },
  'anime-universe': { name: 'Anime Universe', iconKey: 'anime-universe', accent: '#fb7185' },
  'music-nebula': { name: 'Music Nebula', iconKey: 'music-nebula', accent: '#c084fc' },
  universe: { name: 'Universe', iconKey: 'universe', accent: '#60a5fa' },
}

const FALLBACK: ActivityModuleMeta = { name: 'Update', iconKey: 'generic', accent: '#94a3b8' }

export function getModuleMeta(moduleId: string): ActivityModuleMeta {
  return MODULE_META[moduleId] ?? { ...FALLBACK, name: prettifyModuleId(moduleId) }
}

function prettifyModuleId(moduleId: string): string {
  return moduleId
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatAction(action: string): string {
  switch (action) {
    case 'published':
      return 'Published'
    case 'updated':
      return 'Updated'
    case 'added':
      return 'Added'
    case 'expanded':
      return 'Expanded'
    default:
      return action.charAt(0).toUpperCase() + action.slice(1)
  }
}
