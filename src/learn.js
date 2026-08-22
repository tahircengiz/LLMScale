import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// CTA links resolve relative to learn.html (which sits at the LLMScale root).
const BASE = "";

// ---------------------------------------------------------------- data
const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];
const IDS = [464, 2543, 3332, 319, 262, 2603];
const N = TOKENS.length;
const HEADS = [
  { on: true,  name: { tr: "özne", en: "subject" },        dark: 0x34d399, light: 0x059669 },
  { on: true,  name: { tr: "önceki kelime", en: "previous word" }, dark: 0x60a5fa, light: 0x2563eb },
  { on: false, name: { tr: "bağlam", en: "context" },       dark: 0xf59e0b, light: 0xb45309 },
];
function rawW(h, q, k) { if (k > q) return 0;
  if (h === 0) return (k === 1 ? 3 : 0) + (k === q ? 1.2 : 0) + 0.12;
  if (h === 1) return (k === q - 1 && q > 0 ? 3 : 0) + (k === q ? 1 : 0) + 0.08;
  return 1 + 0.4 * k; }
function weights(h, q) { const w = []; let s = 0; for (let k = 0; k <= q; k++) { w[k] = rawW(h, q, k); s += w[k]; } for (let k = 0; k <= q; k++) w[k] /= s || 1; return w; }
const CANDIDATES = [["mat", 0.58], ["floor", 0.14], ["rug", 0.11], ["couch", 0.08], ["grass", 0.05], ["chair", 0.04]];

// ---------------------------------------------------------------- theme
let light = (() => { try { return localStorage.getItem("theme") === "light"; } catch { return false; } })();
const hc = (i) => (light ? HEADS[i].light : HEADS[i].dark);
const THEME = {
  dark: { ambient: 0.7, beamBlend: THREE.AdditiveBlending, glowBlend: THREE.AdditiveBlending, beamOp: (w) => 0.2 + w * 0.65,
    idle: { base: 0x1b2340, emi: 0x6366f1, emiBase: 0.4, glow: 0x818cf8, glowOp: 0.28, glowScale: 2.2 },
    query: { base: 0x0b2f3a, emi: 0x22d3ee, emiI: 1.7, glow: 0x67e8f9, glowOp: 0.82, glowScale: 3.0 },
    att: { emiK: 1.5, glowOpK: 0.7, glowScaleK: 1.8 },
    future: { base: 0x1b2340, emi: 0x1b2340, emiI: 0.12, glow: 0x334155, glowOp: 0.12, glowScale: 1.4 } },
  light: { ambient: 1.25, beamBlend: THREE.NormalBlending, glowBlend: THREE.NormalBlending, beamOp: (w) => 0.4 + w * 0.5,
    idle: { base: 0x6366f1, emi: 0x6366f1, emiBase: 0.3, glow: 0x818cf8, glowOp: 0.12, glowScale: 1.6 },
    query: { base: 0x0891b2, emi: 0x22d3ee, emiI: 0.85, glow: 0x22d3ee, glowOp: 0.18, glowScale: 1.8 },
    att: { emiK: 0.85, glowOpK: 0.14, glowScaleK: 0.9 },
    future: { base: 0xcbd5e1, emi: 0xcbd5e1, emiI: 0.12, glow: 0xcbd5e1, glowOp: 0.1, glowScale: 1.4 } },
};
const T = () => (light ? THEME.light : THEME.dark);

