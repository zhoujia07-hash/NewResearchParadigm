import type {EvidenceValue} from '../shared';
import type {EpisodeWindow,LongitudinalWindow} from '../navigation/scales';
export const NAVIGATION_OUTCOMES=['destination-accuracy','pointing-accuracy','route-efficiency','travel-time','path-length',
  'navigation-error','memory-accuracy','cognitive-map-fidelity','safety','intervention-requirement','subjective-experience'] as const;
export type NavigationOutcomeType=typeof NAVIGATION_OUTCOMES[number];
export interface NavigationOutcome {
  readonly kind:'navigation-outcome';readonly id:string;readonly humanId:string;readonly type:NavigationOutcomeType;
  readonly window:EpisodeWindow;readonly factorId:string;readonly value:EvidenceValue<number|string|boolean>;readonly unit?:string;
}

/** Separate horizons; technology assistance has no assumed learning effect direction. */
export type ResearchNavigationOutcome=
  | {readonly kind:'research-outcome';readonly horizon:'immediate';readonly type:'destination-accuracy'|'navigation-time'|'path-length'|'efficiency'|'safety'|'workload';readonly window:EpisodeWindow;readonly value:EvidenceValue<number|string>}
  | {readonly kind:'research-outcome';readonly horizon:'longer-term';readonly type:'spatial-learning'|'cognitive-map-formation'|'skill-retention'|'technology-dependence'|'recovery-after-technology-failure';readonly window:LongitudinalWindow;readonly value:EvidenceValue<number|string>};
