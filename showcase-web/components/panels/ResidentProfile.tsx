import type {HumanPresentation} from '@/presentation/adapters/humanPresentation';
export default function ResidentProfile({presentation:p}:{presentation:HumanPresentation}){
 return         <aside className="profile" aria-label="Resident profile">
          <div className="profile-heading"><span className="eyebrow">RESIDENT PROFILE</span><span className={`profile-id ${p.color}`}>{p.id}</span></div>
          <h3>{p.age}</h3><p className="profile-meta">{p.mobility} · {p.vulnerabilityLabel}</p>
          <div className={`resident-status ${p.color}`} role="status">{p.status}</div>
          <dl className="profile-facts"><div><dt>Current location</dt><dd>{p.location} <small>(schematic)</small></dd></div><div><dt>Route</dt><dd>{p.route}</dd></div></dl>
          <div className="factor-list">{p.factors.map(({label,key,value})=><div key={key}><div><span>{label}</span><b data-factor={key}>{value.toFixed(2)}</b></div><div className="factor-bar"><i style={{width:`${value*100}%`}}/></div></div>)}</div>
          {p.triageScore!==null&&<p className="profile-alert">Backtracked twice · Conflicting sensors<br/>Triage score: {p.triageScore}</p>}
          <p className="profile-hint">Hover, tap or focus a marker to inspect the same resident throughout the story.</p>
        </aside>;
}
