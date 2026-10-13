"""Run: python -m unittest -v test_web.py (with Streamlit installed)."""
from pathlib import Path
import unittest

from streamlit.testing.v1 import AppTest
from demo import triage_score
from web_simulation import Simulation

ROOT = Path(__file__).resolve().parent


class WebWorkflowTests(unittest.TestCase):
    def start(self):
        at = AppTest.from_file(str(ROOT / 'app.py')).run()
        at.button(key='open_research').click().run()
        at.sidebar.radio(key='workspace').set_value('Five-round demo').run()
        self.assertEqual(len(at.exception), 0)
        return at

    def test_all_decisions_pause_resume_and_report(self):
        for choice, expected in [('A', 'SAFE:'), ('B', 'UNSAFE:'), ('C', 'PENDING:')]:
            with self.subTest(choice=choice):
                at = self.start()
                at.button(key='next').click().run()
                first_locations = [o.current_location for o in at.session_state.simulation.occupants]
                at.button(key='next').click().run()
                self.assertNotEqual(first_locations, [o.current_location for o in at.session_state.simulation.occupants])
                at.button(key='next').click().run()
                sim = at.session_state.simulation
                self.assertTrue(sim.paused)
                self.assertEqual((sim.round, sim.total, sim.automatic, sim.escalations), (3, 24, 16, 1))
                self.assertAlmostEqual(triage_score(sim.occupants[5]), 0.8394)
                self.assertTrue(at.button(key='next').disabled)
                self.assertTrue(at.button(key='submit').disabled)
                at.run()  # Rerendering without submission must not resume.
                self.assertEqual(at.session_state.simulation.round, 3)
                at.button(key=f'choice_{choice}').click().run()
                at.slider(key='human_confidence').set_value(90).run()
                self.assertTrue(at.session_state.simulation.paused)
                at.button(key='submit').click().run()
                self.assertFalse(at.session_state.simulation.paused)
                at.button(key='next').click().run()
                if choice == 'A':
                    self.assertEqual(at.session_state.simulation.occupants[5].current_location, 'West Corridor')
                at.button(key='next').click().run()
                self.assertEqual(len(at.exception), 0)
                report = at.session_state.simulation.report()
                self.assertEqual(report['total_observations'], 40)
                self.assertEqual(report['automatically_handled_observations'], 39)
                self.assertEqual(report['human_escalations'], 1)
                self.assertEqual(report['automation_coverage_percent'], 97.5)
                self.assertEqual(report['human_confidence'], 90)
                self.assertEqual(report['human_decision'], choice)
                self.assertEqual(report['human_intervention_corrected_ai_only_failure'], choice == 'A')
                self.assertTrue(report['final_safety_outcome'].startswith(expected))
                self.assertTrue(any('Human-alone performance requires empirical testing.' in m.value for m in at.info))
                self.assertEqual(len(report['observations']), 40)
                self.assertTrue(at.button(key='next').disabled)
                at.button(key='reset').click().run()
                self.assertEqual(at.session_state.simulation.total, 0)
                self.assertIsNone(at.session_state.choice)

    def test_automatic_ticks_stop_at_takeover(self):
        at = self.start()
        at.button(key='start').click().run()
        self.assertEqual(at.session_state.simulation.round, 1)
        at.run()
        at.run()
        self.assertEqual(at.session_state.simulation.round, 3)
        at.run()
        self.assertEqual(at.session_state.simulation.round, 3)
        at.button(key='choice_A').click().run()
        at.button(key='submit').click().run()
        self.assertEqual(at.session_state.simulation.round, 4)
        at.run()
        self.assertTrue(at.session_state.simulation.finished)
        self.assertEqual(at.session_state.simulation.occupants[5].current_location, 'West Exit')
        self.assertEqual(len(at.exception), 0)

    def test_state_guard_prevents_advance_without_submission(self):
        sim = Simulation()
        for _ in range(3):
            sim.advance()
        self.assertFalse(sim.advance())
        with self.assertRaises(ValueError):
            sim.submit('D', 90)
        with self.assertRaises(ValueError):
            sim.submit('A', 101)
        self.assertTrue(sim.paused)
        sim.submit('A', 85)
        with self.assertRaises(ValueError):
            sim.submit('A', 85)
        sim.advance()
        sim.advance()
        self.assertFalse(sim.advance())


