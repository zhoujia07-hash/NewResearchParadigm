export const TEMPORAL_SCALES=['seconds','minutes','hours','days','months','years','decades','developmental','lifetime'] as const;
export type TemporalScale=typeof TEMPORAL_SCALES[number];
export const SPATIAL_SCALES=['global','local','immediate','not-applicable'] as const;
export type SpatialScale=typeof SPATIAL_SCALES[number];
export type EpisodeWindow={readonly kind:'episode-window';readonly scale:'seconds'|'minutes'|'hours';readonly episodeId:string;readonly startSeconds:number;readonly endSeconds:number};
export type LongitudinalWindow={readonly kind:'longitudinal-window';readonly scale:Exclude<TemporalScale,'seconds'|'minutes'|'hours'>;
  readonly reference:'age'|'calendar-year'|'study-start';readonly unit:'days'|'years';readonly start:number;readonly end:number};
export type NavigationTimeWindow=EpisodeWindow|LongitudinalWindow;
export interface SpatialScope {readonly scale:SpatialScale;readonly environmentId?:string;readonly regionId?:string}
