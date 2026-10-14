# V2.2-C — synthetic Environment research demonstration

Branch: `v2.2-c-environment-models`. Base:
`b9581fb4ac2ae0585016208ab8a6031c5a147482` (completed V2.2-B).
This is a separate research page at **`/environment-comparison`**, linked from the
original Showcase. It is not merged to main or deployed to production.

## Controlled Simple-vs-Complex Environment Comparison

**This comparison isolates synthetic spatial-structure differences while holding Human profile and task constant.**

“Simple” and “Complex” are experimental labels for synthetic route structures.
They are not validated complexity classes. These results are not empirical evidence.
The demonstration follows declared structural characteristics → synthetic local
demand → synthetic H×E presentation response. It generates no lostness/failure
probability, neural state, clinical label or official safety/triage result.

### Held constant

- The exact same immutable V2.2-B Human profile appears on both sides, default **R04**. Selecting any R01–R08 changes both together and resets the shared experiment. No trait or latent state is inferred from Environment.
- Navigation intent: Entrance → Destination / target room. Start and destination have matching coordinates (−18, 0) and (18, 0).
- Baseline support: static route map, standard direction signs and teal room markers. No adaptive Machine policy or extra intervention is delivered.
- Human base behavior coefficients from V2.2-B, identical H×E response rule, scene scale, camera, hospital palette, cutaway room furniture, avatar appearance and rendering conventions.
- One state-owned experiment clock, one Start/Pause/Resume/Reset control set. Neither 3D scene owns a navigation timer. Both graphs, context panels and avatars derive from the same state/time.

Only the synthetic route structure changes. Route length, turns, degree, branching,
network paths and geometry-based sightlines co-vary as a **bundle**. This does not
isolate a causal contribution of node count or any individual structural variable.
Task intent is constant; physical route length is intentionally reported, not
claimed to be matched.

### Exact deterministic presets and raw structure

| Variable | Simple | Complex |
| --- | --- | --- |
| Nodes | 9 | 21 |
| Edges, undirected | 8 | 23 |
| Decision points (degree ≥ 3) | 2 | 9 |
| Mean branching (mean node degree, 2E/N) | 16/9 ≈ 1.78 | 46/21 ≈ 2.19 |
| Branch surplus, Σ max(0, degree−2) | 2 | 10 |
| Planned route length | 36 illustrative m | 52 illustrative m |
| Nonzero planned-route turns | 0 | 4, all 90° |
| All simple Entrance→Destination paths | 1 | 8 |
| Route alternatives excluding selected path | 0 | 7 |
| Connectivity | Connected | Connected |

Node count, edge count, decision points, branching, turn geometry, route alternatives,
connectivity and route length remain separate raw variables. There is no global
validated complexity score. “Mean branching” is explicitly mean degree, not an
inferred psychological burden. Path counts enumerate graph paths without repeated
nodes, including longer alternatives; they are not probabilities or a claim that
people consider every path. Only these small fixtures are enumerated exhaustively.

**Simple:** a straight seven-node main route with two side rooms. Coordinates:

| Node | Position (x,z) | Role |
| --- | --- | --- |
| S0 | (−18,0) | Entrance |
| S1 | (−12,0) | Corridor 01 |
| S2 | (−6,0) | Junction 01 |
| S3 | (0,0) | Corridor 02 |
| S4 | (6,0) | Junction 02 |
| S5 | (12,0) | Corridor 03 |
| S6 | (18,0) | Destination |
| S7 | (−6,−7) | Side room 01 |
| S8 | (6,7) | Side room 02 |

Edges: S0–S1, S1–S2, S2–S3, S3–S4, S4–S5, S5–S6, S2–S7, S4–S8.
Decision points/junctions: **S2, S4**.
Exact route: **S0 → S1 → S2 → S3 → S4 → S5 → S6**.

**Complex:** a deterministic 3×7 grid of corridor nodes. T0–T6 have z=−8,
M0–M6 have z=0, B0–B6 have z=8. Column c has x=−18+6c.
Each row has consecutive horizontal links, except **M1–M2 and M4–M5 are absent**.
Vertical links: T1–M1, M1–B1, T3–M3, M3–B3, T5–M5, M5–B5, B6–M6.
Decision points/junctions: **T1, T3, T5, M1, M3, M5, B1, B3, B5**.
Exact selected route: **M0 → M1 → T1 → T2 → T3 → T4 → T5 → M5 → M6**.
Its four turns are at **M1, T1, T5, M5**. The missing central links require
junction negotiation on the shortest route. Both selected routes are shortest
paths in their own network, tested with weighted graph traversal; an unnecessary
detour is not selected to manufacture a harder case.

