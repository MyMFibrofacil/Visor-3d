"""Actualiza los perfiles 3D de Mesa y Sillas Emi desde el DXF terminado."""
from pathlib import Path
import json, re
import ezdxf
from ezdxf.path import make_path
from shapely.geometry import Polygon

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(r'G:\Mi unidad\Produccion\Maquinas\Pantografo\K30\Prod a Medida\Victoria Bongiovanni\Mesa y Silla Emi')
DXF=SOURCE/'Mesa y 2 sillas.dxf'
TCN=SOURCE/'Mesa y 2 Sillas.tcn'
OUT=ROOT/'src'/'model-data.json'

def tcn_segments():
 data=TCN.read_text(errors='replace')
 points=[tuple(map(float,p)) for p in re.findall(r'W#2201\{\s*::WTl\s+#1=([\d.-]+)\s+#2=([\d.-]+)\s+#3=([\d.-]+)',data)]
 result=[]; current=[]
 for x,y,z in points:
  if z>=0:
   if len(current)>2: result.append(current)
   current=[]
  else: current.append((x,y))
 if len(current)>2: result.append(current)
 return result

def normalize(points, rotate=False):
 if rotate: points=[(-y,x) for x,y in points]
 x0=min(x for x,y in points); y0=min(y for x,y in points)
 poly=Polygon([(x-x0,y-y0) for x,y in points])
 if not poly.is_valid: poly=poly.buffer(0)
 poly=poly.simplify(.18,preserve_topology=True)
 return [[round(x,4),round(y,4)] for x,y in list(poly.exterior.coords)[:-1]]

segments=tcn_segments()
entities=[e for e in ezdxf.readfile(DXF).modelspace() if e.dxftype()=='LWPOLYLINE' and e.dxf.layer=='Capa predeterminada']
assert len(segments)==len(entities)==27
candidates=[]
for entity in entities:
 pts=[(p.x,p.y) for p in make_path(entity).flattening(.12,segments=8)]
 candidates.append((pts,(min(x for x,y in pts),min(y for x,y in pts),max(x for x,y in pts),max(y for x,y in pts)),entity.dxf.handle))
matched=[]; used=set()
for number,segment in enumerate(segments,1):
 sb=(min(x for x,y in segment),min(y for x,y in segment),max(x for x,y in segment),max(y for x,y in segment))
 ranked=[]
 for i,(pts,bounds,handle) in enumerate(candidates):
  if i in used: continue
  score=sum(abs(a-b) for a,b in zip(bounds,(sb[0]+4,sb[1]+4,sb[2]-4,sb[3]-4)))
  ranked.append((score,i,pts,handle))
 score,i,pts,handle=min(ranked)
 assert score<.35,(number,score,handle)
 used.add(i); matched.append(pts)

data=json.loads(OUT.read_text(encoding='utf-8'))
data['source']['dxf']=str(DXF)
data['source']['geometry']='Contornos terminados DXF; mecanizados XML Flex'
representatives={'tapa':(1,False),'lateralMesa':(3,True),'asiento':(4,True),'lateralSilla':(7,True),'faja':(9,False),'respaldo':(11,True)}
for key,(position,rotate) in representatives.items(): data['outlines'][key]=normalize(matched[position-1],rotate)
OUT.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('DXF vinculado: 27/27 contornos; perfiles 3D actualizados:',', '.join(representatives))
