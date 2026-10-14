import type {EvidenceValue} from '../shared';
import type {LongitudinalWindow,SpatialScope,EpisodeWindow} from './scales';
import type {BehaviorObservation} from '../human/types';
import type {NavigationOutcome} from '../human/outcomes';
export interface EnvironmentalExposure {
  readonly kind:'historical-environmental-exposure';readonly id:string;readonly humanId:string;
  readonly window:LongitudinalWindow;readonly scope:SpatialScope;
  readonly type:'physical'|'cultural'|'social'|'developmental'|'upbringing'|'street-network'|'environmental-diversity';
  readonly description:EvidenceValue<string>;readonly factorIds:readonly string[];
}
export interface TechnologyExposure {
  readonly kind:'technology-exposure';readonly id:string;readonly humanId:string;readonly window:LongitudinalWindow;
  readonly navigationAid:EvidenceValue<string>;readonly useFrequency:EvidenceValue<number>;
  readonly engagement:EvidenceValue<'active'|'passive'|'mixed'>;readonly factorIds:readonly string[];
}
export interface NavigationEpisode {
  readonly kind:'navigation-episode';readonly id:string;readonly humanId:string;readonly taskId:string;readonly environmentId:string;
  readonly window:EpisodeWindow;readonly behaviors:readonly BehaviorObservation[];readonly outcomes:readonly NavigationOutcome[];
}
/** Separate temporal stores; no lifetime exposure is smuggled into Environment_t. */
export interface NavigationHistory {
  readonly episodes:readonly NavigationEpisode[];
  readonly longitudinal:{readonly environmentalExposures:readonly EnvironmentalExposure[];readonly technologyExposures:readonly TechnologyExposure[];
    readonly learningAndMemory:readonly {readonly humanId:string;readonly window:LongitudinalWindow;readonly evidence:EvidenceValue<string>}[]};
}
