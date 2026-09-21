"""Render the editorial source to screen and A4 PDFs using ReportLab.
Requires reportlab and Pillow. Run after build-v2.py.
"""
from pathlib import Path
import json, html, math
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4, landscape
ROOT=Path(__file__).resolve().parents[1]
F=ROOT/'04_Typography/fonts'
for name,file in [('Sans','Geist-Regular.ttf'),('Medium','Geist-Medium.ttf'),('Bold','Geist-SemiBold.ttf'),('Mono','GeistMono-Regular.ttf'),('Brand','Goldman-Regular.ttf')]:pdfmetrics.registerFont(TTFont(name,str(F/file)))
PAGES=json.loads((ROOT/'01_Brand_Book/source/book-content.json').read_text())
INK='#050B1A'; MUTED='#34507F'; SIGNAL='#5AC8FF'; BLUE='#0B4BB5'; PAPER='#FAFBFD'
problems=[]
def para(c,text,x,top,width,size=14,color=INK,font='Sans',leading=None):
 text=html.escape(text).replace('\n','<br/>')
 p=Paragraph(text,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading or size*1.4,textColor=HexColor(color),spaceAfter=0))
 _,h=p.wrap(width,1000)
 if top-h<45:problems.append((c.getPageNumber(),text[:65],round(top-h,1)))
 p.drawOn(c,x,top-h);return h

def img(c,rel,x,y,w,h):
 p=ROOT/rel
 if p.exists():c.drawImage(str(p),x,y,w,h,preserveAspectRatio=True,anchor='c',mask='auto')

def chart(c,x,y,w,h):
 c.setFillColor(HexColor('#FFFFFF'));c.rect(x,y,w,h,fill=1,stroke=0)
 l=x+48;r=x+w-18;b=y+38;t=y+h-30
 Y=lambda v:b+(t-b)*v/2000
 c.setFillColor(HexColor('#E7F5FF'));c.rect(l,Y(1100),r-l,Y(1500)-Y(1100),fill=1,stroke=0)
 c.setStrokeColor(HexColor('#C9D6EA'));c.setLineWidth(.6)
 for v in [0,500,1000,1500,2000]:
  c.line(l,Y(v),r,Y(v));c.setFillColor(HexColor(MUTED));c.setFont('Mono',8);c.drawRightString(l-8,Y(v)-3,f'{v:,}'.replace(',','.'))
 vals=[1200,1250,1300,1450,1600,1800];pts=[(l+i*(r-l)/5,Y(v)) for i,v in enumerate(vals)]
 c.setStrokeColor(HexColor('#1B6BFF'));c.setLineWidth(2.5);p=c.beginPath();p.moveTo(*pts[0])
 for pt in pts[1:]:p.lineTo(*pt)
 c.drawPath(p)
 for (xx,yy),m in zip(pts,['Jan','Fev','Mar','Abr','Mai','Jun']):
  c.setFillColor(HexColor('#1B6BFF'));c.circle(xx,yy,3,fill=1,stroke=0);c.setFont('Mono',8);c.setFillColor(HexColor(MUTED));c.drawCentredString(xx,b-18,m)
 c.setFont('Mono',8);c.drawString(x+12,y+h-15,'R$/ELEVADOR/MÊS · DADOS FICTÍCIOS')
 c.setFont('Medium',10);c.setFillColor(HexColor(INK));c.drawRightString(r,Y(1800)+13,'R$ 1.800')

