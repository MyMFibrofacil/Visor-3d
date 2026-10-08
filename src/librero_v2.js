import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { catalog, defaultClient, defaultFurniture, getProduct } from './catalog.js';
import './styles.css';

const route = new URLSearchParams(location.search);
getProduct(route.get('cliente') || defaultClient, route.get('mueble') || defaultFurniture);
const direct = route.has('mueble') || route.has('pieza') || route.has('p');

function showCatalog() {
  const clients = document.getElementById('clientList');
  const furniture = document.getElementById('furnitureList');
  clients.innerHTML = ''; furniture.innerHTML = '';
  for (const [slug, client] of Object.entries(catalog)) {
    const button = document.createElement('button');
    button.className = 'catalog-card';
    button.innerHTML = `<span class="card-label">CLIENTE</span><strong>${client.name}</strong><small>${client.client} · ${client.description}</small><span class="card-action">Ver muebles →</span>`;
    button.onclick = () => {
      document.getElementById('clientStep').hidden = true;
      document.getElementById('furnitureStep').hidden = false;
      document.getElementById('selectedClientName').textContent = `${client.name} · ${client.client}`;
      furniture.innerHTML = '';
      for (const [furnitureSlug, item] of Object.entries(client.furniture)) {
        const card = document.createElement('button');
        card.className = 'catalog-card';
        card.innerHTML = `<span class="card-label">MUEBLE</span><strong>${item.name}</strong><small>${item.description}</small><span class="card-action">Abrir visor 3D →</span>`;
        card.onclick = () => { location.href = `?cliente=${slug}&mueble=${furnitureSlug}`; };
        furniture.append(card);
      }
    };
    clients.append(button);
  }
  document.getElementById('backToClients').onclick = () => { location.href = location.pathname; };
}

if (!direct) showCatalog(); else startViewer();

