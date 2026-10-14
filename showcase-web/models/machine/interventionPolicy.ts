import type {ModelMetadata} from '../shared';
import type {CouplingContext, ModelEvaluations} from '../../engine/couplingEngine';
import type {MachineDecision} from './types';
export interface MachinePolicy {
  readonly metadata:ModelMetadata<'machine'>;
  selectMachineIntervention(context:CouplingContext, evaluations:ModelEvaluations):MachineDecision;
}
