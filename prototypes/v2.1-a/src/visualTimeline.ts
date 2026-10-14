/** V2.1-A visual choreography only. No scientific story, triage or intervention import. */
export type Vec3=[number,number,number];
export type CameraMode='overview'|'follow';
export type Style='modern'|'medical-center'|'care';
export const DURATION=48;
export const LOCATIONS={Entrance:[0,0,9],'North Atrium':[0,0,-7],'Junction A':[-5,0,0],
 'Junction B':[5,0,0],'West Corridor':[-12,0,0],'East Corridor':[12,0,0],
 'West Exit':[-19,0,0],'East Exit':[19,0,0],'Refuge Point':[5,0,8]} satisfies Record<string,Vec3>;
export type Place=keyof typeof LOCATIONS;
export const CONNECTIONS:[Place,Place][]=[['Entrance','Junction A'],['Junction A','Junction B'],
 ['Junction A','North Atrium'],['North Atrium','Junction B'],['Junction A','West Corridor'],
 ['West Corridor','West Exit'],['Junction B','East Corridor'],['East Corridor','East Exit'],
 ['Junction B','Refuge Point']];
export const STAGES=[
 {letter:'A',start:0,end:8,title:'A shared journey',caption:'Eight persistent residents move through a hospital-like interior.',color:'green'},
 {letter:'B',start:8,end:16,title:'A decision point',caption:'R06 approaches Junction B and the East corridor, supported by a walker.',color:'green'},
 {letter:'C',start:16,end:24,title:'Uncertainty emerges',caption:'R06 slows, pauses and looks around. The status ring turns amber.',color:'amber'},
 {letter:'D',start:24,end:34,title:'A route reconsidered',caption:'Two scripted backtracks make the difficulty spatially visible.',color:'amber'},
 {letter:'E',start:34,end:40,title:'East Exit unavailable',caption:'A barricade closes the East Exit. West Exit remains accessible.',color:'amber'},
 {letter:'F',start:40,end:48,title:'The long-tail moment',caption:'R06 stops with a red status ring. This is where a later system would consider intervention.',color:'red'},
] as const;
export const RESIDENTS=Array.from({length:8},(_,i)=>({id:`R${String(i+1).padStart(2,'0')}`,
 role:i===5?'Older adult':'Adult occupant',mobility:i===5?'Walker / mobility aid':'Walking',
 outfit:['#617c91','#998876','#6f8d87','#8a7997','#8b9d79','#a58f78','#7e8eac','#a57968'][i],
 skin:['#d1a584','#aa775c','#dbb397','#b88d74','#d3ae91','#d4b09b','#b2876b','#ddba9d'][i]}));
export const PALETTES:Record<Style,{name:string;floor:string;room:string;accent:string;wood:string;wall:string;backdrop:string}>={
 modern:{name:'A · Modern hospital',floor:'#e8ece9',room:'#dce9e8',accent:'#3b7d88',wood:'#ad896a',wall:'#f6f5ee',backdrop:'#e5eeeb'},
 'medical-center':{name:'B · Medical center',floor:'#e6e4df',room:'#e2e3ed',accent:'#697fa0',wood:'#917558',wall:'#f2f0e8',backdrop:'#e9e8e5'},
 care:{name:'C · Care facility',floor:'#ece8de',room:'#e6ecdc',accent:'#6e947a',wood:'#bb976e',wall:'#faf4e7',backdrop:'#eeebe3'},
};
export const STATUS={green:'#2a8b66',amber:'#df9a2e',red:'#d64453'};
export function stageAt(time:number){return STAGES.find(s=>time<s.end)??STAGES[5];}
const KEYS:[number,Vec3][]=[[0,LOCATIONS.Entrance],[8,LOCATIONS['Junction A']],[14,LOCATIONS['Junction B']],
 [16,[9,0,0]],[17,[10,0,0]],[19,[10,0,0]],[21,[11,0,0]],[24,[11,0,0]],
 [28,[7,0,0]],[30,[10,0,0]],[31,[10,0,0]],[34,LOCATIONS['Junction B']],[37,[7,0,0]],[48,[7,0,0]]];
function r06(time:number):Vec3{
 for(let i=1;i<KEYS.length;i++){const [end,b]=KEYS[i],[start,a]=KEYS[i-1];
  if(time<=end){const p=Math.max(0,(time-start)/(end-start));return a.map((v,j)=>v+(b[j]-v)*p) as Vec3;}}
 return [...KEYS.at(-1)![1]];
}
const ADULT_PATHS:Place[][]=[
 ['Entrance','Junction A','West Corridor','West Exit','West Corridor','Junction A','Entrance'],
 ['Entrance','Junction A','North Atrium','Junction B','East Corridor','Junction B','Junction A','Entrance'],
 ['Entrance','Junction A','Junction B','Refuge Point','Junction B','Junction A','Entrance'],
 ['Entrance','Junction A','West Corridor','Junction A','North Atrium','Junction A','Entrance'],
 ['Entrance','Junction A','Junction B','East Corridor','Junction B','North Atrium','Junction A','Entrance'],
 [],['Entrance','Junction A','North Atrium','Junction B','Junction A','Entrance'],
 ['Entrance','Junction A','Junction B','Refuge Point','Junction B','North Atrium','Junction A','Entrance']];
function adult(time:number,index:number):Vec3{
 const path=ADULT_PATHS[index].map(p=>LOCATIONS[p]);
 const segments=path.slice(1).map((b,i)=>Math.hypot(b[0]-path[i][0],b[2]-path[i][2]));
 const length=segments.reduce((a,b)=>a+b,0);let travel=(time*(1.4+index*.04)+index*4.4)%length;
 for(let i=0;i<segments.length;i++){if(travel<=segments[i]){
  const a=path[i],b=path[i+1],p=travel/segments[i],lane=(index%3-1)*.48;
  return [a[0]+(b[0]-a[0])*p,0,a[2]+(b[2]-a[2])*p+lane];}travel-=segments[i];}
 return [...path[0]];
}
export function samplePose(time:number,index:number,reduced=false){
 const clock=Math.max(0,Math.min(DURATION,time));
 const sample=reduced?Math.floor(clock*2)/2:clock;
 const p=index===5?r06(sample):adult(sample,index);
 const next=index===5?r06(Math.min(48,clock+.08)):adult(clock+.08,index);
 const previous=index===5?r06(Math.max(0,clock-.08)):adult(Math.max(0,clock-.08),index);
 const dx=next[0]-previous[0],dz=next[2]-previous[2];
 const walking=Math.hypot(dx,dz)>.015&&clock<48;
 const looking=index===5&&!walking&&clock>=16&&clock<34&&!reduced?Math.sin(clock*1.1)*.33:0;
 return {position:p,heading:Math.atan2(dx,dz),walking,looking,phase:clock*(index===5?5:7.2)+index};
}
export function visualState(time:number,index:number){return index===5?stageAt(time).color:'green';}
