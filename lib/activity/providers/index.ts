import { registerActivityProvider } from '../registry'
import { postsActivityProvider } from './posts'
import { animeActivityProvider } from './anime'

registerActivityProvider(postsActivityProvider)
registerActivityProvider(animeActivityProvider)