def render(path,print_mode=False):
 w,h=landscape(A4) if print_mode else (960,600)
 c=canvas.Canvas(str(path),pagesize=(w,h),pageCompression=1)
 c.setTitle('Condo Ninja | Sistema de marca 2.0'+(' | Impressão A4' if print_mode else ' | Digital'))
 c.setAuthor('Condo Ninja');c.setSubject('Estratégia, identidade, evidência e implementação');c.setCreator('Condo Ninja V2 / ReportLab')
 for i,p in enumerate(PAGES):
  kind=p['kind'];dark=not print_mode and (kind in ['cover','divider','closing','manifesto'] or p['section'] in ['SÍMBOLO','WORDMARK','MOVIMENTO','SELO DE GOVERNANÇA'])
  bg=INK if dark else PAPER;fg=PAPER if dark else INK;mut='#9AB0D0' if dark else MUTED;ac=SIGNAL if dark else BLUE
  c.setFillColor(HexColor(bg));c.rect(0,0,w,h,fill=1,stroke=0)
  m=48;content=w-2*m
  c.bookmarkPage(f'page-{i+1}');c.addOutlineEntry(p['section'],f'page-{i+1}',0)
  c.setFillColor(HexColor(ac));c.setFont('Mono',8);c.drawString(m,h-32,f'{i+1:02d} / {p["section"]}')
  c.setFillColor(HexColor(mut));c.drawRightString(w-m,h-32,'CONDO NINJA / SISTEMA DE MARCA 2.0')
  c.setStrokeColor(HexColor('#23385F' if dark else '#C9D6EA'));c.setLineWidth(.5);c.line(m,46,w-m,46)
  c.setFont('Mono',8);c.setFillColor(HexColor(mut));c.drawString(m,29,'CLAREZA PARA QUEM PAGA CONDOMÍNIO.');c.drawRightString(w-m,29,f'{i+1:02d} / {len(PAGES):02d}')
  if kind in ['cover','closing','divider']:
   title_size=48 if not print_mode else 43
   para(c,p['title'],m,h-120,content*.70,title_size,fg,'Medium',title_size*1.13)
   para(c,p['lead'],m,220,content*.5,16,mut)
   img(c,'02_Logos/PNG/condo-ninja-symbol-1024.png',w-250,96,170,212)
   c.setStrokeColor(HexColor(ac));c.setLineWidth(2);c.line(m,80,m+100,80)
  else:
   title_size=37 if not print_mode else 33
   th=para(c,p['title'],m,h-78,content,title_size,fg,'Medium',title_size*1.12)
   top=min(h-215,h-95-th-20)
   leftw=content*.40;rightx=m+content*.46;rightw=content*.54
   if kind=='copy':
    y=top+16
    for a in p['items']:
     para(c,a['title'],m,y,110,10,ac,'Mono');hh=para(c,a['body'],m+135,y,content-135,13.5,fg);y-=hh+25
   elif kind=='palette':
    para(c,p['lead'],m,top,content,16,mut)
    sw=[('Ink 950','#050B1A','#FAFBFD'),('Ink 900','#0A1428','#FAFBFD'),('Signal 500','#5AC8FF','#050B1A'),('Signal 700','#1B6BFF','#FFFFFF'),('Paper 50','#FAFBFD','#050B1A')]
    cw=content/5
    if p['section']=='PALETA ESTENDIDA':
     tokens=json.loads((ROOT/'03_Color/brand-tokens.json').read_text());sw=[('Ink '+k,v, '#FAFBFD' if int(k)>=500 else '#050B1A') for k,v in tokens['color']['ink'].items()]+[('Signal '+k,v,'#FFFFFF' if int(k)>=700 else '#050B1A') for k,v in tokens['color']['signal'].items()]
     cw=content/6
    for j,(name,col,txt) in enumerate(sw):
     xx=m+(j%6 if len(sw)>5 else j)*cw; yy=255-(j//6)*73 if len(sw)>5 else 130; hh=64 if len(sw)>5 else 140;c.setFillColor(HexColor(col));c.rect(xx,yy,cw,hh,fill=1,stroke=0);c.setFillColor(HexColor(txt));c.setFont('Medium',10);c.drawString(xx+10,yy+hh-20,name);c.setFont('Mono',9);c.drawString(xx+10,yy+12,col)
    para(c,'Primitivos de marca. Para texto e componentes, escolher os pares semânticos do tema.',m,105,content,11,mut)
   elif kind=='type':
    para(c,p['lead'],m,top,content,16,mut)
    typerows=[(270,'Brand','WORDMARK / 400','Condo Ninja'),(200,'Sans','INTERFACE / 400–600','Clareza antes da conclusão.'),(130,'Mono','DADOS / 400–500','FONTE DEMO-01 / 2026')]
    if p['section']=='ESCALA TIPOGRÁFICA':typerows=[(285,'Medium','DISPLAY / 48–88','Clareza'),(215,'Medium','TÍTULO / 30–40','O que merece atenção'),(145,'Sans','CORPO / 16–18','Uma pergunta com contexto.')]
    for yy,fn,label,text in typerows:
     size=(48 if label.startswith('DISPLAY') else 32 if label.startswith('TÍTULO') else 18) if p['section']=='ESCALA TIPOGRÁFICA' else 26
     c.setStrokeColor(HexColor('#C9D6EA'));c.line(m,yy+28,w-m,yy+28);para(c,label,m,yy+14,160,9,ac,'Mono');para(c,text,m+180,yy+20,content-180,size,fg,fn)
   elif kind=='contrast':
    para(c,p['lead'],m,top,content,15,mut)
    rows=json.loads((ROOT/'03_Color/contrast-audit.json').read_text());selected=[r for r in rows if r['foreground'] in ['text','muted','onAction','focus']]
    y=285;c.setFont('Mono',9);c.setFillColor(HexColor(ac));c.drawString(m,y,'TEMA / PAR');c.drawString(m+390,y,'CONTRASTE');c.drawString(m+510,y,'LIMIAR');c.drawString(m+620,y,'RESULTADO')
    for r in selected:
     y-=23;c.setFillColor(HexColor(fg));c.setFont('Sans',10);c.drawString(m,y,r['theme']+' / '+r['foreground']+' sobre '+r['background']);c.setFont('Mono',10);c.drawString(m+390,y,f'{r["ratio"]:.2f}:1');c.drawString(m+510,y,str(r['threshold'])+':1');c.drawString(m+620,y,'PASSA')
    para(c,'Valores calculados sem arredondamento para aprovação. Pares não certificam a interface inteira.',m,79,content,10,mut)
   else:
    lh=para(c,p['lead'],m,top,leftw,16,mut)
    visualbottom=80;visualtop=top-lh-25;visualh=min(220,visualtop-visualbottom)
    if kind in ['symbol','wordmark','lockups','clearspace','sizes','chart','seals','applications','report','status','icons','sequence']:
     if kind=='symbol':img(c,'02_Logos/PNG/condo-ninja-symbol-1024.png',m+leftw*.2,visualbottom,leftw*.58,visualh)
     elif kind=='wordmark':para(c,'Condo Ninja',m,visualtop-35,leftw,29,fg,'Brand')
     elif kind in ['lockups','clearspace']:
      if kind=='clearspace':c.setDash(3,3);c.setStrokeColor(HexColor(ac));c.rect(m+10,visualbottom+25,leftw-20,visualh-40,stroke=1,fill=0);c.setDash()
      img(c,'02_Logos/PNG/condo-ninja-lockup-horizontal-'+('dark' if dark else 'light')+'-2048.png',m+25,visualbottom+50,leftw-50,110)
     elif kind=='chart':chart(c,m,visualbottom,leftw,visualh)
     elif kind=='sizes':
      for j,sz in enumerate([20,32,50,80]):img(c,'02_Logos/PNG/condo-ninja-symbol-256.png',m+j*75,visualbottom+55,sz,sz*1.25)
     elif kind=='seals':
      for j in range(4):
       x=m+j*leftw/4;c.setFillColor(HexColor(ac));c.setFont('Mono',37);c.drawString(x,visualbottom+90,f'0{j}')
      para(c,'CONCEITOS / NÃO CERTIFICAM',m,visualbottom+50,leftw,9,mut,'Mono')
     elif kind=='applications':img(c,'07_Templates/instagram/v2-instagram-square.png',m,visualbottom,leftw*.6,visualh);img(c,'07_Templates/whatsapp/v2-whatsapp-share.png',m+leftw*.48,visualbottom+20,leftw*.52,visualh*.65)
     elif kind=='report':img(c,'07_Templates/report/v2-report-cover.png',m+60,visualbottom,150,visualh)
     elif kind=='status':
      for j,(a,bg2,fg2) in enumerate([('CONCLUÍDO','#DCFCE7','#166534'),('ATENÇÃO','#FEF3C7','#854D0E'),('DOCUMENTO FALTANTE','#FEE4E2','#B42318')]):
       yy=visualbottom+130-j*45;c.setFillColor(HexColor(bg2));c.rect(m,yy,leftw,35,fill=1,stroke=0);para(c,a,m+12,yy+25,leftw-24,10,fg2,'Mono')
     elif kind=='sequence':
      para(c,'01\n02\n03\n04',m+20,visualtop,leftw,27,ac,'Mono',40)
     elif kind=='icons':
      icons=sorted((ROOT/'05_Iconography/preview').glob('*.png'))
      for j,icon in enumerate(icons):
       xx=m+(j%5)*leftw/5;yy=visualbottom+140-(j//5)*45
       img(c,str(icon.relative_to(ROOT)),xx,yy,24,24)
       para(c,icon.stem[:13],xx,yy-3,leftw/5-2,5.8,mut)
    y=top
    itemsize=12.5 if len(p['items'])==4 else 13.5
    for item in p['items']:
     hh=para(c,item['title'],rightx,y,rightw,15,fg,'Medium');y-=hh+6;hh=para(c,item['body'],rightx,y,rightw,itemsize,mut);y-=hh+20
  c.showPage()
 c.save()

render(ROOT/'01_Brand_Book/brand-book-condo-ninja-screen.pdf')
render(ROOT/'01_Brand_Book/brand-book-condo-ninja-print.pdf',True)
(ROOT/'00_Review/pdf-layout-check.json').write_text(json.dumps({'pages':len(PAGES),'below_safe_area':problems},indent=2))
if problems:raise RuntimeError(problems)
print('Rendered both',len(PAGES),'page books; no text below safe area.')
