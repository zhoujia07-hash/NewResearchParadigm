import type {EvidenceValue, Extensions, Provenance, ResearchLevel} from '../shared';
export interface PhysicalContext {
  readonly kind:'physical';
  readonly setting:'indoor'|'outdoor'|'mixed'|'unspecified';
  readonly venue:string;
  readonly familiarity:EvidenceValue<string>;
}
export interface SpatialNode {
  readonly id:string;
  readonly coordinates:readonly number[];
}
export interface SpatialStructure {
  readonly kind:'spatial';
  readonly coordinateSystem:string;
  readonly nodes:readonly SpatialNode[];
  readonly edges:readonly {readonly from:string;readonly to:string}[];
  readonly globalComplexity:EvidenceValue<ResearchLevel>;
  readonly localDynamicComplexity:EvidenceValue<ResearchLevel>;
  readonly turnCount:EvidenceValue<number>;
  readonly turnAngles:EvidenceValue<readonly number[]>;
  readonly branching:EvidenceValue<number>;
  readonly connectivity:EvidenceValue<number>;
  readonly visibility:EvidenceValue<number>;
  readonly routeLength:EvidenceValue<number>;
  readonly accessibilityConstraints:readonly string[];
}
export interface InformationEnvironment {
  readonly kind:'information';
  readonly signage:EvidenceValue<string>;
  readonly wayfindingSystem:EvidenceValue<string>;
  readonly landmarkSalience:EvidenceValue<ResearchLevel>;
  readonly landmarkDistinctiveness:EvidenceValue<number>;
  readonly featureSimilarity:EvidenceValue<number>;
  readonly visualSalience:EvidenceValue<number>;
  readonly visualClutter:EvidenceValue<number>;
  readonly informationDensity:EvidenceValue<number>;
}
export interface RouteBlockage {
  readonly from:string;readonly to:string;readonly reason:string;readonly provenance:Provenance;
}
export interface SituationalContext {
  readonly kind:'situational';
  /** External task/context constraint, never a Human trait. */
  readonly timePressure:EvidenceValue<string>;
  readonly emergency:EvidenceValue<boolean>;
  readonly crowdDensity:EvidenceValue<number>;
  readonly noise:EvidenceValue<number>;
  readonly lighting:EvidenceValue<string>;
  readonly weather:EvidenceValue<string>;
  readonly blockages:readonly RouteBlockage[];
  readonly hazards:readonly string[];
}
export interface EnvironmentState {
  readonly id:string;
  readonly physical:PhysicalContext;
  readonly spatial:SpatialStructure;
  readonly information:InformationEnvironment;
  readonly situational:SituationalContext;
  readonly extensions:Extensions;
}
