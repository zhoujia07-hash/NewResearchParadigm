"""Streamlit research workspace, independent of the five-round demo state."""
from dataclasses import asdict
import json

import altair as alt
import streamlit as st

from research_config import (DEFAULT_SETTINGS, ENUMS, PRESETS, default_experiment,
                             effective_factors, import_experiment, preset_settings,
                             settings_from_case, validate_experiment)
from synthetic_cases import (GROUND_TRUTH, evaluate_threshold, generate_cases,
                             inspect_cases, sweep_csv, threshold_sweep)
from triage import DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, FACTOR_LABELS, TriageConfig, assess
from web_simulation import PATHS, Simulation

LABELS = dict(
    age_group='Age group', mobility='Mobility', familiarity='Familiarity with building',
    sense_of_direction='Self-reported sense of direction', cognitive_vulnerability='Cognitive vulnerability',
    vulnerability='Vulnerability (direct factor)', navigation_confidence='Navigation confidence',
    backtracking_count='Backtracking count', hesitation='Hesitation level', route_progress='Route progress',
    behavior_anomaly='Behavior anomaly (direct factor)', uwb_confidence='UWB confidence',
    camera_confidence='Camera confidence', ble_confidence='BLE confidence', sensor_agreement='Sensor agreement',
    force_sensor_conflict='Force sensor location conflict', route_agent_confidence='RouteAgent confidence',
    safety_agent_confidence='SafetyAgent confidence', accessibility_agent_confidence='AccessibilityAgent confidence',
    model_disagreement='Model disagreement', safety_risk='Safety risk', building_complexity='Building complexity',
    crowd_density='Crowd density', exit_blocked='Exit blocked', emergency='Emergency condition',
    context_mapping='Enable prototype context-to-factor mapping',
)
THRESHOLD_LABELS = dict(main='Main triage threshold', safety='Mandatory safety escalation',
                        disagreement='Disagreement escalation', agreement='Sensor agreement cutoff',
                        behavior='Behavior anomaly escalation')


def initialize():
    defaults = default_experiment()
    for key, value in defaults['settings'].items():
        st.session_state.setdefault('r_'+key, value)
    for key, value in DEFAULT_WEIGHTS.items():
        st.session_state.setdefault('w_'+key, value)
    for key, value in DEFAULT_THRESHOLDS.items():
        st.session_state.setdefault('t_'+key, value)
    st.session_state.setdefault('research_seed', 42)
    st.session_state.setdefault('research_count', 500)
    st.session_state.setdefault('selected_case', None)
    st.session_state.setdefault('selected_case_seed', None)
    st.session_state.setdefault('benchmark', None)


def apply_settings(settings, selected_case=None):
    for key, value in settings.items():
        st.session_state['r_'+key] = value
    st.session_state.selected_case = selected_case
    st.session_state.selected_case_seed = None


def use_preset(name):
    apply_settings(preset_settings(name))


def use_case(case, seed):
    apply_settings(settings_from_case(case), case)
    st.session_state.selected_case_seed = seed


def normalize_controls():
    try:
        from triage import normalize_weights
        weights = normalize_weights({k:st.session_state['w_'+k] for k in DEFAULT_WEIGHTS})
        for key, value in weights.items():
            st.session_state['w_'+key] = value
        st.session_state.pop('research_error', None)
    except ValueError as exc:
        st.session_state.research_error = str(exc)


def import_controls():
    uploaded = st.session_state.get('research_import')
    if uploaded is None:
        st.session_state.research_error = 'Choose an experiment_config.json file first.'
        return
    try:
        config = import_experiment(uploaded.getvalue().decode('utf-8'))
        apply_settings(config['settings'])
        for key, value in config['weights'].items():
            st.session_state['w_'+key] = value
        for key, value in config['thresholds'].items():
            st.session_state['t_'+key] = value
        st.session_state.research_seed = config['seed']
        st.session_state.research_count = config['case_count']
        st.session_state.benchmark = None
        st.session_state.pop('research_error', None)
        st.session_state.research_notice = 'Configuration imported. Benchmark cleared; run a new sweep.'
    except (ValueError, UnicodeError) as exc:
        st.session_state.research_error = str(exc)


def settings_widget(name):
    key = 'r_'+name
    if name in ENUMS:
        st.selectbox(LABELS[name], ENUMS[name], key=key)
    elif type(DEFAULT_SETTINGS[name]) is bool:
        st.checkbox(LABELS[name], key=key)
    elif name == 'backtracking_count':
        st.slider(LABELS[name], 0, 5, key=key)
    else:
        st.slider(LABELS[name], 0.0, 1.0, step=0.01, key=key)


