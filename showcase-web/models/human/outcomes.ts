import type {EvidenceValue} from '../shared';
import type {EpisodeWindow} from '../navigation/scales';
export const NAVIGATION_OUTCOMES=['destination-accuracy','pointing-accuracy','route-efficiency','travel-time','path-length',
  'navigation-error','memory-accuracy','cognitive-map-fidelity','safety','intervention-requirement','subjective-experience'] as const;
export type NavigationOutcomeType=typeof NAVIGATION_OUTCOMES[number];
export interface NavigationOutcome {
  readonly kind:'navigation-outcome';readonly id:string;readonly humanId:string;readonly type:NavigationOutcomeType;
  readonly window:EpisodeWindow;readonly factorId:string;readonly value:EvidenceValue<number|string|boolean>;readonly unit?:string;
}
