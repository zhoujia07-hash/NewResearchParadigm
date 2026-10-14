import {simpleEnvironment} from '../../models/environment/comparison/simpleEnvironment';
import {complexEnvironment} from '../../models/environment/comparison/complexEnvironment';
import {localContext,nodeAt,edgeLength,structuralMetrics} from '../../models/environment/comparison/structure';
import type {RouteNetwork} from '../../models/environment/comparison/types';
import {syntheticProfile} from '../../models/human/syntheticProfiles';
import {SyntheticHumanBehaviorModel} from '../../models/human/syntheticBehaviorModel';
import {syntheticEnvironmentResponse} from '../../models/coupling/syntheticEnvironmentResponse';
export const EXPERIMENT_TASK=Object.freeze({id:'entrance-to-target-room',start:'Entrance',goal:'Destination / target room',intent:'Reach the designated target room'});
export const BASELINE_SUPPORT=Object.freeze({id:'constant-static-support',description:'Static route map + standard direction signs; no adaptive intervention'});
export interface ExperimentState {readonly elapsed:number;readonly running:boolean;readonly residentId:string}
export const initialExperiment=():ExperimentState=>({elapsed:0,running:false,residentId:'R04'});
export function advanceExperiment(s:ExperimentState,delta:number):ExperimentState {
 if(!Number.isFinite(delta)||delta<0)throw new Error('Nonnegative finite time required');
 return s.running?{...s,elapsed:Math.min(120,s.elapsed+delta),running:s.elapsed+delta<120}:s;
}
export function resetExperiment(s:ExperimentState):ExperimentState{return {...s,elapsed:0,running:false};}
export function selectExperimentResident(s:ExperimentState,id:string):ExperimentState{syntheticProfile(id);return {elapsed:0,running:false,residentId:id};}
export const COMPARISON_NETWORKS=[simpleEnvironment,complexEnvironment] as const;
const globals={simple:structuralMetrics(simpleEnvironment),complex:structuralMetrics(complexEnvironment)};
export function comparisonScene(network:RouteNetwork,state:ExperimentState){
 const human=syntheticProfile(state.residentId),mobility=human.id==='R06'?{kind:'walking' as const,assistiveDevice:'walker' as const}:{kind:'walking' as const};
 const base=SyntheticHumanBehaviorModel.behaviorStyle(human,{environmentId:network.id,stage:'research-comparison',mobility});
 let remaining=state.elapsed;
 for(let i=0;i<network.route.length-1;i++){
  const a=nodeAt(network,network.route[i]),b=nodeAt(network,network.route[i+1]),local=localContext(network,i);
  const response=syntheticEnvironmentResponse(base,human,local.syntheticLocalDemand),travel=edgeLength(a,b)/response.speed;
  // Brief dwell is expressed before the segment; both cases use this identical rule.
  const duration=response.pauseSeconds+travel;
  if(remaining<duration){
   const pausing=remaining<response.pauseSeconds,p=Math.max(0,(remaining-response.pauseSeconds)/travel);
   const moving=state.running&&!pausing;
   return {network,human,task:EXPERIMENT_TASK,support:BASELINE_SUPPORT,clock:state,global:globals[network.id],local,response,
    position:[a.x+(b.x-a.x)*p,a.z+(b.z-a.z)*p] as const,heading:Math.atan2(b.x-a.x,b.z-a.z),
    arrived:false,pausing,moving,behavior:!state.running?(state.elapsed===0?'Ready':'Paused'):pausing?'Brief hesitation':local.syntheticLocalDemand>.25?'Cautious movement':'Walking steadily'};
  }
  remaining-=duration;
 }
 const goal=nodeAt(network,network.goal),last=network.route.length-2,local=localContext(network,last);
 return {network,human,task:EXPERIMENT_TASK,support:BASELINE_SUPPORT,clock:state,global:globals[network.id],local,
  response:syntheticEnvironmentResponse(base,human,local.syntheticLocalDemand),position:[goal.x,goal.z] as const,
  heading:0,arrived:true,pausing:false,moving:false,behavior:'Destination reached'};
}
export function comparisonSnapshot(state:ExperimentState){return {simple:comparisonScene(simpleEnvironment,state),complex:comparisonScene(complexEnvironment,state)};}
export type ComparisonScene=ReturnType<typeof comparisonScene>;