def controls():
    with st.sidebar:
        st.header('Research Controls')
        st.caption('Changes apply only to the research workspace. The five-round demonstration retains its defaults.')
        groups = [
            ('Participant / resident profile', ['age_group', 'mobility', 'familiarity', 'sense_of_direction', 'cognitive_vulnerability', 'vulnerability']),
            ('Navigation state', ['navigation_confidence', 'backtracking_count', 'hesitation', 'route_progress', 'behavior_anomaly']),
            ('Sensor state', ['uwb_confidence', 'camera_confidence', 'ble_confidence', 'sensor_agreement', 'force_sensor_conflict']),
            ('Multi-agent AI state', ['route_agent_confidence', 'safety_agent_confidence', 'accessibility_agent_confidence', 'model_disagreement']),
            ('Safety / environmental state', ['safety_risk', 'building_complexity', 'crowd_density', 'exit_blocked', 'emergency', 'context_mapping']),
        ]
        for title, names in groups:
            with st.expander(title, expanded=title == 'Participant / resident profile'):
                for name in names:
                    settings_widget(name)
        with st.expander('Triage weights', expanded=False):
            for key in DEFAULT_WEIGHTS:
                st.slider('w_'+key, 0.0, 1.0, step=0.01, key='w_'+key)
            st.button('Normalize weights', on_click=normalize_controls)
            raw_sum = sum(st.session_state['w_'+k] for k in DEFAULT_WEIGHTS)
            st.caption(f'Raw weight sum: {raw_sum:.6f}. Effective weights are normalized to 1. The button writes them back to the controls.')
        with st.expander('Escalation thresholds', expanded=False):
            for key in DEFAULT_THRESHOLDS:
                st.slider(THRESHOLD_LABELS[key], 0.0, 1.0, step=0.01, key='t_'+key)
            st.caption('Prototype thresholds — not empirically calibrated.')
        st.number_input('Random seed', min_value=0, max_value=2**32-1, step=1, key='research_seed')
        st.number_input('Synthetic case count', min_value=200, max_value=2000, step=100, key='research_count')
        st.file_uploader('Import experiment_config.json', type=['json'], key='research_import')
        st.button('Import configuration', on_click=import_controls)
    settings = {k:st.session_state['r_'+k] for k in DEFAULT_SETTINGS}
    model = TriageConfig({k:st.session_state['w_'+k] for k in DEFAULT_WEIGHTS},
                         {k:st.session_state['t_'+k] for k in DEFAULT_THRESHOLDS})
    return settings, model


def mapping_note(settings, factors):
    if settings['context_mapping']:
        st.warning('Optional context mapping is ON — uncalibrated, deterministic stress-test assumptions, not measured demographic effects.')
        with st.expander('Exact prototype context mapping', expanded=False):
            st.code('Vulnerability = max(direct, cognitive, mobility floor, age floor, 1-familiarity, 1-direction)\n'
                    'Mobility floors: independent .10, cane .35, walker .65, wheelchair .75\n'
                    'Age floors: young .10, middle-aged .20, older adult .60\n'
                    'Behavior = max(direct, hesitation, backtracks/5, (1-progress)*hesitation)\n'
                    'Risk = max(direct, crowd floor, complexity floor, emergency floor, .96 if blocked)\n'
                    'Crowd floors: low 0, medium .30, high .60\n'
                    'Complexity floors: low 0, medium .20, high .45\n'
                    'Emergency floors: none 0, congestion .65, fire alarm .90, medical event .85')
    else:
        st.caption('Direct-factor mode: profile/context, per-sensor confidence and per-agent confidence are descriptive metadata. They do not silently change the six-factor equation. Optional context mapping is off.')
    with st.expander('Effective six-factor inputs', expanded=False):
        st.json(asdict(factors))


@st.cache_data(show_spinner=False)
def benchmark_result(seed, count, weights, thresholds):
    cases = generate_cases(seed, count)
    config = TriageConfig(weights, thresholds)
    return cases, threshold_sweep(cases, config), inspect_cases(cases, config)


