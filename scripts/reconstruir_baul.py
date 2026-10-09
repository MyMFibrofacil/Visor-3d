"""Reconstruye perfiles DXF y mecanizados XML del Baul Emi."""
from __future__ import annotations
import json, re, xml.etree.ElementTree as ET
from pathlib import Path
import ezdxf
from ezdxf.path import make_path

ROUTER=Path(r"G:\Mi unidad\Produccion\Maquinas\Pantografo\Hermes 28\Prod a Medida\Victoria Bongiovanni\Baul Emi")
FLEX=Path(r"G:\Mi unidad\Produccion\Maquinas\Flex\Archivos Corte\A Medida\Bongiovanni\MA0009040005 Baul")
OUT=Path(__file__).resolve().parents[1]/"src"/"baul-data.json"

def flat(e):
 pts=[(float(p.x),float(p.y)) for p in make_path(e).flattening(.45,segments=10)]; out=[]
 for p in pts:
  if not out or abs(p[0]-out[-1][0])>.01 or abs(p[1]-out[-1][1])>.01:out.append(p)
 if len(out)>2 and abs(out[0][0]-out[-1][0])<.01 and abs(out[0][1]-out[-1][1])<.01:out.pop()
 return out
def box(e):
 p=flat(e);xs=[x for x,y in p];ys=[y for x,y in p];return min(xs),min(ys),max(xs),max(ys)
def dims(e):x0,y0,x1,y1=box(e);return x1-x0,y1-y0
def near(e,a,b,t=.4):w,h=dims(e);return abs(w-a)<t and abs(h-b)<t
def norm(e):
 p=flat(e);x0,y0,x1,y1=box(e);return {"outline":[[round(x-x0,3),round(y-y0,3)] for x,y in p],"width":round(x1-x0,3),"height":round(y1-y0,3)}
def num(s,L,W):
 s=(s or '0').replace('L',str(L)).replace('W',str(W))
 if not re.fullmatch(r'[0-9.+*()\-/ ]+',s):raise ValueError(s)
 return float(eval(s,{"__builtins__":{}},{}))

ents=[e for e in ezdxf.readfile(ROUTER/'Baul Emi.dxf').modelspace() if e.dxftype()=='LWPOLYLINE']
def take(a,b,index=0):return [e for e in ents if near(e,a,b)][index]
profiles={
 'frente':norm(take(452.05,770,0)), 'fondo':norm(take(452.05,770,1)),
 'base':norm(take(693.5,349)), 'tapa':norm(take(400,800)),
 'lateral-a':norm(take(379,349,0)), 'lateral-b':norm(take(379,349,1)),
}
programs={}
for f in sorted(FLEX.glob('*.xml')):
 root=ET.parse(f).getroot();p=root.find('PANEL');L=float(p.findtext('PanelLength'));W=float(p.findtext('PanelWidth'))
 ops=[]
 for o in root.findall('CAD'):
  ops.append({'type':o.findtext('TypeName'),'x':round(num(o.findtext('X1'),L,W),3),'y':round(num(o.findtext('Y1'),L,W),3),'diameter':float(o.findtext('Diameter')),'depth':float(o.findtext('Depth')),'quadrant':o.findtext('Quadrant')})
 programs[f.name]={'length':L,'width':W,'operations':ops}
data={'product':'Baul Emi','code':'MA0009040005','thickness':18.5,'profiles':profiles,'programs':programs,
 'assembly':{'frontWidth':770,'panelHeight':452.05,'sideDepth':379,'sideHeight':349,'baseWidth':693.5,'baseDepth':349,'lidWidth':800,'lidDepth':400},
 'sources':[str(ROUTER/'Baul Emi.dxf'),*[str(f) for f in sorted(FLEX.glob('*.xml'))]]}
OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(OUT)
for k,v in profiles.items():print(k,v['width'],v['height'],len(v['outline']))
