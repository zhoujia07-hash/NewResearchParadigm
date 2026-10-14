import type {HumanAnalysisLevel} from '../human/analysisLevels';
import type {TemporalScale,SpatialScale} from '../navigation/scales';
import type {NavigationTaskType} from '../navigation/task';
import type {MobilityMode} from '../mobility/types';
export const EVIDENCE_CLASSES=['nature-review','nature-primary','nature-portfolio-supporting','project-empirical','external-empirical','framework-hypothesis','synthetic','unknown'] as const;
export type EvidenceClass=typeof EVIDENCE_CLASSES[number];
export const FACTOR_LAYERS=['human','environment','machine','task'] as const;
export type FactorLayer=typeof FACTOR_LAYERS[number];
export const OBSERVABILITIES=['observed','latent','historical','context'] as const;
export type Observability=typeof OBSERVABILITIES[number];
export type FactorEvidenceStatus='source-linked-concept'|'direct-source-support'|'project-empirical'|'framework-placeholder'|'synthetic'|'unknown';
export interface ScientificSource {
  /** Explicit scoped declaration only; absent means undeclared, not neural evidence. */
  readonly humanAnalysisLevels?:readonly HumanAnalysisLevel[];
  readonly id:string;readonly authors:string;readonly title:string;readonly journal:string;readonly year:number;
  readonly volume?:string;readonly pages?:string;readonly doi?:string;readonly url?:string;readonly evidenceClass:EvidenceClass;
  readonly verification:{readonly metadata:'project-owner-supplied'|'publisher-verified'|'crossref-verified';
    readonly content:'not-independently-accessed'|'abstract-reviewed'|'full-text-reviewed';readonly checkedOn:string;readonly note:string};
  readonly suppliedScope:readonly string[];
}
export interface ScientificAttribution {
  /** Explicit scoped declaration only; absent means undeclared, not neural evidence. */
  readonly humanAnalysisLevels?:readonly HumanAnalysisLevel[];
  readonly factorIds:readonly string[];readonly sourceIds:readonly string[];readonly evidenceClass:EvidenceClass;
  readonly claimScope:string;
}
export interface NavigationFactorDefinition {
  /** Explicit scoped declaration only; absent means undeclared, not neural evidence. */
  readonly humanAnalysisLevels?:readonly HumanAnalysisLevel[];
  readonly id:string;readonly version:string;readonly layer:FactorLayer;readonly category:string;
  readonly temporalScale:readonly TemporalScale[];readonly spatialScale:readonly SpatialScale[];
  readonly observability:Observability;readonly sources:readonly ScientificSource[];
  readonly evidenceClass:EvidenceClass;readonly evidenceStatus:FactorEvidenceStatus;
  readonly implementationStatus:'interface-only'|'synthetic'|'empirical'|'legacy';
  readonly implementation:{readonly kind:'none'}|{readonly kind:'legacy'|'model';readonly reference:string;readonly version:string;readonly validated:boolean};
  readonly populationApplicability:readonly string[];readonly taskApplicability:readonly NavigationTaskType[];
  readonly mobilityApplicability:readonly MobilityMode['kind'][];
  readonly applicabilityNote:string;readonly claimScope:string;readonly exclusions:readonly string[];
  readonly causalStatus:'not-established';
}
