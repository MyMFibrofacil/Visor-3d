import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import modelData from "./cama-data.json";
import { catalog, defaultClient, getProduct } from "./catalog.js";
import "./styles.css";
import { responsiveCamera } from "./responsive-camera.js";

const route = new URLSearchParams(location.search);
const selectedProduct = getProduct(route.get("cliente") || defaultClient, "cama-montessori-emi");
const hasDirectPiece = route.has("pieza") || route.has("p");

function showCatalog() {
  const clientList=document.getElementById("clientList"), furnitureList=document.getElementById("furnitureList");
  const clientStep=document.getElementById("clientStep"), furnitureStep=document.getElementById("furnitureStep");
  let activeClient=route.get("cliente")||null;
  const clients=()=>clientList.replaceChildren(...Object.entries(catalog).map(([slug,client])=>{
    const b=document.createElement("button"); b.className="catalog-card"; b.type="button";
    b.innerHTML=`<span class="card-label">CLIENTE</span><strong>${client.name}</strong><small>${client.client} · ${client.description}</small><span class="card-action">Ver muebles →</span>`;
    b.onclick=()=>{activeClient=slug; furniture();}; return b;
  }));
  const furniture=()=>{const client=catalog[activeClient]; if(!client)return; clientStep.hidden=true; furnitureStep.hidden=false;
    document.getElementById("selectedClientName").textContent=`${client.name} · ${client.client}`;
    furnitureList.replaceChildren(...Object.entries(client.furniture).map(([slug,item])=>{const b=document.createElement("button"); b.className="catalog-card furniture-card"; b.type="button";
      b.innerHTML=`<span class="card-label">MUEBLE</span><strong>${item.name}</strong><small>${item.description}</small><span class="card-action">Abrir visor 3D →</span>`;
      b.onclick=()=>location.href=`?cliente=${encodeURIComponent(activeClient)}&mueble=${encodeURIComponent(slug)}`; return b;}));};
  document.getElementById("backToClients").onclick=()=>{activeClient=null;furnitureStep.hidden=true;clientStep.hidden=false;history.replaceState({},"",location.pathname);};
  clients(); if(activeClient&&catalog[activeClient]) furniture();
}

