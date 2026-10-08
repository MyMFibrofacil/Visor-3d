import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import modelData from "./model-data.json";
import "./styles.css";

const U = 0.01;
const T = modelData.dimensions.thickness;
const pieces = {
  tapa: { family: "table", name: "Tapa de mesa", quantity: "1 por mesa", location: "Parte superior", description: "Se une a las dos fajas y a los dos laterales con 6 tarugos y 6 minifix." },
  faja: { family: "table", name: "Fajas de mesa", quantity: "2 por mesa", location: "Debajo de la tapa", description: "Cada faja une los dos laterales y también fija la tapa." },
  "lateral-mesa": { family: "table", name: "Laterales de mesa", quantity: "2 por mesa", location: "Extremos", description: "Cada lateral forma las dos patas de un extremo y recibe las fajas." },
  "lateral-silla": { family: "chair", name: "Laterales de silla", quantity: "2 por silla", location: "Costados", description: "Cada lateral recibe el respaldo, el asiento y la trava en los agujeros coincidentes." },
  asiento: { family: "chair", name: "Asiento", quantity: "1 por silla", location: "Centro de la silla", description: "Se fija a cada lateral con 2 tarugos y 1 tornillo." },
  respaldo: { family: "chair", name: "Respaldo", quantity: "1 por silla", location: "Parte posterior alta", description: "Se fija a cada lateral con 2 tarugos y 1 tornillo." },
  trava: { family: "chair", name: "Trava de asiento", quantity: "1 por silla", location: "Debajo del asiento", description: "Se fija a cada lateral con 1 tarugo y 1 tornillo." }
};

const canvas = document.getElementById("viewer");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe9eee9, 10, 20);
const camera = new THREE.PerspectiveCamera(32, 1, .05, 100);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.minDistance = 5;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * .54;

scene.add(new THREE.HemisphereLight(0xffffff, 0x6b756f, 2.25));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
keyLight.position.set(6, 10, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -10; keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10; keyLight.shadow.camera.bottom = -10;
scene.add(keyLight);

function woodTexture() {
  const c = document.createElement("canvas"); c.width = 384; c.height = 384;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#cf9a69"; ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 150; i++) {
    const y = (i * 31) % c.height;
    ctx.strokeStyle = `rgba(91,49,25,${.025 + (i % 6) * .009})`;
    ctx.lineWidth = .7 + (i % 4) * .3;
    ctx.beginPath(); ctx.moveTo(0, y);
    ctx.bezierCurveTo(100, y + Math.sin(i) * 11, 255, y - Math.cos(i * .6) * 10, 384, y + Math.sin(i * .33) * 8);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

const woodMaterial = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0xe0b181, roughness: .7 });
const highlightMaterial = new THREE.MeshStandardMaterial({ color: 0xe3262e, roughness: .42, emissive: 0x5a0000, emissiveIntensity: .22 });
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x5a321d, transparent: true, opacity: .5 });
const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x39271d, roughness: .9 });
const dowelMaterial = new THREE.MeshStandardMaterial({ color: 0x36a5cf, roughness: .45, emissive: 0x063848, emissiveIntensity: .22 });
const hardwareMaterial = new THREE.MeshStandardMaterial({ color: 0x26322e, roughness: .32, metalness: .4 });

const tableRoot = new THREE.Group();
const chairRoot = new THREE.Group();
tableRoot.scale.setScalar(U); chairRoot.scale.setScalar(U);
scene.add(tableRoot, chairRoot);
const selectable = [];
const machiningObjects = [];

function profileGeometry(points, depth = T, bevel = 1.15) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, bevelSize: bevel, bevelThickness: bevel, curveSegments: 6 });
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  geo.translate(-(box.min.x + box.max.x)/2, -(box.min.y + box.max.y)/2, -depth/2);
  geo.computeVertexNormals();
  return geo;
}

