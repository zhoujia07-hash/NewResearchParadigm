"""Local anonymous pilot persistence. Never store names, contact or credentials."""
import csv,io,json,sqlite3,uuid
from pathlib import Path


def csv_records(records):
    if not records:return ''
    out=io.StringIO();writer=csv.DictWriter(out,fieldnames=list(records[0]))
    writer.writeheader();writer.writerows([{k:json.dumps(v) if isinstance(v,dict) else v for k,v in r.items()} for r in records]);return out.getvalue()


class PilotStore:
    def __init__(self,directory=None):
        self.directory=Path(directory) if directory else Path(__file__).resolve().parent.parent/'data'
        self.directory.mkdir(parents=True,exist_ok=True)
        self.path=self.directory/'pilot.sqlite3'
        with self.connect() as db:
            db.executescript('CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT);'
                             'CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, participant TEXT, protocol TEXT);'
                             'CREATE TABLE IF NOT EXISTS trials (session TEXT, number INTEGER, payload TEXT, PRIMARY KEY(session,number));')
    def connect(self):return sqlite3.connect(self.path,timeout=10)
    def create_session(self,protocol):
        session_id=uuid.uuid4().hex
        with self.connect() as db:
            n=db.execute('INSERT INTO participants DEFAULT VALUES').lastrowid
            participant=f'P{n:03d}'
            db.execute('INSERT INTO sessions VALUES (?,?,?)',(session_id,participant,json.dumps(protocol)))
        return session_id,participant
    def append(self,session_id,record):
        with self.connect() as db:
            db.execute('INSERT INTO trials VALUES (?,?,?)',(session_id,record['trial_number'],json.dumps(record,allow_nan=False)))
        records=self.records(session_id)
        # SQL is the authoritative log. File exports are refreshed after every
        # append and on explicit reads; temp+replace avoids partial JSON/CSV.
        for suffix,content in [('json',json.dumps(records,indent=2,allow_nan=False)),('csv',csv_records(records))]:
            target=self.directory/(session_id+'.'+suffix)
            temp=target.with_suffix('.'+suffix+'.tmp');temp.write_text(content,encoding='utf-8');temp.replace(target)
    def records(self,session_id):
        with self.connect() as db:
            return [json.loads(r[0]) for r in db.execute('SELECT payload FROM trials WHERE session=? ORDER BY number',(session_id,))]
