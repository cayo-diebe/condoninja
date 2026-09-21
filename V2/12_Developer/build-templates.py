from pathlib import Path
import base64,html,json,struct
ROOT=Path(__file__).resolve().parents[1]
icon='data:image/png;base64,'+base64.b64encode((ROOT/'02_Logos/PNG/condo-ninja-symbol-512.png').read_bytes()).decode()
fonts={name:base64.b64encode((ROOT/'04_Typography/fonts'/file).read_bytes()).decode() for name,file in [('Geist','Geist-Regular.ttf'),('Goldman','Goldman-Regular.ttf'),('Geist Mono','GeistMono-Regular.ttf')]}
style='<style>'+''.join('@font-face{font-family:"'+name+'";src:url(data:font/ttf;base64,'+data+')} ' for name,data in fonts.items())+'</style>'
def make(folder,name,w,h,lines,sub,kind='social',label='CLAREZA PARA QUEM PAGA CONDOMÍNIO',light=False):
 bg='#FAFBFD' if light else '#050B1A';fg='#050B1A' if light else '#FAFBFD';ac='#0B4BB5' if light else '#5AC8FF';mut='#34507F' if light else '#9AB0D0';pad=round(w*.065);size=round(w*(.071 if w<h else .067));size=min(size,88)
 top=round(h*.34 if h>w else h*.48)
 if kind=='story':top=440
 s=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img"><title>Condo Ninja · {html.escape(name)}</title>{style}<rect width="{w}" height="{h}" fill="{bg}"/>'
 # Existing brand symbol and editable typography, no reconstructed logo.
 sy=220 if kind=='story' else pad
 s+=f'<image x="{pad}" y="{sy}" width="48" height="60" xlink:href="{icon}"/><text x="{pad+67}" y="{sy+41}" fill="{fg}" font-family="Goldman" font-size="34" font-weight="400">Condo Ninja</text>'
 s+=f'<text x="{pad}" y="{top-size-32}" fill="{ac}" font-family="Geist Mono" font-size="{max(17,round(w*.018))}">{html.escape(label)}</text>'
 for i,line in enumerate(lines):s+=f'<text x="{pad}" y="{top+i*size*1.12}" fill="{fg if i<len(lines)-1 else ac}" font-family="Geist" font-size="{size}" letter-spacing="-2">{html.escape(line)}</text>'
 yy=top+(len(lines)-1)*size*1.12+75
 for i,line in enumerate(sub):s+=f'<text x="{pad}" y="{yy+i*36}" fill="{mut}" font-family="Geist" font-size="{round(w*.026)}">{html.escape(line)}</text>'
 foot=h-(280 if kind=='story' else pad)
 s+=f'<path d="M{pad} {foot-28}H{w-pad}" stroke="{mut}" stroke-width="1"/><text x="{pad}" y="{foot+8}" fill="{mut}" font-family="Geist Mono" font-size="17">{("MODELO EDITÁVEL / SUBSTITUIR CAMPOS" if kind=="report" else "condo.ninja")}</text><text x="{w-pad}" y="{foot+8}" text-anchor="end" fill="{ac}" font-family="Geist Mono" font-size="17">{("[VERSÃO / DATA]" if kind=="report" else "CONDO NINJA / 2.0")}</text></svg>'
 p=ROOT/'07_Templates'/folder/(name+'.svg');p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s)
 return str(p.relative_to(ROOT))
files=[]
files.append(make('instagram','v2-instagram-square',1080,1080,['Este contrato','está caro?'],['Compare o escopo','antes do preço.']))
for i,(lines,sub) in enumerate([
 (['Este contrato','está caro?'],['Cinco perguntas para','comparar com contexto.']),
 (['O que o serviço','realmente inclui?'],['Peças, plantões e manutenção','podem mudar a comparação.']),
 (['Qual é a base','da comparação?'],['Confira região, período','e unidade de medida.']),
 (['Qual documento','ainda falta?'],['Uma lacuna pode mudar','a leitura dos números.']),
 (['Uma pergunta','melhor começa','com contexto.'],['Peça o escopo. Leia o aditivo.','Depois, compare.'])],1):
 files.append(make('instagram',f'v2-carousel-{i:02}',1080,1350,lines,sub,label=f'PERGUNTAS MELHORES / {i:02} DE 05',light=i in [2,4]))
