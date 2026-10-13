import json
import altair as alt
import streamlit as st

from batch_simulation import (STRATEGIES, generate_batch, classify_batch, describe_batch,
                              associations, discover_cases, select_study_cases, study_csv)
from research_config import DEFAULT_SETTINGS
from synthetic_cases import threshold_sweep
from triage import DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, TriageConfig, assess
from web_simulation import Simulation, PATHS


def replay_case(case, floor_plan, config=None):
    from synthetic_cases import factors_from_case
    a=assess(factors_from_case(case),config)
    sim=Simulation();sim.round=1
    for i,o in enumerate(sim.occupants):
        o.current_location=PATHS[i][0]
    sim.occupants[5].current_location='Junction B'
    floor_plan(sim,research_state=a.state,exit_blocked=case['exit_blocked'])
    st.write(f"{case['case_id']} · {case['age_group']} · {case['mobility']} · {a.state} · Score {a.score:.4f}")
    st.caption(f"Blocked path: {case.get('blocked_path',False)} · Crowd: {case['crowd_density']} · Emergency: {case['emergency']}")


@st.cache_data(show_spinner=False)
def evaluated_batch(seed,count,weights,thresholds):
    cases=generate_batch(seed,count); config=TriageConfig(weights,thresholds)
    rows=classify_batch(cases,config)
    return cases,rows,threshold_sweep(cases,config)


def render_batch(floor_plan):
    st.header('Milestone 4 — High-Throughput Digital Sandbox')
    st.info('SIMULATED EVIDENCE — condition-space exploration and experiment prioritization; not human behavioral data.')
    with st.sidebar:
        seed=st.number_input('Batch random seed',0,2**32-1,42,key='batch_seed')
        count=st.selectbox('Scenario count',[100,500,1000,5000],index=1,key='batch_count')
        main=st.slider('Batch main threshold',0.0,1.0,0.62,0.01,key='batch_threshold')
        st.caption('Uses the Research instrument weights and mandatory cutoffs when set; main threshold controlled here.')
    try:
        model=TriageConfig({k:st.session_state.get('w_'+k,v) for k,v in DEFAULT_WEIGHTS.items()},
                       {k:main if k=='main' else st.session_state.get('t_'+k,v) for k,v in DEFAULT_THRESHOLDS.items()})
    except ValueError as exc:
        st.error(str(exc)); return
    if st.button('Generate Batch',key='generate_batch'):
        st.session_state.batch_run=(seed,count)
    run=st.session_state.get('batch_run')
    if not run:
        st.write('AI simulates many → triage discovers informative tail cases → humans test selected conditions.')
        return
    if run!=(seed,count):
        st.warning('Seed/count changed. Generate Batch to replace the displayed sample.')
    cases,rows,frontier=evaluated_batch(*run,model.weights,model.thresholds)
    st.session_state.batch_cases=cases
    summary=describe_batch(rows)
    st.subheader('Head → Uncertain → Long Tail')
    for col,name in zip(st.columns(3),['HEAD / AUTO','WATCH','LONG-TAIL / HUMAN']):
        col.metric(name,f"{summary['percentages'][name]:.1f}%",f"{summary['counts'].get(name,0)} cases",delta_color='off')
    chart=alt.Chart(alt.InlineData(values=rows)).mark_bar(color='#506880').encode(
        x=alt.X('triage_score:Q',bin=alt.Bin(maxbins=30),title='Triage score'),y=alt.Y('count():Q',title='Cases'),
        color=alt.Color('category:N',scale=alt.Scale(domain=['HEAD / AUTO','WATCH','LONG-TAIL / HUMAN'],range=['#15803d','#d97706','#dc2626'])))
    st.altair_chart(chart.properties(height=250),width='stretch')
    st.dataframe([{'Reason':k,'Cases triggered':v} for k,v in summary['reasons'].items()],hide_index=True)
    st.subheader('Factor Analysis — descriptive associations only')
    rate_rows=associations(cases,rows)
    st.altair_chart(alt.Chart(alt.InlineData(values=rate_rows)).mark_bar(color='#506880').encode(
        x='Group:N',y=alt.Y('Escalation rate %:Q',scale=alt.Scale(domain=[0,100])),
        column=alt.Column('Factor:N',header=alt.Header(labelLimit=200)),tooltip=['Cases:Q','Escalation rate %:Q']).properties(width=150,height=180))
    st.caption('Independent synthetic metadata and factors; descriptive associations are not causal effects. WATCH is automatically handled under the unchanged core.')
    st.subheader('Coverage / Risk Frontier')
    for r in frontier:
        r['Interventions per 1,000']=10*r['Human escalation rate %']
    st.altair_chart(alt.Chart(alt.InlineData(values=frontier)).mark_line(point=True).encode(
        x=alt.X('Automation coverage %:Q',scale=alt.Scale(domain=[0,100])),
        y=alt.Y('Critical-case recall %:Q',scale=alt.Scale(domain=[0,100])),order='Threshold:Q',
        tooltip=['Threshold:Q','Missed critical cases:Q','False escalations:Q','Interventions per 1,000:Q']).properties(height=260),width='stretch')
    st.dataframe(frontier,hide_index=True,width='stretch')
    st.caption('Select a threshold with the sidebar slider; mandatory rules remain active. Ground truth is the same transparent synthetic critical-label rule as Milestone 3.')
    st.subheader('Top 20 difficult cases')
    st.caption('Difficulty = mean(score, disagreement, risk, sensor conflict, boundary ambiguity). Boundary ambiguity = 1 − min(1, |score − threshold| / .2). Exploratory ranking, not a validated difficulty model.')
    top=discover_cases(rows)
    st.dataframe(top,hide_index=True,width='stretch',height=250)
    case_id=st.selectbox('Replay case',[r['case_id'] for r in top],key='batch_replay')
    replay_case(next(c for c in cases if c['case_id']==case_id),floor_plan,model)
    st.subheader('Select Cases for Human Study')
    strategy=st.selectbox('Selection strategy',STRATEGIES,key='sampling_strategy')
    n=st.number_input('Number of study cases',1,100,20,key='sampling_count')
    chosen=select_study_cases(cases,model,strategy,n,run[0])
    st.session_state.study_case_pool=chosen
    st.caption(f'{len(chosen)} unique conditions selected from escalated long-tail cases. If the pool is smaller, all available cases are returned. Empty selections are reported without fabricated cases.')
    st.dataframe([{'Condition ID':c['condition_id'],'Case ID':c['case_id'],'Score':c['triage_score'],'Strategy':strategy} for c in chosen],hide_index=True)
    st.download_button('Export human study cases CSV',study_csv(chosen),'human_study_cases.csv','text/csv',on_click='ignore')
    st.download_button('Export human study cases JSON',json.dumps(chosen,indent=2),'human_study_cases.json','application/json',on_click='ignore')
