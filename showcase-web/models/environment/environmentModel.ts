import type {ModelMetadata} from '../shared';
import type {CouplingContext} from '../../engine/couplingEngine';
import type {EnvironmentState} from './types';
export interface EnvironmentModel {
  readonly metadata:ModelMetadata<'environment'>;
  evaluateEnvironment(context:CouplingContext):EnvironmentState;
}
