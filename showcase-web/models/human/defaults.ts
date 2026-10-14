import {unknownValue} from '../shared';
import type {HumanSnapshot,HumanStates} from './types';
/** Structural factories only: absence is preserved, not a population model. */
export function unknownHumanStates():HumanStates {
  return {kind:'states',lostness:unknownValue(),navigationUncertainty:unknownValue(),spatialAnxiety:unknownValue(),
    cognitiveWorkload:unknownValue(),fatigue:unknownValue(),attention:unknownValue(),confidence:unknownValue(),trust:unknownValue(),extensions:{}};
}
export function unspecifiedHuman(id:string,label=id):HumanSnapshot {
  return {profile:{id,label,traits:{kind:'traits',ageGroup:unknownValue(),senseOfDirection:unknownValue(),
    spatialMemory:unknownValue(),spatialAnxietyTrait:unknownValue(),cognitiveCapability:unknownValue(),
    mobilityCapability:unknownValue(),technologyFamiliarity:unknownValue(),navigationExperience:unknownValue(),
    vulnerability:unknownValue(),extensions:{}}},states:unknownHumanStates(),behaviors:{kind:'behaviors',observations:[]}};
}
