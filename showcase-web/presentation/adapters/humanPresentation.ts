import {RESIDENTS,currentPlace,residentColor,residentState,routeFor,blocked,type Place} from '../../lib/story';
import type {LegacyShowcaseSnapshot} from '../../compatibility/legacyStoryAdapter';
import type {EvidenceValue} from '../../models/shared';
const ROWS=[['Navigation confidence','navigationConfidence'],['Sensor agreement','sensorAgreement'],
  ['Model disagreement','modelDisagreement'],['Behavior anomaly','behaviorAnomaly'],['Safety risk','safetyRisk']] as const;
const text=(v:EvidenceValue<string>)=>v.kind==='value'?v.value:'Unspecified';
export interface HumanPresentation {
  readonly id:string;readonly age:string;readonly mobility:string;readonly vulnerabilityLabel:string;
  readonly color:'green'|'amber'|'red';readonly status:string;readonly location:string;readonly route:string;
  readonly factors:readonly {readonly label:string;readonly key:string;readonly value:number}[];
  readonly triageScore:string|null;
}
export function presentHuman(snapshot:LegacyShowcaseSnapshot,index:number,location?:Place):HumanPresentation {
  const human=snapshot.system.humans[index];if(!human)throw new Error('Unknown resident index');
  const story=snapshot.sourceStory,diagnostic=snapshot.system.machine.detection.diagnostics[human.profile.id];
  const legacyRoute=index===5&&story.choice?routeFor(story):index===5&&blocked(story)?['Junction B','East Corridor','East Exit']:
    // Preserve V1 route labels at the explicit compatibility boundary.
    legacyRoutes[index];
  return {id:human.profile.id,age:text(human.profile.traits.ageGroup),mobility:text(human.profile.traits.mobilityCapability),
    vulnerabilityLabel:index===5?'Higher vulnerability':'Typical vulnerability',color:residentColor(story,index),status:residentState(story,index),
    location:location??currentPlace(story,index),route:legacyRoute.join(' →'),
    factors:ROWS.map(([label,key])=>({label,key,value:diagnostic.inputs[key]})),
    triageScore:index===5&&blocked(story)&&!story.choice?diagnostic.score.toFixed(4):null};
}
const legacyRoutes=RESIDENTS.map(r=>r.route);
