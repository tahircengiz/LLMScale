import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 0, 11);
const clock = new THREE.Clock();
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- deep-space background (darker) ----------
function spaceTexture() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 512;
  const g = cv.getContext("2d");
  const grd = g.createRadialGradient(256, 205, 10, 256, 256, 360);
  grd.addColorStop(0, "#0a1020"); grd.addColorStop(0.4, "#050810"); grd.addColorStop(1, "#010207");
  g.fillStyle = grd; g.fillRect(0, 0, 512, 512); return new THREE.CanvasTexture(cv);
}
scene.background = spaceTexture();

function discTexture() {
  const s = 64, cv = document.createElement("canvas"); cv.width = cv.height = s;
  const g = cv.getContext("2d"); const grd = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.4, "rgba(255,255,255,0.4)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, s, s); return new THREE.CanvasTexture(cv);
}
const DISC = discTexture();

// nebula depth
const nebula = [];
[[0x6366f1,-6,3,-24,26],[0x8b5cf6,7,-4,-28,30],[0x22d3ee,2,6,-32,22]].forEach(([col,x,y,z,sc]) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: DISC, color: col, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.position.set(x,y,z); s.scale.setScalar(sc); scene.add(s); nebula.push(s);
});

// starfield
const STARN = 280, sp = new Float32Array(STARN*3);
for (let i=0;i<STARN;i++){ const r=18+Math.random()*64, a=Math.random()*6.28, b=Math.acos(2*Math.random()-1); sp[i*3]=r*Math.sin(b)*Math.cos(a); sp[i*3+1]=r*Math.sin(b)*Math.sin(a)*0.6; sp[i*3+2]=-8-Math.random()*80; }
const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute("position", new THREE.BufferAttribute(sp,3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ map: DISC, size: 0.5, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, color: 0x8ba6cc }));
scene.add(stars);

// ---------- world group ----------
const world = new THREE.Group(); scene.add(world);

// background neuron cloud + web
const CLOUDN = 70, cloudPos = [], cpos = new Float32Array(CLOUDN*3);
for (let i=0;i<CLOUDN;i++){ const r=5+Math.random()*4.5, a=Math.random()*6.28, b=Math.acos(2*Math.random()-1); const x=r*Math.sin(b)*Math.cos(a), y=r*Math.sin(b)*Math.sin(a)*0.8, z=r*Math.cos(b); cpos[i*3]=x;cpos[i*3+1]=y;cpos[i*3+2]=z; cloudPos.push(new THREE.Vector3(x,y,z)); }
const cloudGeo = new THREE.BufferGeometry(); cloudGeo.setAttribute("position", new THREE.BufferAttribute(cpos,3));
world.add(new THREE.Points(cloudGeo, new THREE.PointsMaterial({ map: DISC, size: 0.26, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, color: 0x5f7cc6 })));
const webPts = [];
for (let i=0;i<CLOUDN;i++){ const d=cloudPos.map((p,j)=>({j,d:i===j?1e9:p.distanceTo(cloudPos[i])})).sort((a,b)=>a.d-b.d); for(let k=0;k<2;k++){ const p=cloudPos[i],q=cloudPos[d[k].j]; webPts.push(p.x,p.y,p.z,q.x,q.y,q.z); } }
const webGeo = new THREE.BufferGeometry(); webGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(webPts),3));
world.add(new THREE.LineSegments(webGeo, new THREE.LineBasicMaterial({ color: 0x33437e, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })));

// ---------- token nodes ----------
const TOKENS = ["The","cat","sat","on","the","mat"];
const TOKID = [464, 2543, 3332, 322, 262, 2603];
const NODE_COL = [0x22d3ee,0x8b5cf6,0x6366f1,0x818cf8,0x22d3ee,0xa855f7];
const SCAT = [[-3.4,1.4,0.8],[-1.8,-0.9,1.6],[-0.2,1.9,-0.6],[1.6,-1.5,0.9],[3.0,0.7,-1.2],[1.1,2.0,1.4]];
const ROW = (i) => [ (i-2.5)*1.55, 0, 0 ];
const labelWrap = document.createElement("div");
labelWrap.style.cssText = "position:fixed;inset:0;z-index:6;pointer-events:none";
document.body.appendChild(labelWrap);

