// Versaty — three views (home story, collection pillars, full service), FR/EN, product pages, inquiry.
import { PERFUMES, HERO_ORDER, ING, T } from './data.js';
import { C, BRANDS } from './copy.js';
import { DOMINANT } from './profiles.js';
import { PLATES } from './plates.js';
import { JOURNEY } from './journey.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const byId = Object.fromEntries(PERFUMES.map((p) => [p.id, p]));
const BASE = window.VERSATY_BASE || '.';
const PREVIEW = !!window.VERSATY_PREVIEW;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

const TONE = {
  madeleine: { ink: '#2b1d1d', dark: false, accent: '#b5707a', tint: '#efe1dc', fog: '#ecdcd6' },
  lucky: { ink: '#24211a', dark: false, accent: '#b39a3e', tint: '#f4ecd7', fog: '#f2e9d2' },
  hush: { ink: '#132019', dark: false, accent: '#46664f', tint: '#dfe6df', fog: '#a7b6ab' },
  act2: { ink: '#f6ead8', dark: true, accent: '#b9783a', tint: '#ece0d1', fog: '#6b4529' },
  rouge: { ink: '#f8e9e4', dark: true, accent: '#8f1d24', tint: '#ecd9d7', fog: '#4b1015' },
  mallick: { ink: '#eceef3', dark: true, accent: '#5b5670', tint: '#dedde3', fog: '#2b2a32' },
};

