"""Minimal visitor interface and lightweight SVG motion; no persistence."""
import json
import math
import streamlit as st

from showcase import ShowcaseStory
from web_simulation import CHOICES

NODES={'Entrance':(360,360),'North Atrium':(360,65),'Junction A':(230,190),
       'Junction B':(490,190),'East Corridor':(610,190),'West Corridor':(110,190),
       'East Exit':(710,190),'West Exit':(10,190),'Refuge Point':(490,325)}
EDGES=[('Entrance','Junction A'),('Entrance','Junction B'),('Junction A','North Atrium'),
       ('Junction B','North Atrium'),('Junction A','Junction B'),('Junction A','West Corridor'),
       ('West Corridor','West Exit'),('Junction B','East Corridor'),('East Corridor','East Exit'),('Junction B','Refuge Point')]
PATHS=[['Entrance','Junction A','North Atrium','Junction B','Entrance'],
       ['West Corridor','Junction A','North Atrium','Junction A','West Corridor'],
       ['North Atrium','Junction A','Entrance','Junction B','North Atrium'],
       ['Entrance','Junction B','North Atrium','Junction A','Entrance'],
       ['North Atrium','Junction B','East Corridor','Junction B','North Atrium'],
       ['Entrance','Junction B','East Corridor','Junction B','Entrance'],
       ['Junction A','North Atrium','Junction B','Entrance','Junction A'],
       ['Junction B','Refuge Point','Junction B','North Atrium','Junction B']]
TITLES={'idle':'A rare case. A human judgment. A different outcome.',
        'normal':'AI High-Throughput Sandbox','emerging':'Risk begins to emerge',
        'crisis':'Long-tail event','human':'Human judgment','recovery':'Hybrid recovery','result':'Collaboration result'}
CAPTIONS={'idle':'Experience why an automated system sometimes needs to stop and ask a human.',
          'normal':'Most routine navigation cases are handled automatically.',
          'emerging':'One case begins to deviate from the high-frequency norm.',
          'crisis':'Low confidence, conflicting evidence, and safety risk cross the escalation boundary.',
          'human':'Human judgment enters only at the long tail.',
          'recovery':'The human contributes only where the automated system is least reliable.',
          'result':'A selective intervention connects automated throughput with human judgment.'}


def position_at(index,seconds):
    path=PATHS[index];distance=seconds/3+index*.4
    step=int(distance);p=distance-step
    a=NODES[path[step%(len(path)-1)]];b=NODES[path[(step+1)%(len(path)-1)]]
    return (a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p)


def positions(story,lookahead=0):
    seconds=story.elapsed+(0 if story.frozen else lookahead)
    frozen_time=25 if story.stage in ('crisis','human') else min(seconds,45)
    output=[]
    for i in range(8):
        if i==5 and story.stage in ('crisis','human'):
            output.append(NODES['Junction B'])
        elif i==5 and story.simulation.decision is not None:
            route=story.simulation.occupants[5].route
            if story.choice=='B':route=['Junction B','East Corridor']
            progress=max(0,min(1,(seconds-35)/10))*(len(route)-1)
            step=min(int(progress),len(route)-2);fraction=min(1,progress-step)
            a,b=NODES[route[step]],NODES[route[step+1]]
            output.append((a[0]+(b[0]-a[0])*fraction,a[1]+(b[1]-a[1])*fraction))
        else:
            output.append(position_at(i,frozen_time))
    return output


