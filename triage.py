"""Single source of truth for prototype scoring and escalation.

Defaults reproduce the CLI/Milestone 2 formula exactly. These thresholds and
weights are prototype settings, not empirically calibrated estimates.
"""
from dataclasses import dataclass, field
import math

DEFAULT_WEIGHTS = dict(navigation=0.18, sensor=0.18, disagreement=0.18,
                       behavior=0.18, safety=0.22, vulnerability=0.06)
DEFAULT_THRESHOLDS = dict(main=0.62, safety=0.85, disagreement=0.75,
                          agreement=0.45, behavior=0.80)
FACTOR_LABELS = dict(navigation='Navigation uncertainty', sensor='Sensor conflict',
                     disagreement='Model disagreement', behavior='Behavior anomaly',
                     safety='Safety risk', vulnerability='Vulnerability')


def unit(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError(f'{name} must be a finite number from 0 to 1.')
    return float(value)


def normalize_weights(weights):
    if set(weights) != set(DEFAULT_WEIGHTS):
        raise ValueError('Exactly six named weights are required.')
    values = {name: unit(value, name) for name, value in weights.items()}
    total = sum(values.values())
    if total <= 0:
        raise ValueError('At least one weight must be greater than zero.')
    return {name: value / total for name, value in values.items()}


@dataclass(frozen=True)
class Factors:
    navigation_confidence: float = 0.95
    sensor_agreement: float = 0.94
    model_disagreement: float = 0.06
    behavior_anomaly: float = 0.04
    safety_risk: float = 0.05
    vulnerability: float = 0.20

    def __post_init__(self):
        for name, value in self.__dict__.items():
            unit(value, name)


@dataclass(frozen=True)
class TriageConfig:
    weights: dict = field(default_factory=lambda: DEFAULT_WEIGHTS.copy())
    thresholds: dict = field(default_factory=lambda: DEFAULT_THRESHOLDS.copy())

    def __post_init__(self):
        object.__setattr__(self, 'weights', normalize_weights(self.weights))
        if set(self.thresholds) != set(DEFAULT_THRESHOLDS):
            raise ValueError('Exactly five named thresholds are required.')
        object.__setattr__(self, 'thresholds', {k: unit(v, k) for k, v in self.thresholds.items()})


@dataclass(frozen=True)
class Assessment:
    score: float
    contributions: dict
    rules: dict
    state: str

    @property
    def escalated(self):
        return any(self.rules.values())


def assess(occupant, config=None):
    config = config or TriageConfig()
    factors = dict(navigation=1 - occupant.navigation_confidence,
                   sensor=1 - occupant.sensor_agreement,
                   disagreement=occupant.model_disagreement,
                   behavior=occupant.behavior_anomaly, safety=occupant.safety_risk,
                   vulnerability=occupant.vulnerability)
    contributions = {name: config.weights[name] * value for name, value in factors.items()}
    score = sum(contributions.values())
    t = config.thresholds
    rules = {
        'Main triage threshold': score >= t['main'],
        'Safety risk rule': occupant.safety_risk >= t['safety'],
        'Disagreement rule': occupant.model_disagreement >= t['disagreement'] and occupant.sensor_agreement <= t['agreement'],
        'Behavior anomaly rule': occupant.behavior_anomaly >= t['behavior'],
    }
    state = ('HUMAN TAKEOVER' if any(rules.values()) else
             'WATCH / UNCERTAIN' if score >= 0.8 * t['main'] else 'AI AUTO')
    return Assessment(score, contributions, rules, state)


def triage_score(occupant, config=None):
    return assess(occupant, config).score


def requires_takeover(occupant, config=None):
    return assess(occupant, config).escalated
