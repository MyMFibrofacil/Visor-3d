"""Extrae perfiles finales y mecanizados del Juguetero x2 con Estante.

El DXF de lote contiene cinco pares de laterales unidos; para el perfil de
cada lateral se usa el DXF unitario, exportado del mismo ART. El XML 806 se
refiere a la plantilla, no a la dimensión de la pieza terminada.
"""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import ezdxf
from ezdxf.path import make_path

ROUTER = Path(r"G:\Mi unidad\Produccion\Maquinas\Pantografo\Hermes 28\Prod a Medida\Victoria Bongiovanni\Juguetero Estante x2")
FLEX = Path(r"G:\Mi unidad\Produccion\Maquinas\Flex\Archivos Corte\A Medida\Bongiovanni\MA0009040008 Juguetero x2 con Estante")
OUT = Path(__file__).resolve().parents[1] / "src" / "juguetero-estante-data.json"


def points(entity):
    raw = [(float(p.x), float(p.y)) for p in make_path(entity).flattening(.4, segments=12)]
    result = []
    for x, y in raw:
        if not result or abs(result[-1][0]-x) > .02 or abs(result[-1][1]-y) > .02:
            result.append((x, y))
    if len(result) > 2 and abs(result[0][0]-result[-1][0]) < .02 and abs(result[0][1]-result[-1][1]) < .02:
        result.pop()
    return result


def box(entity):
    p = points(entity)
    return min(x for x, _ in p), min(y for _, y in p), max(x for x, _ in p), max(y for _, y in p)


def near(entity, w, h, tolerance=.8):
    x0, y0, x1, y1 = box(entity)
    return abs(x1-x0-w) < tolerance and abs(y1-y0-h) < tolerance


def profile(entity, swap=False):
    p = [(y, x) if swap else (x, y) for x, y in points(entity)]
    x0 = min(x for x, _ in p)
    y0 = min(y for _, y in p)
    width = max(x for x, _ in p)-x0
    height = max(y for _, y in p)-y0
    return {"outline": [[round(x-x0, 3), round(y-y0, 3)] for x, y in p],
            "width": round(width, 3), "height": round(height, 3)}


lot = [e for e in ezdxf.readfile(ROUTER / "Juguetero emi.dxf").modelspace() if e.dxftype() == "LWPOLYLINE"]
single = [e for e in ezdxf.readfile(ROUTER / "Juguetero Emi x2.dxf").modelspace() if e.dxftype() == "LWPOLYLINE"]

def one(entities, w, h):
    matches = [e for e in entities if near(e, w, h)]
    if not matches:
        raise RuntimeError(f"Sin perfil {w} x {h}")
    return matches[0]

profiles = {
    "lateral": profile(one(single, 405, 700)),
    "frente": profile(one(lot, 142, 322.65), swap=True),
    "base": profile(one(lot, 325, 664), swap=True),
    "fondo": profile(one(lot, 576, 664), swap=True),
    "estante": profile(one(lot, 246, 664), swap=True),
    "medio": profile(one(lot, 399.3, 496.5)),
}


def numeric(expression, length, width):
    expression = (expression or "0").replace("L", str(length)).replace("W", str(width)).replace("T", "36.5")
    if not re.fullmatch(r"[0-9.+*()\-/ ]+", expression):
        raise ValueError(expression)
    return round(float(eval(expression, {"__builtins__": {}}, {})), 3)


programs = {}
for path in sorted(FLEX.glob("MA*.xml")):
    root = ET.parse(path).getroot()
    panel = root.find("PANEL")
    length = float(panel.findtext("PanelLength"))
    width = float(panel.findtext("PanelWidth"))
    ops = []
    for cad in root.findall("CAD"):
        ops.append({
            "type": cad.findtext("TypeName"),
            "x": numeric(cad.findtext("X1"), length, width),
            "y": numeric(cad.findtext("Y1"), length, width),
            "diameter": float(cad.findtext("Diameter")),
            "depth": numeric(cad.findtext("Depth"), length, width),
            "quadrant": cad.findtext("Quadrant"),
        })
    programs[path.name] = {"length": length, "width": width, "operations": ops}

data = {
    "product": "Juguetero x2 con Estante", "code": "MA0009040008", "thickness": 18.5,
    "profiles": profiles, "programs": programs,
    "source": [str(ROUTER / "Juguetero emi.dxf"), str(ROUTER / "Juguetero Emi x2.dxf"), *[str(p) for p in sorted(FLEX.glob("MA*.xml"))]],
    "registration": {
        "lateral": "local depth = 405 - XML Y; local height = 700 - XML X",
        "medio": "local depth = 442.84 - template X; local height below shelf = 585 - template Y",
        "faces": "805 Vertical and Back Vertical are opposite lateral pieces; 806 face operations are opposite sides of one medio",
    },
}
OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
print(OUT)
print({k: len(v["outline"]) for k, v in profiles.items()})
print({k: len(v["operations"]) for k, v in programs.items()})