function addPart(root, outlineKey, type, position, explode, rotation = [0,0,0], scale = [1,1,1]) {
  const group = new THREE.Group();
  const geometry = profileGeometry(modelData.outlines[outlineKey]);
  const mesh = new THREE.Mesh(geometry, woodMaterial);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData.partType = type; mesh.userData.parentPart = group;
  group.add(mesh);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMaterial);
  group.add(edges);
  group.position.set(...position); group.rotation.set(...rotation); group.scale.set(...scale);
  group.userData.base = new THREE.Vector3(...position);
  group.userData.explode = new THREE.Vector3(...explode);
  group.userData.partType = type;
  selectable.push(mesh); root.add(group);
  return group;
}

function faceHole(parent, x, y, z, diameter, axis = "z", kind = "hardware") {
  const radius = Math.max(diameter/2, 3.2);
  const geo = new THREE.CylinderGeometry(radius, radius, 1.4, 24);
  const material = (kind === "dowel" ? dowelMaterial : hardwareMaterial).clone();
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  if (axis === "z") mesh.rotation.x = Math.PI/2;
  if (axis === "x") mesh.rotation.z = Math.PI/2;
  mesh.userData.machining = true;
  mesh.userData.partType = parent.userData.partType;
  parent.add(mesh); machiningObjects.push(mesh);
  return mesh;
}

function markerFor(item) {
  return (item.kind || item.joint || "").startsWith("tarugo") ? "dowel" : "hardware";
}

function addTable() {
  const top = addPart(tableRoot, "tapa", "tapa", [0, 491.25, 0], [0,145,0], [Math.PI/2,0,0]);
  for (const h of modelData.machining.top) faceHole(top,h.x-400,h.z-250,T/2+.7,h.d,"z",markerFor(h));

  for (const z of [-171,171]) {
    const sign = Math.sign(z);
    const rail = addPart(tableRoot, "faja", "faja", [0,434.5,z], [0,0,sign*145]);
    // Las caras con los mecanizados de las fajas miran al centro de la mesa:
    // la faja delantera usa su cara posterior y la trasera su cara anterior.
    const faceZ = -sign * (T/2+.7);
    for (const h of modelData.machining.rail.face) {
      const px=h.x-341.95, py=47.5-h.v;
      faceHole(rail,px,py,faceZ,h.d,"z",markerFor(h));
    }
    for (const h of modelData.machining.rail.topEdge) {
      const px=h.x-341.95;
      faceHole(rail,px,47.5,0,h.d,"y",markerFor(h));
    }
    for (const endX of [-341.95,341.95]) for (const h of modelData.machining.rail.ends) {
      const py=47.5-h.v;
      faceHole(rail,endX,py,0,h.d,"x",markerFor(h));
    }
  }

  for (const x of [-351,351]) {
    const sign = Math.sign(x);
    const side = addPart(tableRoot, "lateralMesa", "lateral-mesa", [x,241,0], [sign*145,0,0], [0,-Math.PI/2,0]);
    const faceZ = sign > 0 ? T/2+.7 : -T/2-.7;
    for (const h of modelData.machining.tableSide.face) {
      const px=h.z-250, py=h.y-241;
      faceHole(side,px,py,faceZ,h.d,"z",markerFor(h));
    }
    for (const h of modelData.machining.tableSide.topEdge) {
      const px=h.z-250;
      faceHole(side,px,241,0,h.d,"y",markerFor(h));
    }
  }
}

function chairSourcePoint(sourceX, sourceY) {
  const m = modelData.machining.chairSide;
  return { z: sourceX - m.seatCenterZSource, y: m.sourceMaxY - sourceY };
}

