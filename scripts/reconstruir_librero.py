"""Fuente geométrica reproducible: DXF real y XML Flex, coordenadas en mm."""
from pathlib import Path
import json
import xml.etree.ElementTree as ET
import ezdxf
from ezdxf.path import make_path

ROOT=Path(__file__).resolve().parents[1]
SRC=Path(r'G:\Mi unidad\Produccion\Maquinas\Pantografo\K30\Prod a Medida\Victoria Bongiovanni\Librero Emi')
FLEX=Path(r'G:\Mi unidad\Produccion\Maquinas\Flex\Archivos Corte\A Medida\Bongiovanni\MA0009040002 Librero')
doc=ezdxf.readfile(SRC/'Librero Emi.dxf')
def profile(handle):
    return [(p.x,p.y) for p in make_path(doc.entitydb[handle]).flattening(.18,segments=8)]
def read(code):
    root=ET.parse(FLEX/f'MA0009040002{code}180101.xml').getroot()
    p=root.find('PANEL'); L=float(p.findtext('PanelLength')); W=float(p.findtext('PanelWidth'))
    def val(s): return float(eval((s or '0'),{'__builtins__':{}},{'L':L,'W':W,'T':18.5}))
    return [dict(id=i+1,x=val(c.findtext('X1')),y=val(c.findtext('Y1')),z=val(c.findtext('Z1')),type=c.findtext('TypeName'),diameter=val(c.findtext('Diameter'))) for i,c in enumerate(root.findall('CAD'))]

T=18.5; W=503.9
side=profile('27E'); xmin=min(p[0] for p in side); xmax=max(p[0] for p in side); ymax=max(p[1] for p in side)
# Reference circles share DXF coordinates with the unit outline reflected in X.
circles=[e for e in doc.modelspace() if e.dxftype()=='CIRCLE' and abs(e.dxf.center.x+(xmin+xmax)/2)<.02 and e.dxf.radius==4]
top=min(circles,key=lambda e:e.dxf.center.y)
origin=ymax-top.dxf.center.y+134.921
base_y=origin-415.964
back_bottom=base_y+T/2
front_bottom=base_y-T/2
base_z=0.0
parts=[]
def hole(pos,normal,d,source): return dict(position=pos,normal=normal,diameter=d,source=source)
def part(id,kind,pos,outline=None,size=None,holes=None,explode=None,cutout=None):
    parts.append(dict(id=id,kind=kind,position=pos,outline=outline,size=size,holes=holes or [],explode=explode,cutout=cutout))

ops=read('01'); indexA=[1,2,3,4,5,6,7,17,18]; indexB=[8,9,10,11,12,13,14,15,16]
side_outline=[[-x+(xmin+xmax)/2,ymax-y] for x,y in side]
for sign,indices in [(-1,indexA),(1,indexB)]:
    hs=[]
    for i in indices:
        op=ops[i-1]
        if sign==-1: z=op['x']-192.014; y=origin-op['y']
        else: z=477.986-op['x']; y=op['y']+(base_y-114.033)
        hs.append(hole([-sign*T/2,y,z],[-sign,0,0],op['diameter'],f'201:{i}'))
    # Counterbore/through operations on outer face, preserved as distinct machining.
    ids=[19,21] if sign==-1 else [20,22]
    for i in ids:
        op=ops[i-1]
        if sign==-1: z=op['x']-192.014; y=origin-op['y']
        else: z=477.986-op['x']; y=op['y']+(base_y-114.033)
        hs.append(hole([sign*T/2,y,z],[sign,0,0],op['diameter'],f'201:{i}'))
    part('lateral-izquierdo' if sign==-1 else 'lateral-derecho','lateral',[sign*(W/2+T/2),0,0],outline=side_outline,holes=hs,explode=[sign*110,0,0])

