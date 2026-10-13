import { BASE, RESIDENTS, assess, blocked, currentPlace, factors, residentColor, residentState, routeFor, type Story,type Place } from '@/lib/story';
const factorRows=[['Navigation confidence','navigationConfidence'],['Sensor agreement','sensorAgreement'],
 ['Model disagreement','modelDisagreement'],['Behavior anomaly','behaviorAnomaly'],['Safety risk','safetyRisk']] as const;
export default function ResidentProfile({story,selected,location}:{story:Story;selected:number;location?:Place}){
 const profile=RESIDENTS[selected],f=factors(story),profileFactors=selected===5?f:BASE,isBlocked=blocked(story);
 return         <aside className="profile" aria-label="Resident profile">
          <div className="profile-heading"><span className="eyebrow">RESIDENT PROFILE</span><span className={`profile-id ${residentColor(story,selected)}`}>{profile.id}</span></div>
          <h3>{profile.age}</h3><p className="profile-meta">{profile.mobility} · {selected===5?'Higher vulnerability':'Typical vulnerability'}</p>
          <div className={`resident-status ${residentColor(story,selected)}`} role="status">{residentState(story,selected)}</div>
          <dl className="profile-facts"><div><dt>Current location</dt><dd>{location??currentPlace(story,selected)} <small>(schematic)</small></dd></div><div><dt>Route</dt><dd>{selected===5&&story.choice?routeFor(story).join(' →'):selected===5&&isBlocked?'Junction B → East Corridor → East Exit':profile.route.join(' →')}</dd></div></dl>
          <div className="factor-list">{factorRows.map(([label,key])=><div key={key}><div><span>{label}</span><b data-factor={key}>{profileFactors[key].toFixed(2)}</b></div><div className="factor-bar"><i style={{width:`${profileFactors[key]*100}%`}}/></div></div>)}</div>
          {selected===5&&isBlocked&&!story.choice&&<p className="profile-alert">Backtracked twice · Conflicting sensors<br/>Triage score: {assess(f).score.toFixed(4)}</p>}
          <p className="profile-hint">Hover, tap or focus a marker to inspect the same resident throughout the story.</p>
        </aside>;
}
