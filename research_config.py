"""Validated experiment schema, presets and explicit optional context mapping."""
import copy
import json

from triage import DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, Factors, TriageConfig, unit

ENUMS = {
    'age_group': ['young', 'middle-aged', 'older adult'],
    'mobility': ['independent', 'cane', 'walker', 'wheelchair'],
    'building_complexity': ['low', 'medium', 'high'],
    'crowd_density': ['low', 'medium', 'high'],
    'emergency': ['none', 'congestion', 'fire alarm', 'medical event'],
}
DEFAULT_SETTINGS = dict(
    age_group='young', mobility='independent', familiarity=0.90,
    sense_of_direction=0.90, cognitive_vulnerability=0.10,
    vulnerability=0.20, navigation_confidence=0.95, backtracking_count=0,
    hesitation=0.04, route_progress=0.50, behavior_anomaly=0.04,
    uwb_confidence=0.95, camera_confidence=0.94, ble_confidence=0.94,
    sensor_agreement=0.94, force_sensor_conflict=False,
    route_agent_confidence=0.95, safety_agent_confidence=0.95,
    accessibility_agent_confidence=0.95, model_disagreement=0.06,
    safety_risk=0.05, building_complexity='medium', crowd_density='low',
    exit_blocked=False, emergency='none', context_mapping=False,
)
BOOL_KEYS = {'force_sensor_conflict', 'exit_blocked', 'context_mapping'}


def default_experiment():
    return dict(schema_version=1, settings=DEFAULT_SETTINGS.copy(),
                weights=DEFAULT_WEIGHTS.copy(), thresholds=DEFAULT_THRESHOLDS.copy(),
                seed=42, case_count=500)


def validate_experiment(value):
    if not isinstance(value, dict) or set(value) != set(default_experiment()):
        raise ValueError('Configuration must contain schema_version, settings, weights, thresholds, seed and case_count.')
    if type(value['schema_version']) is not int or value['schema_version'] != 1:
        raise ValueError('Only schema_version 1 is supported.')
    s = value['settings']
    if not isinstance(s, dict) or set(s) != set(DEFAULT_SETTINGS):
        raise ValueError('Settings must include exactly the supported research controls.')
    for key, val in s.items():
        if key in ENUMS:
            if val not in ENUMS[key]:
                raise ValueError(f'Unsupported {key}.')
        elif key in BOOL_KEYS:
            if type(val) is not bool:
                raise ValueError(f'{key} must be a boolean.')
        elif key == 'backtracking_count':
            if type(val) is not int or not 0 <= val <= 5:
                raise ValueError('Backtracking count must be an integer from 0 to 5.')
        else:
            unit(val, key)
    if type(value['seed']) is not int or not 0 <= value['seed'] <= 2**32-1:
        raise ValueError('Seed must be an integer from 0 to 4294967295.')
    if type(value['case_count']) is not int or not 200 <= value['case_count'] <= 2000:
        raise ValueError('Case count must be an integer from 200 to 2000.')
    if not isinstance(value['weights'], dict) or not isinstance(value['thresholds'], dict):
        raise ValueError('Weights and thresholds must be objects.')
    model = TriageConfig(value['weights'], value['thresholds'])
    out = copy.deepcopy(value)
    for key in set(DEFAULT_SETTINGS) - set(ENUMS) - BOOL_KEYS - {'backtracking_count'}:
        out['settings'][key] = float(out['settings'][key])
    out['weights'], out['thresholds'] = model.weights, model.thresholds
    return out


def import_experiment(text):
    if len(text) > 262144:
        raise ValueError('Configuration exceeds the 256 KB limit.')
    try:
        return validate_experiment(json.loads(text))
    except (TypeError, KeyError, json.JSONDecodeError) as exc:
        raise ValueError('Malformed experiment configuration.') from exc


def effective_factors(settings):
    values = {name: settings[name] for name in Factors.__dataclass_fields__}
    if settings['context_mapping']:
        # Optional, transparent, uncalibrated stress-test mapping. No inference
        # of measured human behavior or empirical demographic effects is made.
        mobility_floor = dict(independent=0.10, cane=0.35, walker=0.65, wheelchair=0.75)[settings['mobility']]
        age_floor = dict(young=0.10, **{'middle-aged':0.20, 'older adult':0.60})[settings['age_group']]
        values['vulnerability'] = max(values['vulnerability'], settings['cognitive_vulnerability'],
                                      mobility_floor, age_floor, 1-settings['familiarity'], 1-settings['sense_of_direction'])
        values['behavior_anomaly'] = max(values['behavior_anomaly'], settings['hesitation'],
                                        settings['backtracking_count']/5,
                                        (1-settings['route_progress'])*settings['hesitation'])
        crowd_floor = dict(low=0.0, medium=0.30, high=0.60)[settings['crowd_density']]
        complexity_floor = dict(low=0.0, medium=0.20, high=0.45)[settings['building_complexity']]
        emergency_floor = {'none':0.0, 'congestion':0.65, 'fire alarm':0.90, 'medical event':0.85}[settings['emergency']]
        values['safety_risk'] = max(values['safety_risk'], crowd_floor, complexity_floor,
                                   emergency_floor, 0.96 if settings['exit_blocked'] else 0.0)
    return Factors(**values)


PRESETS = {
    'Normal visitor': {},
    'Older adult mild uncertainty': dict(age_group='older adult', mobility='cane', familiarity=0.45,
                                        navigation_confidence=0.65, vulnerability=0.60, behavior_anomaly=0.20),
    'Sensor conflict': dict(sensor_agreement=0.22, force_sensor_conflict=True,
                           model_disagreement=0.50, uwb_confidence=0.80, camera_confidence=0.75, ble_confidence=0.70),
    'Navigation breakdown': dict(navigation_confidence=0.20, backtracking_count=4,
                                hesitation=0.90, behavior_anomaly=0.90, route_progress=0.10),
    'Blocked exit crisis': dict(age_group='older adult', mobility='walker', familiarity=0.20,
                               cognitive_vulnerability=0.90, backtracking_count=2, hesitation=0.92,
                               route_progress=0.30, force_sensor_conflict=True,
                               exit_blocked=True, building_complexity='high'),
    'High AI disagreement': dict(model_disagreement=0.88, sensor_agreement=0.40, force_sensor_conflict=True,
                                route_agent_confidence=0.95, safety_agent_confidence=0.95),
    'Vulnerable older adult + emergency': dict(age_group='older adult', mobility='wheelchair',
                                             cognitive_vulnerability=0.90, vulnerability=0.95,
                                             emergency='fire alarm', safety_risk=0.95, crowd_density='high'),
}


def preset_settings(name):
    settings = {**DEFAULT_SETTINGS, **PRESETS[name]}
    if name == 'Blocked exit crisis':
        from demo import create_occupants, inject_crisis
        occupant = create_occupants()[5]
        inject_crisis(occupant)
        settings.update({key:getattr(occupant, key) for key in Factors.__dataclass_fields__})
    return settings


def settings_from_case(case):
    return {**DEFAULT_SETTINGS, **{name:case[name] for name in Factors.__dataclass_fields__},
            'force_sensor_conflict':case['sensor_agreement'] <= 0.45}