hs=[]
for op in read('03'):
    if op['type']=='Vertical Hole': p=[op['x']-W/2,T/2,op['y']-134.5]; n=[0,1,0]
    elif op['x']==0 or op['x']==W: p=[op['x']-W/2,0,op['y']-134.5]; n=[-1 if op['x']==0 else 1,0,0]
    else: p=[op['x']-W/2,0,op['y']-134.5]; n=[0,0,-1 if op['y']==0 else 1]
    hs.append(hole(p,n,op['diameter'],f"203:{op['id']}"))
part('base','base',[0,base_y,0],size=[W,T,269],holes=hs,explode=[0,-35,0])

bp=profile('274'); bx=min(p[0] for p in bp); by=max(p[1] for p in bp)
back_outline=[[x-bx-W/2,by-y] for x,y in bp]
cutout=[[x-bx-W/2,by-y] for x,y in profile('273')]
hs=[]; seen=set()
for op in read('02'):
    # 37 mm means two 18.5 mm panels stacked, not a 37 mm finished panel.
    if op['z']>T: continue
    sig=(op['x'],op['y'],op['diameter'])
    if sig in seen: continue
    seen.add(sig)
    n=[0,-1,0] if op['y']==0 else [-1 if op['x']==0 else 1,0,0]
    hs.append(hole([op['x']-W/2,op['y'],0],n,op['diameter'],f"202:{op['id']}"))
part('separador','separador',[0,back_bottom,0],outline=back_outline,cutout=cutout,holes=hs,explode=[0,130,0])

fo=read('04')
for sign in [-1,1]:
    hs=[]
    for op in fo:
        # First half of the pre-cut panel describes one front; the second is
        # rotated 180 degrees to preserve its 9.25 mm bottom row after cutting.
        if op['y']>=108.2 or op['z']>T or op['type']=='Back Vertical Hole': continue
        if op['type']=='Vertical Hole': p=[op['x']-W/2,op['y'],-sign*T/2]; n=[0,0,-sign]
        else: p=[op['x']-W/2,op['y'],0]; n=[-1 if op['x']==0 else 1,0,0]
        hs.append(hole(p,n,op['diameter'],f"204:{op['id']}"))
    part('frente-delantero' if sign==-1 else 'frente-trasero','frente',[0,front_bottom,sign*(134.5+T/2)],size=[W,106,T],holes=hs,explode=[0,0,sign*110])

# Tangential mismatch of every matching joint: surface separation along drill
# axis is permitted, perpendicular displacement is not.
def world(p,h): return [a+b for a,b in zip(p['position'],h['position'])]
joins=[]
for a in parts:
 for h in a['holes']:
  if h['diameter'] not in (8,6): continue
  pa=world(a,h); n=h['normal']; candidates=[]
  for b in parts:
   if a==b: continue
   for j in b['holes']:
    if h['diameter']!=j['diameter']: continue
    if sum(x*y for x,y in zip(n,j['normal']))>-.99: continue
    pb=world(b,j); delta=[y-x for x,y in zip(pa,pb)]; axial=sum(x*y for x,y in zip(delta,n))
    err=sum((x-axial*y)**2 for x,y in zip(delta,n))**.5
    if abs(axial)<20: candidates.append((err,b['id'],j['source']))
  if candidates:
   err,b,src=min(candidates)
   if err<1: joins.append(dict(a=a['id'],operation=h['source'],b=b,target=src,error=round(err,5)))
lookup={(p['id'],h['source']):h for p in parts for h in p['holes']}
dowel_ends=[j for j in joins if lookup[(j['a'],j['operation'])]['diameter']==8]
assert len(dowel_ends)==48, f'Expected 48 dowel endpoints: {len(dowel_ends)}'
data=dict(thickness=T,source='Librero Emi.dxf + XML 201/202/203/204',baseHeight=base_y,parts=parts,joints=joins)
(ROOT/'src'/'librero-data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'{len(parts)} parts; {sum(len(p["holes"]) for p in parts)} machining operations; {len(joins)//2} paired joints; max mismatch {max(j["error"] for j in joins):.4f} mm')
