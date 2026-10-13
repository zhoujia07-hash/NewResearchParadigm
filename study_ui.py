"""Research builder, isolated participant pilot and descriptive results."""
import json,time
import streamlit as st

from batch_simulation import STRATEGIES
from experiment.study_builder import build_protocol,CONDITIONS,EXPLANATIONS,MEASURES
from experiment.participant import StudySession
from experiment.storage import PilotStore,csv_records
from experiment.analysis import analyze,import_results
from triage import DEFAULT_WEIGHTS,DEFAULT_THRESHOLDS,TriageConfig
from web_simulation import Simulation,PATHS

CHOICES=['A — West Exit','B — East Exit','C — Refuge Point and call staff']


def render_results(records):
    st.header('Results Dashboard')
    st.warning('No scientific conclusion can be drawn until empirical human data are collected.')
    if not records:
        st.info('No pilot records loaded. Run a pilot or import an exported JSON/CSV file.');return
    results=analyze(records)
    st.info('PROTOTYPE / SYNTHETIC PILOT DATA — sources: '+', '.join(results['sources'])+'. Not human empirical evidence.')
    st.dataframe(results['conditions'],hide_index=True,width='stretch')
    gain=results['complementarity_gain']
    st.metric('Complementarity Gain',f'{100*gain:.1f} percentage points' if gain is not None else 'N/A — all three conditions required')
    st.caption('Hybrid accuracy − max(AI-only accuracy, Human-only accuracy). Descriptive pilot arithmetic only; no superiority claim. Missing human choices are not counted as human responses; automated trials have no human RT.')
    st.dataframe(results['categories'],hide_index=True,width='stretch')
    st.download_button('Export pilot JSON',json.dumps(records,indent=2),'pilot_trials.json','application/json',on_click='ignore')
    st.download_button('Export pilot CSV',csv_records(records),'pilot_trials.csv','text/csv',on_click='ignore')


def launch_pilot():
    protocol=st.session_state.study_protocol
    store=PilotStore();session_id,participant_id=store.create_session(protocol)
    source='automated_browser_pilot' if st.session_state.get('builder_automated') else 'prototype_pilot'
    st.session_state.participant_session=StudySession(protocol,session_id,participant_id,source)
    st.session_state.pop('pilot_consent',None)


def render_builder():
    st.header('Human Study Builder')
    st.info('Generate anonymous prototype trials from selected synthetic long-tail cases. No personal data is collected.')
    n=st.number_input('Number of trials per condition',1,20,1,key='builder_n')
    strategy=st.selectbox('Case sampling strategy',STRATEGIES,key='builder_strategy')
    conditions=st.multiselect('Experimental conditions',CONDITIONS,default=CONDITIONS,key='builder_conditions')
    explanations=st.multiselect('Explanation conditions',EXPLANATIONS,default=['Full explanation'],key='builder_explanations')
    seed=st.number_input('Study random seed',0,2**32-1,42,key='builder_seed')
    measures=st.multiselect('Optional post-trial measures',MEASURES,key='builder_measures')
    show_timer=st.checkbox('Show reaction timer to participant',key='builder_timer')
    source=st.selectbox('Study agent source',['Deterministic','Concordia mock'],key='builder_source')
    st.checkbox('Label this session as automated test data',key='builder_automated')
    pool=st.session_state.get('study_case_pool')
    st.caption('Using the current batch study-case pool.' if pool is not None else 'No batch pool selected: generate a seeded 500-case space and sample its tails.')
    if st.button('Generate Experiment',key='generate_study'):
        try:
            model=TriageConfig({k:st.session_state.get('w_'+k,v) for k,v in DEFAULT_WEIGHTS.items()},
                               {k:st.session_state.get('t_'+k,v) for k,v in DEFAULT_THRESHOLDS.items()})
            st.session_state.study_protocol=build_protocol(n,conditions,explanations,seed,strategy,pool,model,measures,show_timer,source)
        except ValueError as exc:st.error(str(exc))
    protocol=st.session_state.get('study_protocol')
    if protocol:
        st.success(f"Experiment generated: {len(protocol['trials'])} trials · Seed {protocol['seed']} · {protocol['actual_trials_per_condition']} cases per condition")
        st.caption('Controls do not mutate a generated protocol. Generate Experiment again after changing settings.')
        st.dataframe([{'Trial':t['trial_number'],'Case':t['case_id'],'Condition':t['condition'],'Explanation':t['explanation_condition']} for t in protocol['trials']],hide_index=True)
        st.download_button('Export experiment protocol',json.dumps(protocol,indent=2),'experiment_protocol.json','application/json',on_click='ignore')
        st.button('Launch Pilot Participant',on_click=launch_pilot,key='launch_pilot')
    st.divider()
    uploaded=st.file_uploader('Import pilot results',type=['json','csv'],key='pilot_import')
    if uploaded is not None:
        try:
            records=import_results(uploaded.getvalue().decode('utf-8'),uploaded.name.rsplit('.',1)[-1])
            st.session_state.pilot_results=records
        except (ValueError,UnicodeError) as exc:st.error(str(exc))
    render_results(st.session_state.get('pilot_results',[]))


