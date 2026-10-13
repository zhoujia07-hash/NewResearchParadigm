"""Run with: streamlit run app.py"""
import html
import json

import streamlit as st

from triage import triage_score
from research_ui import render_research
from batch_ui import render_batch
from agents_ui import render_agents
from study_ui import render_builder, render_participant
from web_simulation import CHOICES, Simulation

st.set_page_config(page_title='New Research Paradigm', layout='wide')
st.markdown('''<style>
.block-container {max-width:1450px; padding-top:2rem;}
h1,h2,h3 {font-family:Georgia,serif;}
.pipeline {background:#eff3f7;border-left:4px solid #506880;padding:14px 20px;margin:16px 0;}
</style>''', unsafe_allow_html=True)
if st.session_state.get('participant_session') is None:
    st.title('New Research Paradigm')
    st.markdown('**AI High-Throughput Simulation + Human Long-Tail Intervention**')
    st.markdown('<div class="pipeline">AI Sandbox → Triage → Human Takeover → Hybrid Decision</div>',
                unsafe_allow_html=True)
    st.caption('Configurable snapshot workspace · fixed-seed synthetic benchmark · No LLM APIs or external services'
               if st.session_state.get('workspace') == 'Research instrument' else
               'Deterministic research prototype · 8 occupants · 5 rounds · No LLM APIs or external services')

if 'simulation' not in st.session_state:
    st.session_state.simulation = Simulation()
    st.session_state.running = False
    st.session_state.choice = None

COORDS = {
    'Entrance': (360, 365), 'North Atrium': (360, 65),
    'Junction A': (240, 180), 'Junction B': (480, 180),
    'East Corridor': (600, 180), 'West Corridor': (120, 180),
    'East Exit': (680, 180), 'West Exit': (40, 180), 'Refuge Point': (480, 315),
}


