/** Model selection lives outside renderers and the official Story engine. */
import {ModelRegistry} from '../engine/modelRegistry';
import {SyntheticHumanBehaviorModel} from '../models/human/syntheticBehaviorModel';
import {syntheticProfile} from '../models/human/syntheticProfiles';
import type {HumanBehaviorStyleModel,BehaviorContext} from '../models/human/behaviorStyle';
import type {HumanProfile} from '../models/human/types';
const registry=new ModelRegistry();registry.register('human',SyntheticHumanBehaviorModel);
const selected=registry.get('human','synthetic-human-behavior','2.2.0-b') as HumanBehaviorStyleModel;
/** Future empirical replacement changes this composition, not scene/Story/Machine. */
export function createHumanBehaviorProvider(model:HumanBehaviorStyleModel,profileFor:(id:string)=>HumanProfile){
  return {profile:profileFor,style:(id:string,context:BehaviorContext)=>model.behaviorStyle(profileFor(id),context)};
}
export const humanBehaviorProvider=createHumanBehaviorProvider(selected,syntheticProfile);
