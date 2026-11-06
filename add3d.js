/* ---------- 3D control room (three.js r128) ---------- */
const VE=6,LON0=10.45,LAT0=48.09;
const W3=(lo,la)=>new THREE.Vector3((lo-LON0)*741-160,0,-(la-LAT0)*1110+160);
const H0m=kv=>(kv>300?40:22)/100*VE;
const sagOf=s=>Math.min(1.2,s.km*.05);
const CAM={th:.7,ph:1.05,r:340,tg:new THREE.Vector3(),follow:false};
const G3={lines:{},drones:{},labels:{},trails:{},rep:{}};
let RAY,MV,REN,SC,CM;
function lineY(seg,lo,la){const s=SEG[seg],p=s.pts;let bi=0,bd=1e9;p.forEach((q,i)=>{const d=(q[0]-lo)**2+(q[1]-la)**2;if(d<bd){bd=d;bi=i}});const u=bi/(p.length-1);return H0m(s.kv)-sagOf(s)*4*u*(1-u)}
function init3(){
  const box=$('g3'),st=document.createElement('style');
  st.textContent='.tag3{position:absolute;left:0;top:0;font:700 10.5px ui-monospace,Menlo,monospace;pointer-events:none;background:rgba(4,8,15,.75);border:1px solid #1b2a40;border-radius:4px;padding:1px 5px;white-space:nowrap;display:none}.tag3.sel{border-color:#67e8f9}.cam3{position:absolute;left:8px;top:8px;display:flex;gap:6px;z-index:2}.cam3 button{font-size:11px;padding:3px 8px}.hint3{position:absolute;right:8px;bottom:6px;font-size:10.5px;color:#7d90ab;pointer-events:none}';
  document.head.appendChild(st);
  const w=box.clientWidth||900,h=box.clientHeight||520;
  REN=new THREE.WebGLRenderer({antialias:true});REN.setPixelRatio(Math.min(window.devicePixelRatio||1,2));REN.setSize(w,h);box.appendChild(REN.domElement);
  SC=new THREE.Scene();SC.background=new THREE.Color(0x050a12);SC.fog=new THREE.Fog(0x050a12,380,760);
  CM=new THREE.PerspectiveCamera(40,w/h,.5,2000);
  SC.add(new THREE.AmbientLight(0x8fb0d4,.75));const sun=new THREE.DirectionalLight(0xffffff,.7);sun.position.set(80,200,60);SC.add(sun);
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(340,340),new THREE.MeshBasicMaterial({color:0x08111e}));gnd.rotation.x=-Math.PI/2;gnd.position.y=-.05;SC.add(gnd);
  const gp=[];for(let lo=10.45;lo<=10.881;lo+=.05)gp.push(W3(lo,48.09),W3(lo,48.38));for(let la=48.1;la<=48.381;la+=.05)gp.push(W3(10.45,la),W3(10.88,la));
  SC.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gp),new THREE.LineBasicMaterial({color:0x172640})));
  const sh=new THREE.Shape();D.storm.forEach((p,i)=>{const v=W3(p[0],p[1]);i?sh.lineTo(v.x,-v.z):sh.moveTo(v.x,-v.z)});
  const sm=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:0xfbbf24,transparent:true,opacity:.08,side:THREE.DoubleSide}));sm.rotation.x=-Math.PI/2;sm.position.y=.02;SC.add(sm);
  D.reps.forEach(r=>{const v=r.poly.map(p=>{const q=W3(p[0],p[1]);return new THREE.Vector3(q.x,.25,q.z)});const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(v),new THREE.LineBasicMaterial({color:0xfbbf24,transparent:true,opacity:.3}));SC.add(l);G3.rep[r.id]=l});
  D.segs.forEach(s=>{const n=s.pts.length,y0=H0m(s.kv),sg=sagOf(s),hi=s.kv>300;
    const v=s.pts.map((p,i)=>{const q=W3(p[0],p[1]),u=i/(n-1);return new THREE.Vector3(q.x,y0-sg*4*u*(1-u),q.z)});
    const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v),Math.max(10,n*6),hi?.2:.11,5,false),new THREE.MeshBasicMaterial({color:hi?0x22d3ee:0x41546f}));
    m.userData.id=s.id;SC.add(m);G3.lines[s.id]=m});
  D.subs.forEach(n=>{const q=W3(n.lon,n.lat),b=new THREE.Mesh(new THREE.BoxGeometry(2.4,1,2.4),new THREE.MeshLambertMaterial({color:0x3b4a60}));b.position.set(q.x,.5,q.z);SC.add(b)});
  FL.forEach(f=>{const c=new THREE.Color(COL[f.id]),g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.1,.35,1.1),new THREE.MeshLambertMaterial({color:c,emissive:c,emissiveIntensity:.35})));
    const rot=[];[[-.8,-.8],[.8,-.8],[-.8,.8],[.8,.8]].forEach(([x,z])=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.04,14),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.35}));r.position.set(x,.3,z);g.add(r);rot.push(r)});
    g.userData.rotors=rot;SC.add(g);G3.drones[f.id]=g;
    const sh2=new THREE.Mesh(new THREE.CircleGeometry(.9,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35}));sh2.rotation.x=-Math.PI/2;SC.add(sh2);g.userData.sh=sh2;
    const tr=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.6}));SC.add(tr);G3.trails[f.id]=tr;
    const lab=document.createElement('div');lab.className='tag3';lab.textContent=f.id;lab.style.color=COL[f.id];box.appendChild(lab);G3.labels[f.id]=lab});
  G3.ring=new THREE.Mesh(new THREE.RingGeometry(2.6,3.4,40),new THREE.MeshBasicMaterial({color:0xfb7185,transparent:true,opacity:.85,side:THREE.DoubleSide}));G3.ring.rotation.x=-Math.PI/2;G3.ring.visible=false;SC.add(G3.ring);
  RAY=new THREE.Raycaster();MV=new THREE.Vector2();
  const cv=REN.domElement;let dr=null,mv=0;
  cv.addEventListener('pointerdown',e=>{dr={x:e.clientX,y:e.clientY};mv=0});
  window.addEventListener('pointermove',e=>{if(!dr)return;const dx=e.clientX-dr.x,dy=e.clientY-dr.y;mv+=Math.abs(dx)+Math.abs(dy);CAM.th-=dx*.006;CAM.ph=Math.min(1.5,Math.max(.2,CAM.ph-dy*.005));dr={x:e.clientX,y:e.clientY};if(mv>6)CAM.follow=false});
  window.addEventListener('pointerup',e=>{if(dr&&mv<6&&e.target===cv)pick(e);dr=null});
  cv.addEventListener('wheel',e=>{e.preventDefault();CAM.r=Math.min(600,Math.max(35,CAM.r*(1+e.deltaY*.0015)))},{passive:false});
  const hud=document.createElement('div');hud.className='cam3';hud.innerHTML='<button id="ovw">Overview</button><button id="fol">Follow '+SEL+'</button>';box.appendChild(hud);
  hud.querySelector('#ovw').onclick=()=>{CAM.follow=false;CAM.r=340;CAM.th=.7;CAM.ph=1.05};
  hud.querySelector('#fol').onclick=()=>{CAM.follow=!CAM.follow;CAM.r=110};
  const hint=document.createElement('div');hint.className='hint3';hint.textContent='drag to orbit · wheel to zoom · click a line · drones enlarged ×10';box.appendChild(hint);
  $('coord').style.display='none';
  window.addEventListener('resize',()=>{const W2=box.clientWidth,H2=box.clientHeight||520;REN.setSize(W2,H2);CM.aspect=W2/H2;CM.updateProjectionMatrix()});
}
function pick(e){const r=REN.domElement.getBoundingClientRect();MV.x=(e.clientX-r.left)/r.width*2-1;MV.y=-(e.clientY-r.top)/r.height*2+1;RAY.setFromCamera(MV,CM);const h=RAY.intersectObjects(Object.values(G3.lines))[0];if(h){SELL=h.object.userData.id;render()}}
function draw3(){
  if(!SC)return;
  const W=REN.domElement.clientWidth,H=REN.domElement.clientHeight,f=T/DT,i0=Math.min(N-2,Math.floor(f)),a=f-i0;
  Object.keys(G3.lines).forEach(id=>{const s=lstat(id,T),c=id===SELL?0xffffff:s==='a'?0xfb7185:s==='w'?0xfbbf24:s==='o'?0x4ade80:s==='d'?0x64748b:(SEG[id].kv>300?0x22d3ee:0x41546f);G3.lines[id].material.color.setHex(c)});
  Object.keys(G3.rep).forEach(id=>G3.rep[id].material.opacity=HL===id?.9:.3);
  const al=Object.keys(SEG).filter(id=>lstat(id,T)==='a'&&ANOM.find(x=>x.seg===id&&x.c));
  G3.ring.visible=al.length>0;
  if(al.length){const an=ANOM.find(x=>x.seg===al[0]),q=W3(an.c[0],an.c[1]),k=1+.25*Math.sin(performance.now()/300);G3.ring.position.set(q.x,H0m(SEG[al[0]].kv)+.15,q.z);G3.ring.scale.set(k,k,k)}
  let fol=null;
  FL.forEach(fl=>{const A=SM[fl.id][i0],B=SM[fl.id][i0+1];
    const lo=A.p[0]+(B.p[0]-A.p[0])*a,la=A.p[1]+(B.p[1]-A.p[1])*a,seg=A.seg||B.seg,onL=['OBS','HOV','CHG'].includes(A.m);
    const tY=A.m==='FLY'?H0m(SEG[seg||'LINE_026'].kv)+4:(onL||(A.m==='RDY'&&A.seg))?lineY(seg,lo,la)+.9:1.6;
    const g=G3.drones[fl.id],q=W3(lo,la);
    g.position.x=q.x;g.position.z=q.z;g.position.y+=(tY-g.position.y)*.25;
    g.rotation.y=Math.PI/2-(A.hd||0)*Math.PI/180;
    const spin=(A.m==='FLY'||A.m==='OBS'||A.m==='HOV')?.9:.05;g.userData.rotors.forEach(r=>r.rotation.y+=spin);
    g.userData.sh.position.set(q.x,.04,q.z);
    const pts=[];for(let k=Math.max(0,i0-16);k<=i0;k++){const s=SM[fl.id][k],ww=W3(s.p[0],s.p[1]);pts.push(new THREE.Vector3(ww.x,s.m==='FLY'?H0m(SEG[s.seg||'LINE_026'].kv)+4:1.4,ww.z))}
    G3.trails[fl.id].geometry.dispose();G3.trails[fl.id].geometry=new THREE.BufferGeometry().setFromPoints(pts);
    const lab=G3.labels[fl.id],v=new THREE.Vector3(g.position.x,g.position.y+2.4,g.position.z).project(CM);
    lab.style.display=v.z>1?'none':'block';lab.style.transform=`translate(${((v.x+1)/2*W).toFixed(0)}px,${((1-v.y)/2*H).toFixed(0)}px)`;
    lab.className='tag3'+(SEL===fl.id?' sel':'');if(SEL===fl.id)fol=g;
  });
  CAM.tg.lerp(fol&&CAM.follow?fol.position:new THREE.Vector3(0,0,0),CAM.follow?.12:.08);
  const R=CAM.r;CM.position.set(CAM.tg.x+R*Math.sin(CAM.ph)*Math.cos(CAM.th),CAM.tg.y+R*Math.cos(CAM.ph),CAM.tg.z+R*Math.sin(CAM.ph)*Math.sin(CAM.th));
  CM.lookAt(CAM.tg);REN.render(SC,CM);
  const fb=document.getElementById('fol');if(fb)fb.textContent=(CAM.follow?'Following ':'Follow ')+SEL;
}
function loop(){draw3();requestAnimationFrame(loop)}
init3();loop();
