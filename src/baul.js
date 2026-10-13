import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import data from "./baul-data.json";
import { catalog, defaultClient } from "./catalog.js";
import "./styles.css";
import { responsiveCamera } from "./responsive-camera.js";

const route=new URLSearchParams(location.search),hasDirectPiece=route.has("pieza")||route.has("p");
function showCatalog(){
 const clientList=document.getElementById("clientList"),furnitureList=document.getElementById("furnitureList"),clientStep=document.getElementById("clientStep"),furnitureStep=document.getElementById("furnitureStep");let activeClient=route.get("cliente")||null;
 const clients=()=>clientList.replaceChildren(...Object.entries(catalog).map(([slug,client])=>{const b=document.createElement("button");b.className="catalog-card";b.type="button";b.innerHTML=`<span class="card-label">CLIENTE</span><strong>${client.name}</strong><small>${client.client} · ${client.description}</small><span class="card-action">Ver muebles →</span>`;b.onclick=()=>{activeClient=slug;furniture();};return b;}));
 const furniture=()=>{const client=catalog[activeClient];if(!client)return;clientStep.hidden=true;furnitureStep.hidden=false;document.getElementById("selectedClientName").textContent=`${client.name} · ${client.client}`;furnitureList.replaceChildren(...Object.entries(client.furniture).map(([slug,item])=>{const b=document.createElement("button");b.className="catalog-card furniture-card";b.type="button";b.innerHTML=`<span class="card-label">MUEBLE</span><strong>${item.name}</strong><small>${item.description}</small><span class="card-action">Abrir visor 3D →</span>`;b.onclick=()=>location.href=`?cliente=${activeClient}&mueble=${slug}`;return b;}));};
 document.getElementById("backToClients").onclick=()=>{activeClient=null;furnitureStep.hidden=true;clientStep.hidden=false;history.replaceState({},"",location.pathname);};clients();if(activeClient&&catalog[activeClient])furniture();
}
function startViewer(){
 document.getElementById("catalogApp").hidden=true;document.getElementById("viewerApp").hidden=false;document.getElementById("clientName").textContent="PICKY KIDS · GUÍA DE ARMADO 3D";document.getElementById("productName").textContent="Baúl Emi";document.getElementById("sceneName").textContent="Baúl";document.getElementById("homeButton").onclick=()=>location.href=`?cliente=${encodeURIComponent(route.get("cliente")||defaultClient)}`;
 const pieces={tapa:"Tapa",frente:"Frente",fondo:"Fondo",lateral:"Laterales",base:"Base"},select=document.getElementById("pieceSelect");select.replaceChildren(...Object.entries(pieces).map(([v,l])=>{const o=document.createElement("option");o.value=v;o.textContent=l;return o;}));
 const U=.01,T=data.thickness,canvas=document.getElementById("viewer"),renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xe9eee9,110,170);const camera=new THREE.PerspectiveCamera(31,1,.05,180),controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.6;const framing=responsiveCamera(camera,controls,canvas,1.3);scene.add(new THREE.HemisphereLight(0xffffff,0x68746c,2.2));const sun=new THREE.DirectionalLight(0xffffff,3.1);sun.position.set(9,13,10);sun.castShadow=true;scene.add(sun);
 const wood=new THREE.MeshStandardMaterial({color:0x9aae72,roughness:.73}),selected=new THREE.MeshStandardMaterial({color:0xe3262e,roughness:.42,emissive:0x5a0000,emissiveIntensity:.22}),edgeMat=new THREE.LineBasicMaterial({color:0x263b22,transparent:true,opacity:.58}),pointMat=new THREE.MeshBasicMaterial({color:0x008fbd,side:THREE.DoubleSide});
 const root=new THREE.Group();root.scale.setScalar(U);scene.add(root);const parts=[],markers=[];
 function transformedProfile(key,mode){const p=data.profiles[key],points=p.outline.map(([x,y])=>mode==='swap'?[y,x]:mode==='swap-flip'?[p.height-y,p.width-x]:[x,y]);return {points,width:mode==='plain'?p.width:p.height,height:mode==='plain'?p.height:p.width};}
 function geometry(key,mode='plain'){const p=transformedProfile(key,mode),s=new THREE.Shape();p.points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:T,bevelEnabled:false,curveSegments:6});g.computeBoundingBox();const b=g.boundingBox;g.translate(-(b.min.x+b.max.x)/2,-(b.min.y+b.max.y)/2,-T/2);g.computeVertexNormals();return g;}
 function addPart(type,key,pos,rot,explode,mode='plain'){const group=new THREE.Group(),g=geometry(key,mode),mesh=new THREE.Mesh(g,wood);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.partType=type;group.add(mesh);group.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,24),edgeMat));group.position.set(...pos);group.rotation.set(...rot);group.userData={base:new THREE.Vector3(...pos),explode:new THREE.Vector3(...explode),partType:type};parts.push({group,mesh,type});root.add(group);return group;}
 function dot(parent,x,y,z,d=8,axis='z'){const r=Math.max(d/2,6),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,2,18),pointMat);m.position.set(x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;m.visible=false;m.userData.partType=parent.userData.partType;parent.add(m);markers.push(m);}
 function addMachining(group,key,program,options={}){
  const {mode='plain',faceSign=1,mirrorX=false,faceType=null}=options;
  const prof=transformedProfile(key,mode),p=data.programs[program],seen=new Set();
  for(const op of p.operations){
   if(faceType && op.type!=='Horizontal Hole' && op.type!==faceType)continue;
   let x=op.x,y=op.y;
   if(key.startsWith('lateral'))[x,y]=[mirrorX?p.length-op.x:op.x,p.width-op.y];
   else if(mode==='swap-flip')[x,y]=[p.length-op.x,p.width-op.y];
   let nx=0,ny=0,edge=false;
   if(op.type==='Horizontal Hole'){
    if(Math.abs(x)<.3){nx=-1;edge=true;}
    else if(Math.abs(x-prof.width)<.3){nx=1;edge=true;}
    else if(Math.abs(y)<.3){ny=-1;edge=true;}
    else if(Math.abs(y-prof.height)<.3){ny=1;edge=true;}
    else continue;
   }
   const k=`${x.toFixed(1)}:${y.toFixed(1)}:${edge?`${nx},${ny}`:faceSign}`;
   if(seen.has(k))continue;
   seen.add(k);
   const px=x-prof.width/2,py=y-prof.height/2;
   if(edge)dot(group,px+nx*.8,py+ny*.8,0,op.diameter,Math.abs(nx)>.5?'x':'y');
   else dot(group,px,py,faceSign*(T/2+.8),op.diameter,'z');
  }
 }
 const a=data.assembly,sideBottom=a.panelHeight-a.sideHeight,wallZ=(a.sideDepth+T)/2,sideX=(a.baseWidth+T)/2;
 const front=addPart('frente','frente',[0,a.panelHeight/2,wallZ],[0,0,0],[0,0,230],'swap-flip');addMachining(front,'frente','MA000904000503180101.xml',{mode:'swap-flip',faceSign:-1});
 const back=addPart('fondo','fondo',[0,a.panelHeight/2,-wallZ],[0,Math.PI,0],[0,0,-230],'swap-flip');addMachining(back,'fondo','MA000904000502180101.xml',{mode:'swap-flip',faceSign:-1});
 const left=addPart('lateral','lateral-a',[-sideX,sideBottom+a.sideHeight/2,0],[0,Math.PI/2,0],[-210,0,0],'swap');
 const right=addPart('lateral','lateral-b',[sideX,sideBottom+a.sideHeight/2,0],[0,-Math.PI/2,0],[210,0,0],'swap');
 addMachining(left,'lateral-a','MA000904000504180101.xml',{mode:'swap',faceType:'Vertical Hole'});
 addMachining(right,'lateral-b','MA000904000504180101.xml',{mode:'swap',mirrorX:true,faceType:'Back Vertical Hole'});
 const base=addPart('base','base',[0,sideBottom+T/2,0],[-Math.PI/2,0,0],[0,330,0]);addMachining(base,'base','MA000904000501180101.xml');
 const lid=addPart('tapa','tapa',[0,a.panelHeight+T/2,-a.lidDepth/2],[-Math.PI/2,0,0],[0,150,-90],'swap');
 addMachining(lid,'tapa','MA000904000505180101.xml',{mode:'swap',faceSign:-1});
 for(const child of lid.children)child.position.y-=a.lidDepth/2;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,16),new THREE.MeshStandardMaterial({color:0xdfe5df,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const smooth=(from,to,value)=>{const t=THREE.MathUtils.clamp((value-from)/(to-from),0,1);return t*t*(3-2*t);};
 let active=route.get('pieza')||'tapa',amount=0,targetAmount=0,lidProgress=0,lidTarget=0;
 if(!pieces[active])active='tapa';select.value=active;
 const lidButton=document.createElement('button');lidButton.type='button';lidButton.className='lid-toggle';lidButton.textContent='Abrir tapa';lidButton.setAttribute('aria-pressed','false');document.querySelector('.stage').append(lidButton);
 lidButton.onclick=()=>{lidTarget=lidTarget?0:1;lidButton.textContent=lidTarget?'Cerrar tapa':'Abrir tapa';lidButton.setAttribute('aria-pressed',String(Boolean(lidTarget)));};
 function refresh(){for(const i of parts)i.mesh.material=i.type===active?selected:wood;for(const p of markers)p.visible=amount>.01;}
 function updateAssembly(){
  const spread=1-(1-THREE.MathUtils.clamp(amount/.8,0,1))**3,baseLift=smooth(.25,1,amount)*smooth(.55,.95,lidProgress),lidSeparation=smooth(.55,1,amount);
  for(const {group} of parts){
   const basePosition=group.userData.base,offset=group.userData.explode;
   const progress=group===base?baseLift:group===lid?lidSeparation:spread;
   group.position.copy(basePosition).addScaledVector(offset,progress);
  }
  // El borde con las cazoletas queda fijo sobre el fondo; abre alrededor de esa línea.
  lid.rotation.x=THREE.MathUtils.lerp(-Math.PI/2,-Math.PI-.13,lidProgress);
  const targetY=2.25+1.15*lidProgress+.65*amount,delta=targetY-controls.target.y;
  controls.target.y=targetY;camera.position.y+=delta;
  refresh();
 }
 select.onchange=()=>{active=select.value;refresh();const u=new URL(location.href);u.searchParams.set('cliente','picky-kids');u.searchParams.set('mueble','baul-emi');u.searchParams.set('pieza',active);history.replaceState({},'',u);};
 const slider=document.getElementById('explode'),button=document.getElementById('explodeButton');slider.value='0';
 function setDespiece(value){targetAmount=value;button.textContent=value===1?'Ver armado completo':'Ver despiece completo';lidButton.hidden=value>.01;}
 slider.oninput=()=>setDespiece(Number(slider.value)/100);
 button.onclick=()=>{slider.value=slider.value==='100'?'0':'100';setDespiece(Number(slider.value)/100);};
 camera.position.set(15,10.5,18);controls.target.set(0,2.25,0);controls.minDistance=5;controls.maxDistance=90;
 updateAssembly();function resize(){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);framing.resize();}new ResizeObserver(resize).observe(canvas);resize();
 const animationClock=new THREE.Clock();
 function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(animationClock.getDelta(),.05),speed=1-Math.exp(-dt*5.5);
  amount=THREE.MathUtils.lerp(amount,targetAmount,speed);
  lidProgress=THREE.MathUtils.lerp(lidProgress,Math.max(lidTarget,smooth(0,.18,amount)),speed);
  if(Math.abs(amount-targetAmount)<.0005)amount=targetAmount;
  updateAssembly();controls.update();renderer.render(scene,camera);
 }
 animate();document.getElementById('loading').classList.add('ready');
}
if(route.has('mueble')||hasDirectPiece)startViewer();else showCatalog();
