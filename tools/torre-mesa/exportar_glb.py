"""Exporta una escena triangulada a GLB 2.0 con material MDF aproximado."""
import json
import struct

COLOR_MDF = [0.52, 0.34, 0.18]


def exportar_glb(cuerpos, destino):
    """Guarda los cuerpos, conservando sus normales y separaciones originales."""
    documento = {"asset": {"version": "2.0", "generator": "Torre Mesa AR"},
                 "scene": 0, "scenes": [{"nodes": []}], "nodes": [], "meshes": [],
                 "accessors": [], "bufferViews": [],
                 "materials": [{"name": "MDF aproximado", "doubleSided": True,
                     "pbrMetallicRoughness": {"baseColorFactor": COLOR_MDF + [1],
                         "metallicFactor": 0, "roughnessFactor": 0.88}},
                     {"name": "Bordes negros", "doubleSided": True,
                      "pbrMetallicRoughness": {"baseColorFactor": [0.001, 0.001, 0.001, 1],
                      "metallicFactor": 0, "roughnessFactor": 1}}]}
    buffer = bytearray()
    for nombre, cuerpo in cuerpos.items():
        atributos = {}
        for semantica, clave in [("POSITION", "posiciones"), ("NORMAL", "normales")]:
            datos = cuerpo[clave].astype("<f4")
            bloque = datos.tobytes()
            vista = len(documento["bufferViews"])
            documento["bufferViews"].append({"buffer": 0, "byteOffset": len(buffer),
                                            "byteLength": len(bloque), "target": 34962})
            buffer.extend(bloque)
            indice = len(documento["accessors"])
            accessor = {"bufferView": vista, "componentType": 5126,
                        "count": len(datos), "type": "VEC3"}
            if semantica == "POSITION":
                accessor.update(min=datos.min(axis=0).tolist(), max=datos.max(axis=0).tolist())
            documento["accessors"].append(accessor)
            atributos[semantica] = indice
        indice = len(documento["meshes"])
        documento["meshes"].append({"name": nombre,
            "primitives": [{"attributes": atributos,
                "material": 1 if cuerpo.get('material') == 'bordes' else 0, "mode": 4}]})
        documento["nodes"].append({"name": nombre, "mesh": indice})
        documento["scenes"][0]["nodes"].append(indice)
    documento["buffers"] = [{"byteLength": len(buffer)}]
    cabecera = json.dumps(documento, separators=(",", ":")).encode("utf-8")
    cabecera += b" " * (-len(cabecera) % 4)
    buffer.extend(b"\0" * (-len(buffer) % 4))
    longitud = 12 + 8 + len(cabecera) + 8 + len(buffer)
    destino.write_bytes(struct.pack("<4sII", b"glTF", 2, longitud) +
        struct.pack("<I4s", len(cabecera), b"JSON") + cabecera +
        struct.pack("<I4s", len(buffer), b"BIN\0") + buffer)
