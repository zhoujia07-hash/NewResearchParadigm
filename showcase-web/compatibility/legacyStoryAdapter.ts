/** The ONLY scientific authority here is the unchanged lib/story.ts.
 * This snapshot is read-only compatibility data, never a new simulation clock.
 */
import {BASE,RESIDENTS,NODES,EDGES,CHOICES,assess,blocked,factors,frozen,type Story} from '../lib/story';
import {avatarPose} from '../lib/navigationModel';
import {specifiedValue,type Provenance} from '../models/shared';
import {unspecifiedHuman} from '../models/human/defaults';
import {unspecifiedEnvironment} from '../models/environment/defaults';
import {unspecifiedMachine} from '../models/machine/defaults';
import type {BehaviorObservation} from '../models/human/types';
import type {MachineState,StateEstimate,PrototypeDiagnostic,Intervention} from '../models/machine/types';
import type {SystemState} from '../engine/simulationState';

const SCRIPT:Provenance={basis:'scripted',source:'V1/V2.1 Story prototype',note:'Scripted assumptions; not measured human navigation'};
const ART:Provenance={basis:'scripted',source:'V2.1 navigationModel avatar choreography',note:'Observable in the visual script, not real behavioral evidence'};
const RULE_NAMES=['triage-score','safety-risk','model-sensor-conflict','behavior-anomaly'] as const;
export interface LegacyShowcaseSnapshot {
  readonly system:SystemState;
  /** Compatibility boundary only; the domain SystemState never embeds Story. */
  readonly sourceStory:Story;
  readonly ledger:{readonly total:number;readonly automatic:number;readonly escalations:number;readonly coveragePercent:number|null};
}
export class LegacyStoryAdapter {
  snapshot(story:Story):LegacyShowcaseSnapshot {
    const diagnostics:Record<string,PrototypeDiagnostic>={},humanEstimates:StateEstimate[]=[];
    const humans=RESIDENTS.map((resident,index)=>{
      const human=unspecifiedHuman(resident.id);
      const input=index===5?factors(story):{...BASE};
      const assessment=assess(input); // Delegation, not a duplicated formula or policy.
      diagnostics[resident.id]={inputs:{...input},score:assessment.score,requiresReview:assessment.escalated,
        triggeredRules:RULE_NAMES.filter((_,i)=>assessment.rules[i]),provenance:SCRIPT};
      humanEstimates.push({target:'human',targetId:resident.id,variable:'navigation-confidence',value:specifiedValue(input.navigationConfidence,SCRIPT)});
      const pose=avatarPose(story,index);
      const observations:BehaviorObservation[]=[{type:pose.walking?'walking':'stopping',atSeconds:story.elapsed,provenance:ART}];
      if(pose.looking!==0)observations.push({type:'looking-around',atSeconds:story.elapsed,provenance:ART});
      return {...human,profile:{...human.profile,traits:{...human.profile.traits,
        ageGroup:specifiedValue(resident.age,SCRIPT),mobilityCapability:specifiedValue(resident.mobility,SCRIPT),
        vulnerability:specifiedValue(index===5?.9:BASE.vulnerability,{...SCRIPT,note:'Legacy prototype factor; not a validated vulnerability scale'})}},
        behaviors:{kind:'behaviors' as const,observations}};
    });
    const environment=unspecifiedEnvironment('legacy-hospital','indoor','Modern Hospital');
    const isBlocked=blocked(story);
    const machine=unspecifiedMachine();
    const needsHuman=isBlocked&&!story.choice;
    const intervention:Intervention|null=needsHuman||story.choice?{
      id:story.choice??'human-review',targetIds:['R06'],modalities:['human-takeover'],
      timing:specifiedValue('Existing Story timing and operator gate',SCRIPT),intensity:{kind:'unknown',reason:'Not modelled'},
      frequency:{kind:'unknown',reason:'Not modelled'},description:story.choice?CHOICES[story.choice]:'Human judgment required',
    }:null;
    const machineState:MachineState={...machine,
      platforms:[{id:'legacy-building-system',type:'ambient-building-system',label:'Scripted building sensing and human review'}],
      sensing:([['uwb','North Atrium'],['camera','Junction B'],['ble','East Corridor']] as const).map(([modality,place])=>({
        id:modality,modality,targets:['human'],observation:isBlocked?specifiedValue(`R06: ${place}`,SCRIPT):{kind:'unknown',reason:'No sensor reading supplied by the Story'},
      })),
      capabilities:['human-takeover'],
      detection:{human:humanEstimates,environment:[{target:'environment',targetId:'East Exit',variable:'route-blockage',value:specifiedValue(isBlocked,SCRIPT)}],diagnostics},
      decision:{status:story.choice?'selected':needsHuman?'awaiting-human':'none',source:story.choice?'operator':'prototype',intervention,
        reason:story.choice?'Viewer-selected action':needsHuman?'Existing Story escalation':'No Story intervention'},
      interaction:{phase:story.stage==='human'?'await-human':story.stage==='crisis'?'decide':story.stage==='recovery'?'intervene':
        story.stage==='result'?'complete':story.stage==='emerging'?'detect':'sense',
        availableActions:needsHuman?Object.entries(CHOICES).map(([id,label])=>({id,label})):[],
        operatorResponse:story.choice?{actionId:story.choice,confidence:story.confidence}:null,
        feedback:needsHuman?['Backtracked twice; conflicting sensors (scripted crisis evidence)']:[]},
    };
    return {sourceStory:story,system:{schemaVersion:'hme/1',humans,
      environment:{...environment,spatial:{...environment.spatial,coordinateSystem:'V1 schematic units (not metres)',
        nodes:Object.entries(NODES).map(([id,p])=>({id,coordinates:[...p]})),edges:EDGES.map(([from,to])=>({from,to}))},
        situational:{...environment.situational,
          blockages:isBlocked?[{from:'East Corridor',to:'East Exit',reason:'Scripted blocked exit',provenance:SCRIPT}]:[],
          hazards:isBlocked?['Blocked East Exit approach']:[]}},
      machine:machineState,mobility:Object.fromEntries(RESIDENTS.map((r,i)=>[r.id,{kind:'walking',...(i===5?{assistiveDevice:'walker'}:{})}])),
      // Story's crisis/result clocks can advance while avatar motion is frozen.
      time:{elapsedSeconds:story.elapsed,clock:'scripted',paused:story.paused||story.stage==='idle'||story.stage==='human'||story.complete},
      context:{studyId:'legacy-showcase',taskId:'scripted-wayfinding',provenance:SCRIPT,
        extensions:{legacyStage:story.stage,legacyMotionFrozen:frozen(story)}}},
      ledger:{total:story.total,automatic:story.automatic,escalations:story.escalations,
        coveragePercent:story.total?story.automatic/story.total*100:null}};
  }
}
export const legacyStoryAdapter=new LegacyStoryAdapter();
