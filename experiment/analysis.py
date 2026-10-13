"""Descriptive pilot analysis. Complementarity is undefined without all arms."""
import csv,io,json,math,re
from experiment.study_builder import CONDITIONS,EXPLANATIONS
from experiment.participant import DATA_SOURCES


def mean(values):
    values=[v for v in values if v is not None]
    return sum(values)/len(values) if values else None


def analyze(records):
    rows=[];accuracy={}
    for condition in CONDITIONS:
        group=[r for r in records if r['condition']==condition]
        performance=mean([int(r['correct']) for r in group]);accuracy[condition]=performance
        rows.append({'Condition':condition,'Trials':len(group),'Accuracy %':100*performance if performance is not None else None,
                     'Mean RT seconds':mean([r['reaction_time'] for r in group]),
                     'Mean human confidence':mean([r['human_confidence'] for r in group]),
                     'AI acceptance %':100*mean([int(r['accepted_AI']) for r in group if r['accepted_AI'] is not None])
                     if any(r['accepted_AI'] is not None for r in group) else None})
    gain=accuracy[CONDITIONS[2]]-max(accuracy[CONDITIONS[0]],accuracy[CONDITIONS[1]]) if all(v is not None for v in accuracy.values()) else None
    categories=[]
    for category in sorted({r['long_tail_category'] or 'HEAD' for r in records}):
        group=[r for r in records if (r['long_tail_category'] or 'HEAD')==category]
        categories.append({'Long-tail category':category,'Trials':len(group),'Accuracy %':100*mean([int(r['correct']) for r in group])})
    return {'conditions':rows,'complementarity_gain':gain,'categories':categories,
            'sources':sorted({r['data_source'] for r in records})}


def validate_records(records):
    # Closed schema prevents imports from smuggling arbitrary participant fields.
    allowed={'participant_id','session_id','data_source','condition','case_id','condition_id','trial_number',
             'AI_recommendation','AI_confidence','human_choice','human_confidence','reaction_time','final_choice',
             'ground_truth','correct','accepted_AI','triage_score','explanation_condition','random_seed',
             'long_tail_category','synthetic_critical','human_intervention','post_measures'}
    if not isinstance(records,list) or not records or len(records)>10000:raise ValueError('Provide 1–10000 pilot records.')
    seen=set()
    for r in records:
        if not isinstance(r,dict) or set(r)!=allowed:raise ValueError('Unsupported/missing trial fields.')
        if not isinstance(r['participant_id'],str) or not re.fullmatch(r'P\d{3,}',r['participant_id']):raise ValueError('Anonymous participant ID required.')
        if not isinstance(r['session_id'],str) or not re.fullmatch(r'[0-9a-f]{32}',r['session_id']):raise ValueError('Invalid session ID.')
        if r['data_source'] not in DATA_SOURCES or r['condition'] not in CONDITIONS:raise ValueError('Unsupported pilot source/condition.')
        if not isinstance(r['case_id'],str) or not re.fullmatch(r'S\d+-\d+',r['case_id']):raise ValueError('Invalid synthetic case ID.')
        if r['condition_id']!='COND-'+r['case_id'][1:]:raise ValueError('Condition/case mismatch.')
        if type(r['trial_number']) is not int or r['trial_number']<1:raise ValueError('Invalid trial number.')
        key=(r['session_id'],r['trial_number'])
        if key in seen:raise ValueError('Duplicate trial record.')
        seen.add(key)
        for key in ('AI_recommendation','final_choice','ground_truth'):
            if r[key] not in ('A','B','C'):raise ValueError('Invalid route choice.')
        if r['human_choice'] not in ('A','B','C',None):raise ValueError('Invalid human choice.')
        for key in ('AI_confidence','triage_score'):
            if isinstance(r[key],bool) or not isinstance(r[key],(int,float)) or not math.isfinite(r[key]) or not 0<=r[key]<=1:raise ValueError('Invalid unit factor.')
        if r['human_confidence'] is not None and (type(r['human_confidence']) is not int or not 0<=r['human_confidence']<=100):raise ValueError('Invalid confidence.')
        if r['reaction_time'] is not None and (isinstance(r['reaction_time'],bool) or not isinstance(r['reaction_time'],(int,float)) or not math.isfinite(r['reaction_time']) or not 0<=r['reaction_time']<=86400):raise ValueError('Invalid RT.')
        if any(type(r[k]) is not bool for k in ('correct','synthetic_critical','human_intervention')) or r['accepted_AI'] not in (True,False,None):raise ValueError('Invalid classification flags.')
        if r['accepted_AI'] is not None and type(r['accepted_AI']) is not bool:raise ValueError('Invalid acceptance flag.')
        human=r['human_intervention']
        if r['condition']=='Human-only' and not human:raise ValueError('Human-only requires a human response.')
        if r['condition']=='AI-only' and human:raise ValueError('AI-only cannot have a human response.')
        if human and (r['human_choice'] is None or r['human_confidence'] is None or r['reaction_time'] is None or r['final_choice']!=r['human_choice']):raise ValueError('Incomplete human response.')
        if not human and (r['human_choice'] is not None or r['human_confidence'] is not None or r['reaction_time'] is not None or r['final_choice']!=r['AI_recommendation']):raise ValueError('Automated response must not contain human measurements.')
        expected_accept=(r['human_choice']==r['AI_recommendation']) if human and r['condition']==CONDITIONS[2] else None
        if r['accepted_AI'] is not expected_accept:raise ValueError('Acceptance inconsistent with shown recommendation.')
        if r['correct']!=(r['final_choice']==r['ground_truth']):raise ValueError('Incorrect reference score.')
        if r['explanation_condition'] not in EXPLANATIONS+['No AI explanation']:raise ValueError('Invalid explanation.')
        if type(r['random_seed']) is not int or not 0<=r['random_seed']<2**32:raise ValueError('Invalid seed.')
        from experiment.study_builder import MEASURES
        if not isinstance(r['post_measures'],dict) or set(r['post_measures'])-set(MEASURES) or any(type(v) is not int or not 0<=v<=100 for v in r['post_measures'].values()):raise ValueError('Invalid post-trial values.')
        if not isinstance(r['long_tail_category'],str) or any(part not in ('Main triage threshold','Safety risk rule','Disagreement rule','Behavior anomaly rule','') for part in r['long_tail_category'].split('; ')):raise ValueError('Invalid category.')
    return records


def import_results(text,kind='json'):
    if len(text)>5_000_000:raise ValueError('Pilot file too large.')
    try:
        if kind=='json':return validate_records(json.loads(text))
        if kind!='csv':raise ValueError('JSON or CSV required.')
        records=[]
        for row in csv.DictReader(io.StringIO(text)):
            for k in ['AI_confidence','triage_score','reaction_time']:
                row[k]=float(row[k]) if row[k] else None
            for k in ['human_confidence','trial_number','random_seed']:
                row[k]=int(row[k]) if row[k] else None
            for k in ['correct','synthetic_critical','human_intervention','accepted_AI']:
                row[k]={'True':True,'False':False,'':None}[row[k]]
            row['human_choice']=row['human_choice'] or None
            # Python dict formatting in CSV is avoided by csv export helper.
            row['post_measures']=json.loads(row['post_measures'])
            records.append(row)
        return validate_records(records)
    except (TypeError,KeyError,json.JSONDecodeError) as exc:
        raise ValueError('Malformed pilot results.') from exc
