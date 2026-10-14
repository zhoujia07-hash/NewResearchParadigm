import type {ModelMetadata} from '../models/shared';
import type {HumanBehaviorProposal} from '../models/human/types';
import type {HumanStateEstimate} from '../models/machine/types';
import type {CouplingContext} from './couplingEngine';
export interface StateEstimator {
  readonly metadata:ModelMetadata<'estimator'>;
  evaluateHumanState(behaviors:readonly HumanBehaviorProposal[],context:CouplingContext):readonly HumanStateEstimate[];
}
