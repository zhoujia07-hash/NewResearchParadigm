import type {EvidenceValue, Extensions, Provenance} from '../shared';
import type {AdaptiveMachineContract} from './navigationScience';
export type PlatformType = 'smartphone'|'smartwatch'|'vehicle-system'|'ar-glasses'|'robot'|'kiosk'|'ambient-building-system';
export type SensorModality = 'gps'|'imu'|'camera'|'ble'|'uwb'|'gaze'|'wearable-physiology'|'vehicle-sensor';
export type InterventionModality = 'map'|'arrow'|'text'|'voice'|'vibration'|'landmark-cue'|'ar-overlay'|'dialogue'|'confirmation'|'feedback'|'human-takeover';
export interface MachinePlatform {readonly id:string;readonly type:PlatformType;readonly label:string}
export interface SensingChannel {
  readonly id:string;readonly modality:SensorModality;
  readonly targets:readonly ('human'|'environment')[];
  readonly observation:EvidenceValue<string>;
}
export interface StateEstimate {
  readonly kind:'machine-estimate';
  readonly target:'human'|'environment';readonly targetId:string;readonly variable:string;
  readonly value:EvidenceValue<number|string|boolean>;
  readonly uncertainty:EstimateUncertainty;readonly provenance:Provenance;
}
export type EstimateUncertainty={readonly kind:'unknown';readonly reason:string}|
  {readonly kind:'reported';readonly representation:'interval'|'probability'|'standard-error'|'model-specific';
    readonly values:readonly number[];readonly provenance:Provenance;readonly scale:string};
export interface HumanStateEstimate extends StateEstimate {readonly target:'human'}
export interface PrototypeDiagnostic {
  readonly inputs:Readonly<Record<string,number>>;
  readonly score:number;
  readonly triggeredRules:readonly string[];
  readonly requiresReview:boolean;
  readonly provenance:Provenance;
}
export interface StateDetection {
  readonly human:readonly StateEstimate[];
  readonly environment:readonly StateEstimate[];
  /** Named prototype diagnostics are not a universal HME composite score. */
  readonly diagnostics:Readonly<Record<string,PrototypeDiagnostic>>;
}
export interface Intervention {
  readonly id:string;readonly targetIds:readonly string[];
  readonly modalities:readonly InterventionModality[];
  readonly timing:EvidenceValue<string>;
  readonly intensity:EvidenceValue<number>;
  readonly frequency:EvidenceValue<number>;
  readonly description:string;
}
export interface MachineDecision {
  readonly status:'none'|'awaiting-human'|'selected';
  readonly source:'prototype'|'operator'|'model';
  readonly intervention:Intervention|null;
  readonly reason:string;
}
export interface MachineInteraction {
  readonly phase:'sense'|'detect'|'decide'|'await-human'|'intervene'|'observe-response'|'complete';
  readonly availableActions:readonly {readonly id:string;readonly label:string}[];
  readonly operatorResponse:{readonly actionId:string;readonly confidence:number|null}|null;
  readonly feedback:readonly string[];
}
export interface MachineState {
  readonly platforms:readonly MachinePlatform[];
  readonly sensing:readonly SensingChannel[];
  readonly detection:StateDetection;
  readonly capabilities:readonly InterventionModality[];
  readonly decision:MachineDecision;
  readonly interaction:MachineInteraction;
  readonly extensions:Extensions;
  /** Role A references canonical longitudinal exposure records, not active policy. */
  readonly exposureHistoryIds?:readonly string[];
  /** Role B specification only; no adaptive implementation is supplied. */
  readonly adaptiveContract?:AdaptiveMachineContract;
}
