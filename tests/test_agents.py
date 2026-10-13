import json,unittest
from unittest.mock import patch
from agents.concordia_adapter import *
from research_config import preset_settings

class AgentTests(unittest.TestCase):
    def test_mock_pipeline_and_disagreement(self):
        scenario=preset_settings('Blocked exit crisis')
        result=run_agents(scenario,'mock')
        self.assertEqual(set(result['recommendations']),set(ROLES))
        self.assertFalse(result['fallback'],result['failures'])
        self.assertEqual(result['disagreement'],1)
        self.assertEqual(result['state'],'HUMAN TAKEOVER')
        self.assertFalse(result['admissible']['RouteAgent'])
        self.assertEqual(result['triage_inputs']['safety_risk'],.96)
        normal=run_agents(preset_settings('Normal visitor'),'mock')
        self.assertEqual(normal['disagreement'],0)
        self.assertEqual(normal['state'],'AI AUTO')
        recommendations=result['recommendations']
        recommendations['AccessibilityAgent']['route_choice']='West Exit'
        self.assertAlmostEqual(disagreement(recommendations),2/3)

    def test_validation_clamp_and_fallback(self):
        p=mock_proposal('RouteAgent',preset_settings('Normal visitor'))
        self.assertEqual(validate_proposal({**p,'confidence':2,'uncertainty':-1})['confidence'],1)
        for malformed in ['invalid',{}, {**p,'confidence':float('nan')},{**p,'route_choice':'unbounded'}, {**p,'confidence':True}]:
            with self.assertRaises((ValueError,TypeError)):
                validate_proposal(malformed)
        result=run_agents(preset_settings('Blocked exit crisis'),'real',sampler=lambda _: 'bad JSON')
        self.assertTrue(result['fallback'])
        self.assertEqual(result['triage_inputs']['model_disagreement'],.88)
        self.assertAlmostEqual(result['triage_score'],.8394)

    def test_missing_credentials_is_explicit_mock(self):
        with patch.dict(os.environ,{},clear=True):
            result=run_agents(preset_settings('Normal visitor'),'real')
            self.assertEqual(result['mode'],'mock')
            self.assertTrue(result['notice'])
            self.assertFalse(result['fallback'])
            self.assertEqual(json.loads(json.dumps(result)),result)

    def test_no_concordia_core_adapter(self):
        result=run_agents(preset_settings('Normal visitor'),'mock',use_concordia=False)
        self.assertEqual(result['backend'],'Python adapter')
        self.assertFalse(result['fallback'])
