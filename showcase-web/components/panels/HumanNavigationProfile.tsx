'use client';
import {useState} from 'react';
import {SYNTHETIC_PROFILES} from '@/models/human/syntheticProfiles';
import {presentNavigationProfile,type HumanNavigationPresentation} from '@/presentation/adapters/humanNavigationPresentation';
export default function HumanNavigationProfile({navigation:n}:{navigation:HumanNavigationPresentation}){
 const [comparison,setComparison]=useState('R06');
 const comparisonId=comparison===n.id?(n.id==='R01'?'R06':'R01'):comparison;
 const other=presentNavigationProfile(comparisonId);
 return <section className="human-navigation" aria-label="Individual navigation profile" data-profile-resident={n.id}>
  <span className="eyebrow">INDIVIDUAL NAVIGATION PROFILE</span>
  <h4><span className="level-pill">MESO</span> Psychometric / cognitive profile</h4>
  <p className="synthetic-label">Synthetic demonstration profile — not a participant measurement.</p>
  <dl className="human-traits">{n.traits.map(t=><div key={t.key} data-human-trait={t.key}><dt>{t.label}</dt><dd>{t.qualitative} <span>· {t.value.toFixed(2)}</span></dd></div>)}</dl>
  <p className="human-note">Individual differences are synthetic in V2.2-B and are used only to demonstrate person-specific behavior in the HME framework.</p>
  <details className="latent-placeholders"><summary>Dynamic Human states · unspecified</summary><p>Navigation uncertainty, confidence, current anxiety and workload remain unknown. Scripted triage indicators below are separate.</p></details>
  <div className="macro-behavior"><h4><span className="level-pill">MACRO</span> Observable behavior</h4>
   <span className="behavior-style" data-behavior-style={n.styleLabel}>{n.styleLabel}</span><small>Illustrative expression, not a fixed psychological type</small>
   <p className="behavior-actions">{n.actions.join(' · ')}</p>
   <p className="human-note">People can behave differently in the same environment. Motion is synthetic; R06’s crisis is independently scripted.</p>
  </div>
  <details className="resident-comparison"><summary>Compare residents</summary>
   <label htmlFor="compare-resident">Compare {n.id} with</label>
   <select id="compare-resident" value={comparisonId} onChange={e=>setComparison(e.target.value)}>{SYNTHETIC_PROFILES.filter(p=>p.id!==n.id).map(p=><option key={p.id} value={p.id}>{p.id}</option>)}</select>
   <table><caption>Synthetic profile values · 0–1</caption><thead><tr><th>Trait</th><th>{n.id}</th><th>{comparisonId}</th></tr></thead><tbody>{n.traits.filter(t=>t.key!=='technologyFamiliarity').map(t=><tr key={t.key}><th scope="row">{t.label}</th><td>{t.value.toFixed(2)}</td><td>{other.traits.find(o=>o.key===t.key)!.value.toFixed(2)}</td></tr>)}</tbody></table>
  </details>
 </section>;
}
