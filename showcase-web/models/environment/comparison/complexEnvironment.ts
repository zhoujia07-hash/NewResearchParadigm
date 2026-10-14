import type {RouteNetwork} from './types';
/** Deterministic 3 × 7 corridor grid with nine branching nodes and route alternatives. */
const rows=['T','M','B'] as const;
export const complexEnvironment:RouteNetwork={
 id:'complex',label:'Complex environment',evidenceStatus:'synthetic',
 nodes:rows.flatMap((row,r)=>Array.from({length:7},(_,c)=>({id:row+c,label:row==='M'&&c===0?'Entrance':row==='M'&&c===6?'Destination':`${row} corridor ${c}`,
  region:row==='T'?'North corridors':row==='M'?'Central corridors':'South corridors',x:-18+c*6,z:-8+r*8}))),
 // Two central links are absent: the shortest route must negotiate junctions.
 edges:[...rows.flatMap(row=>Array.from({length:6},(_,c)=>[row+c,row+(c+1)] as const).filter(([a])=>!['M1','M4'].includes(a))),
  ...[1,3,5].flatMap(c=>[['T'+c,'M'+c],['M'+c,'B'+c]] as const),['B6','M6']],
 start:'M0',goal:'M6',route:['M0','M1','T1','T2','T3','T4','T5','M5','M6'],
 junctions:['T1','T3','T5','M1','M3','M5','B1','B3','B5'],
 decisionPoints:['T1','T3','T5','M1','M3','M5','B1','B3','B5'],
 turnGeometry:'computed from declared route coordinates',visibility:'planned-route straight-run proxy, not measured visibility',
 signage:'Standard direction signs',landmark:'Teal room marker',
};