files.append(make('stories','v2-story',1080,1920,['Quem paga','merece','entender.'],['Informação organizada.','Perguntas melhores.'],kind='story'))
files.append(make('linkedin','v2-linkedin',1200,627,['Clareza para quem','paga condomínio.'],['Uma segunda opinião independente.']))
files.append(make('opengraph','v2-opengraph',1200,630,['Quem paga','merece entender.'],['Clareza independente para o condomínio.']))
files.append(make('whatsapp','v2-whatsapp-share',1200,630,['Uma boa pergunta','começa com você.'],['Vamos entender as despesas do condomínio.']))
files.append(make('report','v2-report-cover',1240,1754,['Raio-X do','condomínio.'],['[Nome do condomínio]','[Período e escopo da análise]'],kind='report',label='RELATÓRIO / MODELO EDITÁVEL'))
files.append(make('report','v2-institutional-cover',1240,1754,['Informação para','uma decisão','mais consciente.'],['[Título do documento]','[Destinatário / data / versão]'],kind='report',label='CONDO NINJA / DOCUMENTO INSTITUCIONAL',light=True))
# Concept seals replace V1 samples, with the provisional status visibly on the artwork.
for i,name in enumerate(['Base em formação','Documentado','Verificável','Referência']):
 s=f'<svg xmlns="http://www.w3.org/2000/svg" width="440" height="480" viewBox="0 0 440 480"><title>Conceito de governança nível {i}. Não certifica.</title>{style}<rect width="440" height="480" fill="#FAFBFD"/><path d="M24 24H416V456H24Z" fill="none" stroke="#0B4BB5" stroke-width="2"/><text x="45" y="70" font-family="Geist Mono" font-size="17" fill="#34507F">GOVERNANÇA / CONCEITO</text><text x="40" y="238" font-family="Geist Mono" font-size="150" fill="#0B4BB5">0{i}</text><text x="45" y="305" font-family="Geist" font-size="27" fill="#050B1A">{name}</text><text x="45" y="357" font-family="Geist" font-size="20" fill="#34507F">Critérios em definição.</text><text x="45" y="417" font-family="Geist Mono" font-size="17" fill="#0B4BB5">NÃO CERTIFICA</text></svg>'
 p=ROOT/f'09_Governance_Seal/concepts/nivel-{i}.svg';p.write_text(s);files.append(str(p.relative_to(ROOT)))
(ROOT/'12_Developer/template-renders.json').write_text(json.dumps(files,indent=2))
# Include the actual OFL license text together with family-specific copyright from the font metadata.
base=(ROOT.parent/'public/fonts/goldman-OFL.txt').read_text();license=base[base.find('SIL OPEN FONT LICENSE'):]
for family,file in [('Goldman','Goldman-Regular.ttf'),('Geist','Geist-Regular.ttf'),('GeistMono','GeistMono-Regular.ttf')]:
 data=(ROOT/'04_Typography/fonts'/file).read_bytes();nt=struct.unpack_from('>H',data,4)[0];offset=None
 for j in range(nt):
  tag,check,off,length=struct.unpack_from('>4sIII',data,12+j*16)
  if tag==b'name':offset=off
 fmt,count,stringoff=struct.unpack_from('>HHH',data,offset);copyrights=set()
 for j in range(count):
  platform,encoding,language,nid,length,off=struct.unpack_from('>HHHHHH',data,offset+6+j*12)
  if nid==0:
   raw=data[offset+stringoff+off:offset+stringoff+off+length]
   try:copyrights.add(raw.decode('utf-16-be' if platform in [0,3] else 'mac_roman'))
   except UnicodeError:pass
 (ROOT/f'04_Typography/OFL-{family}.txt').write_text('\n'.join(sorted(copyrights))+'\n\n'+license)
print('Generated',len(files),'editable templates and concept seals.')
