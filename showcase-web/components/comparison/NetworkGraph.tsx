import type {ComparisonScene} from '@/engine/comparison/experiment';
import {nodeAt} from '@/models/environment/comparison/structure';
export default function NetworkGraph({scene:s}:{scene:ComparisonScene}){
 const project=(x:number,z:number)=>[30+(x+18)*10,22+(z+8)*5];
 const route=s.network.route.map(id=>{const p=nodeAt(s.network,id);return project(p.x,p.z).join(',');}).join(' ');
 const [x,y]=project(...s.position);
 return <svg className="comparison-graph" viewBox="0 0 420 125" role="img" aria-label={s.network.label+' synchronized route graph'} data-graph={s.network.id} data-position={s.position.join(',')}>
  {s.network.edges.map(([a,b])=>{const p=nodeAt(s.network,a),q=nodeAt(s.network,b),[x1,y1]=project(p.x,p.z),[x2,y2]=project(q.x,q.z);return <line key={a+b} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bdcbc7" strokeWidth="3"/>;})}
  <polyline points={route} fill="none" stroke="#3f8279" strokeWidth="3" strokeDasharray="5 3"/>
  {s.network.nodes.map(n=>{const [x,y]=project(n.x,n.z),decision=s.network.decisionPoints.includes(n.id);return <g key={n.id}>
   <circle cx={x} cy={y} r={n.id===s.network.goal?6:decision?4.5:3} fill={n.id===s.network.goal?'#bf9148':n.id===s.local.upcomingJunction?'#153f47':decision?'#76a89d':'#fff'} stroke="#76958c" strokeWidth="1"/>
   <text x={x} y={y+(n.z===8?14:-9)} textAnchor="middle" fontSize="7" fill="#4c6663">{n.id===s.network.start?'Entrance':n.id===s.network.goal?'Goal':n.id}</text>
  </g>;})}
  <circle data-current-position cx={x} cy={y} r="5.5" fill="#173f49" stroke="white" strokeWidth="2"/>
 </svg>;
}
