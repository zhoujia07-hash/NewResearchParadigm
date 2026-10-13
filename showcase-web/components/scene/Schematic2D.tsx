'use client';
import { EDGES, NODES, RESIDENTS, blocked, currentPlace, frozen, position, residentColor, residentState, routeFor, type Story } from '@/lib/story';
export default function Schematic2D({story,selected,reduced,onSelect}:{story:Story;selected:number;reduced:boolean;onSelect:(index:number)=>void}){
  const isFrozen=frozen(story),isBlocked=blocked(story);
  // Reduced motion snaps to nodes; spread occupants sharing a node without
  // changing their logical location, and tether every displaced marker to it.
  const logicalPoints=RESIDENTS.map((_,i)=>position(story,i,reduced));
  const displayPoints=logicalPoints.map((p,i)=>[p[0]+(i%3-1)*8,p[1]+Math.floor(i/3)*7]);
  const tethered=new Set<number>();
  if(reduced){
    const groups=new Map<string,number[]>();
    logicalPoints.forEach((p,i)=>{const key=p.join(',');groups.set(key,[...(groups.get(key)||[]),i]);});
    groups.forEach(indices=>{if(indices.length<2)return;
      const ordered=[...indices].sort((a,b)=>a===5?-1:b===5?1:a-b);
      ordered.forEach((i,k)=>{const p=logicalPoints[i];
        displayPoints[i]=[p[0]+(k%2-.5)*70,p[1]+30+Math.floor(k/2)*62];tethered.add(i);
      });
    });
  }
  return <>
          <div className="map-wrap">
            <svg viewBox="-20 0 825 420" className="building-map" aria-label="Building map with eight persistent virtual occupants">
              <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#dce5e3"/></pattern></defs>
              <rect x="-20" width="825" height="420" fill="url(#grid)"/>
              <text x="18" y="32" className="map-zone">WEST WING</text><text x="646" y="32" className="map-zone">EAST WING</text>
              {EDGES.map(([a,b])=><line key={a+b} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} className="corridor"/>)}
              {story.choice&&<polyline data-testid="chosen-route" points={routeFor(story).map(n=>NODES[n].join(',')).join(' ')} className={`route-trace ${residentColor(story,5)} ${isFrozen?'frozen':''}`}/>}
              {Object.entries(NODES).map(([name,p])=><g key={name} className={`node ${name==='East Exit'&&isBlocked?'blocked':''}`} data-node={name}>
                <rect x={p[0]-25} y={p[1]-15} width="50" height="30" rx="7"/><text x={p[0]} y={p[1]-25} textAnchor="middle">{name}</text>
                {name==='East Exit'&&isBlocked&&<text x={p[0]} y={p[1]+4} className="blocked-text" textAnchor="middle">BLOCKED</text>}
              </g>)}
              {[...tethered].map(i=><line key={'tether'+i} x1={logicalPoints[i][0]} y1={logicalPoints[i][1]} x2={displayPoints[i][0]} y2={displayPoints[i][1]} className="resident-tether"/>)}
              {RESIDENTS.map((r,i)=>{const p=displayPoints[i];
                return <g key={r.id} data-resident={r.id} data-color={residentColor(story,i)} data-location={currentPlace(story,i)}
                  transform={`translate(${p[0]} ${p[1]})`} className={`resident ${residentColor(story,i)} ${selected===i?'selected':''} ${isFrozen?'frozen':''}`}
                  role="button" tabIndex={0} aria-label={`View ${r.id} profile`} aria-pressed={selected===i}
                  onClick={()=>onSelect(i)} onMouseEnter={()=>onSelect(i)} onFocus={()=>onSelect(i)}
                  onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(i);}}}>
                  <title>{`${r.id}: ${r.age}, ${r.mobility} · ${residentState(story,i)}`}</title>
                  <circle className="selection-ring" r="24"/><circle r="18"/><text textAnchor="middle" y="4">{r.id}</text>
                </g>;
              })}
            </svg>
            {isBlocked&&!story.choice&&<div className="pause-overlay"><span className="pause-icon" aria-hidden><svg width="18" height="22" viewBox="0 0 18 22"><rect x="1" y="2" width="5" height="18" rx="1" fill="currentColor"/><rect x="12" y="2" width="5" height="18" rx="1" fill="currentColor"/></svg></span><div><strong>AUTOMATION PAUSED</strong><span>HUMAN-IN-THE-LOOP REQUIRED</span></div></div>}
          </div>
          <div className="legend" aria-label="Map legend"><span><i className="legend-corridor"/> Grey lines: walkable corridors / route connections</span><span><i className="legend-node"/> Named nodes: entrances, junctions, corridors and exits</span><span><i className="dot green"/> Green R01–R08: eight persistent virtual occupants</span><span><i className="dot amber"/> Amber: emerging navigation uncertainty</span><span><i className="dot red"/> Red: critical case requiring human judgment</span><span><i className="legend-blocked">×</i> Red blocked marker: unavailable route or exit</span></div>

  </>;
}
