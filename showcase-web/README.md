# New Research Paradigm — Vercel Showcase

A standalone, client-facing **Next.js + TypeScript + App Router** experience.
It runs without the Python/Streamlit server. There is no database, authentication,
API route, LLM call, account, API key, participant identifier or durable storage.
All decisions live in React memory; Reset, reload or a new tab starts a clean story.

## Run locally

Use Node.js 24 (tested: 24.19.0; Next.js requires at least 20.9).

```bash
cd showcase-web
npm install
npm run build
npm start
```

For development use `npm run dev`. The committed lockfile also supports `npm ci`
for a reproducible installation. No environment variables are required. Fonts,
icons, map and animation are local; the browser does not call external services.

## The experience

The landing page introduces the hospital-like schematic and its complete legend.
Eight fixed identities, R01–R08, remain throughout; occupants are never respawned.
Hover, tap or keyboard-focus a marker to see its age group, mobility, location,
route and changing indicators. R06 is an older adult using a walker.

The story has **55 active seconds plus your decision time**, approximately a
60-second experience for a brief response:

| Active time | Stage | Behavior |
| --- | --- | --- |
| 0–3s | Introduce the environment | Map and legend; occupants hold position |
| 3–12s | Ordinary automation | Eight green occupants visibly move |
| 12–25s | Emerging uncertainty | R06 turns amber; five indicators gradually change |
| 25–35s | Validated long-tail crisis | R06 red, East Exit blocked, all occupants freeze |
| 35s, indefinitely | Human judgment | A/B/C choice and confidence; no timeout |
| 35–45s after submission | Hybrid recovery | Movement resumes according to the chosen route |
| 45–55s | Collaboration report | 40 observations, 39 automatic, 1 escalation; report remains afterward |

Controls are Start, Pause/Resume, Skip to Human Takeover and Reset. Skip evaluates
rounds 1–3 and enters the same decision gate; it cannot silently choose for you.
A reaches West Exit safely. B stops at the blocked East Exit approach and remains
unsafe. C reaches Refuge Point, requests staff and leaves evacuation unconfirmed.
Reduced-motion settings remove interpolation and animated route dashes, using
discrete positions while preserving stage progression and outcomes. Occupants
sharing a node are spread into individually visible markers with thin tethers to
their unchanged schematic location. Manual pause
and the human gate freeze occupants and route animation, including during slider changes.

## Scientific boundary and Python parity

`lib/story.ts` transcribes the **existing defaults** from `../triage.py`, R06
injection from `../demo.py`, and acknowledged-incident counting from
`../web_simulation.py`. The existing Python scientific sources are unchanged.
Animation is a schematic illustration, not a new navigation/planning model.
Intermediate amber indicators are a narrative cue, not a calibrated risk category.

The crisis retains navigation confidence 0.39, sensor agreement 0.22, model
disagreement 0.88, behavior anomaly 0.92, safety risk 0.96 and vulnerability 0.90.
Its original weighted triage score is **0.8394**. The main ≥0.62, safety ≥0.85,
disagreement ≥0.75 with agreement ≤0.45, and behavior ≥0.80 rules are unchanged.
Normal observations are recorded for two rounds. Round 3 holds all eight
observations at the triage barrier; submission acknowledges R06 and releases the
other seven. Rounds 4–5 then yield 40/39/1 for **every** choice. B/C still preserve
their unresolved safety consequences; coverage is not success or superiority.

**Simulated demonstration.**

> 97.5% is a scripted prototype result, not a real-world automation estimate.
>
> Human-alone and Hybrid performance require empirical validation.

No real human behavioral evidence, validated AI superiority or validated Concordia
behavior is implied. This frontend does not invoke Concordia. It contains no
research thresholds, seed controls, study builder or participant data collection.
Milestones 1–6 remain in the separate Streamlit research platform; Milestone 7
has not been started.

## Deploy to Vercel

Import the GitHub repository into Vercel with these settings:

| Setting | Value |
| --- | --- |
| Repository | `zhoujia07-hash/NewResearchParadigm` |
| Production branch | `main` |
| Root Directory | `showcase-web` |
| Framework Preset | **Next.js** |
| Node.js version | **24.x** |
| Install command | Default (`npm install`; `npm ci` is also supported) |
| Build command | Default (`npm run build`) |
| Output directory | Framework default; leave unset |
| Environment variables | **None** |

Click **Deploy**. For a public client demo, allow public access in the project's
Deployment Protection settings if the account enables protection by default.
Do not select the repository root or `app.py`: that is the separate Streamlit app.
No Vercel-specific rewrite or secret is needed. The project owner has confirmed the V1 commit is successfully deployed to Vercel.
The public URL has not been provided here; use the actual URL from the Vercel
project. See [permanent checkpoint and rollback policy](../VERSION_CHECKPOINTS.md).

## Validation

```bash
npm run test
npm run typecheck
npm run build
# Start the production server in another terminal, then:
npm run test:browser
```

The five Node tests cover seven stages, actual observation counts, indefinite
human pause, manual pause, delayed clocks, A/B/C outcomes, reset, discrete reduced
motion and triage parity against Python. **Only the parity test** uses Python 3
and the neighboring scientific source; the frontend installation, build and
runtime do not require Python. It runs without external Python packages.

The Playwright test uses real wall-clock time, actual controls, a production
server and Chromium. This environment uses `/usr/bin/chromium`; elsewhere set
`CHROMIUM_PATH` to an installed Chromium executable. It verifies desktop normal,
amber/red transitions, freeze, A/85, West Exit, final report, reset, B/C at 390px,
reduced motion, zero horizontal overflow, browser errors, storage and external
requests. Override `SHOWCASE_URL` for a different test server. It writes screenshots
19–24, leaving all historical Streamlit screenshots intact.

![Normal simulation](../screenshots/19-vercel-showcase-normal.png)

![Emerging uncertainty](../screenshots/20-vercel-showcase-emerging.png)

![Human takeover](../screenshots/21-vercel-showcase-takeover.png)

![Final collaboration report](../screenshots/22-vercel-showcase-final.png)

![Mobile landing](../screenshots/23-vercel-showcase-mobile.png)

![Mobile human takeover](../screenshots/24-vercel-showcase-mobile-takeover.png)
