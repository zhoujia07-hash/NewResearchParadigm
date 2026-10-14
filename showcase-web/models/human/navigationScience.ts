import type {EvidenceValue} from '../shared';
import type {LongitudinalWindow,EpisodeWindow} from '../navigation/scales';
export interface DistalDeterminants {
  readonly kind:'distal-determinants';readonly temporalScope:LongitudinalWindow;
  readonly genetics:EvidenceValue<string>;readonly ageing:EvidenceValue<string>;
  /** Canonical environmental/cultural/social/developmental records live in history. */
  readonly environmentalExposureHistoryIds:readonly string[];
  readonly culturalExposureHistoryIds:readonly string[];readonly socialExposureHistoryIds:readonly string[];
  readonly developmentalNavigationExposure:EvidenceValue<string>;readonly upbringing:EvidenceValue<'urban'|'suburban'|'rural'|'mixed'>;
  readonly longTermNavigationExperience:EvidenceValue<string>;
}
export interface LifestyleExposure {
  readonly kind:'lifestyle-exposure';readonly temporalScope:LongitudinalWindow;
  readonly sleep:EvidenceValue<string>;readonly exercise:EvidenceValue<string>;
  readonly currentEnvironmentExposureIds:readonly string[];readonly technologyExposureHistoryIds:readonly string[];
  readonly navigationFrequency:EvidenceValue<number>;readonly currentMobilityHabits:EvidenceValue<string>;
}
export interface PersonalAttributes {
  readonly ageGroup:EvidenceValue<string>;readonly physicalCapability:EvidenceValue<string>;readonly mobilityCapability:EvidenceValue<string>;
  readonly sensoryCapability:EvidenceValue<string>;readonly cognitiveCapability:EvidenceValue<string>;
  readonly socialAttributes:EvidenceValue<string>;readonly vulnerability:EvidenceValue<number>;
}
export interface NavigationSpecificTraits {
  readonly senseOfDirection:EvidenceValue<number|string>;readonly spatialMemoryAbility:EvidenceValue<number>;
  readonly spatialAnxietyTrait:EvidenceValue<number|string>;readonly navigationExperience:EvidenceValue<string>;
  readonly technologyFamiliarity:EvidenceValue<number>;
}
/** Optional scientific taxonomy; flat HumanTraits remain a legacy compatibility view. */
export interface HumanDeterminants {
  readonly kind:'human-determinants';readonly distal:DistalDeterminants;readonly lifestyle:LifestyleExposure;
  readonly personal:PersonalAttributes;readonly navigationTraits:NavigationSpecificTraits;
}
export const NAVIGATION_STRATEGIES=['path-integration','landmark-based','geometry-based','route-based','map-survey'] as const;
export type NavigationStrategy=typeof NAVIGATION_STRATEGIES[number];
/** Context-dependent, potentially mixed, never one permanent strategy per person. */
export interface NavigationRepresentations {
  readonly kind:'representations-strategies';readonly humanId:string;readonly taskId:string;readonly environmentId:string;
  readonly window:EpisodeWindow;readonly placeKnowledge:EvidenceValue<string>;readonly routeKnowledge:EvidenceValue<string>;
  readonly surveyKnowledge:EvidenceValue<string>;readonly egocentricRepresentation:EvidenceValue<string>;
  readonly allocentricRepresentation:EvidenceValue<string>;readonly strategies:readonly {readonly strategy:NavigationStrategy;readonly engagement:EvidenceValue<string>}[];
}
