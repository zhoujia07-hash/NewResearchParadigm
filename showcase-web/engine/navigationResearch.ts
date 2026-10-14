import type {NavigationTask} from '../models/navigation/task';
import type {NavigationHistory} from '../models/navigation/history';
import type {EpisodeWindow,SpatialScope} from '../models/navigation/scales';
import type {HumanStateProposal} from '../models/human/types';
import type {EvidenceValue} from '../models/shared';
export type InteractionParticipants=readonly ['human','environment']|readonly ['human','machine']|readonly ['environment','machine']|readonly ['human','environment','machine'];
/** A testable structure/question, not its answer, coefficient or causal conclusion. */
export interface InteractionHypothesis {
  readonly kind:'interaction-hypothesis';readonly id:string;readonly participants:InteractionParticipants;
  readonly factorIds:readonly string[];readonly factorVersion:string;readonly question:string;readonly contextFactorIds:readonly string[];
  readonly evidenceClass:'framework-hypothesis';
}
export interface NavigationChallenge {
  readonly kind:'person-environment-challenge';readonly humanId:string;readonly scope:SpatialScope;
  readonly capabilityFactorIds:readonly string[];readonly stateFactorIds:readonly string[];
  readonly demandFactorIds:readonly string[];readonly machineSupportFactorIds:readonly string[];
  readonly assessment:'unassessed';readonly evidenceClass:'framework-hypothesis';
  readonly factorVersion:string;
}
/** Future feedback payload only. Nothing here schedules or applies a transition. */
export interface TemporalFeedbackProposal {
  readonly kind:'temporal-feedback-proposal';readonly window:EpisodeWindow;readonly from:'t';readonly to:'t+1';
  readonly interactionId:string;readonly behaviorIds:readonly string[];readonly outcomeIds:readonly string[];
  readonly proposedHumanStates:readonly HumanStateProposal[];
  readonly proposedMachinePolicy:EvidenceValue<{readonly id:string;readonly version:string}>;
  readonly proposedEnvironmentPosition:EvidenceValue<{readonly nodeId:string}>;
}
export interface NavigationResearchContext {
  readonly task:NavigationTask;readonly history:NavigationHistory;
  readonly interactions:readonly InteractionHypothesis[];readonly challenges:readonly NavigationChallenge[];
  readonly feedbackProposals:readonly TemporalFeedbackProposal[];
}
