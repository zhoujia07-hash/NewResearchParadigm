import type {EvidenceValue,Provenance} from '../shared';
import type {EpisodeWindow} from '../navigation/scales';
import type {HumanTraits,HumanStates,HumanBehaviors} from './types';
import type {NavigationRepresentations} from './navigationScience';
import type {HumanAnalysisLevel} from './analysisLevels';
export const NEURAL_COMPUTATIONAL_CONSTRUCTS=['grid-cell-like-representation','place-cell-representation','successor-representation',
  'predictive-map','boundary-anchoring','path-integration','grid-scale','grid-orientation','grid-symmetry','grid-regularity',
  'spatial-coding-distortion','decoding-error','neural-computational-uncertainty','bayesian-cue-integration','precision-weighted-integration'] as const;
/** Optional specialist description; not a model implementation or inferred neural observation. */
export interface NeuralComputationalDescription {
  readonly kind:'neural-computational-description';readonly humanId:string;
  readonly analysisLevel:'micro-neural-computational';readonly window:EpisodeWindow;
  readonly constructs:readonly {readonly type:typeof NEURAL_COMPUTATIONAL_CONSTRUCTS[number];
    readonly value:EvidenceValue<number|string>;readonly provenance:Provenance}[];
}
export type HumanAnalysisRecord=
  | {readonly analysisLevel:'macro-behavior';readonly behavior:HumanBehaviors}
  | {readonly analysisLevel:'meso-psychometric-cognitive';readonly traits?:HumanTraits;readonly states?:HumanStates;readonly representations?:readonly NavigationRepresentations[]}
  | {readonly analysisLevel:'micro-neural-computational';readonly description:NeuralComputationalDescription};
/** Competing hypotheses and inference directions, never a mandatory causal chain. */
export interface CrossLevelHumanHypothesis {
  readonly kind:'cross-level-human-hypothesis';readonly id:string;readonly question:string;
  readonly levels:readonly HumanAnalysisLevel[];
  readonly direction:'top-down'|'bottom-up-inference'|'reciprocal';
  readonly competingMechanismIds:readonly string[];readonly outcomeFactorIds:readonly string[];
  readonly evidenceClass:'framework-hypothesis';readonly causalStatus:'not-established';
}
