import * as THREE from "three";

export const VIEWER_COLORS = Object.freeze({
  wood: 0xe0b181,
  edge: 0x5a321d,
  highlight: 0xe3262e,
  highlightEmissive: 0x5a0000,
  dowel: 0x36a5cf,
  hardware: 0x26322e,
  hole: 0x39271d,
  floor: 0xd8ddd7,
});

let sharedWoodTexture;

function woodTexture() {
  if (sharedWoodTexture) return sharedWoodTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 384;
  const context = canvas.getContext("2d");
  context.fillStyle = "#cf9a69";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 150; index += 1) {
    const y = (index * 31) % canvas.height;
    context.strokeStyle = `rgba(91,49,25,${0.025 + (index % 6) * 0.009})`;
    context.lineWidth = 0.7 + (index % 4) * 0.3;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(
      100,
      y + Math.sin(index) * 11,
      255,
      y - Math.cos(index * 0.6) * 10,
      384,
      y + Math.sin(index * 0.33) * 8,
    );
    context.stroke();
  }
  sharedWoodTexture = new THREE.CanvasTexture(canvas);
  sharedWoodTexture.colorSpace = THREE.SRGBColorSpace;
  sharedWoodTexture.wrapS = sharedWoodTexture.wrapT = THREE.RepeatWrapping;
  sharedWoodTexture.repeat.set(3, 3);
  return sharedWoodTexture;
}

export function createWoodMaterial() {
  return new THREE.MeshStandardMaterial({
    map: woodTexture(),
    color: VIEWER_COLORS.wood,
    roughness: 0.7,
  });
}

export function createHighlightMaterial() {
  return new THREE.MeshStandardMaterial({
    color: VIEWER_COLORS.highlight,
    roughness: 0.42,
    emissive: VIEWER_COLORS.highlightEmissive,
    emissiveIntensity: 0.22,
  });
}

export function createEdgeMaterial(opacity = 0.5) {
  return new THREE.LineBasicMaterial({
    color: VIEWER_COLORS.edge,
    transparent: true,
    opacity,
  });
}
