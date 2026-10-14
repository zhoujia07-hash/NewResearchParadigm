import type {HumanModel} from './humanModel';
import type {HumanProfile} from './types';
import type {MobilityMode} from '../mobility/types';
import type {Provenance} from '../shared';
export interface BehaviorStyle {
  readonly speedMultiplier:number;readonly hesitationIntensity:number;readonly pauseTendency:number;
  readonly scanIntensity:number;readonly turnDecisiveness:number;readonly backtrackTendency:number;
  readonly movementConsistency:number;
  readonly evidenceStatus:'synthetic'|'empirical'|'prototype';readonly provenance:Provenance;
}
export interface BehaviorContext {
  readonly environmentId:string;readonly stage:string;readonly mobility:MobilityMode;
}
/** Replace this injected Human port; renderers consume only BehaviorStyle. */
export interface HumanBehaviorStyleModel extends HumanModel {
  behaviorStyle(profile:HumanProfile,context:BehaviorContext):BehaviorStyle;
}
export type IllustrativeStyleLabel='Direct navigator'|'Cautious navigator'|'High-scanning navigator';
export function illustrativeStyleLabel(style:BehaviorStyle):IllustrativeStyleLabel {
  return style.scanIntensity>=.45?'High-scanning navigator':style.turnDecisiveness<.75?'Cautious navigator':'Direct navigator';
}
