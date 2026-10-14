'use client';
import dynamic from 'next/dynamic';
import {Component,type ReactNode} from 'react';
import type {ComparisonScene} from '@/engine/comparison/experiment';
import NetworkGraph from './NetworkGraph';
const World=dynamic(()=>import('./ComparisonWorld'),{ssr:false,loading:()=> <p className="comparison-loading">Preparing 3D network…</p>});
class RenderBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<p className="comparison-loading">3D unavailable. The synchronized route graph remains active.</p>:this.props.children;}}
export default function EnvironmentCard({scene:s,reduced,webgl}:{scene:ComparisonScene;reduced:boolean;webgl:boolean}){
 const global=[['Nodes',s.global.nodes],['Edges',s.global.edges],['Route length',s.global.routeLength+' m*'],['Total turns',s.global.totalTurns],['Decision points',s.global.decisionPoints],['Mean branching',s.global.meanBranching.toFixed(2)],['Route alternatives',s.global.routeAlternatives],['Branch surplus',s.global.branchSurplus]];
 return <article className={'environment-card '+s.network.id} data-environment={s.network.id} data-resident={s.human.id} data-experiment-time={s.clock.elapsed.toFixed(3)}>
  <header><div><span className="eyebrow">{s.network.id==='simple'?'01 / LINEAR NETWORK':'02 / BRANCHED NETWORK'}</span><h2>{s.network.label}</h2></div><span className="comparison-resident">{s.human.id} · {s.arrived?'Arrived':s.behavior}</span></header>
  <div className="comparison-world">{webgl?<RenderBoundary><World scene={s} reduced={reduced}/></RenderBoundary>:<p className="comparison-loading">3D unavailable. Use the synchronized route graph below.</p>}<span className="world-corner">MODERN HOSPITAL / synthetic structure</span></div>
  <div className="comparison-network"><NetworkGraph scene={s}/><p><i/> Current position <b>◇</b> Goal <span>Dashed: planned route · Dark node: upcoming junction</span></p></div>
  <section className="global-structure"><h3>Global structure</h3><dl className="structural-values">{global.map(([label,value])=><div key={label}><dt>{label}</dt><dd data-global={String(label)}>{value}</dd></div>)}</dl><p className="comparison-footnote">Mean branching = mean node degree · Alternatives exclude planned path · Connectivity: {s.global.connected?'connected':'disconnected'}. *Illustrative metre scale.</p></section>
  <div className="comparison-live"><section className="local-context"><h3>Current local context</h3><dl>
   <div><dt>Region</dt><dd data-local="region">{s.local.region}</dd></div><div><dt>Upcoming node</dt><dd data-local="upcoming">{s.arrived?'Destination reached':s.local.upcomingNode+' · '+s.local.upcomingLabel}</dd></div>
   <div><dt>Next junction</dt><dd>{s.arrived?'None ahead':s.local.upcomingJunction}</dd></div><div><dt>Local degree / choices</dt><dd data-local="choices">{s.local.degree} / {s.local.availableChoices}</dd></div>
   <div><dt>Next-turn angle</dt><dd>{s.local.nextTurnAngle.toFixed(0)}°</dd></div><div><dt>Local visibility proxy</dt><dd>{s.local.visibility.toFixed(2)}</dd></div>
   <div><dt>Signage / landmark</dt><dd>Standard signs / teal marker</dd></div><div><dt>Synthetic local demand</dt><dd data-local="demand">{s.local.syntheticLocalDemand.toFixed(2)}</dd></div>
  </dl></section><section className="live-behavior"><h3>Human macro expression</h3><p className="comparison-behavior" data-behavior>{s.behavior}</p><dl>
   <div><dt>Movement speed</dt><dd data-response="speed">{s.moving?s.response.speed.toFixed(2):'0.00'} m/s*</dd></div><div><dt>Hesitation expression</dt><dd data-response="hesitation">{s.response.hesitation.toFixed(2)}</dd></div>
   <div><dt>Scanning intensity</dt><dd data-response="scanning">{s.response.scanning.toFixed(2)}</dd></div><div><dt>Turn decisiveness</dt><dd>{s.response.turnDecisiveness.toFixed(2)}</dd></div><div><dt>Brief pause setting</dt><dd>{s.response.pauseSeconds.toFixed(2)} s</dd></div>
  </dl><p className="comparison-footnote">Synthetic presentation outputs. No psychological state is inferred. *Speed uses the illustrative scene scale.</p></section></div>
 </article>;
}
