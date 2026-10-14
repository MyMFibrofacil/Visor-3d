import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import data from "./juguetero-estante-data.json";
import { catalog, defaultClient } from "./catalog.js";
import { responsiveCamera } from "./responsive-camera.js";
import { createEdgeMaterial, createHighlightMaterial, createWoodMaterial, VIEWER_COLORS } from "./viewer-palette.js";
import "./styles.css";

const route = new URLSearchParams(location.search);
const slug = "juguetero-x2-con-estante";
const pieces = { lateral: "Laterales", fondo: "Fondo", estante: "Estante", base: "Base", medio: "Divisor central", frente: "Frentes" };
const files = { base: "MA000904000801180101.xml", estante: "MA000904000802180101.xml", fondo: "MA000904000803180101.xml", frente: "MA000904000804180101.xml", lateral: "MA000904000805180101.xml", medio: "MA000904000806180101.xml" };
const T = data.thickness;

function showCatalog() {
  const clientList = document.getElementById("clientList"), furnitureList = document.getElementById("furnitureList");
  const clientStep = document.getElementById("clientStep"), furnitureStep = document.getElementById("furnitureStep");
  let activeClient = route.get("cliente") || null;
  const clients = () => clientList.replaceChildren(...Object.entries(catalog).map(([id, client]) => {
    const b = document.createElement("button"); b.className = "catalog-card"; b.type = "button";
    b.innerHTML = `<span class="card-label">CLIENTE</span><strong>${client.name}</strong><small>${client.client} · ${client.description}</small><span class="card-action">Ver muebles →</span>`;
    b.onclick = () => { activeClient = id; furniture(); }; return b;
  }));
  const furniture = () => { const client = catalog[activeClient]; if (!client) return; clientStep.hidden = true; furnitureStep.hidden = false;
    document.getElementById("selectedClientName").textContent = `${client.name} · ${client.client}`;
    furnitureList.replaceChildren(...Object.entries(client.furniture).map(([id, item]) => { const b = document.createElement("button");
      b.className = "catalog-card furniture-card"; b.type = "button";
      b.innerHTML = `<span class="card-label">MUEBLE</span><strong>${item.name}</strong><small>${item.description}</small><span class="card-action">Abrir visor 3D →</span>`;
      b.onclick = () => location.href = `?cliente=${encodeURIComponent(activeClient)}&mueble=${encodeURIComponent(id)}`; return b; })); };
  document.getElementById("backToClients").onclick = () => { activeClient = null; furnitureStep.hidden = true; clientStep.hidden = false; history.replaceState({}, "", location.pathname); };
  clients(); if (activeClient && catalog[activeClient]) furniture();
}

