/** Presentation coordinates only. The original node identities and edges are unchanged. */
import { EDGES, NODES, type Place } from './story';
import type { Point3, SpatialNode } from '@/types/environment';
export function toWorld(point: readonly [number, number]): Point3 {
  return [(point[0]-380)/16, 0, (point[1]-210)/16];
}
export const SPATIAL_NODES: SpatialNode[] = (Object.keys(NODES) as Place[])
  .map(name=>({name, position:toWorld(NODES[name])}));
export const CONNECTIONS=EDGES.map(([a,b])=>({a,b,start:toWorld(NODES[a]),end:toWorld(NODES[b])}));
export const STATUS_COLORS={green:'#248456',amber:'#d49325',red:'#d53c49'};
export const OUTFITS=['#446d88','#806191','#407d77','#b07150','#5a7195','#847563','#7a855d','#6a6b8b'];