def sweep_section(model):
    st.header('Threshold Sweep')
    st.caption('Synthetic benchmark ground truth for prototype evaluation only.')
    st.code(GROUND_TRUTH)
    st.write('Uniform independent synthetic factors; all mandatory rules remain active while only the main threshold is swept.')
    seed, count = st.session_state.research_seed, st.session_state.research_count
    st.caption(f'Reproducible simulation seed: {seed} · {count} synthetic cases')
    if st.button('Run Threshold Sweep', key='run_sweep'):
        st.session_state.benchmark = {'seed':seed, 'count':count}
    benchmark = st.session_state.benchmark
    if benchmark is None:
        st.info('Run a sweep to evaluate 15 main thresholds from 0.20 to 0.90 in steps of 0.05.')
        return
    if benchmark != {'seed':seed, 'count':count}:
        st.warning('Seed/sample count changed. Displayed benchmark uses the previous seed/count; run the sweep again to apply the new values.')
    with st.spinner('Evaluating reproducible cases…'):
        cases, results, rows = benchmark_result(benchmark['seed'], benchmark['count'], model.weights, model.thresholds)
    current = evaluate_threshold(cases, model)
    st.caption(f"Displayed benchmark: seed {benchmark['seed']}, {benchmark['count']} cases. Weights and mandatory thresholds update live.")
    a, b, c = st.columns(3)
    a.metric('Current automation coverage', f"{current['Automation coverage %']:.1f}%")
    b.metric('Current critical-case recall', f"{current['Critical-case recall %']:.1f}%" if current['Critical-case recall %'] is not None else 'N/A')
    c.metric('Current missed critical cases', current['Missed critical cases'])
    st.subheader('Coverage–Risk Curve')
    # Altair is a required Streamlit dependency; no additional package is needed.
    data = alt.InlineData(values=results)
    line = alt.Chart(data).mark_line(point=True, color='#506880').encode(
        x=alt.X('Automation coverage %:Q', scale=alt.Scale(domain=[0,100])),
        y=alt.Y('Critical-case recall %:Q', scale=alt.Scale(domain=[0,100])),
        order='Threshold:Q', tooltip=['Threshold:Q','Automation coverage %:Q',
                                      'Critical-case recall %:Q','Missed critical cases:Q'])
    point = alt.Chart(alt.InlineData(values=[current])).mark_point(color='#dc2626', size=170, filled=True).encode(
        x='Automation coverage %:Q', y='Critical-case recall %:Q',
        tooltip=['Threshold:Q','Automation coverage %:Q','Critical-case recall %:Q'])
    st.altair_chart((line+point).properties(height=290), width='stretch')
    st.caption(f"Red point: current main threshold {model.thresholds['main']:.2f} (evaluated exactly, even between sweep grid points).")
    st.write('Higher thresholds can increase automation and miss more critical cases; lower thresholds can increase human workload and recall. Mandatory rules may produce plateaus. No empirically optimal point is claimed.')
    st.caption('Coverage = automatic / all cases; recall = true escalations / critical cases; false escalation rate = false escalations / noncritical cases. Undefined denominators are reported as N/A. These are synthetic classification outcomes, not actual safety outcomes.')
    with st.expander('Sweep results (15 thresholds)', expanded=False):
        st.dataframe(results, hide_index=True, width='stretch')
    export_rows = [{**row, 'Random seed':benchmark['seed'],
                    **{'w_'+k:v for k,v in model.weights.items()},
                    **{'rule_'+k:v for k,v in model.thresholds.items() if k != 'main'}}
                   for row in results]
    st.download_button('Export threshold sweep CSV', sweep_csv(export_rows),
                       file_name='threshold_sweep.csv', mime='text/csv', key='export_sweep', on_click='ignore')
    st.subheader('Case Inspector')
    if st.session_state.selected_case:
        st.caption(f"Loaded in building sandbox: {st.session_state.selected_case['case_id']} · Seed {st.session_state.selected_case_seed}")
    filters = st.multiselect('Filter outcome categories',
                            ['Missed critical','True escalation','False escalation','Safe automation'],
                            key='case_filters')
    filtered = [r for r in rows if not filters or r['Outcome category'] in filters]
    st.caption(f'{len(filtered)} / {len(rows)} cases shown · Classification uses the current main threshold and mandatory rules.')
    st.dataframe(filtered, hide_index=True, width='stretch', height=300)
    if filtered:
        ids = [r['Case ID'] for r in filtered]
        if st.session_state.get('inspect_case_id') not in ids:
            st.session_state.inspect_case_id = ids[0]
        selection = st.selectbox('Case to inspect', ids, key='inspect_case_id')
        selected = next(case for case in cases if case['case_id']==selection)
        st.button('Load selected case into sandbox', on_click=use_case, args=(selected, benchmark['seed']), key='load_case')
        st.download_button('Export selected case JSON', json.dumps({
            'seed':benchmark['seed'], 'case':selected,
            'classification':next(r for r in rows if r['Case ID']==selection),
            'weights':model.weights, 'thresholds':model.thresholds,
        }, indent=2), file_name='selected_case.json', mime='application/json', key='export_case', on_click='ignore')
    else:
        st.info('No cases match these filters at the current configuration. Change filters or thresholds.')


