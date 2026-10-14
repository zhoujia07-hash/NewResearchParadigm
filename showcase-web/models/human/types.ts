import type {EvidenceValue, Extensions, Provenance, ResearchLevel} from '../shared';

/** Stable characteristics. No default SoD/anxiety/cognitive scores are invented. */
export interface HumanTraits {
  readonly kind:'traits';
  readonly ageGroup:EvidenceValue<string>;
  readonly senseOfDirection:EvidenceValue<ResearchLevel>;
  readonly spatialMemory:EvidenceValue<number>;
  readonly spatialAnxietyTrait:EvidenceValue<ResearchLevel>;
  readonly cognitiveCapability:EvidenceValue<string>;
  readonly mobilityCapability:EvidenceValue<string>;
  readonly technologyFamiliarity:EvidenceValue<number>;
  readonly navigationExperience:EvidenceValue<string>;
  readonly vulnerability:EvidenceValue<number>;
  readonly extensions:Extensions;
}
/** Latent/internal states: behavioral animation does not measure these. */
export interface HumanStates {
  readonly kind:'states';
  readonly lostness:EvidenceValue<number>;
  readonly navigationUncertainty:EvidenceValue<number>;
  readonly spatialAnxiety:EvidenceValue<number>;
  readonly cognitiveWorkload:EvidenceValue<number>;
  readonly fatigue:EvidenceValue<number>;
  readonly attention:EvidenceValue<number>;
  readonly confidence:EvidenceValue<number>;
  readonly trust:EvidenceValue<number>;
  readonly extensions:Extensions;
}
export type BehaviorType = 'walking'|'stopping'|'walking-speed'|'turning'|'head-turning'|
  'looking-around'|'hesitation'|'backtracking'|'wrong-turn'|'detour'|'body-rotation'|'checking-phone'|'asking-for-help';
/** Observable actions, with provenance distinguishing scripted from measured. */
export interface BehaviorObservation {
  readonly type:BehaviorType;
  readonly atSeconds:number;
  readonly provenance:Provenance;
  readonly magnitude?:{readonly value:number; readonly unit:string};
}
export interface HumanBehaviors {
  readonly kind:'behaviors';
  readonly observations:readonly BehaviorObservation[];
}
export interface HumanProfile {
  readonly id:string;
  readonly label:string;
  readonly traits:HumanTraits;
}
export interface HumanSnapshot {
  readonly profile:HumanProfile;
  readonly states:HumanStates;
  readonly behaviors:HumanBehaviors;
}
export interface HumanBehaviorProposal {readonly humanId:string; readonly behaviors:HumanBehaviors}
export interface HumanStateProposal {readonly humanId:string; readonly states:HumanStates}