def sandbox_html(story):
    current=positions(story);future=positions(story,.55)
    blocked=story.stage in ('crisis','human','recovery','result')
    pieces=['<svg viewBox="-55 -5 835 430" style="width:100%;height:430px" role="img" aria-label="Eight occupants in the building sandbox" xmlns="http://www.w3.org/2000/svg">',
            '<rect x="-55" y="-5" width="835" height="430" rx="18" fill="#f1f5f9"/>']
    for a,b in EDGES:
        x1,y1=NODES[a];x2,y2=NODES[b]
        pieces.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#d8e1eb" stroke-width="20" stroke-linecap="round"/>')
    if story.choice:
        route=story.simulation.occupants[5].route
        coords=' '.join(f'{NODES[n][0]},{NODES[n][1]}' for n in route)
        color='#15803d' if story.choice=='A' else '#dc2626' if story.choice=='B' else '#d97706'
        pieces.append(f'<polyline class="route-trace" points="{coords}" fill="none" stroke="{color}" stroke-width="5" stroke-dasharray="9 7"/>')
    for name,(x,y) in NODES.items():
        is_blocked=blocked and name=='East Exit'
        pieces.append(f'<rect x="{x-31}" y="{y-15}" width="62" height="30" rx="6" fill="{"#fee2e2" if is_blocked else "white"}" stroke="{"#dc2626" if is_blocked else "#94a3b8"}"/>')
        pieces.append(f'<text x="{x}" y="{y-24}" text-anchor="middle" font-size="12" fill="#334155">{name}</text>')
        if is_blocked:pieces.append(f'<text x="{x}" y="{y+4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#b91c1c">BLOCKED</text>')
    for i,(point,end) in enumerate(zip(current,future)):
        color=('#d97706' if story.stage=='emerging' else '#dc2626' if story.stage in ('crisis','human') or story.choice=='B'
               else '#d97706' if story.choice=='C' else '#15803d') if i==5 else '#15803d'
        # Fixed small offsets avoid overlapping resident labels at shared nodes.
        dx=(i%3-1)*13;dy=(i//3)*9
        pieces.append(f'<g class="resident" id="R{i+1:02d}" data-start="{point[0]+dx},{point[1]+dy}" data-end="{end[0]+dx},{end[1]+dy}" transform="translate({point[0]+dx} {point[1]+dy})">')
        pieces.append(f'<circle r="17" fill="{color}" stroke="white" stroke-width="2"/><text y="4" text-anchor="middle" font-family="system-ui" font-size="11" fill="white">R{i+1:02d}</text></g>')
    if story.stage in ('crisis','human'):
        pieces.append('<g id="pause-overlay"><rect x="450" y="5" width="300" height="76" rx="12" fill="#fff7f7" stroke="#dc2626"/><text x="600" y="34" text-anchor="middle" font-family="system-ui" font-size="19" font-weight="bold" fill="#b91c1c">AUTOMATION PAUSED</text><text x="600" y="59" text-anchor="middle" font-family="system-ui" font-size="14" fill="#b91c1c">HUMAN-IN-THE-LOOP REQUIRED</text></g>')
    pieces.append('</svg>')
    animate='false' if story.frozen else 'true'
    script='''<script>
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const moving=ANIMATE && !reduced;
document.documentElement.dataset.reducedMotion=String(reduced);
if(moving){
 const start=performance.now();
 const residents=[...document.querySelectorAll('.resident')];
 function step(now){const p=Math.min(1,(now-start)/550);
  residents.forEach(el=>{const a=el.dataset.start.split(',').map(Number),b=el.dataset.end.split(',').map(Number);
   el.setAttribute('transform',`translate(${a[0]+(b[0]-a[0])*p} ${a[1]+(b[1]-a[1])*p})`);});
  if(p<1)requestAnimationFrame(step);
 }requestAnimationFrame(step);
}
</script>'''.replace('ANIMATE',animate)
    return f'<html data-story-stage="{story.stage}" data-frozen="{str(story.frozen).lower()}">' + '<head><style>body{margin:0}.route-trace{animation:flow 1.5s linear infinite}@keyframes flow{to{stroke-dashoffset:-32}}html[data-frozen="true"] .route-trace{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.route-trace{animation:none}}</style></head><body>'+''.join(pieces)+script+'</body></html>'


def open_research():
    story=st.session_state.get('showcase_story')
    if story and story.stage not in ('idle','human') and not story.complete:
        story.pause()
    st.session_state.experience='Research Mode'
    st.session_state.workspace='Research instrument'


@st.fragment(run_every=.5)
def render_showcase():
    st.session_state.setdefault('showcase_story',ShowcaseStory())
    story=st.session_state.showcase_story
    story.tick()
    st.title('New Research Paradigm')
    st.markdown('**AI High-Throughput Simulation + Human Long-Tail Intervention**')
    st.markdown('<div class="pipeline">AI Sandbox → Triage → Human Takeover → Hybrid Decision</div>',unsafe_allow_html=True)
    st.caption('A guided fictional demonstration · about 60 seconds, plus your decision time · no account or API key needed')
    controls=st.columns([2,2,1,1])
    if controls[0].button('Start 60-second Demo',type='primary',disabled=story.stage!='idle',key='showcase_start'):
        story.start();st.rerun()
    if controls[1].button('Skip to Human Takeover',disabled=story.stage in ('human','recovery','result'),key='showcase_skip'):
        story.skip_to_takeover();st.rerun()
    if story.manual_paused:
        if controls[2].button('Resume',key='showcase_resume'):story.resume();st.rerun()
    elif controls[2].button('Pause',disabled=story.stage in ('idle','human') or story.complete,key='showcase_pause'):
        story.pause();st.rerun()
    if controls[3].button('Reset',key='showcase_reset'):
        story.reset();st.session_state.pop('showcase_confidence',None);st.rerun()
    stage_index=0 if story.stage=='idle' else ['normal','emerging','crisis','human','recovery','result'].index(story.stage)+1
    st.caption(f'STAGE {stage_index} / 6 · '+('Awaiting your decision — story timer paused' if story.stage=='human' else 'Paused by viewer' if story.manual_paused else 'Story complete' if story.complete else TITLES[story.stage]))
    st.subheader(TITLES[story.stage])
    st.write(CAPTIONS[story.stage])
    metrics=st.columns(3)
    metrics[0].metric('Virtual occupants',8)
    metrics[1].metric('Automation', 'PAUSED' if story.stage in ('crisis','human') or story.manual_paused else 'COMPLETE' if story.stage=='result' else 'ACTIVE' if story.stage!='idle' else 'READY')
    metrics[2].metric('Human interventions',story.simulation.escalations)
    st.iframe(sandbox_html(story),height=435,alt='Animated building sandbox')
    if story.stage in ('idle','normal'):
        st.success('HEAD / AUTO — routine cases remain green.')
    elif story.stage=='emerging':
        st.warning('R06 · Risk emerging — monitoring, still automatically handled')
        f=story.factors
        st.caption(f'Navigation confidence {f.navigation_confidence:.2f} · Sensor agreement {f.sensor_agreement:.2f} · Behavior anomaly {f.behavior_anomaly:.2f} · Model disagreement {f.model_disagreement:.2f}')
    elif story.stage=='crisis':
        st.error('AUTOMATION PAUSED — a long-tail case needs human judgment.')
        st.caption('R06: older adult · walker · backtracked twice · East Exit blocked · Triage score 0.8394')
    elif story.stage=='human':
        st.error('HUMAN-IN-THE-LOOP REQUIRED — choose a response to continue.')
        left,right=st.columns(2)
        left.markdown('**RouteAgent**\n\nContinue to East Exit\n\n(shortest route; stale map)')
        right.markdown('**SafetyAgent**\n\nReroute to West Exit\n\n(+18 m; clear and accessible)')
        left.markdown('**Sensor conflict**\n\nUWB: North Atrium · Camera: Junction B · BLE: East Corridor')
        right.markdown('**Resident**\n\nOlder adult · Walker · Backtracked twice')
        for col,(choice,label) in zip(st.columns(3),CHOICES.items()):
            if col.button(choice+' — '+label,key='showcase_choice_'+choice,type='primary' if story.choice==choice else 'secondary'):
                story.choice=choice;st.rerun()
        st.caption('Your choice: '+(story.choice or 'not selected'))
        confidence=st.slider('Confidence (0–100)',0,100,85,key='showcase_confidence')
        if st.button('Submit Human Decision',disabled=story.choice is None,key='showcase_submit'):
            story.submit(story.choice,confidence);st.rerun()
    elif story.stage=='recovery':
        st.success('Human intervention accepted · Simulation resumed')
        st.write('R06 route: '+' → '.join(story.simulation.occupants[5].route))
        if story.choice=='B':st.error('Selected consequence: the East approach remains blocked; safe evacuation is not established.')
        if story.choice=='C':st.warning('Selected consequence: wait at Refuge Point and call staff; evacuation remains pending.')
    elif story.stage=='result':
        report=story.report()
        for col,label,key in zip(st.columns(4),['Total observations','Automatically handled','Human escalations','Automation coverage'],
                                 ['total_observations','automatically_handled_observations','human_escalations','automation_coverage_percent']):
            col.metric(label,str(report[key])+('%' if key.endswith('percent') else ''))
        a,b,c=st.columns(3)
        a.markdown('**AI-only**\n\nEast Exit\n\nShortest route; stale map. The exit is blocked.')
        b.markdown('**Human judgment**\n\n'+story.choice+' — '+CHOICES[story.choice]+f'\n\nConfidence {story.simulation.confidence}/100')
        c.markdown('**Hybrid process**\n\n'+report['final_safety_outcome'])
        st.info('97.5% is a scripted prototype result, not a real-world automation estimate.')
        st.info('Human-alone and Hybrid performance require empirical validation.')
    if st.button('Open Research Instrument',key='open_research'):
        open_research()
        st.rerun(scope='app')
