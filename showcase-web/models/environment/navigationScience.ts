/** Environment spatial resolution, distinct from Human analysis resolution. */
export const ENVIRONMENT_ANALYSIS_LEVELS={global:'environmental-global',local:'environmental-local',immediate:'environmental-immediate'} as const;
import type {EvidenceValue} from '../shared';
import type {EpisodeWindow,SpatialScope} from '../navigation/scales';
export interface ScaledEnvironmentFactor {readonly factorId:string;readonly scope:SpatialScope;readonly value:EvidenceValue<number|string|boolean>}
export interface BoundaryGeometry {
  readonly boundaryGeometry:EvidenceValue<string>;readonly enclosureGeometry:EvidenceValue<string>;
  readonly regularity:EvidenceValue<'regular'|'distorted'|'mixed'>;readonly corridorWidth:EvidenceValue<number>;
  readonly regionBreadth:EvidenceValue<string>;readonly turnAngle:EvidenceValue<number>;
  readonly symmetry:EvidenceValue<string>;readonly irregularity:EvidenceValue<string>;
}
export interface ImmediateCueGroups {
  readonly geometric:readonly ScaledEnvironmentFactor[];readonly landmarks:readonly ScaledEnvironmentFactor[];
  readonly wayfindingInformation:readonly ScaledEnvironmentFactor[];readonly visualContext:readonly ScaledEnvironmentFactor[];
}
export interface NavigationEnvironmentEvent {
  readonly kind:'environment-event';readonly id:string;readonly atSeconds:number;readonly environmentId:string;
  readonly type:'approaching-junction'|'entering-ambiguous-region'|'encountering-blockage'|'seeing-landmark'|'seeing-signage'|'crossing-boundary';
  readonly scope:SpatialScope;readonly evidence:EvidenceValue<string>;
}
/** Only current global/local/immediate context; historical exposures live elsewhere. */
export interface MultiScaleEnvironment {
  readonly kind:'multi-scale-environment';readonly global:readonly ScaledEnvironmentFactor[];
  readonly local:readonly {readonly window:EpisodeWindow;readonly regionId:string;readonly factors:readonly ScaledEnvironmentFactor[]}[];
  readonly immediate:readonly {readonly window:EpisodeWindow;readonly factors:readonly ScaledEnvironmentFactor[];readonly cues:ImmediateCueGroups}[];
  readonly geometry:BoundaryGeometry;readonly events:readonly NavigationEnvironmentEvent[];
  readonly taskUrgency:EvidenceValue<string>;readonly destinationImportance:EvidenceValue<string>;readonly instability:EvidenceValue<string>;
}