// ---------------------------------------------------------------- chapters
const CH = [
  { id: "prompt", cam: [0, 3, 14], look: [0, 0.3, 0], layout: "row",
    title: { tr: "Bir cümle <em>giriyor</em>", en: "A sentence <em>goes in</em>" },
    desc: { tr: '“The cat sat on the mat” — modele verdiğimiz metin bu. Peki model bunu nasıl işliyor? Aşağı kaydırarak bir kelimenin yolculuğunu izle.', en: '“The cat sat on the mat” — the text we hand the model. How does it process it? Scroll down to follow a word’s journey.' } },
  { id: "token", cam: [0, 3, 14.5], look: [0, 0.3, 0], layout: "row", ids: true,
    title: { tr: "1 · <em>Tokenizasyon</em>", en: "1 · <em>Tokenization</em>" },
    desc: { tr: 'Model kelimeleri değil <b>token</b>ları görür — metin küçük parçalara bölünür ve her parça bir sayıya (ID) döner. Sık kelimeler tek token, nadir kelimeler birkaç parça olur.', en: 'The model sees <b>tokens</b>, not words — text is split into pieces and each becomes a number (ID). Common words are one token; rare words split into several.' } },
  { id: "embed", cam: [0, 1.0, 18], look: [0, 0, 0], layout: "embed",
    title: { tr: "2 · <em>Embedding</em>", en: "2 · <em>Embedding</em>" },
    desc: { tr: 'Her token bir <b>vektöre</b> (sayı dizisi) çevrilir. Anlamca yakın kelimeler bu uzayda yakın durur — isimler (“cat”, “mat”) bir arada, artikeller (“The”, “the”) bir arada. <b>Sürükle</b> ve uzayı çevir.', en: 'Each token becomes a <b>vector</b> (a list of numbers). Similar meanings sit close — nouns (“cat”, “mat”) cluster, articles (“The”, “the”) cluster. <b>Drag</b> to turn the space.' } },
  { id: "attn", cam: [0, 3.2, 14], look: [0, 0.4, 0], layout: "arc", attn: true,
    title: { tr: "3 · <em>Attention</em>", en: "3 · <em>Attention</em>" },
    desc: { tr: 'Model her kelimeyi anlamlandırmak için diğer kelimelere <b>bakar</b>. Kalın/parlak ışın = daha çok dikkat. Her <b>head</b> farklı ilişki. Bir kelime yalnız <b>kendinden öncekilere</b> bakar.', en: 'To make sense of each word, the model <b>looks at</b> others. Thicker beam = more attention. Each <b>head</b> a different relation. A word only looks at <b>earlier</b> words.' },
    hint: { tr: "💡 Bir kelimeye tıkla — neye baktığını gör", en: "💡 Click a word to see what it attends to" } },
  { id: "layers", cam: [0, 4.5, 18], look: [0, 3.4, 0], layout: "arc", group: "layer",
    title: { tr: "4 · <em>Katmanlar</em>", en: "4 · <em>Layers</em>" },
    desc: { tr: 'Bu “bakışma” tek seferde olmaz. Temsil, üst üste onlarca <b>transformer katmanı</b> boyunca yukarı akar; her katman anlamı biraz daha zenginleştirir.', en: 'This “looking” doesn’t happen once. The representation flows up through dozens of stacked <b>transformer layers</b>; each refines the meaning a little more.' } },
  { id: "predict", cam: [0, 2.6, 13.5], look: [0, 2.1, 0], layout: "hidden", hideTokens: true, group: "predict",
    title: { tr: "5 · <em>Tahmin</em>", en: "5 · <em>Prediction</em>" },
    desc: { tr: 'En üstteki temsil, sözlükteki <b>her kelime için bir olasılığa</b> döner. Model en olası kelimeyi seçer — birazcık rastgelelikle (temperature).', en: 'The top representation turns into a <b>probability for every word</b> in the vocabulary. The model picks the most likely one — with a little randomness (temperature).' } },
  { id: "loop", cam: [0, 4, 15.5], look: [0, 1.2, 0], layout: "row", group: "loop",
    title: { tr: "6 · <em>Döngü</em>", en: "6 · <em>The loop</em>" },
    desc: { tr: 'Seçilen kelime cümleye eklenir ve <b>tüm süreç baştan</b> işler. Kelime kelime — bir LLM böyle “yazar”.', en: 'The chosen word is appended and the <b>whole process repeats</b>. Word by word — that’s how an LLM “writes”.' } },
  { id: "scale", cam: [0, 2, 23], look: [0, 0, 0], layout: "cluster", hideTokens: true, group: "scale", cta: true,
    title: { tr: "Peki ya <em>ölçek?</em>", en: "And the <em>scale?</em>" },
    desc: { tr: 'Bütün bunlar <b>milyarlarca parametre × onlarca katman</b> boyunca, her token için tekrar tekrar olur. GPU belleğini yiyen tam da bu — ve <b>LLMScale</b> bunu hesaplar.', en: 'All of this runs across <b>billions of parameters × dozens of layers</b>, again for every token. That’s what eats GPU memory — and <b>LLMScale</b> sizes exactly that.' } },
];
const HINTSCROLL = { tr: "↓ kaydır", en: "↓ scroll" };
const CTA = { vram: { tr: "VRAM Hesabı", en: "VRAM Sizing" }, anatomy: { tr: "Model Anatomisi", en: "Model Anatomy" } };
let lang = "tr", active = 0, query = N - 1;