class ResearchModelTests(unittest.TestCase):
    def test_default_crisis_and_normal(self):
        from demo import create_occupants, inject_crisis
        from research_config import effective_factors, preset_settings
        from triage import assess
        crisis = create_occupants()[5]
        inject_crisis(crisis)
        self.assertTrue(assess(crisis).escalated)
        self.assertAlmostEqual(assess(crisis).score, 0.8394)
        preset = effective_factors(preset_settings('Blocked exit crisis'))
        self.assertEqual(assess(preset), assess(crisis))
        self.assertFalse(assess(effective_factors(preset_settings('Normal visitor'))).escalated)

    def test_independent_mandatory_rules_and_boundaries(self):
        from dataclasses import replace
        from triage import Factors, assess
        base = Factors(1, 1, 0, 0, 0, 0)
        for fields, expected in [({'safety_risk':0.85}, 'Safety risk rule'),
                                 ({'model_disagreement':0.75,'sensor_agreement':0.45}, 'Disagreement rule'),
                                 ({'behavior_anomaly':0.80}, 'Behavior anomaly rule')]:
            result = assess(replace(base, **fields))
            self.assertTrue(result.escalated)
            self.assertLess(result.score, 0.62)
            self.assertEqual([k for k,v in result.rules.items() if v], [expected])
        self.assertFalse(assess(replace(base, safety_risk=0.8499)).escalated)
        self.assertFalse(assess(replace(base, behavior_anomaly=0.7999)).escalated)
        self.assertFalse(assess(replace(base, model_disagreement=0.75, sensor_agreement=0.4501)).escalated)

    def test_normalization_and_invalid_weights(self):
        from triage import DEFAULT_WEIGHTS, normalize_weights
        normalized = normalize_weights({k:1 for k in DEFAULT_WEIGHTS})
        self.assertAlmostEqual(sum(normalized.values()), 1)
        self.assertTrue(all(abs(v-1/6)<1e-12 for v in normalized.values()))
        for invalid in [{k:0 for k in DEFAULT_WEIGHTS}, {}, {**DEFAULT_WEIGHTS,'safety':float('nan')}, {**DEFAULT_WEIGHTS,'safety':-1}]:
            with self.assertRaises(ValueError):
                normalize_weights(invalid)

    def test_reproducible_cases_and_ground_truth(self):
        from synthetic_cases import generate_cases, is_critical
        from triage import Factors
        self.assertEqual(generate_cases(42), generate_cases(42))
        self.assertNotEqual(generate_cases(42), generate_cases(43))
        base = Factors(1,1,0,0,0,0)
        from dataclasses import replace
        self.assertFalse(is_critical(base))
        self.assertTrue(is_critical(replace(base, safety_risk=0.80)))
        self.assertTrue(is_critical(replace(base, behavior_anomaly=0.85)))
        self.assertTrue(is_critical(replace(base, model_disagreement=0.80, sensor_agreement=0.35)))
        self.assertFalse(is_critical(replace(base, model_disagreement=0.80, sensor_agreement=0.3501)))

    def test_sweep_counts_tradeoff_and_confusion_metrics(self):
        from synthetic_cases import generate_cases, threshold_sweep, inspect_cases, sweep_csv
        from triage import TriageConfig
        import csv, io
        cases = generate_cases(42)
        sweep = threshold_sweep(cases)
        self.assertEqual(len(sweep), 15)
        self.assertEqual([r['Threshold'] for r in sweep], [i/100 for i in range(20,91,5)])
        self.assertTrue(all(a['Automation coverage %']<=b['Automation coverage %'] for a,b in zip(sweep,sweep[1:])))
        self.assertTrue(all(a['Critical-case recall %']>=b['Critical-case recall %'] for a,b in zip(sweep,sweep[1:])))
        self.assertGreater(sweep[-1]['Automation coverage %'], sweep[0]['Automation coverage %'])
        self.assertGreater(sweep[-1]['Missed critical cases'], 0)
        self.assertEqual(len(list(csv.DictReader(io.StringIO(sweep_csv(sweep))))), 15)
        for point in sweep:
            config = TriageConfig(thresholds={**TriageConfig().thresholds,'main':point['Threshold']})
            rows = inspect_cases(cases, config)
            crit = sum(r['Ground-truth critical?'] for r in rows)
            missed = sum(r['Outcome category']=='Missed critical' for r in rows)
            false = sum(r['Outcome category']=='False escalation' for r in rows)
            self.assertEqual(point['Missed critical cases'], missed)
            self.assertAlmostEqual(point['Critical-case recall %'], 100*(crit-missed)/crit)
            self.assertAlmostEqual(point['False escalation rate %'], 100*false/(len(rows)-crit))
            self.assertAlmostEqual(point['Human escalation rate %']+point['Automation coverage %'],100)

    def test_import_export_roundtrip_and_rejections(self):
        import copy, json
        from research_config import default_experiment, import_experiment, validate_experiment
        config = default_experiment()
        self.assertEqual(import_experiment(json.dumps(config)), validate_experiment(config))
        for key, value in [('seed', -1), ('case_count', 199), ('schema_version', 2)]:
            bad = copy.deepcopy(config)
            bad[key] = value
            with self.assertRaises(ValueError):
                import_experiment(json.dumps(bad))
        for value in [float('nan'), -0.1, 'secret', True]:
            bad = copy.deepcopy(config)
            bad['settings']['navigation_confidence'] = value
            with self.assertRaises(ValueError):
                import_experiment(json.dumps(bad))
        for text in ['{', '[]', '{"schema_version":1}', 'a'*262145]:
            with self.assertRaises(ValueError):
                import_experiment(text)

    def test_context_mapping_explicit_and_case_loaded_exactly(self):
        from research_config import effective_factors, preset_settings, settings_from_case
        from synthetic_cases import generate_cases, factors_from_case
        normal = preset_settings('Normal visitor')
        normal['exit_blocked'] = True
        self.assertEqual(effective_factors(normal).safety_risk, 0.05)
        normal['context_mapping'] = True
        self.assertEqual(effective_factors(normal).safety_risk, 0.96)
        case = generate_cases()[0]
        self.assertEqual(effective_factors(settings_from_case(case)), factors_from_case(case))

    def test_cli_standard_library_baseline(self):
        import json, shutil, subprocess, tempfile
        with tempfile.TemporaryDirectory() as directory:
            for name in ['demo.py','triage.py']:
                shutil.copy2(ROOT/name, Path(directory)/name)
            run = subprocess.run(['python3',str(Path(directory)/'demo.py')], input='A\n85\n',
                                 text=True, capture_output=True, timeout=10)
            self.assertEqual(run.returncode, 0, run.stderr)
            report = json.loads((Path(directory)/'hybrid_demo_report.json').read_text())
            self.assertEqual(report['total_observations'],40)
            self.assertEqual(report['human_confidence'],85)
            self.assertTrue(report['human_intervention_corrected_ai_only_failure'])