function startViewer() {
  document.getElementById('catalogApp').hidden = true;
  document.getElementById('viewerApp').hidden = false;
  document.getElementById('clientName').textContent = 'PICKY KIDS · GUÍA DE ARMADO 3D';
  document.getElementById('productName').textContent = 'Librero Emi';
  document.getElementById('sceneName').textContent = 'Librero';
  document.getElementById('homeButton').onclick = () => { location.href = location.pathname; };

  const select = document.getElementById('pieceSelect');
  select.innerHTML = '<option value="lateral">Laterales</option><option value="separador">Respaldo con manija</option><option value="base">Base</option><option value="frente">Frentes</option>';
  const canvas = document.getElementById('viewer');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9eee9);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
  camera.position.set(7.2, 4.8, -8.2);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.8, 0);
  controls.enableDamping = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x66736c, 2.5));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(5, 8, 6); keyLight.castShadow = true; scene.add(keyLight);

  const wood = new THREE.MeshStandardMaterial({ color: 0xd7a16e, roughness: .66 });
  const selected = new THREE.MeshStandardMaterial({ color: 0xe3262e, roughness: .45, emissive: 0x580000, emissiveIntensity: .18 });
  const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x2459d3, roughness: .25 });
  const root = new THREE.Group(); root.scale.setScalar(.01); scene.add(root);
  const groups = {}, meshes = [], holes = [];

  function addPart(name, geometry, position, explodeVector) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.userData = { base: new THREE.Vector3(...position), explode: new THREE.Vector3(...explodeVector), name };
    const mesh = new THREE.Mesh(geometry, wood);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData = { name };
    group.add(mesh);
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0x70452b, transparent: true, opacity: .48 })));
    root.add(group); (groups[name] ??= []).push(group); meshes.push(mesh);
    return group;
  }

  function addHole(group, x, y, z, axis = 'x') {
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 2.2, 18), holeMaterial);
    marker.position.set(x, y, z);
    if (axis === 'x') marker.rotation.z = Math.PI / 2;
    if (axis === 'z') marker.rotation.x = Math.PI / 2;
    marker.visible = false; group.add(marker); holes.push(marker);
  }

  const T = 18.5, INNER_W = 503.9, SIDE_D = 389.9, SIDE_H = 305, BACK_H = 370;

  function lateralGeometry() {
    const shape = new THREE.Shape();
    const outline = [[.9102,.5000],[.9128,.7519],[.9444,.7875],[.9658,.7936],[.9975,.8293],[1,.9443],[.9872,.9837],[.9564,1],[.8127,1],[.6384,1],[.5983,.9661],[.5948,.8851],[.5948,.8480],[.5744,.8008],[.1027,.6639],[.0364,.6163],[.0019,.5297],[.0001,.5074],[.0001,.4926],[.0019,.4703],[.0364,.3837],[.1027,.3361],[.5744,.1992],[.5948,.1520],[.5948,.1149],[.5983,.0339],[.6384,0],[.8127,0],[.9564,0],[.9872,.0163],[1,.0557],[.9975,.1707],[.9658,.2064],[.9444,.2125],[.9128,.2481]];
    outline.forEach(([z, y], index) => index ? shape.lineTo(z * SIDE_D, y * SIDE_H) : shape.moveTo(z * SIDE_D, y * SIDE_H));
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: true, bevelSize: 1.5, bevelThickness: 1.5, bevelSegments: 2 });
    // La parte alta y recta queda hacia el respaldo; la punta baja mira al frente.
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(T / 2, 0, -SIDE_D / 2);
    return geometry;
  }

  function backGeometry() {
    const w = INNER_W, bodyTop = 335, handleTop = BACK_H;
    const shape = new THREE.Shape();
    shape.moveTo(-w/2, 0); shape.lineTo(w/2, 0); shape.lineTo(w/2, bodyTop);
    shape.lineTo(112, bodyTop); shape.quadraticCurveTo(103, bodyTop, 98, 350);
    shape.quadraticCurveTo(90, handleTop, 62, handleTop); shape.lineTo(-62, handleTop);
    shape.quadraticCurveTo(-90, handleTop, -98, 350); shape.quadraticCurveTo(-103, bodyTop, -112, bodyTop);
    shape.lineTo(-w/2, bodyTop); shape.closePath();
    const grip = new THREE.Path();
    grip.moveTo(-70, 303); grip.quadraticCurveTo(-78, 303, -80, 319); grip.quadraticCurveTo(-82, 342, -64, 345);
    grip.lineTo(64, 345); grip.quadraticCurveTo(82, 342, 80, 319); grip.quadraticCurveTo(78, 303, 70, 303); grip.closePath();
    shape.holes.push(grip);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: true, bevelSize: 1.5, bevelThickness: 1.5, bevelSegments: 2 });
    geometry.translate(0, 0, -T/2);
    return geometry;
  }

  const outerX = INNER_W/2 + T/2;
  const left = addPart('lateral', lateralGeometry(), [-outerX, 0, 0], [-100, 0, 0]);
  const right = addPart('lateral', lateralGeometry(), [outerX, 0, 0], [100, 0, 0]);
  const sideHoles = [[0,.5],[.7365,.5],[.7554,0],[1,.1771],[1,.8229],[.7554,1],[.3683,.5],[.9333,0],[.9333,1]];
  for (const [z, y] of sideHoles) {
    addHole(left, T/2, y*SIDE_H, z*SIDE_D-SIDE_D/2, 'x');
    addHole(right, -T/2, y*SIDE_H, z*SIDE_D-SIDE_D/2, 'x');
  }

  const baseY = 45;
  const base = addPart('base', new THREE.BoxGeometry(INNER_W, T, 269), [0, baseY, 0], [0, -75, 0]);
  [-187.95, 0, 187.95].forEach(x => addHole(base, x, T/2, 0, 'y'));
  [-187.95, 0, 187.95].forEach(x => { addHole(base, x, 0, -269/2, 'z'); addHole(base, x, 0, 269/2, 'z'); });
  [-92.5, 92.5].forEach(z => { addHole(base, -INNER_W/2, 0, z, 'x'); addHole(base, INNER_W/2, 0, z, 'x'); });

  const backZ = 269/2 - T/2;
  const back = addPart('separador', backGeometry(), [0, 0, backZ], [0, 0, 90]);
  [64,167.5,271].forEach(y => { addHole(back, -INNER_W/2, y, 0, 'x'); addHole(back, INNER_W/2, y, 0, 'x'); });
  [-187.95,0,187.95].forEach(x => addHole(back, x, 0, 0, 'y'));

  const boardY = baseY + T/2 + 53;
  const front = addPart('frente', new THREE.BoxGeometry(INNER_W, 106, T), [0, boardY, -269/2 + T/2], [0, 0, -95]);
  const middle = addPart('frente', new THREE.BoxGeometry(INNER_W, 106, T), [0, boardY, 0], [0, 0, -45]);
  [-187.95,0,187.95].forEach(x => { addHole(front,x,44,-T/2,'z'); addHole(middle,x,-44,-T/2,'z'); });
  for (const board of [front,middle]) [-25,25].forEach(y => { addHole(board,-INNER_W/2,y,0,'x'); addHole(board,INNER_W/2,y,0,'x'); });

  const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshStandardMaterial({ color: 0xd7ddd6, roughness: 1 }));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
  let current = route.get('pieza') || 'lateral', amount = 0;
  function refresh() { meshes.forEach(mesh => { mesh.material = mesh.userData.name === current ? selected : wood; }); select.value = current; holes.forEach(hole => { hole.visible = amount > .03; }); }
  function explode(value) { amount = value; Object.values(groups).flat().forEach(group => group.position.copy(group.userData.base).addScaledVector(group.userData.explode, value)); holes.forEach(hole => { hole.visible = value > .03; }); }
  select.onchange = event => { current = event.target.value; refresh(); const url = new URL(location.href); url.searchParams.set('pieza', current); history.replaceState({}, '', url); };
  document.getElementById('explode').oninput = event => explode(event.target.value/100);
  document.getElementById('explodeButton').onclick = () => { const next = amount > .5 ? 0 : 1; document.getElementById('explode').value = next*100; explode(next); document.getElementById('explodeButton').textContent = next ? 'Volver a ver armado' : 'Ver despiece completo'; };
  const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
  canvas.onclick = event => { const rect = canvas.getBoundingClientRect(); mouse.set((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1); raycaster.setFromCamera(mouse,camera); const hit=raycaster.intersectObjects(meshes)[0]; if(hit){current=hit.object.userData.name;refresh();} };
  function loop(){const width=canvas.clientWidth,height=canvas.clientHeight;if(canvas.width!==width*renderer.getPixelRatio()){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}controls.update();renderer.render(scene,camera);requestAnimationFrame(loop);}
  refresh(); loop(); document.getElementById('loading').classList.add('ready');
}
