/** Illustrative configurations only. Not imported by the public Showcase.
 * Declaring an adaptive policy requirement does not install or run that policy.
 */
import {unspecifiedHuman} from './human/defaults';
import {unspecifiedEnvironment} from './environment/defaults';
import {unspecifiedMachine} from './machine/defaults';
import {specifiedValue,unknownValue,type Provenance,type ModelLayer} from './shared';
import type {SystemState} from '../engine/simulationState';
export interface ResearchConfiguration {
  readonly id:string;
  readonly system:SystemState;
  readonly requestedModules:readonly {readonly layer:ModelLayer;readonly id:string;readonly status:'not-implemented'}[];
}
const CONFIG:Provenance={basis:'configuration',source:'Illustrative HME research configuration',note:'Hypothetical conditions, not observations or validated model outputs'};
function base(id:string):SystemState {
  return {schemaVersion:'hme/1',humans:[],environment:unspecifiedEnvironment(id),machine:unspecifiedMachine(),mobility:{},
    time:{elapsedSeconds:0,clock:'simulation',paused:true},context:{studyId:id,taskId:'illustrative-wayfinding',provenance:CONFIG,extensions:{}}};
}
export function exampleConfigurations():readonly ResearchConfiguration[] {
  const hospital=base('example-a'),a=unspecifiedHuman('participant-a');
  const road=base('example-b'),b=unspecifiedHuman('driver-b');
  const building=base('example-c'),c=unspecifiedHuman('participant-c');
  return [
    {id:'A',system:{...hospital,
      humans:[{...a,profile:{...a.profile,traits:{...a.profile.traits,ageGroup:specifiedValue('Older adult',CONFIG),
        senseOfDirection:specifiedValue('low',CONFIG),spatialAnxietyTrait:specifiedValue('high',CONFIG)}}}],
      environment:{...hospital.environment,physical:{...hospital.environment.physical,setting:'indoor',venue:'Hospital'},
        spatial:{...hospital.environment.spatial,localDynamicComplexity:specifiedValue('high',CONFIG)},
        information:{...hospital.environment.information,landmarkSalience:specifiedValue('low',CONFIG)},
        situational:{...hospital.environment.situational,timePressure:specifiedValue('high',CONFIG)}},
      machine:{...hospital.machine,platforms:[{id:'phone-a',type:'smartphone',label:'Smartphone'}],capabilities:['arrow','vibration'],
        sensing:([{id:'imu-a',modality:'imu'},{id:'ble-a',modality:'ble'}] as const).map(s=>({...s,targets:['human','environment'],observation:unknownValue()}))},
      mobility:{'participant-a':{kind:'walking'}}},
      requestedModules:[{layer:'human',id:'SenseOfDirectionModel',status:'not-implemented'},
        {layer:'machine',id:'SmartphoneAdaptiveInterventionPolicy',status:'not-implemented'}]},
    {id:'B',system:{...road,
      humans:[{...b,profile:{...b.profile,traits:{...b.profile.traits,ageGroup:specifiedValue('Adult driver',CONFIG),senseOfDirection:specifiedValue('moderate',CONFIG)}}}],
      environment:{...road.environment,physical:{...road.environment.physical,setting:'outdoor',venue:'Road network'},
        spatial:{...road.environment.spatial,localDynamicComplexity:specifiedValue('high',{...CONFIG,note:'Illustrative intersection complexity; no algorithm evaluated'})}},
      machine:{...road.machine,platforms:[{id:'vehicle-b',type:'vehicle-system',label:'In-vehicle navigation'}],capabilities:['voice'],
        sensing:([{id:'gps-b',modality:'gps'},{id:'camera-b',modality:'camera'}] as const).map(s=>({...s,targets:['human','environment'],observation:unknownValue()}))},
      mobility:{'driver-b':{kind:'driving',vehicleId:'vehicle-b'}}},
      requestedModules:[{layer:'environment',id:'IntersectionComplexityModel',status:'not-implemented'}]},
    {id:'C',system:{...building,
      humans:[{...c,profile:{...c.profile,traits:{...c.profile.traits,mobilityCapability:specifiedValue('Wheelchair user',CONFIG)}}}],
      environment:{...building.environment,physical:{...building.environment.physical,setting:'indoor',venue:'Large public building'},
        spatial:{...building.environment.spatial,accessibilityConstraints:['Step-free routes required']},
        information:{...building.environment.information,signage:specifiedValue('Inconsistent signage',CONFIG)}},
      machine:{...building.machine,platforms:[{id:'phone-c',type:'smartphone',label:'Smartphone'},
        {id:'building-c',type:'ambient-building-system',label:'Building system'}],capabilities:['map','text']},
      mobility:{'participant-c':{kind:'wheelchair'}}},
      requestedModules:[{layer:'machine',id:'AccessibleRouteGuidancePolicy',status:'not-implemented'}]},
  ];
}
