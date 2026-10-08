import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { catalog, defaultClient, defaultFurniture, getProduct } from './catalog.js';
import './styles.css';
import model from './librero-data.json';

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
  document.querySelector('.legend').innerHTML = '<span><i class="dowel-dot"></i>Tarugo</span><span><i class="hardware-dot"></i>Tornillo / avellanado</span>';
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
  camera.position.set(8.8, 5.9, -10);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 2.3, 0);
  controls.enableDamping = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x66736c, 2.5));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(5, 8, 6); keyLight.castShadow = true; scene.add(keyLight);

  const wood = new THREE.MeshStandardMaterial({ color: 0xd7a16e, roughness: .66 });
  const selected = new THREE.MeshStandardMaterial({ color: 0xe3262e, roughness: .45, emissive: 0x580000, emissiveIntensity: .18 });
  const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x2459d3, roughness: .25 });
  const screwMaterial = new THREE.MeshStandardMaterial({ color: 0x263c34, roughness: .25 });
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

  const T = model.thickness;

  function profile(points, PathType = THREE.Shape) {
    const path = new PathType();
    points.forEach(([x,y],i) => i ? path.lineTo(x,y) : path.moveTo(x,y));
    path.closePath(); return path;
  }
  for (const piece of model.parts) {
    let geometry;
    if (piece.size) {
      geometry = new THREE.BoxGeometry(...piece.size);
      if (piece.kind === 'frente') geometry.translate(0,53,0);
    } else {
      const shape = profile(piece.outline);
      if (piece.cutout) shape.holes.push(profile(piece.cutout, THREE.Path));
      geometry = new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:false});
      if (piece.kind === 'lateral') {
        geometry.rotateY(-Math.PI/2); geometry.translate(T/2,0,0);
      } else geometry.translate(0,0,-T/2);
    }
    const group=addPart(piece.kind,geometry,piece.position,piece.explode);
    for (const machining of piece.holes) {
      const isDowel = machining.diameter === 8 && !['201:21','201:22'].includes(machining.source);
      const marker=new THREE.Mesh(new THREE.CylinderGeometry(machining.diameter/2,machining.diameter/2,.7,20),isDowel ? holeMaterial : screwMaterial);
      marker.position.fromArray(machining.position);
      const normal=new THREE.Vector3(...machining.normal);
      marker.position.addScaledVector(normal,.2);
      marker.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
      marker.visible=false; group.add(marker); holes.push(marker);
    }
  }

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
