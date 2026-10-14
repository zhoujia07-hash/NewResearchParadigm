import type {EvidenceValue} from '../shared';
import type {InterventionModality} from './types';
export type AdaptationOption='continue'|'modify-cue'|'increase-intervention'|'decrease-intervention'|'switch-modality'|'escalate-human'|'stop-intervention';
/** Action-side policy specification, with no defaults, selection or delivery. */
export interface AdaptiveMachineContract {
  readonly kind:'adaptive-machine-contract';readonly whetherToIntervene:EvidenceValue<boolean>;
  readonly timing:EvidenceValue<string>;readonly threshold:EvidenceValue<number>;
  readonly modality:EvidenceValue<InterventionModality>;readonly intensity:EvidenceValue<number>;readonly frequency:EvidenceValue<number>;
  readonly escalation:EvidenceValue<string>;readonly possibleAdaptations:readonly AdaptationOption[];
}
