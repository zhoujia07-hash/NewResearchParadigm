/** Browser-only transcription of demo.py / triage.py defaults. No backend or persistence.
 * Thresholds are prototype assumptions. Changes must retain Python parity tests.
 */
export type Choice = 'A' | 'B' | 'C';
export type Stage = 'idle' | 'intro' | 'normal' | 'emerging' | 'crisis' | 'human' | 'recovery' | 'result';
export interface Factors {
  navigationConfidence: number; sensorAgreement: number; modelDisagreement: number;
  behaviorAnomaly: number; safetyRisk: number; vulnerability: number;
}
export const BASE: Factors = { navigationConfidence: .95, sensorAgreement: .94,
  modelDisagreement: .06, behaviorAnomaly: .04, safetyRisk: .05, vulnerability: .2 };
export const CRISIS: Factors = { navigationConfidence: .39, sensorAgreement: .22,
  modelDisagreement: .88, behaviorAnomaly: .92, safetyRisk: .96, vulnerability: .9 };
export function assess(f: Factors) {
  if (Object.values(f).some(v => !Number.isFinite(v) || v < 0 || v > 1)) throw Error('Factors must be in [0,1]');
  const score = .18 * (1-f.navigationConfidence) + .18 * (1-f.sensorAgreement)
    + .18*f.modelDisagreement + .18*f.behaviorAnomaly + .22*f.safetyRisk + .06*f.vulnerability;
  const rules = [score >= .62, f.safetyRisk >= .85,
    f.modelDisagreement >= .75 && f.sensorAgreement <= .45, f.behaviorAnomaly >= .80];
  return { score, escalated: rules.some(Boolean), rules };
}
export const CHOICES: Record<Choice, string> = {
  A: 'Reroute to West Exit', B: 'Continue to East Exit', C: 'Refuge Point + staff',
};
export const OUTCOMES: Record<Choice, string> = {
  A: 'SAFE: R06 reached the clear, accessible West Exit.',
  B: 'UNSAFE: R06 remains at the blocked East Exit approach.',
  C: 'PENDING: R06 is at the refuge point; staff assistance requested; evacuation unconfirmed.',
};
export const NODES = {
  'Entrance': [380, 340], 'North Atrium': [380, 80], 'Junction A': [240, 200],
  'Junction B': [520, 200], 'West Corridor': [135, 200], 'West Exit': [40, 200],
  'East Corridor': [650, 200], 'East Exit': [755, 200], 'Refuge Point': [520, 340],
} as const;
export type Place = keyof typeof NODES;
export const EDGES: [Place, Place][] = [
  ['Entrance','Junction A'], ['Entrance','Junction B'], ['Junction A','North Atrium'],
  ['Junction B','North Atrium'], ['Junction A','Junction B'], ['Junction A','West Corridor'],
  ['West Corridor','West Exit'], ['Junction B','East Corridor'], ['East Corridor','East Exit'],
  ['Junction B','Refuge Point'],
];
const PATHS: Place[][] = [
  ['Entrance','Junction A','North Atrium','Junction B','Entrance'],
  ['West Corridor','Junction A','North Atrium','Junction A','West Corridor'],
  ['North Atrium','Junction A','Entrance','Junction B','North Atrium'],
  ['Entrance','Junction B','North Atrium','Junction A','Entrance'],
  ['North Atrium','Junction B','East Corridor','Junction B','North Atrium'],
  ['Entrance','Junction B','East Corridor','Junction B','Entrance'],
  ['Junction A','North Atrium','Junction B','Entrance','Junction A'],
  ['Junction B','Refuge Point','Junction B','North Atrium','Junction B'],
];
export const RESIDENTS = PATHS.map((route, i) => ({ id: `R${String(i+1).padStart(2,'0')}`,
  age: i===5 ? 'Older adult' : 'Adult', mobility: i===5 ? 'Walker' : 'Walking', route }));
