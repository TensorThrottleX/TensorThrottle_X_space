// Provider registration — importing this module (once) publishes every
// built-in activity provider into the registry. Future modules (Documentation,
// Showcase, AI summaries, ...) publish by calling registerActivityProvider
// from their own code; the Activity Center is never modified.

import { registerActivityProvider } from '../registry'
import { postsActivityProvider } from './posts'
import { animeActivityProvider } from './anime'
import { musicActivityProvider } from './music'
import { universeActivityProvider } from './universe'

registerActivityProvider(postsActivityProvider)
registerActivityProvider(animeActivityProvider)
registerActivityProvider(musicActivityProvider)
registerActivityProvider(universeActivityProvider)