// ---------------------------------------------------------------- language
let lang = 'fr', saved = null;
try { saved = localStorage.getItem('versaty-lang'); } catch (e) { /* storage unavailable */ }
lang = saved || ((navigator.language || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr');
if (!T[lang]) lang = 'fr';
const tr = (k) => (C[lang][k] !== undefined ? C[lang][k] : T[lang][k]);
const L = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o[lang] : o);
const pad = (n) => String(n).padStart(2, '0');

const state = { view: 'home', mobile: innerWidth < 760, ptr: { x: 0, y: 0, tx: 0, ty: 0 }, yawT: 0.5, yaw: 0.5, touchYaw: 0 };

// ================================================================ HOME — a 9-second film that plays by itself
// story beats over the film (share of its length): the wordmark transforms fast, two lines, then the two doors
const SCENES = [['s-mark', 0, 0.2], ['s-quote', 0.2, 0.5], ['s-art', 0.5, 0.8], ['s-choice', 0.88, 1.01]];
let sceneEls = [], quoteWords = [];
const vset = () => (state.mobile ? 'm' : 'd');
const VEXT = document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4' : '.webm';
function mkVideo(src) {
  const v = document.createElement('video'); src = src.replace(/\.mp4$/, VEXT);
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto'; v.src = src;
  return v;
}
// the film draws into the canvas (cover-fitted like the rest of the site), so the door glide can steer its framing
const op = { v: null, g: null, set: '', done: false, poster: null, drawn: -1, force: true, started: false };
function coverRect(cv, w, h) { const s = Math.max(cv.width / w, cv.height / h), W = w * s, H = h * s; return [(cv.width - W) / 2, (cv.height - H) / 2 + (cv.height - H) * 0.08, W, H]; }
function loadFilm() {
  const set = vset(); if (op.set === set) return; op.set = set;
  op.v?.pause(); op.v = mkVideo(`${BASE}/assets/video/intro-${set}.mp4`); op.g = null; op.started = false; op.force = true;
  op.v.addEventListener('ended', finishOpening);
  op.poster = new Image(); op.poster.onload = () => { op.force = true; };
  op.poster.src = `${BASE}/assets/video/intro-${op.done ? 'last' : 'first'}-${set}.webp`;
  if (op.done) op.v.addEventListener('loadeddata', () => { op.v.currentTime = Math.max(0, op.v.duration - 0.02); }, { once: true });
  else startOpening();
}
function startOpening() {
  if (op.started || op.done) return; op.started = true;
  const v = op.v; let go = false;
  const begin = () => { if (go) return; go = true; if (reduced) { finishOpening(); return; } v.play().catch(() => finishOpening()); };
  v.addEventListener('canplaythrough', begin, { once: true });
  setTimeout(begin, 2600);                      // never wait long: start with whatever has loaded
}
function skipOpening() {                        // skip / scroll during the film: it fast-forwards to the doors
  if (op.done || !op.v) return;
  if (op.v.paused) { finishOpening(); return; }
  op.v.playbackRate = 3.5;
}
function finishOpening() {
  op.done = true; op.force = true;
  if (op.v && op.v.duration && op.v.currentTime < op.v.duration - 0.05) { op.v.pause(); op.v.currentTime = Math.max(0, op.v.duration - 0.02); }
  document.body.classList.add('opened');
  loadTrans();
}
function loadTrans() { if (!op.g) { op.g = mkVideo(`${BASE}/assets/video/glide-${vset()}.mp4`); op.g.load(); } }
function sizeCanvas() {
  ['#iCanvas', '#jCanvas'].forEach((q) => { const cv = $(q); if (cv) { cv.width = innerWidth; cv.height = innerHeight; } });
  op.force = true; jv.drawn = -1;
}
function drawFilm() {
  if (!op.v || op.gliding) return;
  const v = op.v, cv = $('#iCanvas');
  if (v.readyState >= 2) {
    if (!op.force && v.currentTime === op.drawn) return;
    cv.getContext('2d').drawImage(v, ...coverRect(cv, v.videoWidth, v.videoHeight)); op.drawn = v.currentTime; op.force = false;
  } else if (op.force && op.poster?.complete && op.poster.naturalWidth) {
    cv.getContext('2d').drawImage(op.poster, ...coverRect(cv, op.poster.naturalWidth, op.poster.naturalHeight)); op.force = false;
  }
}
function playTrans(done) {
  loadTrans();
  const G = op.g, cv = $('#iCanvas'), cx = cv.getContext('2d'), W0 = performance.now();
  // the hover zoom is kept and released over the whole glide, so the camera never snaps back before moving in
  cv.style.transition = 'transform 2600ms cubic-bezier(0.45, 0, 0.25, 1)';
  const start = () => {
    document.body.classList.remove('hover-collection'); document.body.classList.add('gliding'); cv.style.transform = 'scale(1)';
    op.gliding = true;
    const fw = G.videoWidth || 1280, R0 = coverRect(cv, fw, fw);
    // the glide's framing drifts onto the collection's framing, so its last frame lands exactly on Madeleine's plate
    const pr = state.mobile ? null : plateRect('madeleine');
    const R1 = pr ? [pr[0], pr[1] - 0.191 * pr[2], 1.004 * pr[2], 1.004 * pr[2]] : R0;
    const draw = () => {
      const u = G.duration ? clamp(G.currentTime / G.duration) : 0, e = u * u * (3 - 2 * u);   // the camera's own ease
      cx.fillStyle = TONE.madeleine.fog; cx.fillRect(0, 0, cv.width, cv.height);
      if (G.readyState >= 2) cx.drawImage(G, ...R0.map((v, q) => v + (R1[q] - v) * e));
    };
    let fin = false;
    const finish = () => {
      if (fin) return; fin = true; draw();
      const copy = document.createElement('canvas'); copy.width = cv.width; copy.height = cv.height; copy.getContext('2d').drawImage(cv, 0, 0);
      cv.style.transition = ''; cv.style.transform = ''; document.body.classList.remove('gliding'); op.gliding = false; op.force = true;
      G.pause(); G.currentTime = 0; done(copy);
    };
    const step = () => { if (fin) return; draw(); if (G.ended || (G.duration && G.currentTime >= G.duration - 0.01)) finish(); else requestAnimationFrame(step); };
    G.addEventListener('ended', finish, { once: true });
    G.currentTime = 0; G.play().then(() => requestAnimationFrame(step), () => finish());
  };
  if (reduced) { done(null); return; }
  // wait (briefly) until the whole glide can play through without stalling
  const wait = () => { if (G.readyState >= 4 || performance.now() - W0 > 3000) start(); else requestAnimationFrame(wait); };
  wait();
}
function buildHome() {
  $('#iQuote').innerHTML = tr('iQuote').split(' ').map((w) => `<span>${w}</span>`).join(' ');
  quoteWords = $$('#iQuote span');
  sceneEls = SCENES.map(([c, a, b]) => ({ el: $('.' + c), a, b }));
  const sk = $('#iSkip'); if (sk) sk.textContent = lang === 'fr' ? 'Passer' : 'Skip';
}
function updateHome() {
  const v = op.v, p = op.done ? 1 : v && v.duration ? clamp(v.currentTime / v.duration) : 0;
  $('#iBar').style.transform = `scaleX(${p.toFixed(4)})`;
  // a light veil keeps the words readable over the film, and lifts for the final frame
  $('.i-veil').style.opacity = (0.3 * (1 - smooth(0.8, 0.9, p))).toFixed(3);
  if (p > 0.6) loadTrans();
  sceneEls.forEach(({ el, a, b }, i) => {
    const t = clamp((p - a) / (b - a));
    let o = smooth(0, 0.16, t) * (1 - smooth(0.84, 1, t));
    if (i === 0) o = 1 - smooth(0.6, 1, t);
    if (i === sceneEls.length - 1) o = smooth(0, 0.3, t);
    el.style.opacity = o.toFixed(3); el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    el.style.setProperty('--t', t.toFixed(4));
  });
  const tq = clamp((p - 0.2) / 0.18);
  quoteWords.forEach((w, i) => { w.style.opacity = (0.14 + 0.86 * smooth(i / quoteWords.length * 0.75, i / quoteWords.length * 0.75 + 0.18, tq)).toFixed(3); });
}

// ================================================================ COLLECTION — six pillars
const N = HERO_ORDER.length;
let worlds = [], jPanels = [];
function plateFor(id) { const P = PLATES[id]; return state.mobile ? { src: `${BASE}/assets/plates/${id}-m.webp`, w: P.m[0], h: P.m[1], box: P.box_m } : { src: `${BASE}/assets/plates/${id}-d.webp`, w: P.d[0], h: P.d[1], box: P.box_d }; }
function buildJourney() {
  $('#jWorlds').innerHTML = HERO_ORDER.map((id, i) => {
    const pl = plateFor(id), b = pl.box;
    return `<div class="j-world" data-i="${i}" style="z-index:${i + 1};--fog:${TONE[id].fog}">
      <div class="j-plate" style="aspect-ratio:${pl.w}/${pl.h}">
        <img class="j-img" src="${pl.src}" alt="" ${i < 2 ? '' : 'loading="lazy"'} decoding="async">
        <div class="j-bottle" style="left:${(b[0] * 100).toFixed(3)}%;top:${((1 - b[3]) * 100).toFixed(3)}%;width:${((b[2] - b[0]) * 100).toFixed(3)}%;height:${((b[3] - b[1]) * 100).toFixed(3)}%">
          <img class="fa" alt="${byId[id].range} ${byId[id].name}" src="${BASE}/assets/sprites/${id}/06.webp" decoding="async"><img class="fb" alt="" src="${BASE}/assets/sprites/${id}/06.webp" decoding="async">
        </div>
      </div>
      <div class="j-mist"></div>
    </div>`;
  }).join('');
  worlds = $$('.j-world').map((el, i) => ({ el, id: HERO_ORDER[i], plate: $('.j-plate', el), bottle: $('.j-bottle', el), a: $('.fa', el), b: $('.fb', el), mist: $('.j-mist', el), frames: null, fi: -1 }));
  $('#jPanels').innerHTML = HERO_ORDER.map((id, i) => {
    const p = byId[id], tn = TONE[id];
    return `<div class="panel pf${tn.dark ? ' dark' : ''}" data-i="${i}" style="--ink:${tn.ink};--inv:${tn.dark ? '#1c1b19' : '#f2eee7'};--fog:${tn.fog}">
      <p class="label">${pad(i + 1)} — ${p.range}</p>
      <h2 class="pf-name">${p.name}</h2>
      <p class="pf-fam">${L(p.fam)}${p.for ? ' · ' + L(p.for) : ''}</p>
      <p class="pf-line">${L(p.line)}</p>
      <div class="pf-actions"><button class="btn" type="button" data-open="${id}">${tr('discoverPf')}</button><a class="text-link" href="#/full-service/inquiry" data-inspire="${id}">${tr('inSpirit')}</a></div>
    </div>`;
  }).join('');
  jPanels = $$('#jPanels .panel');
  $('#gIndex').innerHTML = `<ol>${HERO_ORDER.map((id, i) => `<li><button type="button" data-jump="${i}" aria-label="${byId[id].name}"><i></i><span>${byId[id].name}</span></button></li>`).join('')}</ol>`;
  $('#jHint').textContent = finePointer ? tr('jHint') : tr('jHintTouch');
  layoutPlates();
}
function layoutPlates() {
  const vw = innerWidth, vh = innerHeight;
  worlds.forEach((w) => {
    const [left, top, W, H] = plateRect(w.id); void vw; void vh;
    w.plate.style.width = W + 'px'; w.plate.style.height = H + 'px'; w.plate.style.left = left + 'px'; w.plate.style.top = top + 'px';
  });
}
function loadFrames(w) {
  if (!w || w.frames) return;
  w.frames = Array.from({ length: 13 }, (_, k) => { const im = new Image(); im.decoding = 'async'; im.src = `${BASE}/assets/sprites/${w.id}/${pad(k)}.webp`; return im.src; });
}
let lastFocus = -1, jP = 0;
// desktop: the collection is one camera travelling right down the line of columns (rendered film);
// at each column it rests on that perfume's plate, where the bottle is the live, mouse-turned sprite.
const DW = 0.16;                                    // share of the scroll spent resting at each column (each side)
const jv = { vids: [], drawn: -1, rest: -1 };
const filmMode = () => !state.mobile && JOURNEY.length === N - 1;
function jvid(i) { if (!jv.vids[i]) { jv.vids[i] = mkVideo(`${BASE}/assets/video/j${i}.mp4`); jv.vids[i].load(); } return jv.vids[i]; }
function plateRect(id) {
  const vw = innerWidth, vh = innerHeight, pl = plateFor(id), s = Math.max(vw / pl.w, vh / pl.h), W = pl.w * s, H = pl.h * s;
  const bx = (pl.box[0] + pl.box[2]) / 2 * W;
  const left = state.mobile ? (vw - W) / 2 : clamp(vw * 0.64 - bx, vw - W, 0);
  return [left, (vh - H) / 2, W, H];
}
function updateJourney() {
  const j = $('#journey'), r = j.getBoundingClientRect(), vh = innerHeight, vw = innerWidth;
  const raw = clamp(-r.top / (r.height - vh));
  if (filmMode()) return updateJourneyFilm(j, r, raw);
  jP = raw * (N - 0.0001);
  const P = jP;
  $('#jCanvas').style.visibility = 'hidden';
  worlds.forEach((w, i) => {
    const e = i === 0 ? 1 : smooth(i - 0.42, i - 0.02, P);
    const l = i === N - 1 ? 0 : smooth(i + 0.58, i + 0.98, P);
    const vis = e > 0.001 && l < 0.999;
    w.el.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    if (P > i - 1.2 && P < i + 1.2) loadFrames(w);
    // phones: the next world slides in from the right, as if walking down the line
    const x = reduced ? 0 : (1 - e) * vw * 0.35 - l * vw * 0.35;
    w.el.style.opacity = (i === 0 ? 1 : e).toFixed(3);
    w.plate.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    w.mist.style.opacity = (i === 0 ? 0 : Math.min(0.7, (1 - e) * 0.9)).toFixed(3);
  });
  jPanels.forEach((el, i) => {
    const o = (i === 0 ? 1 : smooth(i - 0.12, i + 0.06, P)) * (i === N - 1 ? 1 : 1 - smooth(i + 0.46, i + 0.6, P));
    el.style.opacity = o.toFixed(3); el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    el.style.transform = `translate3d(0,${((1 - o) * 14).toFixed(1)}px,0)`;
  });
  return journeyChrome(r, clamp(Math.round(P - 0.28), 0, N - 1), P < N - 0.6);
}
function updateJourneyFilm(j, r, raw) {
  const Q = raw * (N - 1); jP = Q;
  const i = Math.min(N - 2, Math.floor(Q)), f = Q - i;
  const travelling = f > DW && f < 1 - DW;
  const rest = travelling ? -1 : (f >= 1 - DW ? i + 1 : i);
  [i - 1, i, i + 1, i + 2].forEach((k) => { if (k >= 0 && k < N) loadFrames(worlds[k]); });
  worlds.forEach((w, k) => {
    const on = k === rest;
    w.el.style.visibility = on ? 'visible' : 'hidden'; w.el.style.opacity = 1; w.plate.style.transform = 'none'; w.mist.style.opacity = 0;
  });
  const cv = $('#jCanvas');
  if (travelling) {
    const V = jvid(i), dur = V.duration || JOURNEY[i], want = clamp((f - DW) / (1 - 2 * DW)) * dur;
    const fwd = mover.on && mover.v > 0.15 && mover.target > mover.x;
    if (fwd && V.readyState >= 2) {                 // gliding forward: the video plays in real time, steered gently to the scroll
      V.playbackRate = clamp(mover.v, 0.5, 2);
      if (V.paused) { if (Math.abs(V.currentTime - want) > 0.04) V.currentTime = want; V.play().catch(() => {}); }
      else if (!V.seeking && Math.abs(V.currentTime - want) > 0.18) V.currentTime = want;
    } else {                                        // stopping, pulling back or scrubbing: show the exact frame
      if (!V.paused) V.pause();
      if (!V.seeking && Math.abs(V.currentTime - want) > 1 / 90) V.currentTime = want;
    }
    if (V.readyState >= 2) {
      const ra = plateRect(HERO_ORDER[i]), rb = plateRect(HERO_ORDER[i + 1]), t = clamp(V.currentTime / dur);
      cv.getContext('2d').drawImage(V, ...ra.map((v, q) => v + (rb[q] - v) * t)); jv.drawn = i;
      cv.style.visibility = 'visible';
    }
    jv.rest = -1;
  } else {
    cv.style.visibility = 'hidden'; jv.drawn = -1;
    if (jv.rest !== rest) {                         // resting: park the clips either side, ready to leave in either direction
      jv.rest = rest;
      jv.vids.forEach((V) => V && !V.paused && V.pause());
      if (rest < N - 1) { const V = jvid(rest); if (V.currentTime > 0.01) V.currentTime = 0; }
      if (rest > 0) { const V = jvid(rest - 1), park = () => { V.currentTime = Math.max(0, (V.duration || JOURNEY[rest - 1]) - 0.01); }; V.readyState >= 1 ? park() : V.addEventListener('loadedmetadata', park, { once: true }); }
    }
  }
  // the bottle settles back to its resting angle as the camera prepares to leave, so the hand-off to the film is invisible
  const d = Math.abs(Q - Math.round(Q));
  state.restWeight = 1 - smooth(DW * 0.45, DW * 0.95, d);
  jPanels.forEach((el, k) => {
    const o = 1 - smooth(DW * 0.55, DW, Math.abs(Q - k));
    el.style.opacity = o.toFixed(3); el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    el.style.transform = `translate3d(0,${((1 - o) * 14).toFixed(1)}px,0)`;
  });
  return journeyChrome(r, clamp(Math.round(Q), 0, N - 1), Q < N - 1 - DW * 0.5);
}
function journeyChrome(r, focus, hint) {
  if (focus !== lastFocus) {
    $$('#gIndex button').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.jump === focus)));
    $('#gIndex').style.color = TONE[HERO_ORDER[focus]].ink; $('#jHint').style.color = TONE[HERO_ORDER[focus]].ink;
    lastFocus = focus;
  }
  const inJ = r.bottom > 70 && r.top < 10;
  $('#jHint').style.opacity = inJ && hint ? 0.7 : 0;
  return { inJ, dark: TONE[HERO_ORDER[focus]].dark };
}
function updateBottles() {
  // yaw: pointer on desktop, swipe on touch; the bottle catches the light as it turns
  const rw = filmMode() ? (state.restWeight ?? 1) : 1;
  const target = 0.5 + ((finePointer ? (state.ptr.tx + 1) / 2 : clamp(0.5 + state.touchYaw)) - 0.5) * rw;
  state.yaw += ((reduced ? 0.5 : target) - state.yaw) * 0.09;
  const fpos = clamp(state.yaw) * 12, f0 = Math.floor(fpos), f1 = Math.min(12, f0 + 1), fr = fpos - f0;
  state.ptr.x += (state.ptr.tx - state.ptr.x) * 0.06; state.ptr.y += (state.ptr.ty - state.ptr.y) * 0.06;
  const k = Math.round(jP);
  [k - 1, k, k + 1].forEach((i) => {
    const w = worlds[i]; if (!w || !w.frames) return;
    if (w.fi !== f0) { w.a.src = w.frames[f0]; w.b.src = w.frames[f1]; w.fi = f0; }
    w.b.style.opacity = fr.toFixed(3);
    if (!reduced) w.bottle.style.transform = `translate3d(${(state.ptr.x * 7 * rw).toFixed(2)}px,${((state.ptr.y * 5 - 3) * rw).toFixed(2)}px,0)`;
  });
}
function jumpTo(i) {
  mover.on = false;
  const j = $('#journey'), top = j.getBoundingClientRect().top + scrollY, len = j.offsetHeight - innerHeight;
  const frac = filmMode() ? i / (N - 1) : (i + 0.22) / N;
  scrollTo({ top: top + len * frac, behavior: reduced ? 'auto' : 'smooth' });
}

