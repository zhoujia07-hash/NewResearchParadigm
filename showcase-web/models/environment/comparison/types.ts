/** Synthetic experimental networks, not a validated spatial-complexity model. */
export interface RouteNode {readonly id:string;readonly label:string;readonly region:string;readonly x:number;readonly z:number}
export interface RouteNetwork {
 readonly id:'simple'|'complex';readonly label:string;readonly evidenceStatus:'synthetic';
 readonly nodes:readonly RouteNode[];readonly edges:readonly (readonly [string,string])[];
 readonly start:string;readonly goal:string;readonly route:readonly string[];
 readonly junctions:readonly string[];readonly decisionPoints:readonly string[];
 readonly turnGeometry:'computed from declared route coordinates';
 readonly visibility:'planned-route straight-run proxy, not measured visibility';
 readonly signage:string;readonly landmark:string;
}
