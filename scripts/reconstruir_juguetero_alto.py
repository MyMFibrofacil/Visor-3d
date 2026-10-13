"""Reconstruye perfiles y mecanizados del Juguetero Alto desde DXF y XML."""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import ezdxf
from ezdxf.path import make_path

ROUTER = Path(r"G:\Mi unidad\Produccion\Maquinas\Pantografo\Hermes 28\Prod a Medida\Victoria Bongiovanni\Juguetero Alto")
FLEX = Path(r"G:\Mi unidad\Produccion\Maquinas\Flex\Archivos Corte\A Medida\Bongiovanni\MA0009040007 Juguetero Alto")
DXF = ROUTER / "Juguetero Alto.dxf"
OUT = Path(__file__).resolve().parents[1] / "src" / "juguetero-alto-data.json"


def flat(entity, tolerance=.35):
    pts = [(float(p.x), float(p.y)) for p in make_path(entity).flattening(tolerance, segments=12)]
    clean = []
    for point in pts:
        if not clean or abs(point[0]-clean[-1][0]) > .01 or abs(point[1]-clean[-1][1]) > .01:
            clean.append(point)
    if len(clean) > 2 and abs(clean[0][0]-clean[-1][0]) < .01 and abs(clean[0][1]-clean[-1][1]) < .01:
        clean.pop()
    return clean


def box(entity):
    pts = flat(entity); xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def dims(entity):
    x0, y0, x1, y1 = box(entity)
    return x1-x0, y1-y0


def near(entity, width, height, tolerance=.8):
    w, h = dims(entity)
    return abs(w-width) <= tolerance and abs(h-height) <= tolerance


def normalized(entity, transform=lambda x, y: (x, y)):
    pts = [transform(x, y) for x, y in flat(entity)]
    x0 = min(x for x, _ in pts); y0 = min(y for _, y in pts)
    return [[round(x-x0, 3), round(y-y0, 3)] for x, y in pts]


def evaluate(expression, length, width):
    value = (expression or "0").replace("L", str(length)).replace("W", str(width))
    if not re.fullmatch(r"[0-9.+*()\-/ ]+", value):
        raise ValueError(value)
    return float(eval(value, {"__builtins__": {}}, {}))


entities = [e for e in ezdxf.readfile(DXF).modelspace() if e.dxftype() == "LWPOLYLINE"]
lateral_candidates = [e for e in entities if near(e, 466.336, 1180)]
if len(lateral_candidates) != 4:
    raise RuntimeError(f"Se esperaban 4 laterales, hay {len(lateral_candidates)}")


def lateral_score(entity):
    pts = normalized(entity)
    low = max((x for x, y in pts if 180 <= y <= 360), default=0)
    high = max((x for x, y in pts if 750 <= y <= 1050), default=0)
    return low-high


lateral = max(lateral_candidates, key=lateral_score)
fondo = next(e for e in entities if near(e, 414, 1130.5))
frente = next(e for e in entities if near(e, 414, 280))
estante = next(e for e in entities if near(e, 270, 414))

profiles = {
    "lateral": {"outline": normalized(lateral), "width": 466.336, "height": 1180.0},
    "fondo": {"outline": normalized(fondo), "width": 414.0, "height": 1130.5},
    "frente": {"outline": normalized(frente), "width": 414.0, "height": 280.0},
    # El DXF anida el estante girado. Aquí queda ancho x profundidad.
    "estante": {"outline": normalized(estante, lambda x, y: (y, x)), "width": 414.0, "height": 270.0},
}

programs = {}
for xml_path in sorted(FLEX.glob("*.xml")):
    root = ET.parse(xml_path).getroot(); panel = root.find("PANEL")
    length = float(panel.findtext("PanelLength")); width = float(panel.findtext("PanelWidth")); thickness = float(panel.findtext("PanelThickness"))
    operations = []
    for operation in root.findall("CAD"):
        operations.append({
            "type": operation.findtext("TypeName"),
            "x": round(evaluate(operation.findtext("X1"), length, width), 3),
            "y": round(evaluate(operation.findtext("Y1"), length, width), 3),
            "z": round(evaluate(operation.findtext("Z1"), length, width), 3) if operation.find("Z1") is not None else None,
            "diameter": float(operation.findtext("Diameter")),
            "depth": float(operation.findtext("Depth")),
            "quadrant": operation.findtext("Quadrant"),
        })
    programs[xml_path.name] = {"length": length, "width": width, "thickness": thickness, "operations": operations}

data = {
    "product": "Juguetero Alto Emi", "code": "MA0009040007", "thickness": 18.5,
    "profiles": profiles, "programs": programs,
    "assembly": {
        "innerWidth": 414.0, "height": 1180.0, "depth": 466.336,
        "backBottom": 29.75, "backDepth": 38.75,
        "shelfDepthStart": 48.0, "shelfHeights": [39.0, 515.0, 833.0, 1151.0],
        "frontBottomY": 53.4, "frontBottomZ": 283.35,
        "frontAngleDeg": 33.87,
    },
    "sources": [str(DXF), *[str(path) for path in sorted(FLEX.glob("*.xml"))]],
}
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(OUT)
print({name: len(profile["outline"]) for name, profile in profiles.items()})
print({name: len(program["operations"]) for name, program in programs.items()})
