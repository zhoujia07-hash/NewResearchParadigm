import json
import os
import streamlit as st
from research_config import PRESETS, preset_settings
from agents.concordia_adapter import run_agents
from triage import assess
from synthetic_cases import factors_from_case
from batch_ui import replay_case


def render_agents(floor_plan):
    st.header('Milestone 5 — Multi-Agent Integration')
    st.warning('Agent simulation validity must be evaluated against human behavior.')
    name=st.selectbox('Agent scenario',list(PRESETS),index=4,key='agent_scenario')
    engine=st.radio('Simulation Engine',['Deterministic','Concordia / LLM'],key='agent_engine')
    mode=st.selectbox('LLM mode',['mock','real'],index=1 if os.environ.get('LLM_MODE')=='real' else 0,key='agent_mode')
    st.caption('Default engine is Deterministic. Mock uses scripted structured proposals through Concordia when installed; it is not an LLM result. Real mode makes provider requests only after Run Agent Comparison.')
    scenario=dict(preset_settings(name),case_id='agent-'+name,condition_id='agent-'+name)
    st.caption('Provider credentials: '+('present' if os.environ.get('LLM_API_KEY') else 'absent')+' · Model: '+('configured' if os.environ.get('LLM_MODEL') else 'not configured'))
    if st.button('Run Agent Comparison',key='run_agents'):
        st.session_state.agent_result=(name,engine,mode,run_agents(scenario,mode) if engine!='Deterministic' else None)
    stored=st.session_state.get('agent_result')
    if not stored: return
    old_name,old_engine,old_mode,result=stored
    if (old_name,old_engine,old_mode)!=(name,engine,mode):
        st.warning('Controls changed. Run Agent Comparison to refresh results.')
    scenario=dict(preset_settings(old_name),case_id='agent-'+old_name)
    baseline=assess(factors_from_case(scenario))
    if result is None:
        st.info('Deterministic only — no generative proposals requested.')
        replay_case(scenario,floor_plan)
        st.metric('Deterministic triage',f'{baseline.score:.4f}')
        return
    st.info(f"Backend: {result['backend']} · Mode: {result['mode']} (SIMULATED EVIDENCE)")
    if result['notice']: st.warning(result['notice'])
    if result['fallback']: st.warning('Structured-output/provider failure: deterministic triage fallback. '+', '.join(result['failures']))
    st.subheader('Agent recommendation matrix')
    rows=[{'Agent':r,**p,'Environment-admissible?':result['admissible'][r]} for r,p in result['recommendations'].items()]
    st.dataframe(rows,hide_index=True,width='stretch')
    st.metric('Model disagreement score',f"{result['disagreement']:.4f}")
    st.caption('Disagreement = pairwise route mismatches / 3 pairs among RouteAgent, SafetyAgent, AccessibilityAgent. Resident and GameMaster are excluded. Three distinct routes produce 1.0; one minority route produces 2/3.')
    st.subheader('Deterministic vs Generative Agent Comparison')
    st.dataframe([{'Engine':'Deterministic','Route':'East Exit (baseline RouteAgent)','Confidence':scenario['route_agent_confidence'],
                   'Disagreement':scenario['model_disagreement'],'Score':baseline.score,'Outcome':baseline.state},
                  {'Engine':result['backend']+' / '+result['mode'],'Route':result['recommendations']['RouteAgent']['route_choice'],
                   'Confidence':result['recommendations']['RouteAgent']['confidence'],'Disagreement':result['triage_inputs']['model_disagreement'],
                   'Score':result['triage_score'],'Outcome':result['state']}],hide_index=True,width='stretch')
    replay_case({**scenario,**result['triage_inputs']},floor_plan)
    st.caption('Environment topology, obstacles and emergency state are controlled deterministically. Agents submit proposals only; free-form text cannot execute routes or modify the triage equation.')
    st.download_button('Export agent comparison',json.dumps(result,indent=2),'agent_comparison.json','application/json',on_click='ignore')