function boardTransform(first, last, firstOffset, fullLength) {
  const dx = last.x-first.x, dy = last.y-first.y;
  const distance = Math.hypot(dx,dy); const ux = dx/distance, uy = dy/distance;
  const start = { x:first.x-ux*firstOffset, y:first.y-uy*firstOffset };
  const centerSource = { x:start.x+ux*fullLength/2, y:start.y+uy*fullLength/2 };
  const m = modelData.machining.chairSide;
  return { z:centerSource.x-m.seatCenterZSource, y:m.sourceMaxY-centerSource.y, angle:Math.atan2(ux,-uy) };
}

function addChair() {
  const outline = modelData.outlines.lateralSilla;
  const maxX = Math.max(...outline.map(p=>p[0])); const maxY = Math.max(...outline.map(p=>p[1]));
  const sourceCenterX = modelData.machining.chairSide.sourceMinX + maxX/2;
  const sideZ = sourceCenterX-modelData.machining.chairSide.seatCenterZSource;
  const halfSpacing = (modelData.dimensions.chair.insideWidth+T)/2;
  for (const x of [-halfSpacing, halfSpacing]) {
    const sign = Math.sign(x);
    const side = addPart(chairRoot, "lateralSilla", "lateral-silla", [x,maxY/2,sideZ], [sign*110,0,0], [0,-Math.PI/2,0]);
    const faceZ = sign > 0 ? T/2+.7 : -T/2-.7;
    const outerFaceZ = -sign*(T/2+.7);
    const chairMachining = modelData.machining.chairSide;
    for (const group of [chairMachining.seat, chairMachining.back, chairMachining.brace, chairMachining.backFace]) {
      for (const h of group) {
        const p = chairSourcePoint(h.z,h.sourceY);
        const holeFace = h.face === "back" ? outerFaceZ : faceZ;
        faceHole(side,p.z-sideZ,p.y-maxY/2,holeFace,h.d,"z",markerFor(h));
      }
    }
  }

  const seatY = modelData.machining.chairSide.sourceMaxY-283.2;
  const seatBaseSource = 117.15-47.285;
  const seatCenterZ = seatBaseSource+219/2-modelData.machining.chairSide.seatCenterZSource;
  const seat = addPart(chairRoot, "asiento", "asiento", [0,seatY,seatCenterZ], [0,105,0], [Math.PI/2,0,0]);
  for (const endX of [-146.95,146.95]) for (const h of [{v:47.285,d:8,k:"dowel"},{v:94.57,d:6,k:"screw"},{v:141.855,d:8,k:"dowel"}]) {
    const yy=h.v-109.5;
    faceHole(seat,endX + Math.sign(endX) * .7,yy,0,h.d,"x",h.k === "dowel" ? "dowel" : "hardware");
  }

  const back = boardTransform({x:313.84,y:108.36},{x:301.89,y:193.39},42.932,185);
  const backPart = addPart(chairRoot, "respaldo", "respaldo", [0,back.y,back.z], [0,55,75], [back.angle,0,0]);
  for (const endX of [-146.95,146.95]) for (const h of [{v:42.932,d:8,k:"dowel"},{v:85.863,d:6,k:"screw"},{v:128.794,d:8,k:"dowel"}]) {
    const yy=h.v-92.5;
    faceHole(backPart,endX + Math.sign(endX) * .7,yy,0,h.d,"x",h.k === "dowel" ? "dowel" : "hardware");
  }

  const brace = boardTransform({x:323.74,y:460.21},{x:328.24,y:479.69},20.75,60);
  const bracePart = addPart(chairRoot, "trava", "trava", [0,brace.y,brace.z], [0,-70,75], [brace.angle,0,0]);
  for (const endX of [-146.95,146.95]) for (const h of [{v:20.75,d:8,k:"dowel"},{v:40.75,d:6,k:"screw"}]) {
    const yy=h.v-30;
    faceHole(bracePart,endX + Math.sign(endX) * .7,yy,0,h.d,"x",h.k === "dowel" ? "dowel" : "hardware");
  }
}

addTable(); addChair();