class ResearchUITests(unittest.TestCase):
    def start(self):
        at = AppTest.from_file(str(ROOT/'app.py')).run()
        at.button(key='open_research').click().run()
        at.sidebar.radio(key='workspace').set_value('Research instrument').run()
        self.assertEqual(len(at.exception),0)
        return at

    def test_presets_thresholds_watch_and_normalization(self):
        at = self.start()
        self.assertTrue(any(m.value=='AI AUTO' for m in at.success))
        at.button(key='preset_4').click().run()
        self.assertEqual(at.metric[0].value,'0.8394')
        self.assertTrue(any(m.value=='HUMAN TAKEOVER' for m in at.error))
        # Raising the main threshold alone cannot bypass mandatory safeguards.
        at.slider(key='t_main').set_value(1.0).run()
        self.assertTrue(any(m.value=='HUMAN TAKEOVER' for m in at.error))
        at.button(key='preset_2').click().run()
        at.slider(key='t_main').set_value(0.32).run()
        self.assertTrue(any(m.value=='WATCH / UNCERTAIN' for m in at.warning))
        at.slider(key='t_main').set_value(0.20).run()
        self.assertTrue(any(m.value=='HUMAN TAKEOVER' for m in at.error))
        at.slider(key='w_navigation').set_value(0.40).run()
        next(b for b in at.button if b.label=='Normalize weights').click().run()
        from triage import DEFAULT_WEIGHTS
        self.assertAlmostEqual(sum(at.session_state['w_'+k] for k in DEFAULT_WEIGHTS),1)
        self.assertEqual(len(at.exception),0)

    def test_sweep_filter_load_and_workspace_isolation(self):
        from synthetic_cases import generate_cases
        at = self.start()
        at.slider(key='t_main').set_value(0.90).run()
        at.button(key='run_sweep').click().run()
        self.assertEqual(len(at.exception),0)
        at.multiselect(key='case_filters').set_value(['Missed critical']).run()
        ids = at.selectbox(key='inspect_case_id').options
        self.assertGreater(len(ids),0)
        selected = ids[0]
        at.button(key='load_case').click().run()
        case = next(c for c in generate_cases() if c['case_id']==selected)
        for name in ['navigation_confidence','sensor_agreement','model_disagreement','behavior_anomaly','safety_risk','vulnerability']:
            self.assertAlmostEqual(at.slider(key='r_'+name).value,case[name])
        self.assertEqual(at.session_state.selected_case['case_id'],selected)
        at.number_input(key='research_seed').set_value(43).run()
        self.assertTrue(any('Seed/sample count changed' in w.value for w in at.warning))
        self.assertEqual(at.session_state.benchmark['seed'],42)
        at.sidebar.radio(key='workspace').set_value('Five-round demo').run()
        at.button(key='next').click().run()
        self.assertEqual(at.session_state.simulation.round,1)
        self.assertFalse(at.session_state.simulation.paused)
        self.assertEqual(len(at.exception),0)


if __name__ == '__main__':
    unittest.main()
