import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import modelData from "./juguetero-data.json";
import { catalog, defaultClient, getProduct } from "./catalog.js";
import "./styles.css";
import { responsiveCamera } from "./responsive-camera.js";

const route = new URLSearchParams(location.search);
const selectedProduct = getProduct(route.get("cliente") || defaultClient, "juguetero-bajo-x2-emi");
const hasDirectPiece = route.has("pieza") || route.has("p");

function showCatalog() {
  const clientList=document.getElementById("clientList"), furnitureList=document.getElementById("furnitureList");
  const clientStep=document.getElementById("clientStep"), furnitureStep=document.getElementById("furnitureStep");
  let activeClient=route.get("cliente")||null;
  const clients=()=>clientList.replaceChildren(...Object.entries(catalog).map(([slug,client])=>{
    const button=document.createElement("button");button.className="catalog-card";button.type="button";
    button.innerHTML=`<span class="card-label">CLIENTE</span><strong>${client.name}</strong><small>${client.client} · ${client.description}</small><span class="card-action">Ver muebles →</span>`;
    button.onclick=()=>{activeClient=slug;furniture();};return button;
  }));
  const furniture=()=>{const client=catalog[activeClient];if(!client)return;clientStep.hidden=true;furnitureStep.hidden=false;document.getElementById("selectedClientName").textContent=`${client.name} · ${client.client}`;
    furnitureList.replaceChildren(...Object.entries(client.furniture).map(([slug,item])=>{const button=document.createElement("button");button.className="catalog-card furniture-card";button.type="button";button.innerHTML=`<span class="card-label">MUEBLE</span><strong>${item.name}</strong><small>${item.description}</small><span class="card-action">Abrir visor 3D →</span>`;button.onclick=()=>location.href=`?cliente=${encodeURIComponent(activeClient)}&mueble=${encodeURIComponent(slug)}`;return button;}));};
  document.getElementById("backToClients").onclick=()=>{activeClient=null;furnitureStep.hidden=true;clientStep.hidden=false;history.replaceState({},"",location.pathname);};clients();if(activeClient&&catalog[activeClient])furniture();
}

