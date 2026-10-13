import csv,io,json,tempfile,unittest,sqlite3
from dataclasses import replace
from experiment.study_builder import *
from experiment.storage import PilotStore,csv_records
from experiment.participant import StudySession
from experiment.analysis import analyze,import_results,validate_records
from batch_simulation import generate_batch
from triage import TriageConfig

class ExperimentTests(unittest.TestCase):
    def pilot(self,folder,seed=42):
        protocol=build_protocol(2,seed=seed)
        store=PilotStore(folder);sid,pid=store.create_session(protocol)
        session=StudySession(protocol,sid,pid,'synthetic_pilot',stage='trials')
        for i in range(len(protocol['trials'])):
            session.begin_trial(now=100+i*10)
            session.begin_trial(now=105+i*10)
            self.assertEqual(session.started,100+i*10)
            trial=session.trial
            session.submit(store,trial['ground_truth'],85,now=101.25+i*10,expected_index=i)
        self.assertTrue(session.finished)
        return protocol,store,session

    def test_protocol_randomization_pairing_and_reference(self):
        a=build_protocol(3,seed=42);b=build_protocol(3,seed=42)
        self.assertEqual(a,b);self.assertNotEqual(a,build_protocol(3,seed=43))
        self.assertEqual(len(a['trials']),9)
        self.assertEqual({t['condition'] for t in a['trials']},set(CONDITIONS))
        for condition in CONDITIONS:
            self.assertEqual({t['case_id'] for t in a['trials'] if t['condition']==condition},
                             {t['case_id'] for t in a['trials'] if t['condition']==CONDITIONS[0]})
        self.assertEqual(json.loads(json.dumps(a)),a)
        c=generate_batch()[0]
        self.assertEqual(reference_choice({**c,'emergency':'medical event'}),'C')
        self.assertEqual(reference_choice({**c,'exit_blocked':True,'emergency':'none'}),'A')
        for bad in [[],['Unknown']]:
            with self.assertRaises(ValueError):build_protocol(conditions=bad)

    def test_pilot_rt_persistence_exports_and_anonymous_schema(self):
        with tempfile.TemporaryDirectory() as folder:
            protocol,store,session=self.pilot(folder)
            records=store.records(session.session_id)
            self.assertEqual(len(records),6)
            self.assertEqual(records,session.records)
            self.assertRegex(session.participant_id,r'^P\d{3,}$')
            self.assertEqual(import_results(json.dumps(records)),records)
            self.assertEqual(import_results(csv_records(records),'csv'),records)
            self.assertTrue((store.directory/(session.session_id+'.json')).exists())
            for r in records:
                self.assertEqual(r['reaction_time'],1.25 if r['human_intervention'] else None)
                self.assertFalse(set(r)&{'name','email','health','address'})
            with self.assertRaises(sqlite3.IntegrityError):store.append(session.session_id,records[0])
            self.assertEqual(len(store.records(session.session_id)),6)
            with self.assertRaises(ValueError):session.submit(store,'A',85)
            _,pid2=store.create_session(protocol)
            self.assertNotEqual(pid2,session.participant_id)

    def test_complementarity_calculation_and_partial_data(self):
        with tempfile.TemporaryDirectory() as folder:
            _,_,session=self.pilot(folder)
            records=session.records
            result=analyze(records)
            accuracy={r['Condition']:r['Accuracy %']/100 for r in result['conditions']}
            self.assertAlmostEqual(result['complementarity_gain'],accuracy[CONDITIONS[2]]-max(accuracy[CONDITIONS[0]],accuracy[CONDITIONS[1]]))
            self.assertIsNone(analyze([r for r in records if r['condition']!=CONDITIONS[0]])['complementarity_gain'])
            self.assertEqual(accuracy[CONDITIONS[1]],1)
            self.assertEqual(accuracy[CONDITIONS[2]],1)
            self.assertEqual(result['sources'],['synthetic_pilot'])

    def test_stale_submission_validation_and_import_rejects_personal_fields(self):
        with tempfile.TemporaryDirectory() as folder:
            _,_,session=self.pilot(folder)
            records=session.records
            with self.assertRaises(ValueError):validate_records([{**records[0],'email':'not accepted'}])
            with self.assertRaises(ValueError):validate_records([records[0],records[0]])
            r=next(r for r in records if r['human_intervention'])
            with self.assertRaises(ValueError):validate_records([{**r,'reaction_time':float('nan')}])
            protocol=build_protocol(1);store=PilotStore(folder);sid,pid=store.create_session(protocol)
            s=StudySession(protocol,sid,pid,stage='trials');s.begin_trial(now=10)
            with self.assertRaises(ValueError):s.submit(store,'A',85,now=11,expected_index=99)
            self.assertEqual(store.records(sid),[])

    def test_hybrid_head_has_no_human_response_and_optional_measures(self):
        from research_config import DEFAULT_SETTINGS
        c=dict(DEFAULT_SETTINGS,case_id='S42-00001',condition_id='COND-42-00001',blocked_path=False)
        p=build_protocol(1)
        p['trials']=[{**p['trials'][0],'condition':CONDITIONS[2],'escalated':False,'AI_recommendation':'B','ground_truth':'B','case':c}]
        with tempfile.TemporaryDirectory() as folder:
            store=PilotStore(folder);sid,pid=store.create_session(p)
            s=StudySession(p,sid,pid,stage='trials');s.begin_trial(now=10)
            self.assertFalse(s.needs_human)
            r=s.submit(store,now=11)
            self.assertIsNone(r['reaction_time']);self.assertIsNone(r['human_choice']);self.assertTrue(r['correct'])

    def test_concordia_mock_study_source(self):
        p=build_protocol(1,agent_source='Concordia mock')
        self.assertEqual(len(p['trials']),3)
        self.assertTrue(all(t['agent_backend'] in ('Concordia EntityAgent','Python mock adapter (optional Concordia unavailable)') for t in p['trials']))