def floor_plan(sim, research_state=None, exit_blocked=None, show_legend=True):
    edges = [('Entrance', 'Junction A'), ('Entrance', 'Junction B'),
             ('Junction A', 'North Atrium'), ('Junction B', 'North Atrium'),
             ('Junction A', 'Junction B'), ('Junction B', 'East Corridor'),
             ('East Corridor', 'East Exit'), ('Junction A', 'West Corridor'),
             ('West Corridor', 'West Exit'), ('Junction B', 'Refuge Point')]
    parts = ['<svg style="width:100%;height:440px" viewBox="-20 0 760 440" role="img" aria-label="Building floor plan with eight resident markers" xmlns="http://www.w3.org/2000/svg">',
             '<rect x="-20" width="760" height="440" rx="12" fill="#f6f8fa"/>']
    for a, b in edges:
        x1, y1 = COORDS[a]
        x2, y2 = COORDS[b]
        parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#cdd6df" stroke-width="14"/>')
    if sim.decision:
        route = sim.occupants[5].route
        points = ' '.join(f'{COORDS[p][0]},{COORDS[p][1]}' for p in route)
        color = '#15803d' if sim.decision == 'A' else '#d97706'
        parts.append(f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="5" stroke-dasharray="8 5"/>')
    for name, (x, y) in COORDS.items():
        blocked = name == 'East Exit' and (sim.round >= 3 if exit_blocked is None else exit_blocked)
        color = '#fee2e2' if blocked else '#e2e8f0'
        parts.append(f'<rect x="{x-32}" y="{y-18}" width="64" height="36" rx="5" fill="{color}" stroke="#94a3b8"/>')
        parts.append(f'<text x="{x}" y="{y-30}" text-anchor="middle" font-size="12" fill="#334155">{name}</text>')
        if blocked:
            parts.append(f'<text x="{x}" y="{y+5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#b91c1c">BLOCKED</text>')
    groups = {}
    for occupant in sim.occupants:
        location = occupant.current_location if sim.round else 'Entrance'
        groups.setdefault(location, []).append(occupant)
    for location, occupants in groups.items():
        x, y = COORDS[location]
        for index, occupant in enumerate(occupants):
            dx = (index % 3 - 1) * 32
            dy = 25 + (index // 3) * 28
            critical = occupant.id == 'R06' and sim.round >= 3 and (sim.paused or sim.decision == 'B')
            uncertain = occupant.id == 'R06' and sim.decision == 'C'
            if research_state and occupant.id == 'R06':
                critical = research_state == 'HUMAN TAKEOVER'
                uncertain = research_state == 'WATCH / UNCERTAIN'
            color = '#dc2626' if critical else '#d97706' if uncertain else '#15803d'
            parts.append(f'<circle cx="{x+dx}" cy="{y+dy}" r="14" fill="{color}"/>')
            parts.append(f'<text x="{x+dx}" y="{y+dy+4}" text-anchor="middle" font-size="10" fill="white">{html.escape(occupant.id)}</text>')
    parts.append('</svg>')
    st.iframe('<html><body style="margin:0">' + ''.join(parts) + '</body></html>',
              height=440, alt='Schematic floor plan with R01–R08')
    if show_legend:
        st.caption('Green: ordinary automation · Amber: unresolved / awaiting staff · Red: critical crisis · Dashed line: submitted R06 route')


def takeover(sim):
    st.subheader('3. Long-tail crisis + human takeover')
    if sim.paused:
        st.error('HUMAN-IN-THE-LOOP TAKEOVER — Automated simulation paused.')
        st.markdown('**R06 · Triage score 0.8394 · East Exit blocked**')
        a, b = st.columns(2)
        a.markdown('**RouteAgent**\n\nContinue to East Exit\n\nShortest route; stale map')
        b.markdown('**SafetyAgent**\n\nReroute to West Exit\n\n+18 m; clear and accessible')
        a.markdown('**Sensor evidence**\n\nUWB: North Atrium\n\nCamera: Junction B\n\nBLE: East Corridor')
        b.markdown('**Resident context**\n\nOlder adult\n\nWalker\n\nBacktracked twice')
        st.caption('Confidence 0.39 · Sensor agreement 0.22 · Model disagreement 0.88 · Behavior anomaly 0.92 · Safety risk 0.96')
        for column, (code, label) in zip(st.columns(3), CHOICES.items()):
            if column.button(f'{code} — {label}', key=f'choice_{code}',
                             type='primary' if st.session_state.choice == code else 'secondary'):
                st.session_state.choice = code
                st.rerun()
        st.write(f"Selected decision: {st.session_state.choice or 'Choose A, B, or C'}")
        confidence = st.slider('Confidence (0–100)', 0, 100, 85, key='human_confidence')
        if st.button('Submit Human Decision', disabled=st.session_state.choice is None, key='submit'):
            sim.submit(st.session_state.choice, confidence)
            st.rerun()
    elif sim.decision:
        st.success(f'Human decision integrated: {sim.decision} — {CHOICES[sim.decision]} · Confidence {sim.confidence}/100. Simulation resumed.')
        st.write('R06 route: ' + ' → '.join(sim.occupants[5].route))
    else:
        st.info('Ordinary cases run automatically. Round 3 introduces one uncertain, high-risk case requiring human judgment.')


def collaboration_report(sim):
    st.subheader('4. Human-AI collaboration report')
    if not sim.finished:
        st.caption('The final report appears after Round 5. No final safety outcome is claimed before completion.')
        return
    report = sim.report()
    cols = st.columns(4)
    for col, label, value in zip(cols, ['Total observations', 'Automatically handled', 'Human escalations', 'Automation coverage'],
                                  [sim.total, sim.automatic, sim.escalations, f'{sim.coverage:.1f}%']):
        col.metric(label, value)
    st.write(f'**Human decision:** {sim.decision} — {CHOICES[sim.decision]}')
    st.write(f'**Human confidence:** {sim.confidence}/100')
    st.write('**Human corrected AI failure?** ' + ('Yes' if sim.decision == 'A' else 'No; safe evacuation not established'))
    a, b, c = st.columns(3)
    a.markdown('**AI-only**\n\n' + report['ai_only_recommendation'] + '\n\nBlocked exit; unsafe recommendation in this scripted scenario.')
    b.markdown('**Human intervention**\n\n' + CHOICES[sim.decision] + f'\n\nConfidence: {sim.confidence}/100')
    c.markdown('**Hybrid outcome**\n\n' + report['hybrid_recommendation'] + '\n\n' + report['final_safety_outcome'])
    st.info('Human-alone performance requires empirical testing.')
    st.caption('This scripted demonstration illustrates selective intervention; it does not establish comparative scientific superiority.')
    st.download_button('Download JSON report', json.dumps(report, indent=2),
                       file_name='hybrid_web_report.json', mime='application/json')


@st.fragment(run_every=2)
def dashboard():
    sim = st.session_state.simulation
    # Timer ticks may observe a pause, but cannot advance through it.
    if st.session_state.running and not sim.paused and not sim.finished:
        sim.advance()
    start, step, reset = st.columns(3)
    if start.button('Start automatic simulation', disabled=sim.round != 0, key='start'):
        st.session_state.running = True
        st.rerun()
    if step.button('Next round', disabled=sim.paused or sim.finished or st.session_state.running, key='next'):
        sim.advance()
        st.rerun()
    if reset.button('Reset simulation', key='reset'):
        st.session_state.simulation = Simulation()
        st.session_state.running = False
        st.session_state.choice = None
        st.session_state.pop('human_confidence', None)
        st.rerun()
    st.caption('Automatic mode advances every 2 seconds. Use Next round for manual inspection; all progression stops during takeover.')
    st.caption('Prototype thresholds — not empirically calibrated.')
    st.progress(sim.round / 5, text=f'Round {sim.round} / 5' if sim.round else 'Ready · 5 rounds')
    if sim.paused:
        st.warning('PAUSED — waiting for a submitted human decision')
    left, right = st.columns([1, 1.25])
    with left:
        st.subheader('1. Building sandbox')
        floor_plan(sim)
    with right:
        st.subheader('2. AI high-throughput panel')
        st.metric('AI Automation Coverage', f'{sim.coverage:.1f}%' if sim.total else '—')
        st.caption(f'{sim.automatic} / {sim.total} observations automatically handled. During pause, 7 ordinary observations await batch resumption.')
        rows = []
        for o in sim.occupants:
            rows.append({'Resident': o.id, 'Age group': o.age_group, 'Mobility': o.mobility_type,
                         'Location': o.current_location, 'Navigation confidence': o.navigation_confidence,
                         'Sensor agreement': o.sensor_agreement, 'Model disagreement': o.model_disagreement,
                         'Behavior anomaly': o.behavior_anomaly, 'Safety risk': o.safety_risk,
                         'Triage score': round(triage_score(o), 4), 'Status': sim.status(o)})
        st.dataframe(rows, hide_index=True, width='stretch')
        with st.expander('Baseline prototype triage logic (shared triage.py)'):
            st.code('score = 0.18*(1-confidence) + 0.18*(1-agreement)\n'
                    '      + 0.18*disagreement + 0.18*anomaly\n'
                    '      + 0.22*risk + 0.06*vulnerability\n\n'
                    'Takeover: score >= .62 OR risk >= .85\n'
                    'OR (disagreement >= .75 AND agreement <= .45)\n'
                    'OR anomaly >= .80')
    takeover(sim)
    collaboration_report(sim)


if st.session_state.get('participant_session') is not None:
    render_participant(floor_plan)
else:
    workspace = st.sidebar.radio('Workspace', ['Five-round demo', 'Research instrument', 'High-throughput sandbox', 'Multi-agent comparison', 'Human Study Builder'], key='workspace')
    if workspace == 'Five-round demo':
        dashboard()
    elif workspace == 'Research instrument':
        render_research(floor_plan)
    elif workspace == 'High-throughput sandbox':
        render_batch(floor_plan)
    elif workspace == 'Multi-agent comparison':
        render_agents(floor_plan)
    else:
        render_builder()