function startViewer(){
  document.getElementById("catalogApp").hidden=true;document.getElementById("viewerApp").hidden=false;
  document.getElementById("clientName").textContent="PICKY KIDS · GUÍA DE ARMADO 3D";
  document.getElementById("productName").textContent="Juguetero Bajo x2 Emi";
  document.getElementById("sceneName").textContent="Juguetero";
  document.getElementById("homeButton").onclick=()=>location.href=location.pathname;
  const pieces={lateral:"Laterales",fondo:"Fondo",tapa:"Tapa",piso:"Piso",medio:"Divisor central",frente:"Frentes"};
  const select=document.getElementById("pieceSelect");select.replaceChildren(...Object.entries(pieces).map(([value,label])=>{const option=document.createElement("option");option.value=value;option.textContent=label;return option;}));

  const U=.01,T=modelData.thickness,assembly=modelData.assembly,canvas=document.getElementById("viewer");
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xe9eee9,115,175);
  const camera=new THREE.PerspectiveCamera(31,1,.05,160),controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.58;
  const framing=responsiveCamera(camera,controls,canvas,1.25);scene.add(new THREE.HemisphereLight(0xffffff,0x6b756f,2.25));const light=new THREE.DirectionalLight(0xffffff,3.2);light.position.set(8,12,9);light.castShadow=true;light.shadow.mapSize.set(2048,2048);scene.add(light);
  const wood=new THREE.MeshStandardMaterial({color:0x8da36a,roughness:.72}),selected=new THREE.MeshStandardMaterial({color:0xe3262e,roughness:.42,emissive:0x5a0000,emissiveIntensity:.22}),edgeMat=new THREE.LineBasicMaterial({color:0x263b22,transparent:true,opacity:.6}),dowelMat=new THREE.MeshStandardMaterial({color:0x36a5cf,roughness:.45,emissive:0x063848,emissiveIntensity:.18}),hardwareMat=new THREE.MeshStandardMaterial({color:0x26322e,roughness:.35,metalness:.25});
  const root=new THREE.Group();root.scale.setScalar(U);scene.add(root);const parts=[],markers=[];

  function geometry(profileKey,swapXY=false,flipX=false,flipY=false){const profile=modelData.profiles[profileKey],shape=new THREE.Shape(),width=swapXY?profile.height:profile.width,height=swapXY?profile.width:profile.height,outline=profile.outline.map(([x,y])=>{let point=swapXY?[y,x]:[x,y];if(flipX)point=[width-point[0],point[1]];if(flipY)point=[point[0],height-point[1]];return point;});outline.forEach(([x,y],index)=>index?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:true,bevelSegments:2,bevelSize:.8,bevelThickness:.8,curveSegments:5});geometry.computeBoundingBox();const box=geometry.boundingBox;geometry.translate(-(box.min.x+box.max.x)/2,-(box.min.y+box.max.y)/2,-T/2);geometry.computeVertexNormals();return geometry;}
  function part(type,profileKey,position,rotation,explode,swapXY=false,flipX=false,flipY=false){const group=new THREE.Group(),g=geometry(profileKey,swapXY,flipX,flipY),mesh=new THREE.Mesh(g,wood);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.partType=type;group.add(mesh);group.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,25),edgeMat));group.position.set(...position);group.rotation.set(...rotation);group.userData={base:new THREE.Vector3(...position),explode:new THREE.Vector3(...explode),partType:type};parts.push({group,mesh,type});root.add(group);return group;}
  function marker(parent,x,y,z,diameter=8,axis="z"){const radius=Math.max(diameter/2,3),material=diameter===8?dowelMat:hardwareMat,point=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1.6,20),material);point.position.set(x,y,z);if(axis==="z")point.rotation.x=Math.PI/2;if(axis==="x")point.rotation.z=Math.PI/2;point.visible=false;point.userData.partType=parent.userData.partType;parent.add(point);markers.push(point);}
  function transformedPoint(x,y,nx,ny,profile,swapXY=false,flipX=false,flipY=false){const width=swapXY?profile.height:profile.width,height=swapXY?profile.width:profile.height;let point=swapXY?[y,x]:[x,y],normal=swapXY?[ny,nx]:[nx,ny];if(flipX){point[0]=width-point[0];normal[0]*=-1;}if(flipY){point[1]=height-point[1];normal[1]*=-1;}return {x:point[0]-width/2,y:point[1]-height/2,nx:normal[0],ny:normal[1]};}
  function machiningMarkers(group,key,programName,swapXY=false,flipX=false,flipY=false){const profile=modelData.profiles[key],program=modelData.programs[programName],eps=.25;for(const op of program.operations){if(op.type==="Horizontal Hole"){let nx=0,ny=0;if(Math.abs(op.x)<eps)nx=-1;else if(Math.abs(op.x-program.length)<eps)nx=1;else if(Math.abs(op.y)<eps)ny=-1;else if(Math.abs(op.y-program.width)<eps)ny=1;else continue;const p=transformedPoint(op.x,op.y,nx,ny,profile,swapXY,flipX,flipY);marker(group,p.x+(p.nx*(T/2+.8)),p.y+(p.ny*(T/2+.8)),0,op.diameter,Math.abs(p.nx)>.5?"x":"y");}else{const p=transformedPoint(op.x,op.y,0,0,profile,swapXY,flipX,flipY),face=op.type==="Back Vertical Hole"?-(T/2+.8):(T/2+.8);marker(group,p.x,p.y,face,op.diameter,"z");}}}

  const sideX=(assembly.innerWidth+T)/2;
  const left=part("lateral","lateral",[-sideX,assembly.sideHeight/2,assembly.sideDepth/2],[0,-Math.PI/2,0],[-170,0,0],true);
  const right=part("lateral","lateral",[sideX,assembly.sideHeight/2,assembly.sideDepth/2],[0,-Math.PI/2,0],[170,0,0],true);
  machiningMarkers(left,"lateral","MA000904000403180101.xml",true);machiningMarkers(right,"lateral","MA000904000403180101.xml",true);

  const backProfile=modelData.profiles.fondo,back=part("fondo","fondo",[0,140,assembly.backDepth],[0,0,0],[0,25,-115],false,false,true);machiningMarkers(back,"fondo","MA000904000405180101.xml",false,false,true);
  const floorProfile=modelData.profiles.piso,floorPart=part("piso","piso",[0,assembly.floorHeight,assembly.floorDepthStart+floorProfile.height/2],[-Math.PI/2,0,0],[0,-110,-15]);machiningMarkers(floorPart,"piso","MA000904000401180101.xml");
  const topProfile=modelData.profiles.tapa,top=part("tapa","tapa",[0,assembly.topHeight,assembly.floorDepthStart+topProfile.height/2],[Math.PI/2,0,0],[0,125,-20],false,false,true);machiningMarkers(top,"tapa","MA000904000406180101.xml",false,false,true);
  const middleProfile=modelData.profiles.medio,middle=part("medio","medio",[0,assembly.floorHeight+middleProfile.width/2,assembly.middleDepthOffset+middleProfile.height/2],[0,-Math.PI/2,0],[0,20,80],true,true,true);machiningMarkers(middle,"medio","MA000904000404180101.xml",true,true,true);

  const angle=THREE.MathUtils.degToRad(assembly.frontAngleDeg),opening=(assembly.innerWidth-T)/2,frontX=(T+opening)/2;
  for(const sign of [-1,1]){const front=part("frente","frente",[sign*frontX,assembly.frontCenterY,assembly.frontCenterZ],[angle,0,0],[sign*85,20,125]);machiningMarkers(front,"frente","MA000904000402180101.xml");}

  const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,16),new THREE.MeshStandardMaterial({color:0xdfe5df,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  let active=route.get("pieza")||"lateral",amount=0;if(!pieces[active])active="lateral";select.value=active;
  function refresh(){for(const item of parts)item.mesh.material=item.type===active?selected:wood;for(const point of markers)point.visible=amount>.03&&(point.userData.partType===active||amount>.7);}
  function explode(value){amount=value;for(const {group} of parts)group.position.copy(group.userData.base).addScaledVector(group.userData.explode,value);refresh();}
  select.onchange=()=>{active=select.value;refresh();const url=new URL(location.href);url.searchParams.set("cliente","picky-kids");url.searchParams.set("mueble","juguetero-bajo-x2-emi");url.searchParams.set("pieza",active);history.replaceState({},"",url);};
  const slider=document.getElementById("explode"),button=document.getElementById("explodeButton");slider.value="0";slider.oninput=()=>{const value=Number(slider.value);explode(value/100);button.textContent=value===100?"Ver armado completo":"Ver despiece completo";};button.onclick=()=>{slider.value=slider.value==="100"?"0":"100";explode(Number(slider.value)/100);button.textContent=slider.value==="100"?"Ver armado completo":"Ver despiece completo";};
  camera.position.set(15,10,17.5);controls.target.set(0,2.7,1.9);controls.minDistance=5;controls.maxDistance=85;refresh();
  function resize(){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);framing.resize();}new ResizeObserver(resize).observe(canvas);resize();function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}animate();document.getElementById("loading").classList.add("ready");
}

if(route.has("mueble")||hasDirectPiece)startViewer();else showCatalog();
