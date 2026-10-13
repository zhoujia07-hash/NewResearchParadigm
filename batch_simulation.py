"""Synthetic condition-space exploration. Associations are descriptive only."""
import random
from collections import Counter
from dataclasses import asdict

from research_config import DEFAULT_SETTINGS, ENUMS
from synthetic_cases import factors_from_case, threshold_sweep, sweep_csv
from triage import TriageConfig, assess

STRATEGIES = ['Highest-risk cases', 'Highest-disagreement cases', 'Near-threshold ambiguous cases',
              'Stratified long-tail sample', 'Random long-tail sample']


def generate_batch(seed=42, count=500):
    if type(seed) is not int or not 0 <= seed < 2**32:
        raise ValueError('Invalid random seed.')
    if count not in (100,500,1000,5000):
        raise ValueError('Choose 100, 500, 1000 or 5000 scenarios.')
    rng = random.Random(seed)
    cases=[]
    for i in range(count):
        settings={}
        for key, default in DEFAULT_SETTINGS.items():
            if key in ENUMS:
                settings[key]=rng.choice(ENUMS[key])
            elif type(default) is bool:
                settings[key]=False if key=='context_mapping' else rng.random()<0.3
            elif key=='backtracking_count':
                settings[key]=rng.randrange(6)
            else:
                settings[key]=rng.random()
        cases.append(dict(case_id=f'S{seed}-{i+1:05d}', condition_id=f'COND-{seed}-{i+1:05d}',
                          **settings, blocked_path=rng.random()<0.25, simulation_seed=seed))
    return cases


def classify_batch(cases, config=None):
    config=config or TriageConfig()
    rows=[]
    names={'AI AUTO':'HEAD / AUTO','WATCH / UNCERTAIN':'WATCH','HUMAN TAKEOVER':'LONG-TAIL / HUMAN'}
    for c in cases:
        a=assess(factors_from_case(c),config)
        ambiguity=1-min(1,abs(a.score-config.thresholds['main'])/0.2)
        difficulty=(a.score+c['model_disagreement']+c['safety_risk']+1-c['sensor_agreement']+ambiguity)/5
        rows.append(dict(case_id=c['case_id'],condition_id=c['condition_id'],triage_score=a.score,
                         category=names[a.state],difficulty=difficulty,
                         reasons='; '.join(k for k,v in a.rules.items() if v), **asdict(factors_from_case(c)),
                         building_complexity=c['building_complexity']))
    return rows


def describe_batch(rows):
    counts=Counter(r['category'] for r in rows)
    reasons=Counter(reason for r in rows for reason in r['reasons'].split('; ') if reason)
    return {'counts':dict(counts), 'percentages':{name:100*counts[name]/len(rows) for name in
            ['HEAD / AUTO','WATCH','LONG-TAIL / HUMAN']},'reasons':dict(reasons)}


def associations(cases, rows):
    output=[]
    for factor in ['safety_risk','navigation_uncertainty','sensor_conflict','model_disagreement','vulnerability','building_complexity']:
        groups={}
        for case,row in zip(cases,rows):
            value=(1-case['navigation_confidence'] if factor=='navigation_uncertainty' else
                   1-case['sensor_agreement'] if factor=='sensor_conflict' else case[factor])
            group=value if isinstance(value,str) else f'{min(int(value*5),4)*.2:.1f}–{min(int(value*5),4)*.2+.2:.1f}'
            groups.setdefault(group,[]).append(row['category']=='LONG-TAIL / HUMAN')
        for group,values in sorted(groups.items()):
            output.append({'Factor':factor,'Group':group,'Cases':len(values),'Escalation rate %':100*sum(values)/len(values)})
    return output


def discover_cases(rows):
    return sorted(rows,key=lambda r:(-r['difficulty'],r['case_id']))[:20]


def select_study_cases(cases, config=None, strategy=STRATEGIES[0], count=20, seed=42):
    if strategy not in STRATEGIES or type(count) is not int or count<1:
        raise ValueError('Invalid selection strategy/count.')
    config=config or TriageConfig()
    rows=classify_batch(cases,config)
    tails=[r for r in rows if r['category']=='LONG-TAIL / HUMAN']
    rng=random.Random(seed)
    if strategy==STRATEGIES[0]:
        chosen=sorted(tails,key=lambda r:(-r['safety_risk'],r['case_id']))[:count]
    elif strategy==STRATEGIES[1]:
        chosen=sorted(tails,key=lambda r:(-r['model_disagreement'],r['case_id']))[:count]
    elif strategy==STRATEGIES[2]:
        chosen=sorted(tails,key=lambda r:(abs(r['triage_score']-config.thresholds['main']),r['case_id']))[:count]
    elif strategy==STRATEGIES[4]:
        chosen=rng.sample(tails,min(count,len(tails)))
    else:
        # Round-robin sampling across primary escalation reasons; a case with
        # several rules is assigned once, in deterministic rule order.
        groups={}
        for r in tails:
            groups.setdefault(r['reasons'].split('; ')[0],[]).append(r)
        for group in groups.values():
            rng.shuffle(group)
        chosen=[]
        while len(chosen)<count and any(groups.values()):
            for key in sorted(groups):
                if groups[key] and len(chosen)<count:
                    chosen.append(groups[key].pop())
    lookup={c['case_id']:c for c in cases}
    return [dict(lookup[r['case_id']],selection_strategy=strategy,selection_seed=seed,
                 triage_score=r['triage_score'],tail_reasons=r['reasons'],
                 weights=config.weights,thresholds=config.thresholds) for r in chosen]


def study_csv(cases):
    import json
    return sweep_csv([{k:json.dumps(v,sort_keys=True) if isinstance(v,dict) else v for k,v in c.items()}
                      for c in cases]) if cases else ''