const nodes = TOKENS.map((w,i) => {
  const col = NODE_COL[i];
  const grp = new THREE.Group(); grp.position.set(...SCAT[i]); world.add(grp);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.26,26,26), new THREE.MeshBasicMaterial({ color: col }));
  core.userData.index = i; grp.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: DISC, color: col, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(1.8); grp.add(glow);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.4,0.46,40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  grp.add(halo);
  const hex = "#"+col.toString(16).padStart(6,"0");
  const el = document.createElement("div");
  el.innerHTML = `<span class="w">${w}</span><span class="id"></span>`;
  el.style.cssText = `position:absolute;transform:translate(-50%,-50%);text-align:center;white-space:nowrap;transition:opacity .2s`;
  el.querySelector(".w").style.cssText = `font:700 14px/1 var(--disp,sans-serif);letter-spacing:1.5px;color:${hex};text-shadow:0 0 8px ${hex},0 0 20px ${hex}88`;
  const ids = el.querySelector(".id");
  ids.textContent = "#"+TOKID[i]; ids.style.cssText = `display:block;font:600 10px/1 var(--term,monospace);color:#8ba6cc;letter-spacing:1px;margin-top:4px;opacity:0;transition:opacity .3s`;
  labelWrap.appendChild(el);
  return { grp, core, glow, halo, el, idEl: ids, col, target: new THREE.Vector3(...SCAT[i]), phase: i*1.3 };
});