// ---------------------------------------------------------------- grid + product page
const ORDER = ['madeleine', 'rouge', 'hush', 'mallick', 'modena', 'modena-intense', 'green', 'noir', 'defy', 'rabiha', 'act1', 'act2', 'lucky', 'ambry', 'funny', 'sexy', 'woody', 'sporty'];
let filter = 'all';
const accentOf = (id) => TONE[id]?.accent || DOMINANT[id] || '#8a8173';
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
function buildGrid() {
  const counts = { all: ORDER.length }; ORDER.forEach((id) => { counts[byId[id].range] = (counts[byId[id].range] || 0) + 1; });
  $('#filters').innerHTML = [['all', tr('all')], ['Spada', 'Spada'], ['Woodmania', 'Woodmania'], ['Oh yes', 'Oh yes']]
    .map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${filter === k}">${l}<sup>${counts[k]}</sup></button>`).join('');
  $('#grid').innerHTML = ORDER.map((id, n) => {
    const p = byId[id];
    return `<li class="${filter === 'all' || p.range === filter ? '' : 'off'}"><button class="card" type="button" data-open="${id}" style="--acc:${hexA(accentOf(id), 0.18)}">
      <span class="tile"><span class="plinth"></span><img src="${BASE}/assets/bottles/${id}.webp" alt="" loading="${n < 8 ? 'eager' : 'lazy'}" decoding="async"></span>
      <span class="meta"><span class="label">${p.range}</span><strong>${p.name}</strong><span class="fam">${L(p.fam)}</span></span>
    </button></li>`;
  }).join('');
}
function notesTable(p) { return ['top', 'heart', 'base'].map((tier, k) => `<div data-k="${k}"><h4>${tr(tier + 'Short')}</h4><ul>${p[tier].map((n) => `<li>${ING[n][lang]}</li>`).join('')}</ul></div>`).join(''); }
let detailId = null, lastEl = null;
function openDetail(id) {
  const p = byId[id]; detailId = id;
  const d = $('#detail'), acc = accentOf(id);
  d.style.setProperty('--acc', acc); d.style.setProperty('--tint', TONE[id]?.tint || hexA(acc, 0.16));
  const img = $('#detailImg'); img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
  img.src = `${BASE}/assets/bottles/${id}.webp`; img.alt = `${p.range} ${p.name}`;
  $('#dRange').textContent = p.range; $('#dName').textContent = p.name;
  $('#dFam').textContent = L(p.fam) + (p.for ? ' · ' + L(p.for) : '');
  $('#dLine').textContent = L(p.line); $('#dNotes').innerHTML = notesTable(p);
  $('#dView').hidden = !HERO_ORDER.includes(id);
  const i = ORDER.indexOf(id); $('#dCount').textContent = `${pad(i + 1)} / ${ORDER.length}`;
  if (d.hidden) { lastEl = document.activeElement; d.hidden = false; document.body.classList.add('modal-open'); $('#detailClose').focus(); }
  d.scrollTop = 0;
}
function closeDetail() { $('#detail').hidden = true; document.body.classList.remove('modal-open'); detailId = null; lastEl?.focus?.(); }
function stepDetail(dir) { const i = ORDER.indexOf(detailId); openDetail(ORDER[(i + dir + ORDER.length) % ORDER.length]); }
function inspire(id) {
  const p = byId[id];
  go('service', 'inquiry', () => {
    $('#f-type').selectedIndex = 1;
    const msg = $('#f-msg'); if (!msg.value) msg.value = (lang === 'fr' ? 'Inspiration : ' : 'Inspiration: ') + `${p.range} ${p.name}\n`;
  });
}

