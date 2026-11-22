"""Read-only audit of public road databases; downloads stay outside production assets."""
import json, hashlib, sqlite3, urllib.request
from collections import Counter
from pathlib import Path
import py7zr

root=Path(__file__).resolve().parent.parent
work=root/'.tools'/'source-audit'
work.mkdir(parents=True,exist_ok=True)
results={'date':'2026-11-21','datasets':[]}
headers={'User-Agent':'RoadLink/0.1 public-source research'}
archives=[
 ('vn-camera.sqlite.7z','1bc0fbb0ba899e8ae9b4419b8a59fd3c9f1d397f03f81b30b29fbe145f6265f9'),
 ('vn.sqlite.7z','ddd53dc38a7c7f1154a27622a10f6208549861aa43378e21af024f5736c3b2d4'),
]
for name,digest in archives:
    url='https://github.com/hvdwolf/SpeedAlert_Databases/releases/download/asia-202611/'+name
    target=work/name
    if not target.exists():
        with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=45) as response:target.write_bytes(response.read())
    actual=hashlib.sha256(target.read_bytes()).hexdigest()
    if actual!=digest:raise RuntimeError('Digest mismatch: '+name)
    with py7zr.SevenZipFile(target,'r') as archive:
        names=archive.getnames()
        if any(Path(n).is_absolute() or '..' in Path(n).parts or ':' in n for n in names):raise RuntimeError('Unsafe archive paths')
        archive.extractall(path=work)
    entry={'source':url,'archiveBytes':target.stat().st_size,'sha256':actual,'files':[]}
    for n in names:
        db=work/n
        if db.is_file() and db.suffix in ('.sqlite','.db','.sqlite3'):
            conn=sqlite3.connect(db.as_uri()+'?mode=ro',uri=True)
            tables=conn.execute("select name,sql from sqlite_master where type='table'").fetchall()
            summaries=[]
            for table,sql in tables:
                quoted='"'+table.replace('"','""')+'"'
                cols=[r[1] for r in conn.execute('pragma table_info('+quoted+')')]
                count=conn.execute('select count(*) from '+quoted).fetchone()[0]
                rows=conn.execute('select * from '+quoted+' limit 2').fetchall()
                safe=[]
                for row in rows:
                    sample={}
                    for key,value in zip(cols,row):
                        if isinstance(value,bytes):value={'blobBytes':len(value),'prefixHex':value[:24].hex()}
                        elif isinstance(value,str) and len(value)>300:value=value[:300]+'...'
                        sample[key]=value
                    safe.append(sample)
                summaries.append({'table':table,'schema':sql,'columns':cols,'rows':count,'samples':safe})
                if table=='cameras' and 'type' in cols:
                    summaries[-1]['typeCounts']=dict(conn.execute('select type,count(*) from cameras group by type').fetchall())
                if table=='speed_data':
                    summaries[-1]['numericRange']=conn.execute('select min(speed),max(speed),sum(case when speed<=0 or speed>300 then 1 else 0 end) from speed_data').fetchone()
            conn.close()
            entry['files'].append({'name':n,'bytes':db.stat().st_size,'tables':summaries})
    results['datasets'].append(entry)

url='https://raw.githubusercontent.com/DangLamTung/navbridge/main/assets/offline_map/vietnam_cameras.json'
file=work/'navbridge-vietnam-cameras.json'
if not file.exists():
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=45) as response:file.write_bytes(response.read())
raw=json.loads(file.read_text('utf8'))
entry={'source':url,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'rootType':type(raw).__name__}
if isinstance(raw,dict):
    entry['rootKeys']=list(raw)[:25]
    for key,value in raw.items():
        if isinstance(value,list):entry[key+'Count']=len(value)
        elif isinstance(value,(str,int,float,bool)):entry[key]=value
    records=raw.get('cameras',next((v for v in raw.values() if isinstance(v,list)),[]))
elif isinstance(raw,list):records=raw
else:records=[]
entry['recordCount']=len(records)
if records and isinstance(records[0],dict):
    entry['recordKeys']=list(records[0])
    entry['sourceCounts']=dict(Counter(str(r.get('source','UNSPECIFIED')) for r in records if isinstance(r,dict)))
    entry['typeCounts']=dict(Counter(str(r.get('type','UNSPECIFIED')) for r in records if isinstance(r,dict)))
    entry['uniqueCoordinatePairs']=len({(r.get('lat'),r.get('lng')) for r in records if isinstance(r,dict)})
else:entry['sample']=records[:1]
results['datasets'].append(entry)
for name,key in [('vietnam_signs.json','signs'),('vietnam_speed_limits.geojson','features')]:
    url='https://raw.githubusercontent.com/DangLamTung/navbridge/main/assets/offline_map/'+name
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=25) as response:body=response.read()
    obj=json.loads(body)
    results['datasets'].append({'source':url,'bytes':len(body),'rootKeys':list(obj),'recordKey':key,'recordCount':len(obj.get(key,[]))})
out=root/'docs'/'SOURCE_AUDIT_RESULTS.json'
out.write_text(json.dumps(results,ensure_ascii=False,indent=2,default=str)+'\n','utf8')
for entry in results['datasets']:
    print(json.dumps(entry,ensure_ascii=False,default=str)[:9000])