// layouts
const P = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const ROW = Array.from({ length: N }, (_, i) => P([(i - (N - 1) / 2) * 2.5, 0, 0]));
const ARC = Array.from({ length: N }, (_, i) => P([(i - (N - 1) / 2) * 2.6, 0, -1.4 * Math.cos((i / (N - 1)) * Math.PI)]));
const EMBED = [P([-4.0, 1.0, -1.0]), P([3.1, 0.4, 0.8]), P([-0.4, -1.7, -2.2]), P([1.0, -1.3, 2.4]), P([-3.1, 1.7, -0.2]), P([3.8, 1.1, 1.5])];
const HIDDEN = Array.from({ length: N }, (_, i) => P([(i - (N - 1) / 2) * 0.5, -20, 0]));
const CLUSTER = Array.from({ length: N }, (_, i) => { const a = (i / N) * Math.PI * 2; return P([Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0]); });
const LAYOUTS = { row: ROW, arc: ARC, embed: EMBED, hidden: HIDDEN, cluster: CLUSTER };

// ---------------------------------------------------------------- three
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 14);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
controls.minDistance = 8; controls.maxDistance = 30; controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.9;
controls.target.set(0, 0.3, 0);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ambient = new THREE.AmbientLight(0xffffff, THEME.dark.ambient); scene.add(ambient);
const keyLight = new THREE.PointLight(0xffffff, 60, 100); keyLight.position.set(6, 10, 10); scene.add(keyLight);

function glowTexture() {
  const s = 128, cv = document.createElement("canvas"); cv.width = cv.height = s;
  const ctx = cv.getContext("2d"); const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s); return new THREE.CanvasTexture(cv);
}
const GLOW = glowTexture();
const labelWrap = document.getElementById("labels");
const nodes = ROW.map((p, i) => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x1b2340, emissive: 0x6366f1, emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.1 }));
  mesh.position.copy(p); mesh.userData.i = i; scene.add(mesh);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x6366f1, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(2.2); mesh.add(glow);
  const el = document.createElement("div"); el.className = "lbl"; el.innerHTML = `${TOKENS[i]}<span class="sub">#${IDS[i]}</span>`;
  labelWrap.appendChild(el);
  return { mesh, glow, el, sub: el.querySelector(".sub"), target: p.clone() };
});

