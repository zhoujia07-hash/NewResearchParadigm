import type {ModelMetadata} from '../models/shared';
import type {HumanBehaviorProposal,HumanStateProposal} from '../models/human/types';
import type {CouplingContext} from './couplingEngine';
export interface StateEstimator {
  readonly metadata:ModelMetadata<'estimator'>;
  evaluateHumanState(behaviors:readonly HumanBehaviorProposal[],context:CouplingContext):readonly HumanStateProposal[];
}
