"""Genera el paquete USDZ para Quick Look utilizando OpenUSD."""
from pxr import Usd, UsdGeom, UsdShade, Sdf, Gf, UsdUtils, Vt
from exportar_glb import COLOR_MDF
import shutil
import tempfile
from pathlib import Path


def exportar_usdz(cuerpos, destino):
    """Escribe cuerpos en metros, eje Y vertical y material mate."""
    carpeta_temporal = Path(tempfile.mkdtemp(prefix="torre-mesa-usd-"))
    temporal = carpeta_temporal / "torre-mesa.usdc"
    stage = Usd.Stage.CreateNew(str(temporal))
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    UsdGeom.SetStageMetersPerUnit(stage, 1.0)
    raiz = UsdGeom.Xform.Define(stage, "/TorreMesa")
    stage.SetDefaultPrim(raiz.GetPrim())
    material = UsdShade.Material.Define(stage, "/TorreMesa/Looks/MDF")
    shader = UsdShade.Shader.Define(stage, "/TorreMesa/Looks/MDF/Shader")
    shader.CreateIdAttr("UsdPreviewSurface")
    shader.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(*COLOR_MDF))
    shader.CreateInput("roughness", Sdf.ValueTypeNames.Float).Set(0.88)
    shader.CreateInput("metallic", Sdf.ValueTypeNames.Float).Set(0.0)
    material.CreateSurfaceOutput().ConnectToSource(shader.ConnectableAPI(), "surface")
    material_bordes = UsdShade.Material.Define(stage, '/TorreMesa/Looks/Bordes')
    shader_bordes = UsdShade.Shader.Define(stage, '/TorreMesa/Looks/Bordes/Shader')
    shader_bordes.CreateIdAttr('UsdPreviewSurface')
    shader_bordes.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(0.001))
    shader_bordes.CreateInput('roughness', Sdf.ValueTypeNames.Float).Set(1.0)
    material_bordes.CreateSurfaceOutput().ConnectToSource(shader_bordes.ConnectableAPI(), 'surface')
    for nombre, cuerpo in cuerpos.items():
        malla = UsdGeom.Mesh.Define(stage, "/TorreMesa/" + nombre)
        puntos = [Gf.Vec3f(*map(float, p)) for p in cuerpo["posiciones"]]
        malla.CreatePointsAttr(puntos)
        malla.CreateFaceVertexCountsAttr([3] * (len(puntos) // 3))
        malla.CreateFaceVertexIndicesAttr(list(range(len(puntos))))
        malla.CreateNormalsAttr([Gf.Vec3f(*map(float, n)) for n in cuerpo["normales"]])
        malla.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
        malla.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
        malla.CreateDoubleSidedAttr(True)
        malla.CreateExtentAttr(UsdGeom.PointBased.ComputeExtent(Vt.Vec3fArray(puntos)))
        UsdShade.MaterialBindingAPI.Apply(malla.GetPrim()).Bind(
            material_bordes if cuerpo.get('material') == 'bordes' else material)
    stage.GetRootLayer().Save()
    paquete = carpeta_temporal / "torre-mesa.usdz"
    if not UsdUtils.CreateNewUsdzPackage(Sdf.AssetPath(str(temporal)), str(paquete)):
        raise RuntimeError("No se pudo crear el paquete USDZ.")
    shutil.copyfile(paquete, destino)
    del stage
    shutil.rmtree(carpeta_temporal)