export interface Observation { round: number; id: string; score: number; escalated: boolean }
export interface Story {
  stage: Stage; elapsed: number; paused: boolean; complete: boolean; choice: Choice | null;
  confidence: number | null; round: number; total: number; automatic: number;
  escalations: number; observations: Observation[];
}
export function initialStory(): Story {
  return { stage:'idle',elapsed:0,paused:false,complete:false,choice:null,confidence:null,
    round:0,total:0,automatic:0,escalations:0,observations:[] };
}
function through(s: Story, target: number): Story {
  while(s.round < target) {
    const round = s.round+1;
    const observations = RESIDENTS.map((r,i) => {
      const f = i===5 && round>=3 && s.choice!=='A' ? CRISIS : {...BASE,vulnerability:i===5?.9:.2};
      const a=assess(f);
      return {round,id:r.id,score:a.score,escalated:a.escalated};
    });
    const incident = observations.some(o=>o.escalated) && s.choice===null;
    s={...s,round,total:s.total+8,automatic:s.automatic+(incident?0:8),
      escalations:s.escalations+(incident?1:0),observations:[...s.observations,...observations]};
    if(incident) break;
  }
  return s;
}
export function startStory(): Story { return through({...initialStory(),stage:'intro'},1); }
export function tick(s: Story, seconds: number): Story {
  if(!Number.isFinite(seconds)||seconds<0) throw Error('Nonnegative finite elapsed time required');
  if(s.stage==='idle'||s.stage==='human'||s.paused||s.complete) return s;
  let elapsed=s.elapsed+seconds;
  if(!s.choice) {
    elapsed=Math.min(elapsed,35);
    if(elapsed>=6)s=through(s,2);
    if(elapsed>=25)s=through(s,3);
    const stage:Stage=elapsed>=35?'human':elapsed>=25?'crisis':elapsed>=12?'emerging':elapsed>=3?'normal':'intro';
    return {...s,elapsed,stage};
  }
  if(elapsed>=40)s=through(s,4);
  if(elapsed>=45)s=through(s,5);
  return {...s,elapsed:Math.min(elapsed,55),stage:elapsed>=45?'result':'recovery',complete:elapsed>=55};
}
export function skipStory(): Story { return tick(startStory(),35); }
export function submit(s:Story,choice:Choice,confidence:number):Story {
  if(s.stage!=='human'||!['A','B','C'].includes(choice)||!Number.isInteger(confidence)||confidence<0||confidence>100)
    throw Error('A pending takeover, A/B/C choice and integer confidence 0–100 are required');
  return {...s,choice,confidence,stage:'recovery',paused:false,automatic:s.automatic+7};
}
export const blocked=(s:Story)=>['crisis','human','recovery','result'].includes(s.stage);
export const frozen=(s:Story)=>s.paused||['idle','intro','crisis','human','result'].includes(s.stage);
export function factors(s: Story): Factors {
  if(s.choice==='A') return {...BASE,vulnerability:.9};
  if(blocked(s)) return {...CRISIS};
  if(s.stage!=='emerging') return {...BASE,vulnerability:.9};
  const p=Math.min(1,Math.max(0,(s.elapsed-12)/13))*2;
  const frames=[ [.88,.90,.10,.12,.14], [.72,.68,.30,.38,.25], [.55,.45,.58,.61,.35] ];
  const k=Math.min(1,Math.floor(p)),t=p-k;
  const v=frames[k].map((a,i)=>a+(frames[k+1][i]-a)*t);
  return {navigationConfidence:v[0],sensorAgreement:v[1],modelDisagreement:v[2],behaviorAnomaly:v[3],safetyRisk:v[4],vulnerability:.9};
}
export function routeFor(s:Story):Place[] {
  return s.choice==='A'?['Junction B','Junction A','West Corridor','West Exit']
    :s.choice==='C'?['Junction B','Refuge Point']:['Junction B','East Corridor','East Exit'];
}
function interpolate(path: Place[],progress:number):[number,number] {
  const step=Math.min(path.length-2,Math.floor(progress)),p=Math.min(1,progress-step);
  const a=NODES[path[step]],b=NODES[path[step+1]];
  return [a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p];
}
export function position(s:Story,index:number,reduced=false):[number,number] {
  if(index===5 && blocked(s)) {
    if(!s.choice) return [...NODES['Junction B']];
    const path=s.choice==='B'?['Junction B','East Corridor'] as Place[]:routeFor(s);
    let p=Math.min(1,Math.max(0,(s.elapsed-35)/10))*(path.length-1);
    if(reduced)p=Math.floor(p);
    return interpolate(path,p);
  }
  const time=s.stage==='idle'||s.stage==='intro'?0:s.stage==='crisis'||s.stage==='human'?25:Math.min(s.elapsed,45);
  const path=RESIDENTS[index].route;
  let p=time/3+index*.4;
  if(reduced)p=Math.floor(p);
  return interpolate(path,p%(path.length-1));
}
export function residentState(s:Story,index:number) {
  if(index!==5)return 'HEAD / AUTO';
  if(s.choice==='A')return s.stage==='result'?'Resolved · West Exit':'Rerouted · West Exit';
  if(s.choice==='B')return 'Unsafe · blocked approach';
  if(s.choice==='C')return 'Refuge · awaiting staff';
  return s.stage==='emerging'?'Uncertainty rising':blocked(s)?'Long-tail / human takeover':'HEAD / AUTO';
}
export function residentColor(s:Story,index:number) {
  if(index!==5)return 'green';
  if(s.choice==='B'||(!s.choice&&blocked(s)))return 'red';
  return s.stage==='emerging'||s.choice==='C'?'amber':'green';
}
export function currentPlace(s:Story,index:number):Place {
  const p=position(s,index);
  return (Object.keys(NODES) as Place[]).reduce((best,n)=>{
    const d=(q:Place)=>(NODES[q][0]-p[0])**2+(NODES[q][1]-p[1])**2;
    return d(n)<d(best)?n:best;
  },'Entrance');
}
