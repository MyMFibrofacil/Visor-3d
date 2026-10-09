"""Extrae perfiles terminados de los DXF de Cama Montessori Emi."""

from __future__ import annotations

import json
from pathlib import Path

import ezdxf
from ezdxf.path import make_path

SOURCE = Path(r"G:\Mi unidad\Produccion\Maquinas\Pantografo\Hermes 28\Prod a Medida\Victoria Bongiovanni\Cama Montessori Emi")
OUT = Path(__file__).resolve().parents[1] / "src" / "cama-data.json"


def entities(filename: str):
    return [e for e in ezdxf.readfile(SOURCE / filename).modelspace()
            if e.dxftype() == "LWPOLYLINE" and e.dxf.layer == "Capa predeterminada"]


def points(entity):
    return [(float(p.x), float(p.y)) for p in make_path(entity).flattening(.7, segments=8)]


def bounds(entity):
    pts = points(entity)
    return min(x for x, _ in pts), min(y for _, y in pts), max(x for x, _ in pts), max(y for _, y in pts)


def size(entity):
    x0, y0, x1, y1 = bounds(entity)
    return round(x1 - x0, 1), round(y1 - y0, 1)


def select(items, dimensions):
    target = sorted(dimensions)
    return [e for e in items if all(abs(a-b) < .2 for a, b in zip(sorted(size(e)), target))]


def normalize(entity, *, swap=False):
    pts = points(entity)
    x0 = min(x for x, _ in pts); y0 = min(y for _, y in pts)
    local = [(x-x0, y-y0) for x, y in pts]
    if swap:
        local = [(y, x) for x, y in local]
    x0 = min(x for x, _ in local); y0 = min(y for _, y in local)
    return [[round(x-x0, 3), round(y-y0, 3)] for x, y in local]


def contained_slots(items, outer):
    ox0, oy0, ox1, oy1 = bounds(outer)
    slots = []
    for item in select(items, (245, 55)):
        x0, y0, x1, y1 = bounds(item)
        if ox0-.1 <= x0 and oy0-.1 <= y0 and x1 <= ox1+.1 and y1 <= oy1+.1:
            raw = points(item)
            slots.append([[round(y-oy0, 3), round(x-ox0, 3)] for x, y in raw])
    return slots


cama1 = entities("Cama 1.dxf")
cama2 = entities("Cama 2.dxf")
cama4 = entities("Cama 4.dxf")

gap = select(cama1, (2025, 440))[0]
full = select(cama4, (2025, 440))[0]
end = select(cama2, (838, 440))[0]
slat = select(cama2, (815, 100))[0]

data = {
    "source": {
        "product": "Cama Montessori Emi",
        "geometry": "Cama 1-4.dxf",
        "machining": "MA000904000101-104180101.xml",
    },
    "thickness": 18.5,
    "profiles": {
        "lateralHueco": {"outline": normalize(gap, swap=True), "holes": contained_slots(cama1, gap)},
        "lateralCompleto": {"outline": normalize(full, swap=True), "holes": contained_slots(cama4, full)},
        "cabecera": {"outline": normalize(end, swap=True), "holes": contained_slots(cama2, end)},
        "parrilla": {"outline": normalize(slat), "holes": []},
        "tirante": {"outline": [[0,0],[1900,0],[1900,50],[0,50]], "holes": []},
    },
    "dimensions": {
        "outerLength": 2025,
        "innerWidth": 838,
        "outerWidth": 875,
        "height": 440,
        "slatLength": 815,
        "slatWidth": 100,
        "runnerLength": 1900,
        "runnerHeight": 50,
    },
    "machining": {
        "lateral": [{"x":x,"y":y,"d":5,"kind":"mecanizado"}
                    for x in (39,1986) for y in (84,356)],
        "cabeceraEnds": [{"y":84,"d":6,"kind":"mecanizado"},{"y":356,"d":6,"kind":"mecanizado"}],
        "runnerTop": [{"x":round(25.02 + i*202.22,2),"d":8,"kind":"tarugo"} for i in range(10)]
                     + [{"x":round(75.02 + i*202.22,2),"d":8,"kind":"tarugo"} for i in range(10)],
        "slat": [{"x":9.25,"z":-25,"d":8,"kind":"tarugo"},
                 {"x":9.25,"z":25,"d":8,"kind":"tarugo"},
                 {"x":805.75,"z":-25,"d":8,"kind":"tarugo"},
                 {"x":805.75,"z":25,"d":8,"kind":"tarugo"}],
    },
}

OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(OUT)
