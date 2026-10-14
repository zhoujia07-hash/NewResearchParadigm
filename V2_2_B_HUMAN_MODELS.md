# V2.2-B — synthetic Human models (review branch)

Branch: `v2.2-b-human-models`, based on reviewed V2.2-A
`c785b7268f5a0ab4e7671e34ab9546f20e5fe50a`. This is an opt-in development
baseline for scientific and visual review, with no merge or production deployment.

## Purpose and scientific boundary

Demonstrate different person-specific behavior expressions in the same unchanged
Modern Hospital. This stage implements **Human meso → macro**, within the approved
[HME architecture](HME_ARCHITECTURE.md). Micro remains interface-only.

**These profiles are synthetic demonstration parameters and are not participant measurements.**

**The behavior mappings are illustrative architectural demonstrations and are not validated effect estimates.**

**Low Sense of Direction or high spatial anxiety does not automatically imply lostness.**

No psychometric calibration, causal effect of SoD/anxiety, lostness probability,
real participant behavior, neural mechanism or clinical classification is claimed.
“Direct”, “cautious” and “high-scanning” describe this illustrative expression,
not fixed psychological types. Software tests check implementation rules, not
scientific truth. The prior Nature evidence ontology and verification limitations
are unchanged; no source is claimed to support these coefficients.

## Meso profiles: exact invented values

All six numerical parameters use the illustrative interval **0–1**. They are not
psychometric scores, normative ranks, estimated states or measured capability.
Values are explicit immutable fixtures, identical across reloads, without random
generation or participant input.

| ID | Age group | Mobility capability | SoD | Anxiety trait | Spatial memory | Navigation experience | Technology familiarity | Vulnerability |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R01 | Adult | Walking | 0.90 | 0.15 | 0.82 | 0.90 | 0.78 | 0.20 |
| R02 | Adult | Walking | 0.65 | 0.20 | 0.92 | 0.75 | 0.84 | 0.25 |
| R03 | Adult | Walking | 0.85 | 0.45 | 0.70 | 0.55 | 0.70 | 0.30 |
| R04 | Adult | Walking | 0.35 | 0.50 | 0.55 | 0.50 | 0.60 | 0.35 |
| R05 | Adult | Walking | 0.55 | 0.80 | 0.35 | 0.45 | 0.65 | 0.40 |
| R06 | Older adult | Walker | 0.30 | 0.75 | 0.55 | 0.50 | 0.40 | 0.90 |
| R07 | Adult | Walking | 0.88 | 0.12 | 0.75 | 0.25 | 0.90 | 0.20 |
| R08 | Adult | Walking | 0.60 | 0.45 | 0.60 | 0.55 | 0.72 | 0.30 |

Age and mobility retain the existing resident identities. Other profiles are not
derived from age or mobility group membership. Vulnerability here is a synthetic
Human parameter; its values are **not written into the official triage inputs**.
Technology familiarity is displayed for comparison and future replacement; it
has no behavior effect in this first mapping.

`SyntheticHumanProfile` extends the existing `HumanProfile`. Normalized canonical
parameters are exposed through its `parameters` and `traits.extensions` adapter;
compatible existing traits carry evidence-valued entries. Navigation experience
also has a qualitative compatibility label because the approved Human trait field
uses a string. All values carry configuration provenance identifying synthetic,
illustrative, replaceable data. Unspecified cognitive capability remains unknown.

`syntheticHuman(id)` supplies the existing `HumanSnapshot` contract. Navigation
uncertainty, confidence, current anxiety, workload, lostness, attention, fatigue
and trust remain **unknown**. No model in this stage derives latent-state values.
Machine-estimated Human state remains a separate type and remains unknown under
the retained unspecified estimator.

## Exact synthetic behavior mapping

Let D = SoD, A = anxiety trait, M = spatial memory, E = navigation experience,
V = vulnerability and W = 1 for walker use, otherwise 0. `clamp(x,a,b)` limits x
to [a,b]; omitted bounds are [0,1]. Every base and coefficient below is invented
for this demonstration; none is an empirical coefficient.

