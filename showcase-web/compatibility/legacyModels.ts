/** Optional pass-through modules for exercising composition, NOT new science.
 * The public Showcase still advances exclusively through Story tick/submit.
 */
import type {HumanModel} from '../models/human/humanModel';
import type {EnvironmentModel} from '../models/environment/environmentModel';
import type {MachinePolicy} from '../models/machine/interventionPolicy';
import type {StateEstimator} from '../engine/stateEstimator';
import {ModelRegistry} from '../engine/modelRegistry';
import {unknownValue} from '../models/shared';

export const legacyHumanModel:HumanModel={
  metadata:{id:'legacy-human-pass-through',version:'1',layer:'human',evidence:'prototype',description:'Expose existing scripted observations; no trait-to-behavior model'},
  evaluateHumanBehavior:({system})=>system.humans.map(h=>({humanId:h.profile.id,behaviors:h.behaviors})),
};
export const legacyEnvironmentModel:EnvironmentModel={
  metadata:{id:'legacy-environment-pass-through',version:'1',layer:'environment',evidence:'prototype',description:'Return supplied environment; no complexity computation'},
  evaluateEnvironment:({system})=>system.environment,
};
export const unspecifiedStateEstimator:StateEstimator={
  metadata:{id:'unspecified-states',version:'1',layer:'estimator',evidence:'structural',description:'Retain unknown latent states; do not infer from animated behaviors'},
  evaluateHumanState:(_,context)=>context.system.humans.map(h=>({kind:'machine-estimate',target:'human',targetId:h.profile.id,
    variable:'latent-human-states',value:unknownValue('No latent-state estimation model implemented'),
    uncertainty:{kind:'unknown',reason:'No inference model or calibration'},
    provenance:{basis:'configuration',source:'Unimplemented state-estimation contract; no ground-truth state assignment'}})),
};
export const prototypePolicy:MachinePolicy={
  metadata:{id:'legacy-prototype-policy',version:'1',layer:'machine',evidence:'prototype',description:'Expose supplied Story/operator decision; no adaptive policy or automatic A/B/C selection'},
  selectMachineIntervention:({system})=>system.machine.decision,
};
export function createLegacyModelRegistry():ModelRegistry {
  const registry=new ModelRegistry();
  registry.register('human',legacyHumanModel);registry.register('environment',legacyEnvironmentModel);
  registry.register('estimator',unspecifiedStateEstimator);registry.register('machine',prototypePolicy);
  return registry;
}
