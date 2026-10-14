import type {BehaviorStyle} from '../human/behaviorStyle';
import type {SyntheticHumanProfile} from '../human/syntheticProfiles';
/** Synthetic H×E presentation assumptions, not empirical effects, risk or lostness. */
export function syntheticEnvironmentResponse(base:BehaviorStyle,human:SyntheticHumanProfile,demand:number){
 if(!Number.isFinite(demand)||demand<0||demand>1)throw new Error('Demand must be a synthetic [0,1] input');
 const D=human.parameters.senseOfDirection,A=human.parameters.spatialAnxiety;
 const susceptibility=.5+.5*(1-D);
 const speed=2*base.speedMultiplier*(1-.35*demand*susceptibility);
 const hesitation=Math.min(1,base.hesitationIntensity+.4*demand*(1-D));
 return {speed,hesitation,scanning:Math.min(1,base.scanIntensity+.5*demand*(.5+.5*A)),
  turnDecisiveness:Math.max(.2,base.turnDecisiveness-.25*demand*(1-D)),
  pauseSeconds:.8*hesitation*demand,evidenceStatus:'synthetic' as const,
  provenance:{basis:'model-output' as const,source:'synthetic-environment-response@2.2.0-c',note:'Illustrative H×E expression only; not validated effects or a lostness inference.'}};
}