// ---------- attention edges (a<b = causal) ----------
const EDGES = [[0,1,.5,0],[1,2,.85,1],[2,3,.6,2],[3,4,.5,0],[4,5,.75,1],[0,2,.35,2],[2,5,.55,0],[1,4,.4,1],[3,5,.45,2]];
const HEADS = [{ col: 0x22d3ee, on: true }, { col: 0x8b5cf6, on: true }, { col: 0x6366f1, on: true }];
const edges = EDGES.map(([a,b,w,h]) => {
  const geo = new THREE.BufferGeometry().setFromPoints([nodes[a].target.clone(), nodes[b].target.clone()]);
  const mat = new THREE.LineBasicMaterial({ color: HEADS[h].col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const line = new THREE.Line(geo, mat); world.add(line);
  return { a, b, w, h, line, base: 0.12 + w*0.13 };
});
const edgesOf = (i) => edges.filter(e => e.a===i || e.b===i);

// ---------- pulses ----------
const pulseGeo = new THREE.SphereGeometry(0.07,12,12);
const pulses = [];
function spawnPulse(edge, col) {
  const m = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: DISC, color: col, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.scale.setScalar(0.85); m.add(g); world.add(m);
  pulses.push({ m, a: edge.a, b: edge.b, t: 0, sp: 0.6+Math.random()*0.5, dir: Math.random()<0.5?1:-1 });
}
let idleTimer = 0;

// ---------- extra props ----------
// embedding axes
const axes = new THREE.Group(); axes.visible = true;
[[0x22d3ee,new THREE.Vector3(5,0,0)],[0x8b5cf6,new THREE.Vector3(0,3.4,0)],[0x6366f1,new THREE.Vector3(0,0,5)]].forEach(([col,v]) => {
  const g = new THREE.BufferGeometry().setFromPoints([v.clone().multiplyScalar(-1), v.clone()]);
  axes.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
});
world.add(axes);

// layer planes
const planes = new THREE.Group();
for (let i=0;i<6;i++){
  const g = new THREE.PlaneGeometry(7.6, 4.4);
  const edgeG = new THREE.EdgesGeometry(g);
  const ln = new THREE.LineSegments(edgeG, new THREE.LineBasicMaterial({ color: i===2?0x22d3ee:0x5566b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  ln.position.z = -3 + i*1.15; ln.position.y = 0.2; ln.rotation.x = -0.18;
  planes.add(ln);
}
world.add(planes);

// scale field (billions)
const FN = 4000, fpos = new Float32Array(FN*3), fcol = new Float32Array(FN*3);
const pal = [[0.13,0.83,0.93],[0.55,0.36,0.96],[0.39,0.4,0.95]];
for (let i=0;i<FN;i++){ const r=3+Math.random()*22, a=Math.random()*6.28, b=Math.acos(2*Math.random()-1); fpos[i*3]=r*Math.sin(b)*Math.cos(a); fpos[i*3+1]=r*Math.sin(b)*Math.sin(a); fpos[i*3+2]=r*Math.cos(b); const c=pal[(Math.random()*3)|0]; fcol[i*3]=c[0];fcol[i*3+1]=c[1];fcol[i*3+2]=c[2]; }
const fieldGeo = new THREE.BufferGeometry(); fieldGeo.setAttribute("position", new THREE.BufferAttribute(fpos,3)); fieldGeo.setAttribute("color", new THREE.BufferAttribute(fcol,3));
const field = new THREE.Points(fieldGeo, new THREE.PointsMaterial({ map: DISC, size: 0.16, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
world.add(field);

// loop ring (autoregression)
const loopCurve = new THREE.EllipseCurve(0, 0.4, 3.6, 2.2, 0, 6.283, false, 0);
const loopGeo = new THREE.BufferGeometry().setFromPoints(loopCurve.getPoints(80).map(p => new THREE.Vector3(p.x, p.y, 0)));
const loop = new THREE.Line(loopGeo, new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
loop.rotation.x = -0.35; world.add(loop);

// ---------- bloom ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.7, 0.32);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- chapters ----------
const CH = [
  { id:"hero", cam:[0,0,11], look:[0,0,0], layout:"scatter", spin:true, edges:0, axes:0, planes:0, field:0, loop:0, ids:false },
  { id:"prompt", cam:[0,0,7.6], look:[0,0,0], layout:"row", spin:false, edges:0, axes:0, planes:0, field:0, loop:0, ids:false,
    tr:{e:"01 · PROMPT", h:'Her şey bir <em>cümleyle</em> başlar', p:'Modele bir metin verirsin: <b>“The cat sat on the mat.”</b> Model harfleri değil, anlam taşıyan parçaları görmek üzere bunu hazırlar.'},
    en:{e:"01 · PROMPT", h:'It starts with a <em>sentence</em>', p:'You hand the model text: <b>“The cat sat on the mat.”</b> It won’t read letters — it prepares to see meaningful pieces.'} },
  { id:"token", cam:[0,0,8], look:[0,0,0], layout:"row", spin:false, edges:0, axes:0, planes:0, field:0, loop:0, ids:true,
    tr:{e:"02 · TOKENIZATION", h:'Metin <em>token</em>’lara bölünür', p:'Cümle küçük parçalara (token) ayrılır ve her biri bir sayıya (<b>ID</b>) eşlenir. Model artık kelimelerle değil, sayılarla çalışır.'},
    en:{e:"02 · TOKENIZATION", h:'Text is split into <em>tokens</em>', p:'The sentence is chopped into pieces, each mapped to a number (<b>ID</b>). From here the model works in numbers, not words.'} },
  { id:"embed", cam:[0.4,0.6,9.4], look:[0,0,0], layout:"scatter", spin:true, edges:0, axes:1, planes:0, field:0, loop:0, ids:true,
    tr:{e:"03 · EMBEDDING", h:'Her token bir <em>vektör</em> olur', p:'Her ID, yüksek boyutlu bir <b>anlam uzayında</b> bir noktaya (vektör) dönüşür. Benzer anlamlar birbirine yakın konumlanır.'},
    en:{e:"03 · EMBEDDING", h:'Each token becomes a <em>vector</em>', p:'Every ID turns into a point in a high-dimensional <b>meaning space</b>. Similar meanings land close together.'} },
  { id:"attention", cam:[0,0,9], look:[0,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:0, ids:false, attn:true,
    tr:{e:"04 · ATTENTION", h:'Token’lar <em>birbirine bakar</em>', p:'Her token, cümledeki diğerlerine <b>ne kadar dikkat edeceğini</b> hesaplar. Nedensel maske gereği bir token yalnızca kendinden öncekilere bakabilir.'},
    en:{e:"04 · ATTENTION", h:'Tokens <em>look at each other</em>', p:'Each token computes <b>how much to attend</b> to the others. With a causal mask, a token only looks at the ones before it.'} },
  { id:"layers", cam:[0,1.7,10.6], look:[0,-0.3,0], layout:"scatter", spin:false, edges:1, axes:0, planes:1, field:0, loop:0, ids:false,
    tr:{e:"05 · LAYERS", h:'Aynı blok <em>onlarca kez</em>', p:'Attention + ileri-besleme bloğu üst üste yığılır (örn. <b>×32 katman</b>). Her geçişte temsil biraz daha rafine olur.'},
    en:{e:"05 · LAYERS", h:'The same block, <em>stacked deep</em>', p:'Attention + feed-forward repeats, stacked dozens deep (e.g. <b>×32</b>). Every pass refines the representation.'} },
  { id:"predict", cam:[-1.6,0.4,7.8], look:[0.4,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:0, ids:false, bars:true,
    tr:{e:"06 · PREDICTION", h:'Sıradaki <em>en olası</em> token', p:'Son katman, tüm kelime dağarcığı için bir <b>olasılık dağılımı</b> üretir. En yüksek olasılıklı token seçilir (ya da örneklenir).'},
    en:{e:"06 · PREDICTION", h:'The next most <em>likely</em> token', p:'The final layer scores the entire vocabulary into a <b>probability distribution</b>. The top token is picked (or sampled).'} },
  { id:"loop", cam:[0,0.2,10], look:[0,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:1, ids:false,
    tr:{e:"07 · AUTOREGRESSION", h:'Tahmin <em>geri beslenir</em>', p:'Seçilen token diziye eklenir ve süreç <b>baştan</b> işler. Kelime kelime, model metni böyle üretir.'},
    en:{e:"07 · AUTOREGRESSION", h:'The prediction <em>feeds back</em>', p:'The chosen token is appended and the whole process runs <b>again</b>. Word by word, that’s how text is generated.'} },
  { id:"scale", cam:[0,0,17], look:[0,0,0], layout:"scatter", spin:true, edges:1, axes:0, planes:0, field:1, loop:0, ids:false, cta:true,
    tr:{e:"08 · SCALE", h:'Bunu <em>milyarlarca</em> kez, dev boyutta', p:'Bu küçük ağ aslında <b>milyarlarca parametre</b>. İşte bu yüzden VRAM önemli — modelin bir GPU’ya sığar mı?'},
    en:{e:"08 · SCALE", h:'Now at <em>billions</em>-scale', p:'This tiny network is really <b>billions of parameters</b> — which is exactly why VRAM matters. Does your model fit a GPU?'} },
];

// ---------- build DOM (sections, cards, bars) ----------
let lang = "tr";
try { if (localStorage.getItem("lang") === "en") lang = "en"; } catch (e) {}
const scrollEl = document.getElementById("scroll");
const sections = CH.map((ch, i) => {
  const sec = document.createElement("section"); sec.dataset.i = i;
  if (ch.tr) {
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<div class="eyebrow"></div><h2></h2><p></p>`;
    if (ch.attn) {
      const heads = document.createElement("div"); heads.className = "heads";
      HEADS.forEach((hd, hi) => {
        const b = document.createElement("span"); b.className = "head"; b.dataset.h = hi;
        b.innerHTML = `<span class="dot" style="color:#${hd.col.toString(16).padStart(6,"0")}"></span>Head ${hi+1}`;
        b.onclick = () => { hd.on = !hd.on; b.classList.toggle("off", !hd.on); };
        heads.appendChild(b);
      });
      card.appendChild(heads);
      const hint = document.createElement("div"); hint.className = "hint"; hint.dataset.role = "attnhint";
      card.appendChild(hint);
    }
    if (ch.cta) { const a = document.createElement("a"); a.className = "cta"; a.href = "index.html"; a.dataset.role = "cta"; card.appendChild(a); }
    sec.appendChild(card);
  }
  scrollEl.appendChild(sec);
  return sec;
});

// prediction bars
const PRED = [["mat",72],["floor",11],["rug",8],["ground",5],["couch",4]];
const barsEl = document.getElementById("bars");
barsEl.innerHTML = PRED.map(([w,pct],i) => `<div class="brow ${i===0?"win":""}"><div class="btop"><span class="w">${w}</span><span class="pct">${pct}%</span></div><div class="track"><div class="fill" data-pct="${pct}"></div></div></div>`).join("");

function applyLang() {
  document.querySelectorAll("[data-tr]").forEach(el => el.textContent = el.dataset[lang]);
  CH.forEach((ch, i) => {
    if (!ch.tr) return;
    const c = sections[i].querySelector(".card"); const t = ch[lang];
    c.querySelector(".eyebrow").textContent = t.e;
    c.querySelector("h2").innerHTML = t.h;
    c.querySelector("p").innerHTML = t.p;
    const ah = c.querySelector('[data-role="attnhint"]'); if (ah) ah.textContent = lang==="tr" ? "⊹ bir düğümün üzerine gel · head’leri aç/kapa · tıkla" : "⊹ hover a node · toggle heads · click to fire";
    const cta = c.querySelector('[data-role="cta"]'); if (cta) cta.textContent = lang==="tr" ? "→ LLMScale ile VRAM hesapla" : "→ Size it on LLMScale";
  });
  document.getElementById("lang").textContent = lang==="tr" ? "EN" : "TR";
}
document.getElementById("lang").onclick = () => { lang = lang==="tr" ? "en" : "tr"; try { localStorage.setItem("lang", lang); } catch (e) {} applyLang(); };
applyLang();

// analytics: CTA click back into the calculator
const ctaEl = document.querySelector(".cta");
if (ctaEl) ctaEl.addEventListener("click", () => { try { window.umami && window.umami.track && window.umami.track("learn_cta"); } catch (e) {} });

// ---------- interaction (drag / hover / click) ----------
const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2();
let dragging=false, moved=0, lastX=0, lastY=0, hovered=-1, interacting=false;
const target = { x:0, y:0 }, rot = { x:0, y:0 };
function setPointer(e){ pointer.x=(e.clientX/innerWidth)*2-1; pointer.y=-(e.clientY/innerHeight)*2+1; }
function pickNode(){ ray.setFromCamera(pointer, camera); const hit = ray.intersectObjects(nodes.map(n=>n.core), false)[0]; return hit ? hit.object.userData.index : -1; }
canvas.addEventListener("pointerdown", e => { dragging=true; moved=0; lastX=e.clientX; lastY=e.clientY; interacting=true; canvas.classList.add("grabbing"); canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", e => {
  setPointer(e);
  if (dragging) { const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; moved+=Math.abs(dx)+Math.abs(dy); target.y+=dx*0.005; target.x=Math.max(-0.7,Math.min(0.7,target.x+dy*0.005)); }
  else { const h=pickNode(); if(h!==hovered){ hovered=h; canvas.classList.toggle("pointing", h>=0); } }
});
function endDrag(){ if(!dragging) return; dragging=false; canvas.classList.remove("grabbing"); if(moved<6){ const h=pickNode(); if(h>=0) edgesOf(h).forEach(ed=>spawnPulse(ed, nodes[h].col)); } setTimeout(()=>interacting=false, 900); }
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointerleave", ()=>{ hovered=-1; canvas.classList.remove("pointing"); });

// ---------- scroll → chapter ----------
let chap = 0;
const rev = { edges:0, axes:0, planes:0, field:0, loop:0 };
const camPos = new THREE.Vector3(0,0,11), camLook = new THREE.Vector3(0,0,0);
function setChapter(i) {
  if (i === chap) return; chap = i;
  sections.forEach((s, si) => s.classList.toggle("active", si===i && CH[si].tr));
  barsEl.classList.toggle("show", !!CH[i].bars);
  if (CH[i].bars) barsEl.querySelectorAll(".fill").forEach(f => f.style.width = f.dataset.pct + "%");
  else barsEl.querySelectorAll(".fill").forEach(f => f.style.width = "0");
}
function onScroll() {
  const vh = innerHeight;
  const idx = Math.max(0, Math.min(CH.length-1, Math.round(scrollY / vh)));
  setChapter(idx);
  const heroFade = Math.max(0, 1 - scrollY / (vh*0.7));
  document.getElementById("hero").style.opacity = heroFade;
  document.getElementById("scrollhint").style.opacity = heroFade*0.9;
}
addEventListener("scroll", onScroll, { passive: true });

// ---------- render ----------
const wp = new THREE.Vector3();
function tick() {
  const t = clock.getElapsedTime();
  const ch = CH[chap];

  // rotation
  if (!interacting) {
    if (ch.spin && !reduce) { target.y += 0.0006; target.x += (0 - target.x) * 0.02; }
    else { target.y += (0 - target.y) * 0.04; target.x += (0 - target.x) * 0.04; }
  }
  rot.x = lerp(rot.x, target.x, 0.08); rot.y = lerp(rot.y, target.y, 0.08);
  world.rotation.set(rot.x, rot.y, 0);

  // reveal lerps
  for (const k in rev) rev[k] = lerp(rev[k], ch[k], 0.08);
  axes.children.forEach(l => l.material.opacity = rev.axes * 0.5);
  planes.children.forEach((l,i) => l.material.opacity = rev.planes * (i===2?0.7:0.32));
  field.material.opacity = rev.field * 0.85;
  loop.material.opacity = rev.loop * 0.6;

  // nodes: target layout + bob + hover
  nodes.forEach((n,i) => {
    const tgt = ch.layout==="row" ? ROW(i) : SCAT[i];
    n.target.x = lerp(n.target.x, tgt[0], 0.07); n.target.y = lerp(n.target.y, tgt[1], 0.07); n.target.z = lerp(n.target.z, tgt[2], 0.07);
    n.grp.position.copy(n.target);
    if (!reduce) n.grp.position.y += Math.sin(t*1.1 + n.phase) * 0.1;
    const on = i===hovered;
    n.core.scale.setScalar(on?1.35:1);
    n.glow.material.opacity = lerp(n.glow.material.opacity, on?0.95:0.5, 0.15);
    n.glow.scale.setScalar(lerp(n.glow.scale.x, on?2.6:1.8, 0.15));
    n.halo.material.opacity = lerp(n.halo.material.opacity, on?0.8:0, 0.15); n.halo.lookAt(camera.position);
    n.idEl.style.opacity = ch.ids ? "0.9" : "0";
  });

  // edges
  edges.forEach(e => {
    const pa=nodes[e.a].grp.position, pb=nodes[e.b].grp.position;
    e.line.geometry.attributes.position.setXYZ(0,pa.x,pa.y,pa.z); e.line.geometry.attributes.position.setXYZ(1,pb.x,pb.y,pb.z);
    e.line.geometry.attributes.position.needsUpdate = true;
    const headOn = HEADS[e.h].on;
    const hot = hovered>=0 && (e.a===hovered || e.b===hovered);
    let o = rev.edges * (headOn ? (hovered<0 ? e.base : hot ? 0.85 : e.base*0.35) : 0);
    e.line.material.opacity = lerp(e.line.material.opacity, o, 0.15);
    e.line.material.color.set(hot ? nodes[hovered].col : HEADS[e.h].col);
  });

  // idle pulses (attention/scale/loop chapters)
  if (!reduce && (ch.attn || ch.id==="scale" || ch.loop)) { idleTimer += 0.016; if (idleTimer>0.7){ idleTimer=0; const e=edges[(Math.random()*edges.length)|0]; if(HEADS[e.h].on) spawnPulse(e, 0x8bd6ff); } }
  for (let i=pulses.length-1;i>=0;i--){ const p=pulses[i]; p.t+=0.016*p.sp; const tt=p.dir>0?p.t:1-p.t; p.m.position.lerpVectors(nodes[p.a].grp.position, nodes[p.b].grp.position, tt); const k=Math.sin(Math.min(p.t,1)*Math.PI); p.m.material.opacity=k; p.m.children[0].material.opacity=k*0.9; if(p.t>=1){ world.remove(p.m); p.m.material.dispose(); pulses.splice(i,1); } }

  // starfield twinkle
  if (!reduce) { stars.material.opacity = 0.34 + 0.1*Math.sin(t*1.4); }

  // camera: chapter target + mouse parallax
  const cc = ch.cam, cl = ch.look;
  camPos.x = lerp(camPos.x, cc[0] + pointer.x*0.5, 0.05);
  camPos.y = lerp(camPos.y, cc[1] + pointer.y*0.35, 0.05);
  camPos.z = lerp(camPos.z, cc[2], 0.05);
  camLook.set(lerp(camLook.x, cl[0], 0.05), lerp(camLook.y, cl[1], 0.05), lerp(camLook.z, cl[2], 0.05));
  camera.position.copy(camPos); camera.lookAt(camLook);

  // labels
  nodes.forEach(n => {
    n.grp.getWorldPosition(wp); wp.project(camera);
    const vis = wp.z < 1;
    n.el.style.opacity = vis ? (n===nodes[hovered] ? "1" : "0.82") : "0";
    n.el.querySelector(".w").style.fontSize = n===nodes[hovered] ? "17px" : "14px";
    n.el.style.left = (wp.x*0.5+0.5)*innerWidth + "px";
    n.el.style.top = (-wp.y*0.5+0.5)*innerHeight - 30 + "px";
  });

  composer.render();
  requestAnimationFrame(tick);
}
function resize(){ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); onScroll(); }
addEventListener("resize", resize);
onScroll();
requestAnimationFrame(tick);