// ---------------------------------------------------------------- beams
const beamGroup = new THREE.Group(); scene.add(beamGroup); let pulses = [];
function clearBeams() { beamGroup.children.forEach((c) => { c.geometry?.dispose(); c.material?.dispose(); }); beamGroup.clear(); pulses.forEach((p) => p.mesh.material.dispose()); pulses = []; }
function paintIdle() {
  const th = T();
  nodes.forEach((nd) => { const m = nd.mesh.material, gm = nd.glow.material; gm.blending = th.glowBlend; gm.needsUpdate = true;
    m.color.setHex(th.idle.base); m.emissive.setHex(th.idle.emi); m.emissiveIntensity = th.idle.emiBase; nd.mesh.scale.setScalar(1);
    gm.color.setHex(th.idle.glow); gm.opacity = th.idle.glowOp; nd.glow.scale.setScalar(th.idle.glowScale);
    nd.el.classList.remove("q"); nd.el.style.opacity = "1"; });
}
function buildBeams() {
  clearBeams(); const th = T();
  const activeHeads = HEADS.map((h, i) => ({ ...h, i })).filter((h) => h.on); const incoming = new Array(N).fill(0);
  activeHeads.forEach((h) => { const w = weights(h.i, query);
    for (let k = 0; k <= query; k++) { if (k === query) continue; incoming[k] += w[k]; if (w[k] < 0.04) continue;
      const from = nodes[query].mesh.position, to = nodes[k].mesh.position;
      const mid = from.clone().add(to).multiplyScalar(0.5); mid.y += 2.4 + w[k] * 2.2;
      const curve = new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
      beamGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 0.02 + w[k] * 0.3, 10, false),
        new THREE.MeshBasicMaterial({ color: hc(h.i), transparent: true, opacity: th.beamOp(w[k]), blending: th.beamBlend, depthWrite: false })));
      const pm = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: hc(h.i), transparent: true, blending: th.beamBlend, depthWrite: false }));
      pm.scale.setScalar(0.55 + w[k] * 0.5); beamGroup.add(pm); pulses.push({ mesh: pm, curve, speed: 0.35 + w[k] * 0.25, phase: Math.random() }); } });
  const maxIn = Math.max(0.0001, ...incoming);
  nodes.forEach((nd, i) => { const m = nd.mesh.material, gm = nd.glow.material; gm.blending = th.glowBlend; gm.needsUpdate = true;
    if (i === query) { m.color.setHex(th.query.base); m.emissive.setHex(th.query.emi); m.emissiveIntensity = th.query.emiI; nd.mesh.scale.setScalar(1.24); gm.color.setHex(th.query.glow); gm.opacity = th.query.glowOp; nd.glow.scale.setScalar(th.query.glowScale); }
    else if (i < query) { const t = incoming[i] / maxIn; m.color.setHex(th.idle.base); m.emissive.setHex(th.idle.emi); m.emissiveIntensity = th.idle.emiBase + t * th.att.emiK; nd.mesh.scale.setScalar(1); gm.color.setHex(th.idle.glow); gm.opacity = th.idle.glowOp + t * th.att.glowOpK; nd.glow.scale.setScalar(th.idle.glowScale + t * th.att.glowScaleK); }
    else { m.color.setHex(th.future.base); m.emissive.setHex(th.future.emi); m.emissiveIntensity = th.future.emiI; nd.mesh.scale.setScalar(1); gm.color.setHex(th.future.glow); gm.opacity = th.future.glowOp; nd.glow.scale.setScalar(th.future.glowScale); }
    nd.el.classList.toggle("q", i === query); nd.el.style.opacity = i > query ? "0.4" : "1"; });
}

// ---------------------------------------------------------------- scene groups (layers / predict / loop / scale)
// layer stack
const layerGroup = new THREE.Group(); layerGroup.visible = false; scene.add(layerGroup);
for (let i = 0; i < 7; i++) {
  const slab = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.1, 4.4),
    new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.13, blending: THREE.NormalBlending, depthWrite: false }));
  slab.position.y = 1.4 + i * 0.92; layerGroup.add(slab);
}
const layerPulse = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 4.4),
  new THREE.MeshBasicMaterial({ map: GLOW, color: 0x22d3ee, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
layerPulse.rotation.x = -Math.PI / 2; layerGroup.add(layerPulse);

// prediction bars
const predictGroup = new THREE.Group(); predictGroup.visible = false; scene.add(predictGroup);
const bars = CANDIDATES.map(([w, p], i) => {
  const h = 0.5 + p * 7; const top = i === 0;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.95, h, 0.95),
    new THREE.MeshStandardMaterial({ color: top ? 0x0b2f3a : 0x1b2340, emissive: top ? 0x22d3ee : 0x6366f1, emissiveIntensity: top ? 1.2 : 0.5, roughness: 0.4 }));
  bar.position.set((i - (CANDIDATES.length - 1) / 2) * 1.5, h / 2, 0); predictGroup.add(bar);
  const el = document.createElement("div"); el.className = "plabel" + (top ? " top" : ""); el.innerHTML = `${w}<span>${Math.round(p * 100)}%</span>`;
  labelWrap.appendChild(el);
  return { bar, el, x: bar.position.x, h, top };
});

// loop arrow
const loopGroup = new THREE.Group(); loopGroup.visible = false; scene.add(loopGroup);
const loopCurve = new THREE.QuadraticBezierCurve3(ROW[N - 1].clone().setY(0.4), new THREE.Vector3(0, 5.4, 0), ROW[0].clone().setY(0.4));
loopGroup.add(new THREE.Mesh(new THREE.TubeGeometry(loopCurve, 60, 0.08, 8, false), new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.55 })));
const loopTip = loopCurve.getPoint(1), loopDir = loopCurve.getTangent(0.99);
const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.7, 14), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
cone.position.copy(loopTip); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), loopDir.clone().normalize()); loopGroup.add(cone);
const loopPulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x6ee7b7, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
loopPulse.scale.setScalar(0.8); loopGroup.add(loopPulse);

