/** Mobility/task mode is not a technology platform or a personality trait. */
export type MobilityMode =
  | {readonly kind:'walking'; readonly assistiveDevice?:'walker'|'cane'|'other'}
  | {readonly kind:'driving'; readonly vehicleId?:string}
  | {readonly kind:'cycling'; readonly cycleId?:string}
  | {readonly kind:'wheelchair'; readonly powered?:boolean}
  | {readonly kind:'public-transit'; readonly serviceId?:string}
  | {readonly kind:'other'; readonly name:string};
