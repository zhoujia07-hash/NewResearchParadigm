import type {ModelAnalysisMetadata} from './analysisMetadata';
import type {ScientificAttribution} from './evidence/types';
/** Provenance is a declaration, never a certificate of empirical validity. */
export type EvidenceBasis = 'scripted' | 'configuration' | 'measurement' | 'model-output';
export interface Provenance {
  readonly basis: EvidenceBasis;
  readonly source: string;
  readonly note?: string;
  readonly citation?: string;
  readonly scientific?:ScientificAttribution;
}
export type EvidenceValue<T> =
  | {readonly kind: 'unknown'; readonly reason: string}
  | {readonly kind: 'value'; readonly value: T; readonly provenance: Provenance; readonly scale?: string};
export const unknownValue = <T>(reason = 'Not specified or estimated'): EvidenceValue<T> => ({kind:'unknown',reason});
export const specifiedValue = <T>(value:T, provenance:Provenance, scale?:string): EvidenceValue<T> =>
  ({kind:'value',value,provenance,...(scale?{scale}:{})});
export type Extensions = Readonly<Record<string, unknown>>;
/** Qualitative configuration labels are allowed; no numerical scale is implied. */
export type ResearchLevel = number|'low'|'moderate'|'high';
export type ModelLayer = 'human' | 'environment' | 'machine' | 'estimator';
export interface ModelMetadata<L extends ModelLayer = ModelLayer> {
  readonly id: string;
  readonly version: string;
  readonly layer: L;
  readonly analysis?:ModelAnalysisMetadata;
  readonly evidence: 'structural' | 'prototype' | 'synthetic' | 'empirical';
  readonly description: string;
  readonly citation?: string;
  readonly scientific?:ScientificAttribution;
}
