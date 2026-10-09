"""Reconstruye perfiles y mecanizados del Juguetero Bajo x2 Emi."""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import ezdxf
from ezdxf.path import make_path
from shapely.geometry import Point, Polygon

ROUTER = Path(r"G:\Mi unidad\Produccion\Maquinas\Pantografo\Hermes 28\Prod a Medida\Victoria Bongiovanni\Juguetero Bajo x2 Emi")
FLEX = Path(r"G:\Mi unidad\Produccion\Maquinas\Flex\Archivos Corte\A Medida\Bongiovanni\MA0009040004 Juguetero Bajo x2")
OUT = Path(__file__).resolve().parents[1] / "src" / "juguetero-data.json"
DXF = ROUTER / "Juguetero Bajo x2.dxf"


def flat(entity, tolerance=.45):
    points = [(float(p.x), float(p.y)) for p in make_path(entity).flattening(tolerance, segments=10)]
    cleaned = []
    for point in points:
        if not cleaned or abs(point[0] - cleaned[-1][0]) > .01 or abs(point[1] - cleaned[-1][1]) > .01:
            cleaned.append(point)
    if len(cleaned) > 2 and abs(cleaned[0][0] - cleaned[-1][0]) < .01 and abs(cleaned[0][1] - cleaned[-1][1]) < .01:
        cleaned.pop()
    return cleaned


def bbox(entity):
    points = flat(entity)
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


def dimensions(entity):
    x0, y0, x1, y1 = bbox(entity)
    return x1 - x0, y1 - y0


def normalize(points):
    x0 = min(x for x, _ in points)
    y0 = min(y for _, y in points)
    return [[round(x - x0, 3), round(y - y0, 3)] for x, y in points]


def close_to(entity, width, height, tolerance=.35):
    w, h = dimensions(entity)
    return abs(w - width) <= tolerance and abs(h - height) <= tolerance


def evaluate(expression, length, width):
    value = (expression or "0").replace("L", str(length)).replace("W", str(width))
    if not re.fullmatch(r"[0-9.+*()\-/ ]+", value):
        raise ValueError(value)
    return float(eval(value, {"__builtins__": {}}, {}))


entities = list(ezdxf.readfile(DXF).modelspace())


def choose(width, height, highest=False):
    matches = [entity for entity in entities if entity.dxftype() == "LWPOLYLINE" and close_to(entity, width, height)]
    if not matches:
        raise RuntimeError(f"No se encontro perfil {width} x {height}")
    if highest:
        return max(matches, key=lambda entity: sum(bbox(entity)[1::2]) / 2)
    return matches[0]


targets = {
    "lateral": choose(530, 427.38, highest=True),
    "fondo": choose(764, 414.99),
    "piso": choose(764, 292),
    "medio": choose(334.2, 384.07),
    "tapa": choose(764, 324.99),
}


def profile(entity):
    outline_world = flat(entity)
    polygon = Polygon(outline_world)
    x0, y0, x1, y1 = bbox(entity)
    holes = []
    for candidate in entities:
        if candidate is entity or candidate.dxftype() != "LWPOLYLINE":
            continue
        width, height = dimensions(candidate)
        if max(width, height) > 16.2 or min(width, height) < 3.5:
            continue
        cx0, cy0, cx1, cy1 = bbox(candidate)
        center = Point((cx0 + cx1) / 2, (cy0 + cy1) / 2)
        if polygon.buffer(.6).contains(center):
            holes.append({
                "x": round(center.x - x0, 3),
                "y": round(center.y - y0, 3),
                "d": round((width + height) / 2, 2),
            })
    holes.sort(key=lambda item: (item["y"], item["x"]))
    return {
        "outline": normalize(outline_world),
        "width": round(x1 - x0, 3),
        "height": round(y1 - y0, 3),
        "holes": holes,
    }


profiles = {name: profile(entity) for name, entity in targets.items()}
profiles["frente"] = {
    "outline": [[0, 0], [361, 0], [361, 160], [0, 160]],
    "width": 361,
    "height": 160,
    "holes": [
        {"x": 0, "y": 40, "d": 8}, {"x": 0, "y": 120, "d": 8},
        {"x": 361, "y": 40, "d": 8}, {"x": 361, "y": 120, "d": 8},
    ],
}


programs = {}
for xml_path in sorted(FLEX.glob("*.xml")):
    root = ET.parse(xml_path).getroot()
    panel = root.find("PANEL")
    length = float(panel.findtext("PanelLength"))
    width = float(panel.findtext("PanelWidth"))
    thickness = float(panel.findtext("PanelThickness"))
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
    "product": "Juguetero Bajo x2 Emi",
    "code": "MA0009040004",
    "thickness": 18.5,
    "profiles": profiles,
    "programs": programs,
    "assembly": {
        "innerWidth": 764,
        "sideHeight": 530,
        "sideDepth": 427.38,
        "backDepth": 28.9,
        "backYOffset": 115,
        "floorHeight": 148.9,
        "floorDepthStart": 37.9,
        "topHeight": 501.1,
        "topDepthOffset": 12.9,
        "middleYOffset": 117.03,
        "middleDepthOffset": 37.9,
        "frontCenterY": 228.594,
        "frontCenterZ": 368.585,
        "frontAngleDeg": 35,
    },
    "sources": [str(DXF), *[str(path) for path in sorted(FLEX.glob("*.xml"))]],
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(OUT)
for name, value in profiles.items():
    print(name, len(value["outline"]), "puntos", len(value["holes"]), "mecanizados DXF")
