import type {HumanBehaviorStyleModel,BehaviorStyle,BehaviorContext} from './behaviorStyle';
import type {HumanProfile} from './types';
import type {SyntheticHumanParameters} from './syntheticProfiles';
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
function parameters(profile:HumanProfile):SyntheticHumanParameters {
  const p=profile.traits.extensions.syntheticHumanParameters as SyntheticHumanParameters|undefined;
  if(!p||['senseOfDirection','spatialAnxiety','spatialMemory','navigationExperience','technologyFamiliarity','vulnerability'].some(k=>{
    const v=p[k as keyof typeof p];return typeof v!=='number'||!Number.isFinite(v)||v<0||v>1;
  }))throw new Error('Synthetic model requires explicit normalized demonstration parameters');
  return p;
}
/** All coefficients below are invented demonstration rules, not effect estimates. */
export const SyntheticHumanBehaviorModel:HumanBehaviorStyleModel={
  metadata:{id:'synthetic-human-behavior',version:'2.2.0-b',layer:'human',evidence:'synthetic',
    description:'Illustrative, replaceable meso-to-macro expression; no latent-state or lostness inference',
    analysis:{domain:'human',analysisLevels:['psychometric-cognitive','behavioral'],humanAnalysisLevels:['meso-psychometric-cognitive','macro-behavior']}},
  behaviorStyle(profile:HumanProfile,context:BehaviorContext):BehaviorStyle {
    const {senseOfDirection:D,spatialAnxiety:A,spatialMemory:M,navigationExperience:E,vulnerability:V}=parameters(profile);
    const walker=context.mobility.kind==='walking'&&context.mobility.assistiveDevice==='walker';
    return {
      speedMultiplier:clamp(1+.1*E-.1*A-.1*V-(walker?.08:0),.8,1.12),
      hesitationIntensity:clamp(.1+.25*(1-D)+.2*A),pauseTendency:clamp(.05+.25*A+.15*V),
      scanIntensity:clamp(.05+.65*A),turnDecisiveness:clamp(.4+.6*D),
      backtrackTendency:clamp(.1+.3*(1-M)),movementConsistency:clamp(.5+.5*E),
      evidenceStatus:'synthetic',provenance:{basis:'model-output',source:'synthetic-human-behavior@2.2.0-b',
        note:'Illustrative architectural demonstration, not validated effect estimates; not lostness, risk or participant behavior.'},
    };
  },
  // Existing HumanModel port: express styles as proposed observable dimensions.
  // Not applied to the Story ledger, latent Human states or Machine estimates.
  evaluateHumanBehavior({system}){
    return system.humans.map(h=>{
      const style=this.behaviorStyle(h.profile,{environmentId:system.environment.id,stage:'research-proposal',mobility:system.mobility[h.profile.id]});
      return {humanId:h.profile.id,behaviors:{kind:'behaviors' as const,observations:[
        {type:'walking-speed' as const,atSeconds:system.time.elapsedSeconds,magnitude:{value:style.speedMultiplier,unit:'illustrative cadence multiplier'},provenance:style.provenance},
        {type:'gaze-scanning' as const,atSeconds:system.time.elapsedSeconds,magnitude:{value:style.scanIntensity,unit:'illustrative intensity'},provenance:style.provenance},
      ]}};
    });
  },
};