// ================================================================ FULL SERVICE — the pathway
function buildService() {
  $('#pathSteps').innerHTML = tr('steps').map(([a, b], i) => `<li style="--i:${i}"><span class="node"><i></i></span><span class="num label">${pad(i + 1)}</span><strong>${a}</strong><span class="txt">${b}</span></li>`).join('');
  $('#uniList').innerHTML = tr('uni').map(([a, b], i) => `<li><span class="label">${pad(i + 1)}</span><strong>${a}</strong><span>${b}</span></li>`).join('');
  $('#logList').innerHTML = tr('log').map(([a, b]) => `<li><strong>${a}</strong><span>${b}</span></li>`).join('');
  $('#trustRow').innerHTML = BRANDS.map((b) => `<li>${b}</li>`).join('');
  const sel = $('#f-type'), cur = sel.selectedIndex;
  sel.innerHTML = tr('fTypes').map((x) => `<option>${x}</option>`).join(''); sel.selectedIndex = Math.max(0, cur);
  requestAnimationFrame(drawPath);
}
let pathLen = 0;
function drawPath() {
  const track = $('#pathTrack'); if (!track || $('#v-service').hidden) return;
  const nodes = $$('#pathSteps .node'); if (!nodes.length) return;
  const tb = track.getBoundingClientRect();
  const pts = nodes.map((n) => { const b = n.getBoundingClientRect(); return [b.left - tb.left + b.width / 2, b.top - tb.top + b.height / 2]; });
  const svg = $('#pathLine'); svg.setAttribute('viewBox', `0 0 ${track.scrollWidth} ${track.scrollHeight}`); svg.style.width = track.scrollWidth + 'px'; svg.style.height = track.scrollHeight + 'px';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2; d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`; }
  $('#pathD').setAttribute('d', d); $('#pathDone').setAttribute('d', d);
  pathLen = $('#pathDone').getTotalLength(); $('#pathDone').style.strokeDasharray = pathLen;
  updateService();
}
function updateService() {
  const sec = $('#path'); if (!sec) return;
  const r = sec.getBoundingClientRect(), vh = innerHeight;
  const p = clamp(-r.top / Math.max(1, r.height - vh));
  const track = $('#pathTrack');
  if (!state.mobile) {
    const over = Math.max(0, track.scrollWidth - innerWidth + 80);
    track.style.transform = `translate3d(${(-over * smooth(0.06, 0.94, p)).toFixed(1)}px,0,0)`;
  } else track.style.transform = '';
  const prog = state.mobile ? clamp((vh * 0.7 - track.getBoundingClientRect().top) / track.offsetHeight) : p;
  if (pathLen) $('#pathDone').style.strokeDashoffset = (pathLen * (1 - prog)).toFixed(1);
  $$('#pathSteps li').forEach((li, i, a) => li.classList.toggle('on', prog >= (i / (a.length - 1)) * 0.98 - 0.02));
}
function sizePath() {
  // the pathway section is tall enough to scroll the whole track sideways
  const sec = $('#path'), track = $('#pathTrack');
  if (state.mobile) { sec.style.height = ''; return; }
  sec.style.height = `${innerHeight + Math.max(0, track.scrollWidth - innerWidth + 80)}px`;
}

// ================================================================ views & transitions
const VIEWS = { home: '#v-home', collection: '#v-collection', service: '#v-service' };
function parseHash() {
  const h = location.hash.replace(/^#\/?/, ''); const [a, b] = h.split('/');
  if (a === 'collection') return { view: 'collection', sub: b };
  if (a === 'full-service') return { view: 'service', sub: b };
  return { view: 'home', sub: null };
}
function scrollToSub(sub) {
  const el = sub && document.getElementById(sub);
  const h = document.documentElement, prev = h.style.scrollBehavior; h.style.scrollBehavior = 'auto';   // jump, never glide through the page
  if (el) el.scrollIntoView({ behavior: 'instant' }); else scrollTo({ top: 0, left: 0, behavior: 'instant' });
  h.style.scrollBehavior = prev;
}
function show(view) {
  Object.entries(VIEWS).forEach(([k, s]) => { $(s).hidden = k !== view; });
  document.body.dataset.view = view; state.view = view;
  if (view === 'collection') layoutPlates();
  if (view === 'service') { sizePath(); requestAnimationFrame(drawPath); }
  lastNavDark = null; tick();
}
let busy = false;
function go(view, sub, after, opts = {}) {
  const hash = view === 'home' ? '#/' : view === 'collection' ? '#/collection' + (sub ? '/' + sub : '') : '#/full-service' + (sub ? '/' + sub : '');
  if (location.hash !== hash) history.pushState(null, '', hash);
  if (view === state.view) { scrollToSub(sub); after?.(); return; }
  if (busy) return; busy = true;
  const veil = $('#routeVeil');
  // from the final frame of the story, the collection door is a camera move into Madeleine, then the collection takes over seamlessly
  if (view === 'collection' && state.view === 'home' && $('#intro').getBoundingClientRect().bottom > innerHeight * 0.5 && opts.film !== false) {
    $$('.i-scene').forEach((el) => { el.style.transition = 'opacity .4s'; el.style.opacity = 0; });
    playTrans((last) => {
      veil.style.transition = 'none'; veil.style.backgroundColor = TONE.madeleine.fog; veil.style.backgroundImage = 'none'; veil.replaceChildren(); if (last) { last.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; veil.append(last); }
      veil.classList.add('on'); void veil.offsetWidth; veil.style.transition = '';
      show(view); scrollToSub(sub); after?.(); $$('.i-scene').forEach((el) => { el.style.transition = ''; });
      requestAnimationFrame(() => requestAnimationFrame(() => { veil.style.transition = 'opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1)'; veil.classList.remove('on'); busy = false; setTimeout(() => { veil.replaceChildren(); veil.style.transition = ''; }, 1700); }));
    });
    return;
  }
  veil.style.backgroundImage = 'none';
  veil.style.backgroundColor = view === 'collection' ? TONE.madeleine.fog : '#ece7de';
  document.body.classList.add('leaving', 'to-' + view);
  const dur = reduced ? 10 : 820;
  veil.classList.add('on');
  setTimeout(() => {
    show(view); scrollToSub(sub); after?.();
    document.body.classList.remove('leaving', 'to-home', 'to-collection', 'to-service');
    requestAnimationFrame(() => { veil.classList.remove('on'); busy = false; });
  }, dur);
}
addEventListener('popstate', () => { const r = parseHash(); if (r.view !== state.view) { show(r.view); scrollToSub(r.sub); } else scrollToSub(r.sub); });

// ---------------------------------------------------------------- nav tone
let lastNavDark = null;
function sectionDark() {
  const y = 40;
  for (const s of $$('[data-tone]')) { if (s.closest('[hidden]')) continue; const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) return s.dataset.tone === 'dark'; }
  return false;
}
function tick() {
  let dark = false;
  if (state.view === 'home') { updateHome(); const r = $('#intro').getBoundingClientRect(); dark = r.bottom > 70 ? false : sectionDark(); }
  else if (state.view === 'collection') { const j = updateJourney(); dark = j.inJ ? j.dark : sectionDark(); }
  else { updateService(); dark = sectionDark(); }
  if (dark !== lastNavDark) { document.body.classList.toggle('nav-dark', dark); lastNavDark = dark; }
}

// ---------------------------------------------------------------- language
function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => { const v = tr(el.dataset.i18n); if (typeof v === 'string') el.innerHTML = v; });
  $$('[data-c]').forEach((el) => { const v = tr(el.dataset.c); if (typeof v === 'string') el.innerHTML = v; });
  $('#langCur').textContent = lang.toUpperCase(); $('#langAlt').textContent = lang === 'fr' ? 'EN' : 'FR';
  $('#langBtn').setAttribute('aria-label', lang === 'fr' ? 'English' : 'Français');
  buildHome(); buildJourney(); buildGrid(); buildService();
  if (detailId) openDetail(detailId);
  lastFocus = -1; tick();
}

// ---------------------------------------------------------------- events
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  const ins = e.target.closest('[data-inspire]'); if (ins) { e.preventDefault(); if (detailId) closeDetail(); inspire(ins.dataset.inspire); return; }
  const op = e.target.closest('[data-open]'); if (op) { openDetail(op.dataset.open); return; }
  const j = e.target.closest('[data-jump]'); if (j) { jumpTo(+j.dataset.jump); return; }
  const fb = e.target.closest('#filters button'); if (fb) { filter = fb.dataset.f; buildGrid(); return; }
  if (a) {
    const href = a.getAttribute('href');
    if (href.startsWith('#/')) { e.preventDefault(); const h = href.replace(/^#\/?/, '').split('/'); const v = h[0] === 'collection' ? 'collection' : h[0] === 'full-service' ? 'service' : 'home'; closeMenu(); if (detailId) closeDetail(); go(v, h[1] || null); return; }
    if (href.startsWith('#') && href.length > 1) { e.preventDefault(); document.getElementById(href.slice(1))?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
  }
});
$('#detailClose').addEventListener('click', closeDetail);
$('#dPrev').addEventListener('click', () => stepDetail(-1));
$('#dNext').addEventListener('click', () => stepDetail(1));
$('#dCta').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const id = detailId; closeDetail(); inspire(id); });
$('#dView').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const k = HERO_ORDER.indexOf(detailId); closeDetail(); go('collection', null, () => setTimeout(() => jumpTo(k), 60)); });
addEventListener('keydown', (e) => { if (!detailId) return; if (e.key === 'Escape') closeDetail(); if (e.key === 'ArrowRight') stepDetail(1); if (e.key === 'ArrowLeft') stepDetail(-1); });
$('#langBtn').addEventListener('click', () => { lang = lang === 'fr' ? 'en' : 'fr'; try { localStorage.setItem('versaty-lang', lang); } catch (e) { /* ignore */ } applyLang(); });
$('#iSkip')?.addEventListener('click', skipOpening);
const mb = $('#menuBtn'), mm = $('#mobileMenu');
function closeMenu() { mm.hidden = true; mb.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); }
mb.addEventListener('click', () => { const o = mm.hidden; mm.hidden = !o; mb.setAttribute('aria-expanded', String(o)); document.body.classList.toggle('menu-open', o); });

const form = $('#contactForm'), st = $('#formStatus');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  if (PREVIEW) { st.textContent = tr('fPreview'); return; }
  try {
    const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
    if (!res.ok) throw new Error(res.status);
    st.textContent = tr('fSent'); form.reset();
  } catch (err) { st.textContent = tr('fError'); }
});

addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; state.ptr.tx = (e.clientX / innerWidth) * 2 - 1; state.ptr.ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
let tx0 = null, ty0 = null, swiping = false;
const stage = $('#jStage');
stage.addEventListener('touchstart', (e) => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; swiping = false; }, { passive: true });
stage.addEventListener('touchmove', (e) => {
  if (tx0 === null) return; const dx = e.touches[0].clientX - tx0, dy = e.touches[0].clientY - ty0;
  if (!swiping && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) swiping = true;
  if (swiping) state.touchYaw = clamp(dx / innerWidth * 1.4, -0.5, 0.5);
}, { passive: true });
stage.addEventListener('touchend', () => { tx0 = null; });
addEventListener('deviceorientation', (e) => { if (finePointer || e.gamma == null || swiping) return; state.touchYaw = clamp(e.gamma / 70, -0.5, 0.5); }, { passive: true });
addEventListener('resize', () => { const m = innerWidth < 760; if (m !== state.mobile) { state.mobile = m; buildJourney(); loadFilm(); } sizeCanvas(); layoutPlates(); sizePath(); drawPath(); tick(); });
addEventListener('scroll', tick, { passive: true });
$$('[data-door]').forEach((d) => {
  d.addEventListener('pointerenter', () => { document.body.classList.add('hover-' + d.dataset.door); if (d.dataset.door === 'collection') loadTrans(); });
  d.addEventListener('pointerleave', () => document.body.classList.remove('hover-' + d.dataset.door));
  d.addEventListener('focus', () => loadTrans());
});

// ---------------------------------------------------------------- one scroll = one complete move
// Inside the story and the pillar line, a single wheel flick / swipe / key press plays the whole next beat
// (one chapter, or the full glide to the next perfume) instead of scrubbing a few frames.
const STORY_STOPS = [0, 1];   // the opening plays as one continuous film
// pacing: the wordmark transforms quickly, the lines linger long enough to read (seconds per stretch of the story)
const PACE_P = [0, 0.12, 0.28, 0.44, 0.64, 0.75, 0.84, 0.91, 1];
const PACE_S = [1.4, 3.2, 3.0, 2.6, 2.6, 2.4, 2.0, 1.6];
const PACE_T = PACE_S.reduce((a, v) => (a.push(a[a.length - 1] + v), a), [0]);
const storyTime = (p) => { let i = 0; while (i < PACE_S.length - 1 && p > PACE_P[i + 1]) i++; return PACE_T[i] + PACE_S[i] * (p - PACE_P[i]) / (PACE_P[i + 1] - PACE_P[i]); };
const storyP = (t) => { let i = 0; while (i < PACE_S.length - 1 && t > PACE_T[i + 1]) i++; return PACE_P[i] + (PACE_P[i + 1] - PACE_P[i]) * clamp((t - PACE_T[i]) / PACE_S[i]); };
// the collection: each glide between columns is timed (seconds) — leave the plate, travel, arrive
const JSEG = [0.4, 2.7, 0.4], JT = JSEG[0] + JSEG[1] + JSEG[2], PHONE_T = 3.6;
function jTime(p) {
  if (!filmMode()) return p * N * PHONE_T;
  const Q = clamp(p) * (N - 1), i = Math.min(N - 2, Math.floor(Q)), f = Q - i;
  const t = f < DW ? JSEG[0] * f / DW : f < 1 - DW ? JSEG[0] + JSEG[1] * (f - DW) / (1 - 2 * DW) : JSEG[0] + JSEG[1] + JSEG[2] * (f - 1 + DW) / DW;
  return i * JT + t;
}
function jPos(t) {
  if (!filmMode()) return clamp(t / (N * PHONE_T));
  t = Math.max(0, t); const i = Math.min(N - 2, Math.floor(t / JT)), u = t - i * JT;
  const f = u < JSEG[0] ? DW * u / JSEG[0] : u < JSEG[0] + JSEG[1] ? DW + (1 - 2 * DW) * (u - JSEG[0]) / JSEG[1] : 1 - DW + DW * clamp((u - JSEG[0] - JSEG[1]) / JSEG[2]);
  return clamp((i + f) / (N - 1));
}
function stepSection() {
  const vh = innerHeight;
  const pick = (el, stops) => { if (!el || el.closest('[hidden]')) return null; const r = el.getBoundingClientRect(); return r.top <= 2 && r.bottom >= vh - 2 ? { el, r, stops } : null; };
  if (state.view === 'collection') return pick($('#journey'), Array.from({ length: N }, (_, i) => (filmMode() ? i / (N - 1) : (i + 0.22) / N)));
  return null;
}
// One gesture plays the move, but the move is never locked: scroll back mid-move and it eases to a stop and drifts back
// a little; scroll forward again and it carries on from there. Position is in "film seconds", driven at a steady
// pace (accelerating and settling smoothly), so reversing or stopping never jumps.
const mover = { on: false, x: 0, v: 0, target: 0, sec: null, last: 0 };
function secInfo() {
  const s = stepSection(); if (!s) return null;
  const home = state.view === 'home', toT = home ? storyTime : jTime, toP = home ? storyP : jPos;
  return { ...s, home, toT, toP, T: s.stops.map(toT), pull: home ? 1.6 : 0.9, acc: home ? 2.2 : 2.0, len: s.r.height - innerHeight };
}
function gesture(dir) {
  const s = secInfo(); if (!s) return false;
  const x = mover.on ? mover.x : s.toT(clamp(-s.r.top / s.len)), eps = 0.03;
  let tgt;
  if (dir > 0) {
    if (mover.on && mover.target > x + eps) return true;                      // already on its way forward
    tgt = s.T.find((v) => v > x + eps); if (tgt === undefined) return false;  // past the end: normal scrolling takes over
  } else {
    const prev = [...s.T].reverse().find((v) => v < x - eps); if (prev === undefined) return false;
    const atStop = !mover.on && s.T.some((v) => Math.abs(v - x) < eps);
    if (atStop && !s.home) tgt = prev;                                        // resting on a perfume: back to the previous one
    else tgt = Math.max(prev, (mover.on && mover.target < x ? mover.target : x) - s.pull);   // mid-move: stop, pull back a little
  }
  mover.sec = s; mover.target = tgt;
  if (!mover.on) { mover.x = x; mover.v = 0; mover.on = true; mover.last = performance.now(); document.documentElement.style.scrollBehavior = 'auto'; requestAnimationFrame(moveTick); }
  return true;
}
function brake() {   // a touch on the screen while it moves: settle to a stop where it is
  if (!mover.on) return; const a = mover.sec.acc * 1.6;
  mover.target = mover.x + Math.sign(mover.v) * (mover.v * mover.v) / (2 * a);
}
function moveTick(now) {
  if (!mover.on) return;
  const s = mover.sec, dt = Math.min(0.05, (now - mover.last) / 1000); mover.last = now;
  const a = reduced ? 1e4 : s.acc, d = mover.target - mover.x;
  const want = Math.sign(d) * Math.min(1, Math.sqrt(2 * a * Math.abs(d)));
  const lim = a * 1.6 * dt; mover.v += Math.max(-lim, Math.min(lim, want - mover.v));
  const nx = mover.x + mover.v * dt;
  let done = false;
  if ((d >= 0 && nx >= mover.target) || (d <= 0 && nx <= mover.target)) { mover.x = mover.target; mover.v = 0; done = true; } else mover.x = nx;
  const r = s.el.getBoundingClientRect();
  if (s.el.closest('[hidden]')) { mover.on = false; return; }
  scrollTo(0, r.top + scrollY + (r.height - innerHeight) * s.toP(mover.x));
  if (done) { mover.on = false; document.documentElement.style.scrollBehavior = ''; } else requestAnimationFrame(moveTick);
}
const wheelG = { t: 0, dir: 0, ours: false };
addEventListener('wheel', (e) => {
  if (detailId || e.ctrlKey) return;
  if (state.view === 'home' && !op.done) { e.preventDefault(); if (e.deltaY > 4) skipOpening(); return; }   // the film plays by itself; scrolling skips ahead
  const now = performance.now(), dir = Math.sign(e.deltaY);
  const fresh = now - wheelG.t > 200 || (dir !== wheelG.dir && Math.abs(e.deltaY) >= 4);
  wheelG.t = now;
  if (!fresh) { if (wheelG.ours) e.preventDefault(); return; }               // the tail of the same flick
  if (!dir) return;
  wheelG.dir = dir; wheelG.ours = gesture(dir);
  if (wheelG.ours) e.preventDefault();
}, { passive: false });
let ty0s = null;
addEventListener('touchstart', (e) => { ty0s = e.touches[0].clientY; brake(); }, { passive: true });
addEventListener('touchmove', (e) => { if (((stepSection() || mover.on) || (state.view === 'home' && !op.done)) && !detailId) e.preventDefault(); }, { passive: false });
addEventListener('touchend', (e) => {
  if (ty0s === null || detailId) return; const dy = ty0s - e.changedTouches[0].clientY; ty0s = null;
  if (Math.abs(dy) < 30) return;
  if (state.view === 'home' && !op.done) { if (dy > 0) skipOpening(); return; }
  if (!gesture(Math.sign(dy))) scrollBy({ top: dy * 1.5, behavior: 'smooth' });
}, { passive: true });
addEventListener('keydown', (e) => {
  if (detailId || /input|textarea|select/i.test(e.target.tagName)) return;
  const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
  if (dir > 0 && state.view === 'home' && !op.done) { e.preventDefault(); skipOpening(); return; }
  if (dir && gesture(dir)) e.preventDefault();
});

function loop() {
  requestAnimationFrame(loop);
  if (!finePointer && tx0 === null) state.touchYaw *= 0.97;
  if (state.view === 'collection') { updateBottles(); updateJourney(); }
  else if (state.view === 'home') { updateHome(); drawFilm(); }
}

applyLang(); loadFilm(); sizeCanvas();
const r0 = parseHash(); show(r0.view); scrollToSub(r0.sub);
loop();
window.__versatyOpen = openDetail; window.__versatyGo = go; // used by automated checks