def render_research(floor_plan):
    initialize()
    st.header('Milestone 3 — Configurable Research Instrument')
    st.markdown('**When should an AI system stop acting autonomously and defer a spatial decision to a human?**')
    st.warning('Prototype thresholds — not empirically calibrated.')
    st.subheader('Scenario presets')
    cols = st.columns(3)
    for i, name in enumerate(PRESETS):
        cols[i%3].button(name, on_click=use_preset, args=(name,), key='preset_'+str(i))
    st.caption('Presets change resident/context factors; they preserve your edited weights and thresholds.')
    try:
        settings, model = controls()
    except ValueError as exc:
        st.error(str(exc))
        st.info('Use Normalize weights after assigning at least one positive weight.')
        return
    if st.session_state.get('research_error'):
        st.error(st.session_state.research_error)
    if st.session_state.get('research_notice'):
        st.success(st.session_state.pop('research_notice'))
    factors = effective_factors(settings)
    result = assess(factors, model)
    selected = st.session_state.selected_case
    if selected:
        st.info(f"Loaded synthetic case {selected['case_id']} into R06 (seed {st.session_state.selected_case_seed}). Context is illustrative; the case's six factors are loaded exactly. Controls can now edit that case.")
    left, right = st.columns([1,1])
    with left:
        st.subheader('Building sandbox — live inspected R06')
        sim = Simulation()
        sim.round = 1
        for i, o in enumerate(sim.occupants):
            o.current_location = PATHS[i][0]
        sim.occupants[5].current_location = 'Junction B' if result.escalated else 'North Atrium'
        floor_plan(sim, research_state=result.state, exit_blocked=settings['exit_blocked'])
        st.caption(f"R06: {settings['age_group']} · {settings['mobility']} · Building {settings['building_complexity']} complexity · Crowd {settings['crowd_density']} · Emergency {settings['emergency']}")
    with right:
        st.subheader('Live decision panel')
        st.metric('Current triage score', f'{result.score:.4f}')
        {'AI AUTO':st.success, 'WATCH / UNCERTAIN':st.warning, 'HUMAN TAKEOVER':st.error}[result.state](result.state)
        st.caption('Amber: score ≥ 80% of main threshold, below main threshold, and no mandatory rule triggered.')
        for label, active in result.rules.items():
            st.write(('✓ ' if active else '✗ ') + label)
        t = model.thresholds
        st.caption(f"Main ≥ {t['main']:.2f}; Safety ≥ {t['safety']:.2f}; Disagreement ≥ {t['disagreement']:.2f} AND agreement ≤ {t['agreement']:.2f}; Behavior ≥ {t['behavior']:.2f}.")
        if settings['force_sensor_conflict']:
            st.warning('UWB ≠ Camera ≠ BLE')
            st.write('UWB: North Atrium · Camera: Junction B · BLE: East Corridor')
        else:
            st.write('Illustrative sensor locations agree: North Atrium.')
        st.caption(f"Sensor confidences: UWB {settings['uwb_confidence']:.2f}, Camera {settings['camera_confidence']:.2f}, BLE {settings['ble_confidence']:.2f}. Location labels do not replace the editable agreement factor.")
        st.caption(f"Agent confidences: Route {settings['route_agent_confidence']:.2f}, Safety {settings['safety_agent_confidence']:.2f}, Accessibility {settings['accessibility_agent_confidence']:.2f}.")
    mapping_note(settings, factors)
    st.subheader('Weighted contributions')
    contribution_data = [{'Factor':FACTOR_LABELS[k], 'Contribution':v} for k,v in result.contributions.items()]
    chart = alt.Chart(alt.InlineData(values=contribution_data)).mark_bar(color='#506880').encode(
        x=alt.X('Contribution:Q', scale=alt.Scale(domain=[0,1])),
        y=alt.Y('Factor:N', sort=list(FACTOR_LABELS.values()), axis=alt.Axis(labelLimit=240)), tooltip=['Factor:N','Contribution:Q'])
    st.altair_chart(chart.properties(height=220), width='stretch')
    equation = '\n+ '.join(f"{model.weights[k]:.4f} × {FACTOR_LABELS[k]}" for k in DEFAULT_WEIGHTS)
    st.code(equation + f'\n= {result.score:.4f} (effective weight sum = {sum(model.weights.values()):.6f})')
    st.dataframe(contribution_data, hide_index=True, width='stretch')
    config = validate_experiment(dict(schema_version=1, settings=settings, weights=model.weights,
                                     thresholds=model.thresholds, seed=st.session_state.research_seed,
                                     case_count=st.session_state.research_count))
    st.download_button('Export experiment configuration', json.dumps(config, indent=2),
                       file_name='experiment_config.json', mime='application/json', key='export_config', on_click='ignore')
    sweep_section(model)
    st.divider()
    st.info('LLM/synthetic-agent behavior is not treated as a substitute for human behavioral data.')
    st.info('The synthetic benchmark is used for stress testing and experimental design, not for estimating real human effect sizes.')
    st.info('Human-alone and Hybrid performance require empirical validation with human participants.')
