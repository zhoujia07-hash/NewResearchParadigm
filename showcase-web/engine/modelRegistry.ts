import {validateModelAnalysis} from '../models/analysisMetadata';
import type {HumanModel} from '../models/human/humanModel';
import type {EnvironmentModel} from '../models/environment/environmentModel';
import type {MachinePolicy} from '../models/machine/interventionPolicy';
import type {StateEstimator} from './stateEstimator';
export interface RegistryModels {human:HumanModel;environment:EnvironmentModel;machine:MachinePolicy;estimator:StateEstimator}
type Layer=keyof RegistryModels;
/** Explicit layer + ID + version, no auto-discovery or implicit empirical endorsement. */
export class ModelRegistry {
  private readonly entries:{[K in Layer]:Map<string,RegistryModels[K]>}={human:new Map(),environment:new Map(),machine:new Map(),estimator:new Map()};
  register<K extends Layer>(layer:K,model:NoInfer<RegistryModels[K]>):void {
    const {id,version}=model.metadata;
    if(model.metadata.layer!==layer||!id.trim()||!version.trim())throw new Error('Model layer, ID and version must match');
    validateModelAnalysis(model.metadata.analysis,layer);
    const key=JSON.stringify([id,version]);
    if(this.entries[layer].has(key))throw new Error('Model version already registered');
    this.entries[layer].set(key,model);
  }
  get<K extends Layer>(layer:K,id:string,version:string):RegistryModels[K]|undefined {
    return this.entries[layer].get(JSON.stringify([id,version]));
  }
  list<K extends Layer>(layer:K):readonly RegistryModels[K][] {return [...this.entries[layer].values()];}
}
