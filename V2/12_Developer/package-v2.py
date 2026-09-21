"""Build portable HTML and file manifests. Run only after PDFs and templates exist."""
from pathlib import Path
import json,re,base64,mimetypes,html,hashlib,csv,shutil
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'11_Brand_Site'
def datauri(path):
 path=Path(path);mt={'.svg':'image/svg+xml','.ttf':'font/ttf','.ico':'image/x-icon','.md':'text/markdown','.json':'application/json','.css':'text/css'}.get(path.suffix,mimetypes.guess_type(path.name)[0] or 'application/octet-stream')
 return 'data:'+mt+';base64,'+base64.b64encode(path.read_bytes()).decode()
def embedcss(css,base):
 def repl(m):
  u=m[1].strip('\"\'')
  if u.startswith(('data:','http','#')):return m[0]
  return 'url("'+datauri(base/u)+'")'
 return re.sub(r'url\(([^)]+)\)',repl,css)
# Remove only byte-identical case-colliding duplicates in the V2 copy.
low=ROOT/'02_Logos/SVG/outlined';upper=ROOT/'02_Logos/SVG/Outlined'
if low.exists():
 for p in list(low.glob('*.svg')):
  match=upper/p.name.replace('-outlined.svg','.svg')
  if match.exists() and p.read_bytes()==match.read_bytes():
   p.unlink()
  else:
   alternate=ROOT/'02_Logos/SVG/Alternate-Outlined-Exports';alternate.mkdir(exist_ok=True)
   p.rename(alternate/p.name)
 low.rmdir()
for i in range(4):shutil.copy2(ROOT/f'09_Governance_Seal/concepts/nivel-{i}.png',SITE/f'assets/seal-{i}.png')
# Source HTML mirrors the actual editorial JSON; PDFs are authored by render-book.py.
pages=json.loads((ROOT/'01_Brand_Book/source/book-content.json').read_text())
bookcss='''@font-face{font-family:Geist;src:url(../../04_Typography/fonts/Geist-Regular.ttf)}*{box-sizing:border-box}body{margin:0;background:#F2F5F9;color:#050B1A;font:16px/1.6 Geist,Arial,sans-serif}nav,section{max-width:1000px;margin:30px auto;padding:48px;background:#FAFBFD}nav a{display:inline-block;margin:8px;color:#0B4BB5}small{color:#0B4BB5;letter-spacing:.1em}h1{font-size:40px;line-height:1.1;letter-spacing:-.03em}h2{font-size:20px}p{max-width:75ch}article{border-top:1px solid #C9D6EA;padding:16px 0}a:focus-visible{outline:3px solid #0B4BB5}img{max-width:100%}@media(max-width:600px){nav,section{margin:0;padding:24px}h1{font-size:32px}}@media print{section{break-after:page}nav{display:none}}'''
(ROOT/'01_Brand_Book/source/brand-book.css').write_text(bookcss)
body='<nav aria-label="Sumário"><h1>Condo Ninja · Sistema de marca 2.0</h1><p>Fonte editorial consultável. Os PDFs finais usam o layout do gerador Python.</p>'+''.join(f'<a href="#p{i+1}">{i+1:02} {html.escape(p["section"])}</a>' for i,p in enumerate(pages))+'</nav>'
for i,p in enumerate(pages):
 body+=f'<section id="p{i+1}"><small>{i+1:02} / {html.escape(p["section"])}</small><h1>{html.escape(p["title"]).replace(chr(10),"<br>")}</h1><p>{html.escape(p["lead"])}</p>'+''.join('<article><h2>'+html.escape(a['title'])+'</h2><p>'+html.escape(a['body'])+'</p></article>' for a in p['items'])+'</section>'
bookhtml='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Condo Ninja V2 · Fonte editorial</title><link rel="stylesheet" href="brand-book.css"></head><body>'+body+'</body></html>'
for name in ['brand-book-source.html','brand-book-screen.html','brand-book-print.html']:(ROOT/'01_Brand_Book/source'/name).write_text(bookhtml)
(ROOT/'BRAND-STRATEGY.md').write_text('# Condo Ninja · Estratégia V2\n\n'+'\n\n'.join('## '+p['section']+'\n\n'+p['title'].replace('\n',' ')+'\n\n'+p['lead']+'\n\n'+'\n\n'.join('**'+a['title']+'**: '+a['body'] for a in p['items']) for p in pages[:20]))
# Independent working prototype of the evidence component.
source=(SITE/'index.html').read_text()
article=re.search(r'<article class="demo".*?</article>',source,re.S)[0]
prototype='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Condo Ninja V2 · Raio-X demonstrativo</title><link rel="stylesheet" href="../../12_Developer/variables.css"><link rel="stylesheet" href="../../11_Brand_Site/styles.css"></head><body><main style="max-width:1260px;margin:30px auto;padding:20px"><h1 style="font-size:28px;margin-bottom:24px">Raio-X / demonstração de identidade</h1>'+article.replace('../08_Data','../../08_Data')+'</main><script>document.querySelector(".theme-button").addEventListener("click",e=>{const d=document.querySelector(".demo"),on=d.dataset.theme!=="dark";d.dataset.theme=on?"dark":"light";e.currentTarget.setAttribute("aria-pressed",String(on));e.currentTarget.textContent=on?"Ver tema claro":"Ver tema escuro"});</script></body></html>'
(ROOT/'07_Templates/product/raio-x-demo.html').write_text(prototype)
# Truly portable standalone, including download links and runtime logo variants.
css=embedcss((ROOT/'12_Developer/variables.css').read_text(),ROOT/'12_Developer')+'\n'+embedcss((SITE/'styles.css').read_text(),SITE)
js=(SITE/'script.js').read_text()
for url in set(re.findall(r'assets/logos/[a-z0-9-]+\.svg',js)):js=js.replace(url,datauri(SITE/url))
stand=re.sub(r'<link rel="stylesheet"[^>]+>','',source)
stand=stand.replace('</head>','<style>'+css+'</style></head>')
stand=stand.replace('<script src="script.js"></script>','<script>'+js+'</script>')
def attr(m):
 key,u=m[1],html.unescape(m[2])
 if u.startswith(('#','data:','http:','https:','mailto:')):return m[0]
 p=(SITE/u).resolve()
 assert p.is_relative_to(ROOT),p
 return key+'="'+datauri(p)+'"'