function startViewer() {
  document.getElementById("catalogApp").hidden = true; document.getElementById("viewerApp").hidden = false;
  document.getElementById("clientName").textContent = "PICKY KIDS · GUÍA DE ARMADO 3D";
  document.getElementById("productName").textContent = "Juguetero x2 con Estante";
  document.getElementById("sceneName").textContent = "Juguetero de dos compartimentos";
  document.getElementById("homeButton").onclick = () => location.href = `?cliente=${encodeURIComponent(route.get("cliente") || defaultClient)}`;
  const select = document.getElementById("pieceSelect");
  select.replaceChildren(...Object.entries(pieces).map(([value, label]) => { const o = document.createElement("option"); o.value = value; o.textContent = label; return o; }));

  const canvas = document.getElementById("viewer"), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe9eee9, 145, 215);
  const camera = new THREE.PerspectiveCamera(31, 1, .05, 220), controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = Math.PI * .65;
  const framing = responsiveCamera(camera, controls, canvas, 1.18);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65726b, 2.35));
  const light = new THREE.DirectionalLight(0xffffff, 3.25); light.position.set(9, 15, 11); light.castShadow = true; light.shadow.mapSize.set(2048, 2048); scene.add(light);
  const wood = createWoodMaterial(), selected = createHighlightMaterial(), edgeMat = createEdgeMaterial();
  wood.side = THREE.DoubleSide; selected.side = THREE.DoubleSide;
  const smallHole = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.dowel, roughness: .45 });
  const largeHole = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.hardware, roughness: .35, metalness: .18 });
  const root = new THREE.Group(); root.scale.setScalar(.01); scene.add(root);
  const parts = [], markers = [];

  function shapeGeometry(type) {
    const p = data.profiles[type], shape = new THREE.Shape();
    p.outline.forEach(([sourceX, sourceY], i) => {
      // El DXF de la base y el XML Flex tienen orientaciones opuestas.
      // Se invierte sólo el contorno para abrir su ranura hacia el medio.
      const x = type === "base" ? p.width - sourceX : sourceX;
      const y = type === "base" ? p.height - sourceY : sourceY;
      i ? shape.lineTo(x, y) : shape.moveTo(x, y);
    }); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 7 });
    g.translate(-p.width / 2, -p.height / 2, -T / 2); g.computeVertexNormals(); return g;
  }
  function addPart(type, pos, rot, explode, scaleY = 1) {
    const group = new THREE.Group(), g = shapeGeometry(type), mesh = new THREE.Mesh(g, wood);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.partType = type;
    group.add(mesh); group.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), edgeMat));
    group.position.set(...pos); group.rotation.set(...rot); group.scale.y = scaleY;
    group.userData = { base: new THREE.Vector3(...pos), explode: new THREE.Vector3(...explode), partType: type };
    root.add(group); parts.push({ group, mesh, type }); return group;
  }
  function dot(parent, x, y, z, diameter = 8, axis = "z") {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(diameter / 2, 3), Math.max(diameter / 2, 3), 1.7, 20), diameter <= 8 ? smallHole : largeHole);
    m.position.set(x, y, z); if (axis === "z") m.rotation.x = Math.PI / 2; if (axis === "x") m.rotation.z = Math.PI / 2;
    m.visible = false; m.userData.partType = parent.userData.partType; parent.add(m); markers.push(m);
  }
  function ops(type) { return data.programs[files[type]].operations; }
  function addSideMarks(part, face) {
    for (const op of ops("lateral")) { if (op.type !== face) continue;
      dot(part, 405 - op.y - 202.5, 700 - op.x - 350, face === "Vertical Hole" ? T / 2 + 1 : -T / 2 - 1, op.diameter); }
  }
  function addPanelMarks(part, type, faceSign = 1) {
    const p = data.profiles[type], seen = new Set();
    for (const op of ops(type)) {
      const x = op.x - p.width / 2, y = (type === "fondo" ? p.height - op.y : op.y) - p.height / 2;
      let edge = null;
      if (op.type === "Horizontal Hole") {
        if (Math.abs(op.x) < .3) edge = "left"; else if (Math.abs(op.x - p.width) < .3) edge = "right";
        else if (Math.abs(op.y) < .3) edge = type === "fondo" ? "top" : "bottom";
        else if (Math.abs(op.y - p.height) < .3) edge = type === "fondo" ? "bottom" : "top";
      }
      const key = `${x.toFixed(1)}:${y.toFixed(1)}:${edge || op.type}`; if (seen.has(key)) continue; seen.add(key);
      if (edge === "left" || edge === "right") dot(part, x + (edge === "left" ? -.8 : .8), y, 0, op.diameter, "x");
      else if (edge === "top" || edge === "bottom") dot(part, x, y + (edge === "bottom" ? -.8 : .8), 0, op.diameter, "y");
      else dot(part, x, y, faceSign * (T / 2 + .9), op.diameter);
    }
  }

  const sideX = (664 + T) / 2;
  const left = addPart("lateral", [-sideX, 350, 202.5], [0, Math.PI / 2, 0], [-180, 0, 0]);
  const right = addPart("lateral", [sideX, 350, 202.5], [0, Math.PI / 2, 0], [180, 0, 0]);
  addSideMarks(left, "Vertical Hole"); addSideMarks(right, "Back Vertical Hole");
  const back = addPart("fondo", [0, 412, 33.875], [0, 0, 0], [0, 0, -160]); addPanelMarks(back, "fondo", 1);
  const shelf = addPart("estante", [0, 482.143, 166], [Math.PI / 2, 0, 0], [0, 110, 20]); addPanelMarks(shelf, "estante", 1);
  const base = addPart("base", [0, 133.25, 205.5], [Math.PI / 2, 0, 0], [0, -45, 20]); addPanelMarks(base, "base", 1);
  for (const direction of [-1, 1]) {
    const front = addPart("frente", [direction * 170.575, 194.896, 377.25], [0, 0, 0], [direction * 45, 0, 170]);
    addPanelMarks(front, "frente", -1);
  }
  // El perfil del DXF de lote es 23,6 mm más alto que el perfil de la plantilla.
  // Se ajusta visualmente entre el piso y la cara inferior del estante. Las
  // posiciones de unión se registran abajo contra las piezas complementarias.
  const middleHeight = 472.893, middleScale = middleHeight / data.profiles.medio.height;
  const middle = addPart("medio", [0, middleHeight / 2, 5.5 + data.profiles.medio.width / 2], [0, -Math.PI / 2, 0], [0, 0, 95], -middleScale);
  const middleProgram = ops("medio");
  for (const op of middleProgram) {
    if (op.type === "Horizontal Hole") {
      const worldZ = 448.47 - op.x, localX = worldZ - middle.position.z;
      dot(middle, localX, -data.profiles.medio.height / 2 - .9, 0, op.diameter, "y");
    } else if (op.type === "Vertical Hole" || op.type === "Back Vertical Hole") {
      const worldZ = 448.47 - op.x, worldY = 496.448 - op.y;
      const localX = worldZ - middle.position.z, localY = (worldY - middle.position.y) / middle.scale.y;
      dot(middle, localX, localY, op.type === "Vertical Hole" ? T / 2 + .9 : -T / 2 - .9, op.diameter);
    }
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.floor, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  let active = route.get("pieza") || "lateral", amount = 0; if (!pieces[active]) active = "lateral"; select.value = active;
  function refresh() { for (const item of parts) item.mesh.material = item.type === active ? selected : wood;
    for (const m of markers) m.visible = amount > .001 && (m.userData.partType === active || amount > .72); }
  function explode(value) { amount = value; const eased = 1 - Math.pow(1 - value, 2);
    for (const { group } of parts) group.position.copy(group.userData.base).addScaledVector(group.userData.explode, eased); refresh(); }
  select.onchange = () => { active = select.value; refresh(); const url = new URL(location.href);
    url.searchParams.set("cliente", "picky-kids"); url.searchParams.set("mueble", slug); url.searchParams.set("pieza", active); history.replaceState({}, "", url); };
  const slider = document.getElementById("explode"), button = document.getElementById("explodeButton"); slider.value = "0";
  slider.oninput = () => { const v = Number(slider.value); explode(v / 100); button.textContent = v === 100 ? "Ver armado completo" : "Ver despiece completo"; };
  button.onclick = () => { slider.value = slider.value === "100" ? "0" : "100"; explode(Number(slider.value) / 100); button.textContent = slider.value === "100" ? "Ver armado completo" : "Ver despiece completo"; };
  camera.position.set(12, 9, 13); controls.target.set(0, 3.5, 2.0); controls.minDistance = 5; controls.maxDistance = 105;
  refresh(); function resize() { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); framing.resize(); }
  new ResizeObserver(resize).observe(canvas); resize();
  function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); } animate();
  document.getElementById("loading").classList.add("ready");
}

if (route.has("mueble") || route.has("pieza") || route.has("p")) startViewer(); else showCatalog();
