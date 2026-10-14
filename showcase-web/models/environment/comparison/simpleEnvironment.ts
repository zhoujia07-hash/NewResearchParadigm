import type {RouteNetwork} from './types';
/** "Simple" is an experimental label. Nine nodes do not establish low difficulty. */
export const simpleEnvironment:RouteNetwork={
 id:'simple',label:'Simple environment',evidenceStatus:'synthetic',
 nodes:[
  {id:'S0',label:'Entrance',region:'Arrival',x:-18,z:0},
  {id:'S1',label:'Corridor 01',region:'West corridor',x:-12,z:0},
  {id:'S2',label:'Junction 01',region:'West junction',x:-6,z:0},
  {id:'S3',label:'Corridor 02',region:'Central corridor',x:0,z:0},
  {id:'S4',label:'Junction 02',region:'East junction',x:6,z:0},
  {id:'S5',label:'Corridor 03',region:'East corridor',x:12,z:0},
  {id:'S6',label:'Destination',region:'Target room',x:18,z:0},
  {id:'S7',label:'Side room 01',region:'Side room',x:-6,z:-7},
  {id:'S8',label:'Side room 02',region:'Side room',x:6,z:7},
 ],
 edges:[['S0','S1'],['S1','S2'],['S2','S3'],['S3','S4'],['S4','S5'],['S5','S6'],['S2','S7'],['S4','S8']],
 start:'S0',goal:'S6',route:['S0','S1','S2','S3','S4','S5','S6'],
 junctions:['S2','S4'],decisionPoints:['S2','S4'],
 turnGeometry:'computed from declared route coordinates',visibility:'planned-route straight-run proxy, not measured visibility',
 signage:'Standard direction signs',landmark:'Teal room marker',
};
