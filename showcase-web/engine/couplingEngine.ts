import type {HumanModel} from '../models/human/humanModel';
import type {EnvironmentModel} from '../models/environment/environmentModel';
import type {MachinePolicy} from '../models/machine/interventionPolicy';
import type {HumanBehaviorProposal,HumanStateProposal} from '../models/human/types';
import type {EnvironmentState} from '../models/environment/types';
import type {MachineDecision} from '../models/machine/types';
import type {Provenance} from '../models/shared';
import type {StateEstimator} from './stateEstimator';
import type {SystemState} from './simulationState';

export interface CouplingContext {readonly system:SystemState;readonly history:readonly SystemState[]}
export interface ModelEvaluations {
  readonly behaviors:readonly HumanBehaviorProposal[];
  readonly environment:EnvironmentState;
  readonly humanStates:readonly HumanStateProposal[];
}
export interface OutcomeProposal {readonly targetId:string;readonly name:string;readonly value:string|number|boolean;readonly provenance:Provenance}
export interface AdaptationProposal {readonly targetId:string;readonly description:string;readonly provenance:Provenance}
export interface CouplingResult extends ModelEvaluations {
  readonly decision:MachineDecision;
  readonly outcomes:readonly OutcomeProposal[];
  readonly adaptations:readonly AdaptationProposal[];
}
export interface CouplingModules {
  readonly human:HumanModel;readonly environment:EnvironmentModel;
  readonly estimator:StateEstimator;readonly machine:MachinePolicy;
}
export interface CouplingEngine {evaluate(context:CouplingContext):CouplingResult}
/** Composition only: no clock, inferred formula, policy threshold or application of proposals.
 * Outcomes/adaptation remain unevaluated in V2.2-A. Caller retains state ownership.
 */
export function createCouplingEngine(modules:CouplingModules):CouplingEngine {
  return {evaluate(context){
    const environment=modules.environment.evaluateEnvironment(context);
    const behaviors=modules.human.evaluateHumanBehavior(context);
    const humanStates=modules.estimator.evaluateHumanState(behaviors,context);
    const evaluations={environment,behaviors,humanStates};
    return {...evaluations,decision:modules.machine.selectMachineIntervention(context,evaluations),outcomes:[],adaptations:[]};
  }};
}
