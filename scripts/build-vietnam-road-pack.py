"""Build attributable route-matched road metadata from a Vietnam OSM PBF extract."""
import argparse, collections, datetime, hashlib, json, math, os, re, urllib.request
from pathlib import Path
import osmium

ROOT=Path(__file__).resolve().parent.parent
SOURCE='https://download.geofabrik.de/asia/vietnam/vietnam-261120.osm.pbf'
VERSION='20261120'
WORK=ROOT/'.tools'/'road-pack'
OUT=ROOT/'public'/'data'/('vn-osm-'+VERSION)
WORK.mkdir(parents=True,exist_ok=True)

def download():
    target=WORK/('vietnam-'+VERSION+'.osm.pbf')
    req=lambda url: urllib.request.Request(url,headers={'User-Agent':'RoadLink/0.1 Vietnam OSM offline-pack builder'})
    with urllib.request.urlopen(req(SOURCE+'.md5'),timeout=40) as response:
        expected=response.read().decode().split()[0].lower()
    if not re.fullmatch('[a-f0-9]{32}',expected):raise RuntimeError('Invalid publisher checksum')
    if not target.exists() or hashlib.md5(target.read_bytes()).hexdigest()!=expected:
        temporary=target.with_suffix('.part');total=0;reported=0
        with urllib.request.urlopen(req(SOURCE),timeout=90) as response,temporary.open('wb') as output:
            size=int(response.headers.get('Content-Length','0'))
            if size>500_000_000:raise RuntimeError('Unexpected extract size')
            while chunk:=response.read(1024*1024):
                output.write(chunk);total+=len(chunk)
                if total>500_000_000:raise RuntimeError('Extract exceeded budget')
                if total-reported>=32*1024*1024:print(f'Downloaded {total//1048576} MiB',flush=True);reported=total
        if hashlib.md5(temporary.read_bytes()).hexdigest()!=expected:raise RuntimeError('Publisher MD5 mismatch')
        os.replace(temporary,target)
    print(f'PBF verified: {target.stat().st_size} bytes',flush=True)
    return target,expected

def cell(lat,lon):return (math.floor(lat*10),math.floor(lon*10))
def key(c):return str(c[0])+'_'+str(c[1])
def dump(path,value):
    data=json.dumps(value,ensure_ascii=False,separators=(',',':')).encode('utf8')
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+'.tmp');temp.write_bytes(data);os.replace(temp,path)
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

class Roads(osmium.SimpleHandler):
    def __init__(self):
        super().__init__();self.tiles=collections.defaultdict(dict);self.ways=0;self.nodes=0;self.seen_nodes=0;self.missing=0;self.kinds=collections.Counter()
    def add(self,cells,obj):
        for c in cells:self.tiles[key(c)][(obj['type'],obj['id'])]=obj
    def node(self,node):
        self.seen_nodes+=1
        if self.seen_nodes%2000000==0:print(f'Read {self.seen_nodes:,} nodes; kept {self.nodes:,}',flush=True)
        if not len(node.tags):return
        highway=node.tags.get('highway','');sign=node.tags.get('traffic_sign','');surveillance=node.tags.get('man_made','')=='surveillance'
        calming=node.tags.get('traffic_calming','');rail=node.tags.get('railway','');hazard=node.tags.get('hazard','')
        if not (highway in ('speed_camera','stop','give_way','traffic_signals','crossing') or sign or surveillance or calming or rail=='level_crossing' or hazard):return
        if not node.location.valid():return
        tags={t.k:t.v for t in node.tags if t.k in ('highway','traffic_sign','direction','traffic_sign:direction','man_made','surveillance:type','surveillance:zone','camera:type','name','traffic_calming','railway','crossing','crossing:signals','crossing:markings','crossing_ref','hazard') or t.k.startswith('maxspeed')}
        obj={'type':'node','id':node.id,'lat':round(node.location.lat,7),'lon':round(node.location.lon,7),'tags':tags,'timestamp':node.timestamp.isoformat()}
        category='traffic_calming' if calming else 'level_crossing' if rail=='level_crossing' else 'hazard' if hazard else highway or ('traffic_sign' if sign else 'surveillance')
        self.add([cell(obj['lat'],obj['lon'])],obj);self.nodes+=1;self.kinds[category]+=1
    def way(self,way):
        if not way.tags.get('highway') or not any(t.k.startswith('maxspeed') for t in way.tags):return
        if len(way.nodes)<2:return
        if any(not n.location.valid() for n in way.nodes):self.missing+=1;return
        geometry=[{'lat':round(n.location.lat,7),'lon':round(n.location.lon,7)} for n in way.nodes]
        cells=set()
        for a,b in zip(geometry,geometry[1:]):
            lo=cell(min(a['lat'],b['lat']),min(a['lon'],b['lon']));hi=cell(max(a['lat'],b['lat']),max(a['lon'],b['lon']))
            if (hi[0]-lo[0]+1)*(hi[1]-lo[1]+1)>100:self.missing+=1;return
            for x in range(lo[0],hi[0]+1):
                for y in range(lo[1],hi[1]+1):cells.add((x,y))
        tags={t.k:t.v for t in way.tags if t.k in ('highway','oneway','name') or t.k.startswith('maxspeed')}
        obj={'type':'way','id':way.id,'nodes':[n.ref for n in way.nodes],'geometry':geometry,'tags':tags,'timestamp':way.timestamp.isoformat()}
        self.add(cells,obj);self.ways+=1

def main():
    path,md5=download();handler=Roads()
    print('Extracting original OSM tags and ordered node IDs...',flush=True)
    handler.apply_file(str(path),locations=True,idx='flex_mem')
    manifest={'schema':1,'country':'VN','version':VERSION+'-r2','featureRevision':'warnings-v2','tileDegrees':0.1,'sourceUrl':SOURCE,'sourceMd5':md5,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'builtAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'license':'ODbL-1.0','attribution':'© OpenStreetMap contributors; extract: Geofabrik','licenseUrl':'https://www.openstreetmap.org/copyright','coverageNotice':'Chỉ các đối tượng được ghi trong OSM; điểm qua đường/gờ giảm tốc/đường ngang/nguy cơ không mặc nhiên là biển báo đã lắp. Chưa kiểm tra thực địa.','wayCount':handler.ways,'nodeCount':handler.nodes,'nodeKinds':dict(handler.kinds),'skippedMissingGeometry':handler.missing,'tiles':{}}
    for name,objects in sorted(handler.tiles.items()):
        elements=list(objects.values());rel='tiles/'+name+'.json'
        stats=dump(OUT/rel,{'elements':elements})
        if stats['bytes']>12_000_000:raise RuntimeError('Oversized shard '+name)
        manifest['tiles'][name]={'path':rel,'elements':len(elements),**stats}
    dump(OUT/'manifest.json',manifest)
    print(json.dumps({'tiles':len(manifest['tiles']),'ways':handler.ways,'nodes':handler.nodes,'nodeKinds':dict(handler.kinds),'jsonBytes':sum(t['bytes'] for t in manifest['tiles'].values()),'output':str(OUT)},ensure_ascii=True),flush=True)

if __name__=='__main__':main()