The presets declare nodes, edges, start, goal, route, junctions, decision points,
geometry interpretation, visibility interpretation, signage and landmark descriptors.
Nothing is randomly generated. Closed-room props are identical decorative context
in both scenes; they are not additional route nodes or navigable branches.

### Live local context and synthetic local demand

For the current planned segment a→b, context reports the region of a, upcoming
node b, next planned junction, degree of b, forward choices degree−1, next-turn
angle, planned-route visibility proxy, and constant signage/landmark support.
Context changes as the resident reaches successive segments. Values at a junction
are anticipatory context, not inferred Human perceptions.

Turn angle θ is computed from consecutive route coordinate vectors using the
clamped dot-product angle. Segment lengths use Euclidean distance.

Visibility V is a **geometry-only planned-route straight-run proxy**. Sum the
current segment length plus subsequent collinear planned segments until the next
bend. If the goal is reached without a bend, V=1 (a nearby visible goal is clear).
Otherwise V=min(1, straight-run length/12). The 12-unit horizon is a synthetic
convention. This is not renderer ray-casting, eye tracking, photometry, occlusion
measurement or a validated visibility metric. No signage optimization or salience
algorithm is implemented.

The explicitly synthetic local demand d is:

```text
d = min(1,
    0.12 × max(0, upcoming degree − 2)
  + 0.25 × θ / 180
  + 0.20 × (1 − V))
```

The coefficients are illustrative assumptions. The proxy inputs can be correlated;
this expression does not establish their independent effects. Node count and total
edge count do not directly enter d. It does not enter the original triage logic.

### Exact synthetic H×E behavior mapping

The unchanged V2.2-B Human model supplies base cadence multiplier bSpeed, hesitation
bHesitation, scanning bScan and turn decisiveness bTurn. Let D=synthetic SoD,
A=synthetic anxiety trait, and susceptibility s=0.5+0.5(1−D).

```text
planned movement speed = 2 × bSpeed × (1 − 0.35 × d × s)
hesitation expression   = min(1, bHesitation + 0.40 × d × (1−D))
scanning intensity     = min(1, bScan + 0.50 × d × (0.5+0.5A))
turn decisiveness      = max(0.20, bTurn − 0.25 × d × (1−D))
brief pause duration   = 0.80 × hesitation expression × d
```

All quantities carry synthetic provenance. Metre/m/s labels use the explicitly
illustrative scene scale. These are not measured speed effects, psychological
susceptibility estimates or calibrated individual predictions. Trait contributions
are demonstration rules, not causal claims about SoD or anxiety.

Before each segment, the traversal expresses the brief pause, then moves at that
segment's planned speed. The schedule is reconstructed deterministically from the
shared elapsed time; renderers do not integrate their own movement. Paused/arrived
residents display actual movement speed 0. Behavior labels are Ready, Paused,
Brief hesitation, Walking steadily, Cautious movement (d>0.25), or Destination reached.
No behavior is automatically interpreted as lostness.

Head scanning uses sin(1.8×shared time) × (0.04+0.40×scanning intensity) radians.
Leg motion uses sin(6×shared time) × 0.24 radians with opposite leg phases.
Both stop when paused/arrived; reduced motion removes gait and head scanning.
The camera stays fixed. Graph and spatial position continue to convey experiment
progress under reduced motion. Heading follows segment geometry; turn decisiveness
is displayed as a proposed dimension, not implemented as a separate physical turn
controller in this stage.

All coefficients are invented and replaceable. Human latent uncertainty, confidence,
anxiety, workload and lostness remain unknown. The comparison creates no neural
model or adaptive Machine module.

### Shared controls and completion

Start/Resume advances the single clock; Pause stops both scenes; Reset returns
both to Entrance at t=0 while preserving the resident selection. Selecting a
resident resets both and pauses, avoiding an uncontrolled mid-route profile swap.
Both routes completing pauses the clock. A 120-second safety cap prevents an
unbounded local timer; all current profiles complete both fixture routes before it.
The cap is a UI guard, not a performance threshold.

