import type {Stage,Story} from '@/lib/story';
const STAGES: Stage[]=['intro','normal','emerging','crisis','human','recovery','result'];
const TITLES:Record<Stage,string>={idle:'One rare case changes the story.',intro:'A building. Eight people. One shared journey.',
 normal:'AI handles the ordinary.',emerging:'One case begins to diverge.',crisis:'The safest action is to pause.',
 human:'This is where your judgment matters.',recovery:'The hybrid system resumes.',result:'Throughput meets human judgment.'};
const CAPTIONS:Record<Stage,string>={idle:'Explore a guided, fictional navigation story. You make one decision where automation reaches its limit.',
 intro:'Grey connections form walkable corridors. The same eight virtual occupants remain throughout the story.',
 normal:'Most routine navigation cases are handled automatically. R01–R08 move through the building.',
 emerging:'R06 loses navigation confidence as evidence begins to conflict. The case is still monitored automatically.',
 crisis:'AI agents disagree. Low confidence, conflicting evidence and safety risk cross the escalation boundary.',
 human:'The story clock is stopped. Compare the evidence and decide what R06 should do next.',
 recovery:'Human intervention accepted. Simulation resumed under your selected decision.',
 result:'A single selective intervention completes the five-round scripted demonstration.'};

export default function StoryControls({story,onStart,onPause,onSkip,onReset}:{story:Story;onStart:()=>void;onPause:()=>void;onSkip:()=>void;onReset:()=>void}){
 const stageIndex=STAGES.indexOf(story.stage);return <>      <div className="story-heading"><div><p className="eyebrow">{story.stage==='idle'?'THE 60-SECOND EXPERIENCE':`STAGE ${stageIndex+1} / 7`}</p><h2>{TITLES[story.stage]}</h2><p className="caption" role="status">{CAPTIONS[story.stage]}</p></div>
        <div className="clock"><strong>{Math.floor(story.elapsed).toString().padStart(2,'0')}<small> / 55s</small></strong><span>{story.stage==='human'?'Waiting for your decision':story.paused?'Manually paused':story.complete?'Story complete':'Active story time'}</span></div></div>
      <div className="progress" role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={55} aria-valuenow={Math.floor(story.elapsed)}><span style={{width:`${story.elapsed/55*100}%`}}/></div>
      <div className="controls">
        <button className="primary" onClick={onStart} disabled={story.stage!=='idle'}>Start 60-second Demo <span aria-hidden>→</span></button>
        <button onClick={onPause} disabled={['idle','human','result'].includes(story.stage)}>{story.paused?'Resume':'Pause'}</button>
        <button onClick={onSkip} disabled={story.stage==='human'||story.choice!==null}>Skip to Human Takeover</button>
        <button className="reset" onClick={onReset}>Reset <span aria-hidden>↺</span></button>
        <span className="timing-note">About 60 seconds + your decision time</span>
      </div>
</>;
}