// ambient particle field — a subtle drifting backdrop behind every chapter,
// and the "billions of parameters" hero in the final chapter.
const scaleGroup = new THREE.Group(); scene.add(scaleGroup);
let bgMat;
{ const cnt = 1800, pos = new Float32Array(cnt * 3);
  for (let i = 0; i < cnt; i++) { const r = 8 + Math.random() * 16, a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(b) * Math.cos(a); pos[i * 3 + 1] = r * Math.sin(b) * Math.sin(a) * 0.7; pos[i * 3 + 2] = r * Math.cos(b); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  bgMat = new THREE.PointsMaterial({ color: 0x8b5cf6, size: 0.06, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  scaleGroup.add(new THREE.Points(geo, bgMat)); }
function updateBg() { if (light) { bgMat.blending = THREE.NormalBlending; bgMat.color.setHex(0xa78bfa); bgMat.opacity = 0.32; } else { bgMat.blending = THREE.AdditiveBlending; bgMat.color.setHex(0x8b5cf6); bgMat.opacity = 0.4; } bgMat.needsUpdate = true; }

// ---------------------------------------------------------------- chapter engine
const camGoal = { pos: P(CH[0].cam), look: P(CH[0].look) }; let camLerp = true; let tokensHidden = false; let pendingBeams = false;
function setChapter(i) {
  active = i; const c = CH[i]; const L = LAYOUTS[c.layout];
  nodes.forEach((nd, k) => { nd.target.copy(L[k]); nd.sub.style.display = c.ids ? "block" : "none"; });
  camGoal.pos.copy(P(c.cam)); camGoal.look.copy(P(c.look)); camLerp = true; tokensHidden = !!c.hideTokens;
  layerGroup.visible = c.group === "layer"; predictGroup.visible = c.group === "predict";
  loopGroup.visible = c.group === "loop";
  bars.forEach((b) => (b.el.style.display = c.group === "predict" ? "block" : "none"));
  // build the attention beams only once the tokens have settled into the arc —
  // building mid-morph would pin them to stale positions.
  clearBeams(); paintIdle(); pendingBeams = !!c.attn;
}

// ---------------------------------------------------------------- narrative
const scrollWrap = document.getElementById("scroll");
function buildSections() {
  scrollWrap.innerHTML = "";
  CH.forEach((c, i) => {
    const sec = document.createElement("section"); sec.dataset.i = i;
    const card = document.createElement("div"); card.className = "card";
    const eb = c.id === "prompt" ? "LLM 101" : c.id === "scale" ? "LLM 101" : "adım " + i + " / 6";
    let html = `<div class="eyebrow">${eb}</div><h2>${c.title[lang]}</h2><p>${c.desc[lang]}</p>`;
    if (c.attn) html += `<div class="heads"></div><div class="hint">${c.hint[lang]}</div>`;
    if (c.cta) html += `<div class="cta"><a href="${BASE}index.html">${CTA.vram[lang]} →</a><a href="${BASE}anatomy.html">${CTA.anatomy[lang]} →</a></div>`;
    card.innerHTML = html; sec.appendChild(card); scrollWrap.appendChild(sec);
    if (c.attn) renderHeads(card.querySelector(".heads"));
  });
  setActiveByScroll();
}
function renderHeads(wrap) {
  wrap.innerHTML = "";
  HEADS.forEach((h, i) => { const el = document.createElement("div"); el.className = "head" + (h.on ? "" : " off");
    const hex = "#" + hc(i).toString(16).padStart(6, "0");
    el.innerHTML = `<span class="dot" style="background:${hex};color:${hex}"></span>Head ${i + 1} <small>· ${h.name[lang]}</small>`;
    el.onclick = () => { h.on = !h.on; el.classList.toggle("off", !h.on); if (CH[active].attn) buildBeams(); }; wrap.appendChild(el); });
}
function setActiveByScroll() {
  const i = Math.max(0, Math.min(CH.length - 1, Math.round(scrollY / innerHeight)));
  [...scrollWrap.children].forEach((s, k) => s.classList.toggle("active", k === i));
  if (i !== active) setChapter(i);
}
addEventListener("scroll", setActiveByScroll, { passive: true });

// ---------------------------------------------------------------- interaction
const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2(); let downXY = null;
canvas.addEventListener("pointerdown", (e) => { downXY = [e.clientX, e.clientY]; });
canvas.addEventListener("pointerup", (e) => {
  if (!downXY) return; const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]); downXY = null;
  if (moved > 6 || !CH[active].attn) return;
  ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(nodes.map((n) => n.mesh))[0]; if (hit) { query = hit.object.userData.i; pendingBeams = false; buildBeams(); }
});

// ---------------------------------------------------------------- chrome
document.getElementById("lang").onclick = () => { lang = lang === "tr" ? "en" : "tr";
  document.getElementById("lang").textContent = lang === "tr" ? "EN" : "TR";
  document.getElementById("scrollhint").textContent = HINTSCROLL[lang]; document.documentElement.lang = lang;
  const y = scrollY; buildSections(); scrollTo(0, y); };
document.getElementById("theme").onclick = () => { light = document.body.classList.toggle("light");
  document.getElementById("theme").textContent = light ? "🌙" : "☀️"; ambient.intensity = T().ambient; updateBg();
  try { localStorage.setItem("theme", light ? "light" : "dark"); } catch {}
  if (CH[active].attn) buildBeams(); else paintIdle(); };

// ---------------------------------------------------------------- loop
const v = new THREE.Vector3();
function projectLabels() {
  nodes.forEach((nd) => { if (tokensHidden) { nd.el.style.display = "none"; return; }
    v.copy(nd.mesh.position).project(camera);
    nd.el.style.left = (v.x * 0.5 + 0.5) * innerWidth + "px";
    nd.el.style.top = (-v.y * 0.5 + 0.5) * innerHeight - (nd.el.classList.contains("q") ? 52 : 34) + "px";
    nd.el.style.display = v.z > 1 ? "none" : "block"; });
  if (CH[active].group === "predict") bars.forEach((b) => {
    v.set(b.x, 0, 0).project(camera);
    b.el.style.left = (v.x * 0.5 + 0.5) * innerWidth + "px"; b.el.style.top = (-v.y * 0.5 + 0.5) * innerHeight + 8 + "px";
    b.el.style.display = v.z > 1 ? "none" : "block"; });
}
let t0 = performance.now(), clock = 0;
function tick(now) {
  const dt = Math.min(0.05, (now - t0) / 1000); t0 = now; clock += dt;
  nodes.forEach((nd) => nd.mesh.position.lerp(nd.target, 0.08));
  if (pendingBeams) { let mx = 0; for (const nd of nodes) mx = Math.max(mx, nd.mesh.position.distanceTo(nd.target)); if (mx < 0.05) { buildBeams(); pendingBeams = false; } }
  if (downXY !== null) { camLerp = false; controls.update(); }
  else if (camLerp) { camera.position.lerp(camGoal.pos, 0.06); controls.target.lerp(camGoal.look, 0.09); camera.lookAt(controls.target); if (camera.position.distanceTo(camGoal.pos) < 0.12) camLerp = false; }
  else controls.update();
  if (!reduce) {
    pulses.forEach((p) => { p.phase = (p.phase + dt * p.speed) % 1; p.mesh.position.copy(p.curve.getPoint(p.phase)); p.mesh.material.opacity = (light ? 0.5 : 0.35) + 0.5 * Math.sin(p.phase * Math.PI); });
    if (layerGroup.visible) { const t = (clock * 0.35) % 1; layerPulse.position.y = 1.2 + t * 5.8; layerPulse.material.opacity = 0.55 * (1 - Math.abs(t - 0.5) * 1.4); }
    if (predictGroup.visible) bars[0].bar.material.emissiveIntensity = 1.0 + 0.6 * Math.sin(clock * 3);
    if (loopGroup.visible) { const t = (clock * 0.35) % 1; loopPulse.position.copy(loopCurve.getPoint(t)); loopPulse.material.opacity = 0.4 + 0.5 * Math.sin(t * Math.PI); }
    scaleGroup.rotation.y += dt * 0.03; // ambient background, always drifting
  }
  projectLabels(); renderer.render(scene, camera); requestAnimationFrame(tick);
}
function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
addEventListener("resize", resize);

resize(); document.getElementById("scrollhint").textContent = HINTSCROLL[lang];
if (light) { document.body.classList.add("light"); document.getElementById("theme").textContent = "🌙"; ambient.intensity = T().ambient; }
updateBg();
setChapter(0); buildSections(); requestAnimationFrame(tick);
