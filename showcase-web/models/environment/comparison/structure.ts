import type {RouteNetwork,RouteNode} from './types';
export const nodeAt=(n:RouteNetwork,id:string):RouteNode=>{const p=n.nodes.find(p=>p.id===id);if(!p)throw new Error('Unknown route node '+id);return p;};
export const neighbors=(n:RouteNetwork,id:string):readonly string[]=>n.edges.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]);
export const edgeLength=(a:RouteNode,b:RouteNode)=>Math.hypot(b.x-a.x,b.z-a.z);
export function nextTurnAngle(n:RouteNetwork,upcomingIndex:number):number {
 if(upcomingIndex<=0||upcomingIndex>=n.route.length-1)return 0;
 const a=nodeAt(n,n.route[upcomingIndex-1]),b=nodeAt(n,n.route[upcomingIndex]),c=nodeAt(n,n.route[upcomingIndex+1]);
 const dot=(b.x-a.x)*(c.x-b.x)+(b.z-a.z)*(c.z-b.z);
 return Math.acos(Math.max(-1,Math.min(1,dot/(edgeLength(a,b)*edgeLength(b,c)))))*180/Math.PI;
}
/** Count all simple (no repeated node) Entrance→Destination paths in these small fixtures. */
export function simplePathCount(n:RouteNetwork):number {
 function visit(id:string,seen:Set<string>):number {
  if(id===n.goal)return 1;
  let count=0;for(const next of neighbors(n,id))if(!seen.has(next)){seen.add(next);count+=visit(next,seen);seen.delete(next);}return count;
 }
 return visit(n.start,new Set([n.start]));
}
export function structuralMetrics(n:RouteNetwork){
 const degrees=n.nodes.map(p=>neighbors(n,p.id).length),paths=simplePathCount(n);
 return {nodes:n.nodes.length,edges:n.edges.length,routeLength:n.route.slice(1).reduce((sum,id,i)=>sum+edgeLength(nodeAt(n,n.route[i]),nodeAt(n,id)),0),
  totalTurns:n.route.map((_,i)=>nextTurnAngle(n,i)).filter(a=>a>1).length,
  decisionPoints:degrees.filter(d=>d>=3).length,branchSurplus:degrees.reduce((sum,d)=>sum+Math.max(0,d-2),0),
  meanBranching:degrees.reduce((sum,d)=>sum+d,0)/degrees.length,routeAlternatives:paths-1,startGoalPaths:paths,
  connected:n.nodes.every(p=>reachable(n,n.start).has(p.id))};
}
function reachable(n:RouteNetwork,start:string):Set<string>{
 const seen=new Set([start]);for(const id of seen)for(const next of neighbors(n,id))seen.add(next);return seen;
}
export function localContext(n:RouteNetwork,segment:number){
 const upcoming=Math.min(segment+1,n.route.length-1),current=nodeAt(n,n.route[segment]),next=nodeAt(n,n.route[upcoming]);
 const degree=neighbors(n,next.id).length,angle=nextTurnAngle(n,upcoming);
 // Straight portion of the planned route visible ahead, capped at a 12-unit horizon.
 // This geometry-only proxy is NOT occlusion simulation or measured human visibility.
 let straight=edgeLength(current,next);
 let sightIndex=upcoming;
 while(sightIndex<n.route.length-1&&nextTurnAngle(n,sightIndex)<1){straight+=edgeLength(nodeAt(n,n.route[sightIndex]),nodeAt(n,n.route[sightIndex+1]));sightIndex++;}
 // An unobstructed line to the goal is clear even when less than 12 units remain.
 const visibility=sightIndex===n.route.length-1?1:Math.min(1,straight/12),availableChoices=Math.max(0,degree-1);
 const demand=Math.min(1,.12*Math.max(0,degree-2)+.25*angle/180+.2*(1-visibility));
 const nextJunction=n.route.slice(upcoming).find(id=>n.junctions.includes(id));
 return {region:current.region,currentNode:current.id,upcomingNode:next.id,upcomingLabel:next.label,
  upcomingJunction:nextJunction??'None ahead',degree,availableChoices,nextTurnAngle:angle,visibility,
  signage:n.signage,landmark:n.landmark,syntheticLocalDemand:demand,evidenceStatus:'synthetic' as const};
}