| BehaviorStyle output | Exact calculation | Bounds | Demonstration assumption |
| --- | --- | --- | --- |
| speedMultiplier | clamp(1 + 0.10 E − 0.10 A − 0.10 V − 0.08 W, 0.80, 1.12) | 0.80–1.12 | More experience, lower anxiety/vulnerability and no walker offset increase illustrative cadence |
| hesitationIntensity | clamp(0.10 + 0.25 (1 − D) + 0.20 A) | 0–1 | Lower SoD/higher anxiety increase expressive hesitation |
| pauseTendency | clamp(0.05 + 0.25 A + 0.15 V) | 0–1 | Anxiety/vulnerability increase brief presentation holds |
| scanIntensity | clamp(0.05 + 0.65 A) | 0–1 | Anxiety increases head-scanning expression, without a lostness inference |
| turnDecisiveness | clamp(0.40 + 0.60 D) | 0–1 | SoD changes heading response smoothness |
| backtrackTendency | clamp(0.10 + 0.30 (1 − M)) | 0–1 | Lower memory increases proposed reconsideration tendency; not executed as an extra route reversal |
| movementConsistency | clamp(0.50 + 0.50 E) | 0–1 | Experience increases this declared consistency dimension |

Outputs carry `evidenceStatus: synthetic` and model-output provenance. There are
no probability, risk, difficulty-score or lostness outputs. No synthetic navigation
challenge score is needed. Environment ID, story stage and mobility are explicit
context inputs; the building has no newly computed demand/complexity measure.
Only walker use enters these formulas. Story stage gates expression in the
presentation adapter, rather than changing traits or generating official events.

The UI uses Low < 0.40, High ≥ 0.70, otherwise Moderate. Illustration labels use:
scanIntensity ≥ 0.45 → High-scanning; otherwise turnDecisiveness < 0.75 → Cautious;
otherwise Direct. Thus R01/R02/R03/R07/R08 illustrate Direct, R04 Cautious, and
R05/R06 High-scanning. These display thresholds are also synthetic.

### Macro rendering and every new rendering coefficient

`humanMotionPose` translates the neutral BehaviorStyle port to subtle expression:

- Head scanning: sin(1.8 × story seconds + resident index) × (0.04 + 0.40 × scanIntensity), in radians. It stops under frozen/reduced-motion conditions. The largest fixture amplitude is approximately 0.268 radians (15.4°), without exaggerated gestures.
- Normal gait phase: story seconds × existing cadence (5 for R06, 8 for others) × speedMultiplier + resident index. Existing limb amplitudes and walker geometry remain unchanged.
- Heading response: existing exponential interpolation uses rate 4 + 4 × turnDecisiveness instead of a shared rate 8. Reduced motion still uses the existing discrete response.
- For other residents, each existing 3-second spatial interval keeps its endpoints. With u = fractional part of seconds / 3, hold = 0.10 × pauseTendency + 0.10 × hesitationIntensity; p = 0 while u < hold, otherwise (u − hold) / (1 − hold). The presented time is 3 × (floor(seconds / 3) + p − (1 − speedMultiplier) × sin(πp) / π). This adds short holds and subtle speed variation along the same routes. It is not a prediction of average travel time; the script retains arrivals and overall timing.
- A 0.01-second finite difference with tolerance 0.00001 identifies a presentation hold for the walking flag. The profile describes Scanning only when absolute rendered head angle exceeds 0.08 radians. These are display conventions, not detectors of psychological states.

`backtrackTendency` and `movementConsistency` remain proposed descriptive outputs
for replacement/evaluation; they do not create extra backtracks or stochastic
motion in this release. Experience also affects rendered cadence through the
speed formula. No body animation, head movement or numerical change occurs with
a separate simulation clock. Reduced motion bypasses continuous style warping,
gait and scanning. The 2D reference keeps its existing schematic motion.

## R06 compatibility and protected layers

The synthetic profile is **not the scientific cause** of R06’s scripted crisis.

- Normal: only baseline scanning/cadence expression may vary; R06’s position follows the original path.
- Emerging: original slower gait, holds, two reversals and head scanning dominate, unchanged.
- Crisis/human gate: original red status, frozen positions, sensor conflict and East Exit blockage persist.
- Recovery/result: original A/B/C paths and timing persist. A/85 reaches West Exit, B reaches the unsafe East Corridor blocked approach, C reaches Refuge Point awaiting staff.

`story.ts` stays byte-identical to V1/V2.1. Official navigation confidence, sensor
agreement, disagreement, anomaly, risk, vulnerability, triage formula/thresholds,
observations and reporting remain untouched. The final scripted prototype still
reports **40 / 39 / 1 / 97.5%**. Those values are not measured automation performance.