const floor = new THREE.Mesh(new THREE.CircleGeometry(13,64), new THREE.MeshStandardMaterial({ color:0xd8ddd7, roughness:1 }));
floor.rotation.x = -Math.PI/2; floor.position.y = -.015; floor.receiveShadow = true; scene.add(floor);

const params = new URLSearchParams(location.search);
const shortPiece = { t:"tapa", f:"faja", lm:"lateral-mesa", ls:"lateral-silla", a:"asiento", r:"respaldo", tr:"trava" };
let selectedType = params.get("pieza") || shortPiece[params.get("p")] || "tapa";
if (!pieces[selectedType]) selectedType = "tapa";
let explodeAmount = 0;

function setFamily(family) {
  tableRoot.visible = family === "table"; chairRoot.visible = family === "chair";
  if (family === "table") { camera.position.set(8.5,7.2,9.4); controls.target.set(0,2.5,0); document.getElementById("sceneName").textContent = "Mesa"; }
  else { camera.position.set(6.5,5.2,7.8); controls.target.set(0,2.55,.2); document.getElementById("sceneName").textContent = "Una silla"; }
  controls.update();
}

function updateSelection(resetCamera=false) {
  const piece = pieces[selectedType];
  if (resetCamera) setFamily(piece.family); else { tableRoot.visible=piece.family==="table"; chairRoot.visible=piece.family==="chair"; }
  selectable.forEach(mesh => mesh.material = mesh.userData.partType === selectedType ? highlightMaterial : woodMaterial);
  machiningObjects.forEach(mesh => {
    const isSelected = mesh.userData.partType === selectedType;
    mesh.material.depthTest = !isSelected;
    mesh.renderOrder = isSelected ? 10 : 0;
    mesh.material.needsUpdate = true;
  });
  document.getElementById("pieceSelect").value = selectedType;
  document.title = `${piece.name} · Armado 3D Emi`;
}

function updateExplode(value) {
  explodeAmount = value;
  for (const root of [tableRoot,chairRoot]) root.children.forEach(object => {
    if (object.userData.base && object.userData.explode) object.position.copy(object.userData.base).addScaledVector(object.userData.explode,value);
  });
}

document.getElementById("pieceSelect").addEventListener("change", event => {
  selectedType=event.target.value; updateSelection(true);
  const url=new URL(location.href); url.searchParams.set("pieza",selectedType); history.replaceState({},"",url);
});
const explode = document.getElementById("explode");
explode.addEventListener("input", event => updateExplode(Number(event.target.value)/100));
document.getElementById("explodeButton").addEventListener("click", () => {
  const next=Number(explode.value)>50?0:100; explode.value=next; updateExplode(next/100);
  document.getElementById("explodeButton").textContent=next?"Volver a ver armado":"Ver despiece completo";
});

const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let downPoint=null;
canvas.addEventListener("pointerdown",e=>downPoint={x:e.clientX,y:e.clientY});
canvas.addEventListener("pointerup", event => {
  if (!downPoint || Math.hypot(event.clientX-downPoint.x,event.clientY-downPoint.y)>5) return;
  const rect=canvas.getBoundingClientRect(); pointer.x=((event.clientX-rect.left)/rect.width)*2-1; pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera); const hit=raycaster.intersectObjects(selectable.filter(m=>m.parent?.parent?.visible!==false),false)[0];
  if (hit) { selectedType=hit.object.userData.partType; updateSelection(false); document.getElementById("pieceSelect").value=selectedType; }
});

function resize() {
  const width=canvas.clientWidth,height=canvas.clientHeight;
  if (canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio())) { renderer.setSize(width,height,false); camera.aspect=width/height; camera.updateProjectionMatrix(); }
}
function animate(){resize();controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);}

machiningObjects.forEach(object => object.visible = true);
setFamily(pieces[selectedType].family); updateSelection(); updateExplode(0); animate();
document.getElementById("loading").classList.add("ready");
