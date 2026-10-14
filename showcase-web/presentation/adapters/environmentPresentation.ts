import {blocked,frozen} from '../../lib/story';
import type {LegacyShowcaseSnapshot} from '../../compatibility/legacyStoryAdapter';
/** Both renderers retain the exact same authoritative Story object. */
export function presentEnvironment(snapshot:LegacyShowcaseSnapshot){
  return {story:snapshot.sourceStory,environment:snapshot.system.environment,
    blocked:blocked(snapshot.sourceStory),frozen:frozen(snapshot.sourceStory)};
}