function startViewer() {
  document.getElementById("catalogApp").hidden=true; document.getElementById("viewerApp").hidden=false;
  document.getElementById("clientName").textContent="PICKY KIDS · GUÍA DE ARMADO 3D";
  document.getElementById("productName").textContent="Cama Montessori Emi";
  document.getElementById("sceneName").textContent="Cama";
  document.getElementById("homeButton").onclick=()=>location.href=location.pathname;

  const pieces={
    "lateral-hueco":"Lateral con hueco", "lateral-completo":"Lateral completo",
    cabecera:"Cabecera y pie", parrilla:"Parrillas", tirante:"Tirantes"
  };
  const select=document.getElementById("pieceSelect"); select.replaceChildren(...Object.entries(pieces).map(([value,text])=>{const o=document.createElement("option");o.value=value;o.textContent=text;return o;}));

  const U=.01, T=modelData.thickness, canvas=document.getElementById("viewer");
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene(); scene.fog=new THREE.Fog(0xe9eee9,125,190);
  const camera=new THREE.PerspectiveCamera(31,1,.05,120), controls=new OrbitControls(camera,canvas); controls.enableDamping=true; controls.dampingFactor=.07; controls.maxPolarAngle=Math.PI*.55;
  const framing=responsiveCamera(camera,controls,canvas); scene.add(new THREE.HemisphereLight(0xffffff,0x6b756f,2.2));
  const light=new THREE.DirectionalLight(0xffffff,3.3); light.position.set(7,11,9); light.castShadow=true; light.shadow.mapSize.set(2048,2048); scene.add(light);

  const wood=new THREE.MeshStandardMaterial({color:0xd5a06e,roughness:.72});
  const selected=new THREE.MeshStandardMaterial({color:0xe3262e,roughness:.42,emissive:0x5a0000,emissiveIntensity:.22});
  const edgeMat=new THREE.LineBasicMaterial({color:0x5a321d,transparent:true,opacity:.5});
  const dowelMat=new THREE.MeshStandardMaterial({color:0x36a5cf,roughness:.45,emissive:0x063848,emissiveIntensity:.2});
  const machineMat=new THREE.MeshStandardMaterial({color:0x26322e,roughness:.35,metalness:.35});
  const root=new THREE.Group(); root.scale.setScalar(U); scene.add(root);
  const parts=[], markers=[];

  function geometry(profileKey,flipProfile=false) {
    const profile=modelData.profiles[profileKey], shape=new THREE.Shape();
    const orient=([x,y])=>flipProfile?[-x,-y]:[x,y];
    profile.outline.map(orient).forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y)); shape.closePath();
    for(const sourceLoop of profile.holes||[]){const hole=new THREE.Path();sourceLoop.map(orient).forEach(([x,y],i)=>i?hole.lineTo(x,y):hole.moveTo(x,y));hole.closePath();shape.holes.push(hole);}
    const g=new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:true,bevelSegments:2,bevelSize:.9,bevelThickness:.9,curveSegments:5});
    g.computeBoundingBox(); const b=g.boundingBox; g.translate(-(b.min.x+b.max.x)/2,-(b.min.y+b.max.y)/2,-T/2);g.computeVertexNormals();return g;
  }
  function part(type,profileKey,position,rotation,explode,flipProfile=false){const group=new THREE.Group(),g=geometry(profileKey,flipProfile),mesh=new THREE.Mesh(g,wood);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.partType=type;group.add(mesh);group.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,25),edgeMat));group.position.set(...position);group.rotation.set(...rotation);group.userData={base:new THREE.Vector3(...position),explode:new THREE.Vector3(...explode),partType:type};parts.push({group,mesh,type});root.add(group);return group;}
  function boxPart(type,size,position,explode){const group=new THREE.Group(),g=new THREE.BoxGeometry(...size),mesh=new THREE.Mesh(g,wood);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.partType=type;group.add(mesh);group.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,25),edgeMat));group.position.set(...position);group.userData={base:new THREE.Vector3(...position),explode:new THREE.Vector3(...explode),partType:type};parts.push({group,mesh,type});root.add(group);return group;}
  function mark(parent,x,y,z,d,axis="z",kind="mecanizado"){const r=Math.max(d/2,3.1),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1.5,20),kind==="tarugo"?dowelMat:machineMat);m.position.set(x,y,z);if(axis==="z")m.rotation.x=Math.PI/2;if(axis==="x")m.rotation.z=Math.PI/2;m.visible=false;m.userData.partType=parent.userData.partType;parent.add(m);markers.push(m);}

  const sideZ=(modelData.dimensions.innerWidth+T)/2;
  const gap=part("lateral-hueco","lateralHueco",[0,220,sideZ],[0,0,0],[0,0,190],true);
  const full=part("lateral-completo","lateralCompleto",[0,220,-sideZ],[0,0,0],[0,0,-190]);
  for(const [side,face] of [[gap,-T/2-.8],[full,T/2+.8]]) for(const h of modelData.machining.lateral) mark(side,h.x-1012.5,h.y-220,face,h.d,"z",h.kind);

  for(const x of [-973.5,973.5]){const sign=Math.sign(x),end=part("cabecera","cabecera",[x,220,0],[0,Math.PI/2,0],[sign*170,0,0]);
    for(const localX of [-419,419])for(const h of modelData.machining.cabeceraEnds)mark(end,localX+Math.sign(localX)*.8,h.y-220,0,h.d,"x",h.kind);}

  for(const z of [-398.25,398.25]){const sign=Math.sign(z),runner=part("tirante","tirante",[0,75,z],[0,0,0],[0,-65,sign*95]);
    for(const h of modelData.machining.runnerTop)mark(runner,h.x-960,25+.8,0,h.d,"y",h.kind);}
  for(let i=0;i<10;i++){const x=-910+i*202.22,slat=boxPart("parrilla",[100,T,815],[x,109.25,0],[0,100+(i%2)*20,0]);
    for(const dx of [-25,25])for(const z of [-398.25,398.25])mark(slat,dx,-T/2-.8,z,8,"y","tarugo");}

  const floor=new THREE.Mesh(new THREE.PlaneGeometry(28,18),new THREE.MeshStandardMaterial({color:0xdfe5df,roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const aliases={lh:"lateral-hueco",lc:"lateral-completo",c:"cabecera",p:"parrilla",t:"tirante"};
  let active=aliases[route.get("p")]||route.get("pieza")||"lateral-hueco", amount=0;
  if(!pieces[active])active="lateral-hueco"; select.value=active;
  function refresh(){for(const item of parts)item.mesh.material=item.type===active?selected:wood;for(const m of markers)m.visible=amount>.03&&(m.userData.partType===active||amount>.7);}
  function explode(v){amount=v;for(const {group} of parts)group.position.copy(group.userData.base).addScaledVector(group.userData.explode,v);refresh();}
  select.onchange=()=>{active=select.value;refresh();history.replaceState({},"",`?cliente=picky-kids&mueble=cama-montessori-emi&pieza=${encodeURIComponent(active)}`);};
  const slider=document.getElementById("explode");slider.value="0";slider.oninput=()=>explode(Number(slider.value)/100);document.getElementById("explodeButton").onclick=()=>{slider.value=slider.value==="100"?"0":"100";explode(Number(slider.value)/100);};
  camera.position.set(20,12,24);controls.target.set(0,2.1,0);controls.minDistance=8;controls.maxDistance=70;refresh();
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);framing.resize();}new ResizeObserver(resize).observe(canvas);resize();
  function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}animate();document.getElementById("loading").style.opacity="0";
}

if(route.has("mueble")||hasDirectPiece) startViewer(); else showCatalog();