stand=re.sub(r'(src|href)="([^"]+)"',attr,stand)
# Download names must remain meaningful when href becomes a data URI.
original_downloads=re.findall(r'<a[^>]*href="([^"]+)"[^>]*download[^>]*>',source)
for u in original_downloads:
 target=datauri((SITE/u).resolve());stand=stand.replace('href="'+target+'" download','href="'+target+'" download="'+Path(u).name+'"')
(SITE/'brand-concept-standalone.html').write_text(stand)
start='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Condo Ninja · V2</title><style>body{margin:0;background:#050B1A;color:#FAFBFD;font:18px/1.6 system-ui,sans-serif}main{max-width:850px;margin:8vh auto;padding:35px}small{color:#5AC8FF}h1{font-size:52px;line-height:1.08;letter-spacing:-.04em}a{display:block;color:#5AC8FF;padding:18px 0;border-bottom:1px solid #23385F;text-decoration:none}a:focus-visible{outline:3px solid #5AC8FF}p{color:#9AB0D0}</style></head><body><main><small>CONDO NINJA / SISTEMA DE MARCA 2.0</small><h1>Clareza para quem<br>paga condomínio.</h1><p>Brand Book, identidade, templates e demonstração de produto.</p><a href="11_Brand_Site/index.html">Explorar o microsite ↗</a><a href="11_Brand_Site/brand-concept-standalone.html">Abrir o HTML standalone ↗</a><a href="01_Brand_Book/brand-book-condo-ninja-screen.pdf">Brand Book · leitura digital ↗</a><a href="01_Brand_Book/brand-book-condo-ninja-print.pdf">Brand Book · A4 para impressão ↗</a><a href="07_Templates/product/raio-x-demo.html">Explorar o exemplo de Raio-X ↗</a><a href="00_Review/REVIEW-V1.md">Revisão V1 e decisões da V2 ↗</a><p>62 páginas. Dados demonstrativos fictícios. Materiais originais preservados e origem documentada.</p></main></body></html>'''
(ROOT/'START-HERE.html').write_text(start)
# Keep V1 recovery intermediates out of the finished package; full ZIP is now available.
recovered=ROOT/'00_Review/recovered-v1'
if recovered.exists():shutil.rmtree(recovered)
# Portable fontconfig is generated by render-assets.mjs, never distributed with host paths.
fc=ROOT/'12_Developer/fontconfig.xml'
if fc.exists():fc.unlink()
original={x['path']:x for x in json.loads((ROOT/'00_Review/v1-inventory.json').read_text())}
excluded={'ASSET-INDEX.csv','12_Developer/SHA256SUMS.txt','00_Review/change-manifest.json'}
items=[]
for p in sorted(ROOT.rglob('*')):
 if not p.is_file() or p.relative_to(ROOT).as_posix() in excluded:continue
 rel=p.relative_to(ROOT).as_posix();sha=hashlib.sha256(p.read_bytes()).hexdigest();old=original.get(rel)
 items.append({'path':rel,'format':p.suffix.lstrip('.'),'bytes':p.stat().st_size,'sha256':sha,'origin':'new' if old is None else 'preserved' if old['sha256']==sha else 'modified'})
with (ROOT/'ASSET-INDEX.csv').open('w',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=['path','format','bytes','sha256','origin']);wr.writeheader();wr.writerows(items)
(ROOT/'12_Developer/SHA256SUMS.txt').write_text(''.join(i['sha256']+'  '+i['path']+'\n' for i in items))
changes={'modified':[i['path'] for i in items if i['origin']=='modified'],'new':[i['path'] for i in items if i['origin']=='new'],'preserved':[i['path'] for i in items if i['origin']=='preserved'],'removed_or_relocated_case_collisions':[p for p in original if not (ROOT/p).exists()]}
(ROOT/'00_Review/change-manifest.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2))
print('Standalone:',round(len(stand.encode())/1024/1024,2),'MiB. Indexed:',len(items),'files.')
