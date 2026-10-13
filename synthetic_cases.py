"""Reproducible synthetic stress test, not human behavioral ground truth."""
import csv
import io
import random
from dataclasses import replace

from triage import Factors, TriageConfig, assess

GROUND_TRUTH = ('critical = safety_risk >= 0.80 OR behavior_anomaly >= 0.85 '
                'OR (model_disagreement >= 0.80 AND sensor_agreement <= 0.35)')


def generate_cases(seed=42, count=500):
    if type(seed) is not int or not 0 <= seed <= 2**32 - 1:
        raise ValueError('Seed must be an integer from 0 to 4294967295.')
    if type(count) is not int or not 200 <= count <= 10000:
        raise ValueError('Generate between 200 and 10000 cases.')
    rng = random.Random(seed)
    return [dict(case_id=f'C{i+1:04d}', **{
        name: rng.random() for name in Factors.__dataclass_fields__
    }) for i in range(count)]


def factors_from_case(case):
    return Factors(**{name: case[name] for name in Factors.__dataclass_fields__})


def is_critical(factors):
    return (factors.safety_risk >= 0.80 or factors.behavior_anomaly >= 0.85
            or (factors.model_disagreement >= 0.80 and factors.sensor_agreement <= 0.35))


def inspect_cases(cases, config):
    rows = []
    for case in cases:
        f = factors_from_case(case)
        result = assess(f, config)
        critical = is_critical(f)
        outcome = ('True escalation' if critical else 'False escalation') if result.escalated else (
            'Missed critical' if critical else 'Safe automation')
        rows.append({'Case ID': case['case_id'],
                     'Navigation uncertainty': 1-f.navigation_confidence,
                     'Sensor conflict': 1-f.sensor_agreement,
                     'Model disagreement': f.model_disagreement,
                     'Behavior anomaly': f.behavior_anomaly,
                     'Safety risk': f.safety_risk, 'Vulnerability': f.vulnerability,
                     'Triage score': result.score, 'Ground-truth critical?': critical,
                     'Escalated?': result.escalated, 'Outcome category': outcome})
    return rows


def evaluate_threshold(cases, config):
    rows = inspect_cases(cases, config)
    critical = sum(r['Ground-truth critical?'] for r in rows)
    noncritical = len(rows)-critical
    escalations = sum(r['Escalated?'] for r in rows)
    missed = sum(r['Outcome category']=='Missed critical' for r in rows)
    false = sum(r['Outcome category']=='False escalation' for r in rows)
    return {'Threshold': config.thresholds['main'],
            'Automation coverage %': 100*(len(rows)-escalations)/len(rows),
            'Human escalation rate %': 100*escalations/len(rows),
            'Critical-case recall %': 100*(critical-missed)/critical if critical else None,
            'Missed critical cases': missed,
            'False escalation rate %': 100*false/noncritical if noncritical else None,
            'Total cases': len(rows), 'Critical cases': critical,
            'False escalations': false}


def threshold_sweep(cases, config=None):
    if not cases:
        raise ValueError('A nonempty benchmark is required.')
    config = config or TriageConfig()
    # Integer steps avoid cumulative floating-point drift: 15 inclusive values.
    return [evaluate_threshold(cases, replace(config, thresholds={**config.thresholds, 'main': i/100}))
            for i in range(20, 91, 5)]


def sweep_csv(rows):
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()
