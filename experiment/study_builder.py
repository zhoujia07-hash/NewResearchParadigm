"""Versioned synthetic pilot protocols; no empirical ground truth is inferred."""
import random
from dataclasses import asdict

from batch_simulation import generate_batch,select_study_cases,STRATEGIES
from agents.concordia_adapter import mock_proposal,ROLES,run_agents
from synthetic_cases import factors_from_case,is_critical
from triage import TriageConfig,assess,Factors

CONDITIONS=['AI-only','Human-only','Human + AI selective takeover']
EXPLANATIONS=['Recommendation only','Recommendation + confidence','Recommendation + sensor evidence',
              'Recommendation + agent disagreement','Full explanation']
MEASURES=['Perceived workload','Trust','Perceived difficulty','Explanation usefulness']
ROUTE_CODES={'West Exit':'A','East Exit':'B','Refuge Point':'C'}


def reference_choice(case):
    """Scripted spatial reference, distinct from the synthetic critical label."""
    if case['emergency']=='medical event': return 'C'
    if case['exit_blocked'] or case.get('blocked_path',False) or case['emergency']=='fire alarm': return 'A'
    return 'B'


def build_protocol(trials_per_condition=1,conditions=None,explanations=None,seed=42,
                   strategy=STRATEGIES[0],pool=None,config=None,measures=None,show_timer=False,
                   agent_source='Deterministic'):
    conditions=CONDITIONS if conditions is None else conditions
    explanations=EXPLANATIONS if explanations is None else explanations
    measures=[] if measures is None else measures
    if type(trials_per_condition) is not int or not 1<=trials_per_condition<=20:
        raise ValueError('Trials per condition must be 1–20.')
    if not conditions or len(set(conditions))!=len(conditions) or any(c not in CONDITIONS for c in conditions):
        raise ValueError('Select supported experimental conditions without duplicates.')
    if not explanations or any(e not in EXPLANATIONS for e in explanations):
        raise ValueError('Select supported explanation conditions.')
    if any(m not in MEASURES for m in measures) or agent_source not in ('Deterministic','Concordia mock'):
        raise ValueError('Unsupported measures or agent source.')
    if type(seed) is not int or not 0<=seed<2**32: raise ValueError('Invalid seed.')
    model=config or TriageConfig()
    source=pool if pool is not None else generate_batch(seed,500)
    selected=select_study_cases(source,model,strategy,trials_per_condition,seed)
    if not selected: raise ValueError('No escalated cases are available for this study.')
    rng=random.Random(seed)
    rng.shuffle(selected)
    trials=[]
    for case in selected:
        proposals={r:mock_proposal(r,case) for r in ROLES}
        backend='Deterministic scripted recommendations'
        factors=factors_from_case(case)
        if agent_source=='Concordia mock':
            result=run_agents(case,'mock')
            proposals=result['recommendations'];backend=result['backend']
            factors=Factors(**result['triage_inputs'])
        a=assess(factors,model)
        order=list(conditions);rng.shuffle(order)
        for condition in order:
            explanation=rng.choice(explanations) if condition==CONDITIONS[2] else 'No AI explanation'
            trials.append(dict(case_id=case['case_id'],condition_id=case['condition_id'],case=case,
                               condition=condition,explanation_condition=explanation,
                               AI_recommendation=ROUTE_CODES[proposals['RouteAgent']['route_choice']],
                               AI_confidence=proposals['RouteAgent']['confidence'],
                               agent_recommendations=proposals,agent_backend=backend,
                               triage_score=a.score,escalated=a.escalated,
                               ground_truth=reference_choice(case),synthetic_critical=is_critical(factors_from_case(case)),
                               long_tail_category='; '.join(k for k,v in a.rules.items() if v)))
    for i,t in enumerate(trials,1): t['trial_number']=i
    return dict(schema_version=1,seed=seed,data_source='synthetic_protocol',
                design='Within-subject: same selected cases across selected conditions; randomized case and condition order.',
                requested_trials_per_condition=trials_per_condition,actual_trials_per_condition=len(selected),
                conditions=list(conditions),explanations=list(explanations),sampling_strategy=strategy,
                weights=model.weights,thresholds=model.thresholds,measures=list(measures),show_timer=bool(show_timer),
                agent_source=agent_source,
                reference_rule='Medical event → C; blocked East path/exit or fire alarm → A; otherwise B. Scripted, not empirical.',
                trials=trials)
