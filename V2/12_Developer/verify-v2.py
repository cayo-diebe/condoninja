"""Read-only packaging verification. Python stdlib + Pillow + pypdf."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlsplit
import json,re,xml.etree.ElementTree as ET,hashlib,csv,base64
from PIL import Image
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
errors=[];counts={'svg':0,'png':0,'pdf':0,'html':0}
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.refs=[];self.ids=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  for k in ('src','href'):
   if k in a:self.refs.append((tag,k,a[k]))
for p in ROOT.rglob('*'):
 if not p.is_file():continue
 try:
  if p.suffix=='.svg':ET.parse(p);counts['svg']+=1
  elif p.suffix=='.png':
   with Image.open(p) as im:im.verify()
   counts['png']+=1
  elif p.suffix=='.pdf':
   r=PdfReader(p);assert len(r.pages)>0;counts['pdf']+=1
   if p.parent.name=='01_Brand_Book':assert len(r.pages)==62
  elif p.suffix=='.json':json.loads(p.read_text())
  elif p.suffix=='.html':
   parser=Parser();parser.feed(p.read_text());counts['html']+=1
   assert len(parser.ids)==len(set(parser.ids)),f'Duplicate ID: {p}'
   for tag,key,u in parser.refs:
    if u.startswith(('data:','http:','https:','mailto:','tel:')):continue
    if u.startswith('#'):
     if u[1:] and u[1:] not in parser.ids:errors.append(f'Anchor {p.relative_to(ROOT)} {u}')
    else:
     target=(p.parent/unquote(urlsplit(u).path)).resolve()
     if not target.exists():errors.append(f'Missing {p.relative_to(ROOT)} {u}')
 except Exception as e:errors.append(f'{p.relative_to(ROOT)}: {e}')
# Every advertised download and dependency in the standalone is embedded.
stand=(ROOT/'11_Brand_Site/brand-concept-standalone.html').read_text();p=Parser();p.feed(stand)
assert all(u.startswith(('data:','#')) for _,_,u in p.refs)
assert all(u.strip(chr(34)+chr(39)).startswith(('data:','#')) for u in re.findall(r'url\(([^)]+)\)',stand)), 'Unembedded CSS URL'
for m in re.finditer(r'(?:src|href)="data:([^;,]+);base64,([A-Za-z0-9+/=]+)"',stand):base64.b64decode(m[2],validate=True)
assert not re.search(r'assets/logos/[a-z0-9-]+\.svg',stand), 'Unembedded runtime logo path'
# Source copy counts and data arithmetic.
for n,t in json.loads((ROOT/'01_Brand_Book/source/brand-copy.json').read_text()).items():assert len(t.split())==int(n)
d=json.loads((ROOT/'08_Data_Visualization/examples/benchmark-demo.json').read_text());assert round((d['observed'][-1]/d['upper'][-1]-1)*100)==20
pairs=json.loads((ROOT/'03_Color/contrast-audit.json').read_text());assert len(pairs)==20 and all(p['pass'] for p in pairs)
assert (ROOT/'03_Color/brand-tokens.json').read_bytes()==(ROOT/'12_Developer/brand-tokens.json').read_bytes()
assert (ROOT/'03_Color/variables.css').read_bytes()==(ROOT/'12_Developer/variables.css').read_bytes()
# Inventory accurately describes the current bytes.
with (ROOT/'ASSET-INDEX.csv').open() as f:
 rows=list(csv.DictReader(f))
for r in rows:
 p=ROOT/r['path']
 if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=r['sha256']:errors.append('Hash mismatch: '+r['path'])
# Avoid case-colliding paths on Windows/macOS.
paths=[str(p.relative_to(ROOT)).casefold() for p in ROOT.rglob('*') if p.is_file()]
assert len(paths)==len(set(paths)), 'Case-colliding files'
print(json.dumps({'checked':counts,'indexed_files':len(rows),'contrast_pairs':len(pairs),'errors':errors},ensure_ascii=False,indent=2))
if errors:raise SystemExit(1)
