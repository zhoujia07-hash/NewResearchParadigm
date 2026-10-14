import type {ModelMetadata} from '../shared';
import type {CouplingContext} from '../../engine/couplingEngine';
import type {HumanBehaviorProposal} from './types';
/** Cross-layer inputs enter through the coupling contract, never renderer imports. */
export interface HumanModel {
  readonly metadata:ModelMetadata<'human'>;
  evaluateHumanBehavior(context:CouplingContext):readonly HumanBehaviorProposal[];
}
