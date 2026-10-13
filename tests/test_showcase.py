import json,unittest
from unittest.mock import patch
from pathlib import Path
from streamlit.testing.v1 import AppTest
from showcase import ShowcaseStory
from showcase_ui import sandbox_html,positions
from triage import assess

class ShowcaseTests(unittest.TestCase):
    def test_clean_start_transitions_and_core_crisis(self):
        s=ShowcaseStory();self.assertEqual(s.stage,'idle');self.assertEqual(s.simulation.total,0)
        s.start(0);self.assertEqual((s.stage,s.simulation.total),('normal',8))
        before=positions(s);s.tick(6);self.assertEqual(s.simulation.total,16)
        self.assertNotEqual(before,positions(s))
        s.tick(12);self.assertEqual(s.stage,'emerging')
        first=s.factors;s.tick(24.99);last=s.factors
        self.assertGreater(first.navigation_confidence,last.navigation_confidence)
        self.assertLess(first.behavior_anomaly,last.behavior_anomaly)
        self.assertFalse(s.assessment.escalated)
        s.tick(25);self.assertEqual(s.stage,'crisis');self.assertTrue(s.simulation.paused)
        self.assertAlmostEqual(s.assessment.score,.8394)
        self.assertEqual(s.simulation.occupants[5].sensor_evidence,{'UWB':'North Atrium','Camera':'Junction B','BLE':'East Corridor'})
        self.assertEqual((s.simulation.total,s.simulation.automatic,s.simulation.escalations),(24,16,1))
        frozen=positions(s);s.tick(35);self.assertEqual(s.stage,'human')
        s.tick(1000);self.assertEqual(s.elapsed,35);self.assertEqual(frozen,positions(s))
        with self.assertRaises(ValueError):s.submit('D',85,1000)
        with self.assertRaises(ValueError):s.submit('A',101,1000)

    def test_manual_pause_resume_and_delayed_ticks_never_skip_gate(self):
        s=ShowcaseStory();s.start(0);s.pause(8);frozen=positions(s)
        s.tick(80);self.assertEqual(s.elapsed,8);self.assertEqual(positions(s),frozen)
        s.resume(100);s.tick(104);self.assertEqual(s.stage,'emerging')
        s.tick(10000);self.assertEqual(s.stage,'human');self.assertEqual(s.elapsed,35)
        self.assertIsNone(s.simulation.decision)

    def test_all_decisions_counts_and_reset(self):
        for choice,outcome in [('A','SAFE:'),('B','UNSAFE:'),('C','PENDING:')]:
            with self.subTest(choice=choice):
                s=ShowcaseStory();s.skip_to_takeover(0);s.tick(300)
                self.assertEqual(s.stage,'human')
                s.submit(choice,85,300);self.assertEqual(s.stage,'recovery')
                s.tick(305);self.assertEqual(s.simulation.round,4)
                s.tick(310);self.assertEqual(s.stage,'result');self.assertEqual(s.simulation.round,5)
                report=s.report()
                self.assertEqual((report['total_observations'],report['automatically_handled_observations'],report['human_escalations']),(40,39,1))
                self.assertEqual(report['automation_coverage_percent'],97.5)
                self.assertTrue(report['final_safety_outcome'].startswith(outcome))
                self.assertEqual(report['human_confidence'],85)
                self.assertEqual(report['human_decision'],choice)
                s.tick(320);self.assertTrue(s.complete)
                before=s.elapsed;s.tick(10000);self.assertEqual(s.elapsed,before)
                s.reset();self.assertEqual(s.stage,'idle');self.assertIsNone(s.choice)
                self.assertEqual(s.simulation.total,0);self.assertFalse(s.complete)
                s.start(20000);self.assertEqual(s.simulation.total,8)

    def test_session_only_no_provider_or_participant_storage(self):
        with patch('experiment.storage.PilotStore',side_effect=AssertionError('public storage call')), \
             patch('agents.concordia_adapter.run_agents',side_effect=AssertionError('provider call')):
            at=AppTest.from_file(str(Path(__file__).resolve().parents[1]/'app.py')).run()
            self.assertEqual(len(at.exception),0)
            self.assertEqual(at.session_state.experience,'Showcase Mode')
            self.assertEqual(len(at.sidebar.radio),0)
            at.button(key='showcase_skip').click().run()
            at.button(key='showcase_choice_A').click().run()
            at.button(key='showcase_submit').click().run()
            self.assertEqual(len(at.exception),0)
            self.assertEqual(at.session_state.showcase_story.simulation.decision,'A')
            at.button(key='showcase_reset').click().run()
            self.assertEqual(at.session_state.showcase_story.stage,'idle')
            self.assertEqual(len(at.slider),0)
            self.assertFalse('participant_session' in at.session_state)

    def test_research_navigation_preserves_paused_story(self):
        at=AppTest.from_file(str(Path(__file__).resolve().parents[1]/'app.py')).run()
        at.button(key='showcase_start').click().run()
        at.button(key='open_research').click().run()
        self.assertEqual(at.session_state.experience,'Research Mode')
        self.assertEqual(at.sidebar.radio(key='workspace').value,'Research instrument')
        self.assertTrue(at.session_state.showcase_story.manual_paused)
        at.sidebar.radio(key='workspace').set_value('Showcase Mode').run()
        self.assertEqual(at.session_state.experience,'Showcase Mode')
        self.assertTrue(at.session_state.showcase_story.manual_paused)
        self.assertEqual(len(at.exception),0)

    def test_reduced_motion_and_freeze_markup(self):
        s=ShowcaseStory();s.start(0)
        self.assertIn('prefers-reduced-motion',sandbox_html(s))
        self.assertIn('const moving=true',sandbox_html(s))
        s.skip_to_takeover(0)
        self.assertIn('const moving=false',sandbox_html(s))
        self.assertIn('BLOCKED',sandbox_html(s))
        self.assertIn('id="pause-overlay"',sandbox_html(s))
        self.assertIn('animation-play-state:paused',sandbox_html(s))
