import type {HumanProfile,HumanSnapshot} from './types';
import {unknownHumanStates} from './defaults';
import {specifiedValue,type Provenance} from '../shared';
export interface SyntheticHumanParameters {
  readonly senseOfDirection:number;readonly spatialAnxiety:number;readonly spatialMemory:number;
  readonly navigationExperience:number;readonly technologyFamiliarity:number;readonly vulnerability:number;
}
export const SYNTHETIC_PROFILE_PROVENANCE:Provenance=Object.freeze({basis:'configuration',source:'V2.2-B synthetic demonstration values',
  note:'Synthetic, illustrative, replaceable; not participant measurements or psychometric scores.'});
export interface SyntheticHumanProfile extends HumanProfile {
  readonly evidenceStatus:'synthetic';readonly parameters:SyntheticHumanParameters;
}
// Explicit invented fixtures, not age/mobility-derived estimates or participant data.
const rows=[
  ['R01',.90,.15,.82,.90,.78,.20],['R02',.65,.20,.92,.75,.84,.25],
  ['R03',.85,.45,.70,.55,.70,.30],['R04',.35,.50,.55,.50,.60,.35],
  ['R05',.55,.80,.35,.45,.65,.40],['R06',.30,.75,.55,.50,.40,.90],
  ['R07',.88,.12,.75,.25,.90,.20],['R08',.60,.45,.60,.55,.72,.30],
] as const;
export const SYNTHETIC_PROFILES:readonly SyntheticHumanProfile[]=Object.freeze(rows.map(([id,senseOfDirection,spatialAnxiety,spatialMemory,navigationExperience,technologyFamiliarity,vulnerability])=>{
  const parameters=Object.freeze({senseOfDirection,spatialAnxiety,spatialMemory,navigationExperience,technologyFamiliarity,vulnerability});
  const value=(v:number)=>Object.freeze(specifiedValue(v,SYNTHETIC_PROFILE_PROVENANCE,'normalized illustrative [0,1]'));
  const label=(v:string)=>Object.freeze(specifiedValue(v,SYNTHETIC_PROFILE_PROVENANCE));
  return Object.freeze({id,label:id,evidenceStatus:'synthetic' as const,parameters,traits:Object.freeze({kind:'traits' as const,
    ageGroup:label(id==='R06'?'Older adult':'Adult'),mobilityCapability:label(id==='R06'?'Walker':'Walking'),
    senseOfDirection:value(senseOfDirection),spatialAnxietyTrait:value(spatialAnxiety),spatialMemory:value(spatialMemory),
    navigationExperience:label(navigationExperience<.4?'Less experienced':navigationExperience>=.7?'More experienced':'Moderate experience'),
    technologyFamiliarity:value(technologyFamiliarity),vulnerability:value(vulnerability),
    cognitiveCapability:Object.freeze({kind:'unknown' as const,reason:'No synthetic cognitive-capability model'}),
    extensions:Object.freeze({syntheticHumanParameters:parameters})})});
}));
export function syntheticProfile(id:string):SyntheticHumanProfile {
  const profile=SYNTHETIC_PROFILES.find(p=>p.id===id);if(!profile)throw new Error('Unknown synthetic resident: '+id);return profile;
}
/** Opt-in research snapshot; never changes the legacy Story or official diagnostics. */
export function syntheticHuman(id:string):HumanSnapshot {
  return {profile:syntheticProfile(id),states:unknownHumanStates(),behaviors:{kind:'behaviors',observations:[]}};
}
