import unittest,json,csv,io
from batch_simulation import *
from triage import TriageConfig, Factors

class BatchTests(unittest.TestCase):
    def test_counts_reproducibility_and_valid_values(self):
        for n in (100,500,1000,5000):
            cases=generate_batch(42,n)
            self.assertEqual(len(cases),n)
            self.assertEqual(cases,generate_batch(42,n))
            self.assertEqual(len({c['condition_id'] for c in cases}),n)
            rows=classify_batch(cases)
            self.assertTrue(all(0<=r['triage_score']<=1 for r in rows))
            self.assertTrue(set(r['category'] for r in rows)<={'HEAD / AUTO','WATCH','LONG-TAIL / HUMAN'})
        self.assertNotEqual(generate_batch(42,100),generate_batch(43,100))

    def test_classification_thresholds_and_selection(self):
        cases=generate_batch(42,500)
        rows=classify_batch(cases)
        self.assertEqual(sum(describe_batch(rows)['counts'].values()),500)
        low=TriageConfig(thresholds={**TriageConfig().thresholds,'main':.2})
        high=TriageConfig(thresholds={**TriageConfig().thresholds,'main':.9})
        self.assertGreaterEqual(sum(r['category']=='LONG-TAIL / HUMAN' for r in classify_batch(cases,low)),
                                sum(r['category']=='LONG-TAIL / HUMAN' for r in classify_batch(cases,high)))
        self.assertEqual(len(discover_cases(rows)),20)
        self.assertTrue(associations(cases,rows))
        for strategy in STRATEGIES:
            chosen=select_study_cases(cases,strategy=strategy,count=20)
            self.assertEqual(chosen,select_study_cases(cases,strategy=strategy,count=20))
            self.assertEqual(len(chosen),20)
            self.assertEqual(len({c['condition_id'] for c in chosen}),20)
            self.assertEqual(len(list(csv.DictReader(io.StringIO(study_csv(chosen))))),20)
            self.assertEqual(json.loads(json.dumps(chosen)),chosen)
            self.assertTrue(all(assess(factors_from_case(c)).escalated for c in chosen))

    def test_exact_three_states_and_empty_pool(self):
        settings=DEFAULT_SETTINGS.copy()
        cases=[dict(case_id='a',condition_id='a',**settings),
               dict(case_id='b',condition_id='b',**{**settings,'safety_risk':.84,'behavior_anomaly':.79,'model_disagreement':.7,'sensor_agreement':.5,'navigation_confidence':.8}),
               dict(case_id='c',condition_id='c',**{**settings,'safety_risk':.9})]
        self.assertEqual([r['category'] for r in classify_batch(cases)],['HEAD / AUTO','WATCH','LONG-TAIL / HUMAN'])
        self.assertEqual(select_study_cases(cases[:1]),[])