def participant_map(trial,floor_plan,hybrid):
    sim=Simulation();sim.round=1
    for i,o in enumerate(sim.occupants):o.current_location=PATHS[i][0]
    sim.occupants[5].current_location='Junction B'
    floor_plan(sim,research_state='HUMAN TAKEOVER' if hybrid and trial['escalated'] else 'PARTICIPANT',
               exit_blocked=trial['case']['exit_blocked'],show_legend=False)


def render_participant(floor_plan):
    session=st.session_state.participant_session
    st.title('Spatial Decision Pilot')
    st.caption('Anonymous participant '+session.participant_id+' · Prototype pilot, not an approved human study')
    if session.stage=='consent':
        st.header('Consent placeholder')
        st.warning('Formal human-subject research requires institutionally approved consent and ethics procedures.')
        st.write('This is a software demonstration using fictional occupants. Do not enter names, email addresses, health details or identifying information. Only route choices, confidence and response timing are recorded locally under an anonymous ID.')
        agreed=st.checkbox('I understand this is a prototype pilot, not approved human-subject research.',key='pilot_consent')
        if st.button('Continue to instructions',disabled=not agreed):
            session.stage='instructions';st.rerun()
        return
    if session.stage=='instructions':
        st.header('Instructions')
        st.write('Inspect the fictional spatial situation and choose West Exit (A), East Exit (B), or Refuge Point and call staff (C). Some trials are AI-only; these require no human judgment. Human-only trials hide AI recommendations. Selective-takeover trials ask you to judge only when triage escalates.')
        st.write('Confidence ranges from 0 to 100. The timer is hidden unless the researcher enabled it. There is no correctness feedback between trials.')
        if st.button('Start trials'):
            session.stage='trials';st.rerun()
        return
    if session.finished:
        records=PilotStore().records(session.session_id)
        st.session_state.pilot_results=records
        st.success('Pilot complete — anonymous trial results saved as SQLite, JSON and CSV.')
        render_results(records)
        if st.button('Return to researcher'):
            st.session_state.participant_session=None
            st.session_state.workspace='Human Study Builder'
            st.rerun()
        return
    session.begin_trial()
    t=session.trial;hybrid=t['condition']==CONDITIONS[2]
    st.header(f"Trial {session.index+1} / {len(session.protocol['trials'])}")
    st.caption(t['condition'])
    if hybrid and t['escalated']:st.error('HUMAN-IN-THE-LOOP TAKEOVER — automatic decision paused.')
    c=t['case']
    st.write(f"Fictional resident at Junction B · {c['age_group']} · {c['mobility']}. East Exit {'blocked' if c['exit_blocked'] else 'open'}; East approach {'blocked' if c.get('blocked_path') else 'open'}. West Exit clear and accessible; refuge available. Emergency: {c['emergency']}.")
    participant_map(t,floor_plan,hybrid)
    if hybrid and session.needs_human:
        explanation=t['explanation_condition']
        st.write('AI recommendation: '+CHOICES['ABC'.index(t['AI_recommendation'])])
        if explanation in (EXPLANATIONS[1],EXPLANATIONS[4]):st.write(f"AI confidence: {t['AI_confidence']:.0%}")
        if explanation in (EXPLANATIONS[2],EXPLANATIONS[4]):
            st.write('Sensor evidence: '+('UWB: North Atrium · Camera: Junction B · BLE: East Corridor' if c['force_sensor_conflict'] else 'All locations: North Atrium')+f" · Sensor agreement {c['sensor_agreement']:.2f}")
        if explanation in (EXPLANATIONS[3],EXPLANATIONS[4]):
            st.dataframe([{'Agent':r,'Route':t['agent_recommendations'][r]['route_choice']} for r in ['RouteAgent','SafetyAgent','AccessibilityAgent']],hide_index=True)
        if explanation==EXPLANATIONS[4]:
            st.write('Why takeover: '+t['long_tail_category'])
        st.caption('Information condition: '+explanation)
    if session.protocol['show_timer']:
        st.caption(f'Elapsed: {time.perf_counter()-session.started:.1f} seconds (server timer)')
    if session.needs_human:
        chosen=st.radio('Your spatial decision',CHOICES,index=None,key=f'pilot_choice_{session.session_id}_{session.index}')
        confidence=st.slider('Confidence (0–100)',0,100,85,key=f'pilot_confidence_{session.session_id}_{session.index}')
        values={}
        for measure in session.protocol['measures']:
            v=st.number_input(measure+' (optional, 0–100)',0,100,value=None,step=1,key=f'pilot_measure_{session.index}_{measure}')
            if v is not None:values[measure]=v
        if st.button('Submit decision',disabled=chosen is None,key=f'pilot_submit_{session.index}'):
            session.submit(PilotStore(),chosen[0],confidence,values,expected_index=session.index);st.rerun()
    else:
        st.info('AI automatic decision: '+CHOICES['ABC'.index(t['AI_recommendation'])]+'. No human response or human RT is recorded.')
        if st.button('Continue automated trial',key=f'pilot_auto_{session.index}'):
            session.submit(PilotStore(),expected_index=session.index);st.rerun()