Hospital geometry, routes, signage, global/local/immediate Environment contracts,
historical exposure, sensing, Machine policy, intervention choices and scientific
caveats are preserved. No environment algorithm, adaptive Machine intervention,
phone/watch cue, V2.3 work or micro neural/computational model is implemented.
The public UI shows only MESO and MACRO, with no micro panel.

## Replaceable implementation

`SyntheticHumanBehaviorModel` implements the existing `HumanModel` through an
extended `HumanBehaviorStyleModel` port. Its metadata declares:

- ID `synthetic-human-behavior`, version `2.2.0-b`, runtime layer `human`;
- scientific domain `human`, evidence `synthetic`;
- analysisLevels `psychometric-cognitive`, `behavioral`;
- humanAnalysisLevels `meso-psychometric-cognitive`, `macro-behavior` (no micro).

`humanBehaviorProvider` registers and selects it through `ModelRegistry` and
injects a profile provider. Renderers consume `BehaviorStyle` through the
presentation adapter. Future reviewed empirical SoD/anxiety/behavior modules can
replace that composition and profile mapping without changing the scene,
resident meshes, Environment, Machine or Story. The neutral style port supports
explicit synthetic, empirical or prototype provenance; no empirical model is
provided or endorsed here.

The HumanModel behavior-proposal method emits explicitly synthetic movement /
scanning dimensions when used with an opt-in synthetic research snapshot. It
does not apply proposals to the official ledger, infer lostness, set latent
states, or feed a changed Machine policy. The public Showcase uses only its
presentation-style method. Empirical replacement needs operationalization,
calibration, task/population applicability and validation, beyond swapping a name.

## UI and review screenshots

The existing resident selection opens an Individual Navigation Profile with age,
mobility, six qualitative + normalized traits, visible synthetic caveats, separate
meso/macro labels, rendered action descriptions and optional comparison. Dynamic
Human states remain explicitly unspecified; scripted Machine diagnostics are
labelled separately. Desktop Human details scroll within the profile; mobile
uses a single readable column. Comparison is a secondary expandable table.

| Review state | Screenshot |
| --- | --- |
| R01 profile | [49 — R01](screenshots/49-v2-2-b-r01-profile.png) |
| R06 profile | [50 — R06](screenshots/50-v2-2-b-r06-profile.png) |
| Human diversity overview | [51 — diversity](screenshots/51-v2-2-b-human-diversity-overview.png) |
| Direct expression | [52 — direct](screenshots/52-v2-2-b-direct-navigator.png) |
| High-scanning expression | [53 — scanning](screenshots/53-v2-2-b-high-scanning-navigator.png) |
| R06 emerging | [54 — emerging](screenshots/54-v2-2-b-r06-emerging.png) |
| Resident comparison | [55 — comparison](screenshots/55-v2-2-b-resident-comparison.png) |
| Preserved human takeover | [56 — takeover](screenshots/56-v2-2-b-takeover-preserved.png) |
| Mobile profile | [57 — mobile](screenshots/57-v2-2-b-mobile.png) |

A still image cannot validate motion; `test:browser:human` samples actual rendered
head rotations over real time and checks three distinct expression amplitudes.
The retained 2D/3D browser suites verify the full official story and B/C outcomes.

## Reproduce validation

```bash
cd showcase-web
npm install
npm run typecheck
npm run test
npm run build
npm start
# In another terminal, against that production server:
npm run test:browser
npm run test:browser:3d
npm run test:browser:human
# From repository root:
python -m unittest discover -v
```

The Python regression suite uses the existing development environment with the
optional Streamlit platform dependencies. Browser tests need Chromium/Playwright
in the development environment; production adds no external runtime service,
API key, dependency or request. Historical approved screenshots are preserved;
new review artifacts use filenames 49–57. No production deployment is requested.

Stop for human scientific and visual review before merging or starting concrete
Environment/Machine models. Main, reviewed V2.2-A, V1 branch/tag and all stable
checkpoints remain unchanged.

## Recorded verification

Installation, TypeScript, 49 frontend tests, production build, retained 2D browser
flow, retained 3D browser flow, the new Human browser flow, and 32 Python regressions
passed. All nine screenshots were captured and visually inspected. Actual rendered
head-scan peaks were approximately 0.099 (R01), 0.190 (R04), and 0.268 radians (R05).
A retained browser assertion initially read the crisis DOM before its WebGL frame;
it now waits for the actual rendered red/block state before retaining the same
assertions. No application scientific rule changed to resolve that test race.