Desktop presents both 3D scenes, synchronized top-down graphs, raw structure,
local context and behavior panels together. Mobile stacks the same two cards.
Without WebGL, both synchronized route graphs and experiment controls remain usable.
No account, external runtime request, participant data, API key or new dependency
is required.

### Isolation from the official Showcase

This page has no dependency on the official Story runtime, triage, East Exit
crisis, A/B/C takeover or collaboration counters. It uses no R06 crisis timeline;
R06 may be selected only as the same synthetic profile in both experimental scenes.
The original Showcase remains at `/` and retains its scientific behavior. Only a
navigation link is added there. `story.ts`, all original Human model parameters,
Environment/Machine contracts, crisis inputs, thresholds and Python science remain
unchanged. Nothing is merged or deployed automatically.

### Review screenshots

| Artifact | Link |
| --- | --- |
| Paired overview | [67 — Simple vs Complex](screenshots/67-v2-2-c-simple-vs-complex.png) |
| Simple card | [68 — Simple network](screenshots/68-v2-2-c-simple-network.png) |
| Complex card | [69 — Complex network](screenshots/69-v2-2-c-complex-network.png) |
| Early shared progress | [70 — Early comparison](screenshots/70-v2-2-c-live-comparison-early.png) |
| Junction context | [71 — Junction](screenshots/71-v2-2-c-live-comparison-junction.png) |
| Paired live local panels | [72 — Local demand](screenshots/72-v2-2-c-live-local-demand.png) |
| Same selected R01 on both sides | [73 — Same Human](screenshots/73-v2-2-c-same-human-different-environment.png) |
| Stacked mobile cards | [74 — Mobile](screenshots/74-v2-2-c-mobile-comparison.png) |

### Validation and interpretation limits

Unit tests verify exact graph counts, connectivity, declared routes/turns/junctions,
shortest paths, same Human/task/support/clock references, immutable profiles,
deterministic bounded synthetic response, evolving local context, shared reset,
completion, one timer and no official Story runtime dependency. They validate
implementation assumptions, not scientific truth.

The browser test checks actual rendered WebGL pixels in both scenes, simultaneous
movement and shared elapsed values, Pause/Resume/Reset, resident selection,
changing local panels and graphs, different response values, both goals reached,
mobile stacking, reduced motion, graph fallback, no browser errors and no external
runtime requests. Review screenshots are captured from the actual browser.

```bash
cd showcase-web
npm install
npm run typecheck
npm run test
npm run build
npm start
# Against that production server:
npm run test:browser:comparison
npm run test:browser
npm run test:browser:3d
# From repository root, using the existing platform environment:
python -m unittest discover -v
```

This is one controlled software demonstration with multiple co-varying structural
features and invented response rules. It cannot establish that a complex network
causes lostness, that a Human trait causes a behavioral effect, or that any
intervention improves navigation. Future empirical studies must independently
operationalize and validate demand, visibility, behavior and applicability.

### Implementation map and recorded verification

- `models/environment/comparison/simpleEnvironment.ts` and `complexEnvironment.ts`: deterministic preset declarations.
- `models/environment/comparison/structure.ts`: separate raw graph metrics, route geometry, local context and synthetic demand.
- `models/coupling/syntheticEnvironmentResponse.ts`: explicitly synthetic H×E response coefficients.
- `engine/comparison/experiment.ts`: shared task/support, one experiment state and deterministic route traversal.
- `components/comparison/`: matched hospital rendering, synchronized graph and live metric panels.
- `app/environment-comparison/`: controlled research page and scoped layout.
- `tests/environment-comparison.test.ts` and `tests/browser-comparison.cjs`: unit and actual browser verification.

Installation, typecheck, **55 frontend tests**, production build, the comparison
browser suite, retained 2D/3D Showcase browser suites, and **32 Python regressions**
passed. All eight requested screenshots were captured and visually inspected.
The retained 3D mesh-selection test now scrolls the canvas into view before its
projected-coordinate click, accommodating the added navigation entry without
changing its actual mesh-selection assertions. Historical screenshots are preserved.

The original scientific Story, Human profiles/model, Environment/Machine contracts,
Python code, V1 checkpoints and protected branches remain unchanged. No V2 stable
tag, merge, production deployment, adaptive Machine model or Human micro model
was created. Stop here for scientific and visual review.
