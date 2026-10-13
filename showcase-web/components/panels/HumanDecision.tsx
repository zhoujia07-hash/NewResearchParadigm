import { CHOICES,type Choice,type Story } from '@/lib/story';
export default function HumanDecision({story,choice,confidence,onChoice,onConfidence,onSubmit}:{story:Story;choice:Choice|null;confidence:number;onChoice:(c:Choice)=>void;onConfidence:(n:number)=>void;onSubmit:()=>void}){
 return <>      {story.stage==='human'&&<section className="takeover" aria-labelledby="decision-title">
        <div className="decision-heading"><span className="eyebrow">YOUR TURN · NO TIME LIMIT</span><h2 id="decision-title">Choose the next step for R06.</h2><p>Older adult · Walker · Backtracked twice. East Exit is blocked.</p></div>
        <div className="evidence"><div><span className="eyebrow">ROUTEAGENT</span><h3>Continue to East Exit</h3><p>Shortest route; stale map</p></div><div><span className="eyebrow">SAFETYAGENT</span><h3>Reroute to West Exit</h3><p>+18 m; clear and accessible</p></div><div><span className="eyebrow">SENSOR CONFLICT</span><p>UWB: North Atrium<br/>Camera: Junction B<br/>BLE: East Corridor</p></div></div>
        <fieldset className="choices"><legend>Your judgment</legend>{(['A','B','C'] as Choice[]).map(c=><label key={c} className={choice===c?'chosen':''}><input type="radio" name="decision" value={c} checked={choice===c} onChange={()=>onChoice(c)}/><b>{c}</b><span>{CHOICES[c]}</span></label>)}</fieldset>
        <div className="submit-row"><div className="confidence"><label htmlFor="confidence">Confidence <strong><output htmlFor="confidence">{confidence}</output> / 100</strong></label><input id="confidence" aria-label="Confidence" type="range" min="0" max="100" value={confidence} onChange={e=>onConfidence(Number(e.target.value))}/></div><button className="primary" disabled={!choice} onClick={onSubmit}>Submit Human Decision <span aria-hidden>→</span></button></div>
      </section>}
</>;
}
