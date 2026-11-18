const $ = (s) => document.querySelector(s);
const rand = (a, b) => Math.random() * (b - a) + a;
const colors = ['#ff5d8f', '#ffd166', '#7ee0c3', '#a78bfa', '#ff9f43', '#5ec8ff'];

/* ---------- Confetti (hero + cake celebration) ---------- */
const cc = $('#confetti'), cx = cc.getContext('2d');
let pieces = [];
function sizeConfetti() { cc.width = cc.offsetWidth; cc.height = cc.offsetHeight; }
sizeConfetti(); addEventListener('resize', sizeConfetti);
function confettiBurst(n = 120) {
  for (let i = 0; i < n; i++) pieces.push({
    x: rand(0, cc.width), y: rand(-cc.height, 0), w: rand(6, 12), h: rand(8, 16),
    c: colors[(Math.random() * colors.length) | 0], vy: rand(1.5, 4), vx: rand(-1, 1), r: rand(0, 6), vr: rand(-.1, .1)
  });
}
(function loop() {
  cx.clearRect(0, 0, cc.width, cc.height);
  pieces.forEach(p => {
    p.y += p.vy; p.x += p.vx + Math.sin(p.y / 30); p.r += p.vr;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
  });
  pieces = pieces.filter(p => p.y < cc.height + 20);
  requestAnimationFrame(loop);
})();
confettiBurst(160);

/* ---------- Cake: blow the candles ---------- */
const candles = [...document.querySelectorAll('.candle')];
const msg = $('#cakeMsg');
function checkOut() {
  if (candles.every(c => c.classList.contains('out'))) {
    msg.textContent = 'Your wish is on its way, Lily! Happy Birthday!';
    confettiBurst(220);
    stopMic();
    if (!shown) showPopup();
  }
}
let shown = false;
const popup = $('#popup');
function showPopup() { shown = true; popup.hidden = false; $('#popClose').focus(); }
$('#popClose').addEventListener('click', () => { popup.hidden = true; });
popup.addEventListener('click', e => { if (e.target === popup) popup.hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape') popup.hidden = true; });
candles.forEach(c => c.addEventListener('click', () => { c.classList.add('out'); checkOut(); }));
function blowAll() {
  candles.forEach((c, i) => setTimeout(() => { c.classList.add('out'); if (i === candles.length - 1) checkOut(); }, i * 250));
}
$('#blowBtn').addEventListener('click', () => { showPopup(); blowAll(); });
$('#relightBtn').addEventListener('click', () => {
  shown = false;
  candles.forEach(c => c.classList.remove('out'));
  msg.textContent = 'Blow out the candles. Tap the button or blow into your microphone.';
  startMic();
});

/* optional microphone blow detection */
let micStream, micCtx, micTimer;
async function startMic() {
  if (micStream || !navigator.mediaDevices) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micCtx = new (window.AudioContext || window.webkitAudioContext)();
    const an = micCtx.createAnalyser(); an.fftSize = 256;
    micCtx.createMediaStreamSource(micStream).connect(an);
    const buf = new Uint8Array(an.frequencyBinCount);
    micTimer = setInterval(() => {
      an.getByteFrequencyData(buf);
      const low = buf.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
      if (low > 190) blowAll();
    }, 150);
  } catch (e) { /* mic not allowed: buttons still work */ }
}
function stopMic() {
  clearInterval(micTimer);
  if (micStream) micStream.getTracks().forEach(t => t.stop());
  if (micCtx) micCtx.close();
  micStream = micCtx = null;
}

/* ---------- Letter ---------- */
const env = $('#envelope');
const paper = $('#paper');
const toggleEnv = () => { env.classList.toggle('open'); if (!env.classList.contains('open')) paper.scrollTop = 0; };
env.addEventListener('click', toggleEnv);
env.addEventListener('keydown', e => { if (e.target === env && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleEnv(); } });
/* once open, tapping or scrolling the paper must not close it; use the Close letter button */
paper.addEventListener('click', e => { if (env.classList.contains('open')) e.stopPropagation(); });
paper.addEventListener('keydown', e => e.stopPropagation());
$('#letterClose').addEventListener('click', () => { env.classList.remove('open'); paper.scrollTop = 0; env.scrollIntoView({ block: 'center', behavior: 'smooth' }); });

/* ---------- Balloons ---------- */
const field = $('#balloonField'), TOTAL = 12; let popped = 0;
$('#popTotal').textContent = TOTAL;
function makeBalloons() {
  field.innerHTML = ''; popped = 0; $('#popCount').textContent = 0;
  for (let i = 0; i < TOTAL; i++) {
    const b = document.createElement('button');
    b.className = 'balloon'; b.setAttribute('aria-label', 'Pop balloon');
    const col = colors[i % colors.length];
    b.style.cssText = `left:${rand(3, 90)}%;background:${col};animation-duration:${rand(7, 13)}s;animation-delay:${rand(0, 4)}s`;
    b.addEventListener('click', () => pop(b, col));
    field.appendChild(b);
  }
}
function pop(b, col) {
  const r = b.getBoundingClientRect(), f = field.getBoundingClientRect();
  const x = r.left - f.left + r.width / 2, y = r.top - f.top + r.height / 2;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span'); s.className = 'spark';
    const a = (i / 14) * Math.PI * 2, d = rand(30, 70);
    s.style.cssText = `left:${x}px;top:${y}px;background:${col};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    field.appendChild(s); setTimeout(() => s.remove(), 650);
  }
  b.remove(); popped++; $('#popCount').textContent = popped;
  if (popped === TOTAL) confettiBurst(150);
}
$('#resetBalloons').addEventListener('click', makeBalloons);
makeBalloons();

/* ---------- Fireworks + lanterns ---------- */
const fc = $('#fireworks'), fx = fc.getContext('2d');
let sparks = [], rockets = [];
function sizeFw() { fc.width = fc.offsetWidth; fc.height = fc.offsetHeight; }
sizeFw(); addEventListener('resize', sizeFw);
const pick = () => colors[(Math.random() * colors.length) | 0];
/* explosion: round, single ring or double ring, in one or two colours */
function burst(x, y) {
  const n = rand(90, 140) | 0, type = Math.random(), c1 = pick(), c2 = pick();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-.04, .04);
    const s = type < .35 ? rand(1, 6.5) : type < .7 ? 5 + rand(-.2, .2) : (i % 2 ? 6.2 : 3.2) + rand(-.2, .2);
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, decay: rand(.008, .016), c: i % 3 ? c1 : c2, r: rand(1.6, 3) });
  }
}
/* rocket rises from the bottom, leaves a trail, then explodes at (tx, ty) */
function firework(tx, ty) {
  const x = tx + rand(-40, 40), vy = -rand(8, 11), frames = (fc.height - ty) / -vy;
  rockets.push({ x, y: fc.height, vx: (tx - x) / frames, vy, ty, c: pick() });
}
(function fwLoop() {
  fx.globalCompositeOperation = 'source-over';
  fx.fillStyle = 'rgba(11,7,32,.2)'; fx.fillRect(0, 0, fc.width, fc.height);
  fx.globalCompositeOperation = 'lighter';
  rockets.forEach(r => {
    r.x += r.vx; r.y += r.vy;
    sparks.push({ x: r.x, y: r.y, vx: rand(-.3, .3), vy: rand(.2, .8), life: .6, decay: .05, c: r.c, r: 1.6 });
    fx.globalAlpha = 1; fx.fillStyle = '#fff'; fx.beginPath(); fx.arc(r.x, r.y, 2.4, 0, 7); fx.fill();
    if (r.y <= r.ty) { r.done = true; burst(r.x, r.y); }
  });
  rockets = rockets.filter(r => !r.done);
  sparks.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .04; p.vx *= .985; p.life -= p.decay;
    fx.globalAlpha = Math.max(p.life, 0); fx.fillStyle = p.c; fx.beginPath(); fx.arc(p.x, p.y, p.r, 0, 7); fx.fill();
  });
  fx.globalAlpha = 1; sparks = sparks.filter(p => p.life > 0);
  requestAnimationFrame(fwLoop);
})();
function lanterns(n = 10) {
  const box = $('#lanterns');
  for (let i = 0; i < n; i++) {
    const l = document.createElement('div'); l.className = 'lantern';
    l.style.cssText = `left:${rand(2, 94)}%;--sway:${rand(-60, 60)}px;animation-duration:${rand(9, 16)}s;animation-delay:${rand(0, 3)}s;transform:scale(${rand(.7, 1.2)})`;
    box.appendChild(l); setTimeout(() => l.remove(), 20000);
  }
}
/* a big show: 24 rockets over about 7 seconds plus lanterns */
function celebrate() {
  for (let i = 0; i < 24; i++) setTimeout(() => firework(rand(fc.width * .08, fc.width * .92), rand(fc.height * .1, fc.height * .55)), i * 290 + rand(0, 140));
  lanterns(14);
}
$('#celebrateBtn').addEventListener('click', celebrate);
fc.addEventListener('click', e => { const r = fc.getBoundingClientRect(); burst(e.clientX - r.left, e.clientY - r.top); });
/* big show when the section first scrolls into view, then a steady stream of rockets while it stays visible */
let firstShow = false, ambient = null;
new IntersectionObserver(en => {
  if (en[0].isIntersecting) {
    if (!firstShow) { firstShow = true; celebrate(); }
    clearInterval(ambient);
    ambient = setInterval(() => firework(rand(fc.width * .08, fc.width * .92), rand(fc.height * .1, fc.height * .55)), 1100);
  } else clearInterval(ambient);
}, { threshold: .4 }).observe($('#sky'));
new IntersectionObserver(en => { if (en[0].isIntersecting) startMic(); else stopMic(); }, { threshold: .6 }).observe($('#cake'));

/* ---------- Music + song picker ---------- */
/* EDIT THIS LIST: title = what she sees, file = the mp3 next to index.html */
const SONGS = [
  { title: 'Flatline', file: 'play.mp3' },
  { title: 'Radio',        file: 'radio.mp3' },
  { title: 'Song 3',        file: 'song3.mp3' },
  { title: 'Song 4',        file: 'song4.mp3' }
];
const bgm = $('#bgm'), musicBtn = $('#musicBtn');
const songBtn = $('#songBtn'), songPanel = $('#songPanel'), songList = $('#songList'), songNow = $('#songNow');
let current = 0, userPaused = false;

function setMusicUI(on) { musicBtn.classList.toggle('playing', on); musicBtn.setAttribute('aria-pressed', on); renderSongs(); }
function playMusic() { return bgm.play().then(() => setMusicUI(true)).catch(() => setMusicUI(false)); }

function renderSongs() {
  songList.innerHTML = '';
  SONGS.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'song-item' + (i === current ? ' active' : '');
    const ico = document.createElement('span'); ico.className = 'ico';
    ico.innerHTML = (i === current && !bgm.paused) ? '&#9654;' : '&#9835;';
    const t = document.createElement('span'); t.textContent = s.title;
    b.append(ico, t);
    b.addEventListener('click', () => chooseSong(i));
    songList.appendChild(b);
  });
}
function loadSong(i) {
  current = i;
  bgm.src = SONGS[i].file;
  songNow.textContent = 'Selected: ' + SONGS[i].title;
}
function chooseSong(i) {
  if (i === current && bgm.src) {            // same song: play / pause
    if (bgm.paused) { userPaused = false; playMusic(); } else { userPaused = true; bgm.pause(); setMusicUI(false); }
    return;
  }
  loadSong(i);
  userPaused = false;
  playMusic();
  renderSongs();
}
/* the selected song repeats until another one is chosen */
bgm.loop = true;
bgm.addEventListener('error', () => { songNow.textContent = 'Could not load ' + SONGS[current].file; });

songBtn.addEventListener('click', e => {
  e.stopPropagation();
  songPanel.hidden = !songPanel.hidden;
  songBtn.setAttribute('aria-expanded', !songPanel.hidden);
});
addEventListener('click', e => {
  if (!songPanel.hidden && !e.target.closest('.song-panel, .song-btn')) { songPanel.hidden = true; songBtn.setAttribute('aria-expanded', false); }
});

musicBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (bgm.paused) { userPaused = false; playMusic(); } else { userPaused = true; bgm.pause(); setMusicUI(false); }
});
loadSong(0);
renderSongs();
/* browsers block autoplay, so start on the visitor's first tap or key press */
['click', 'touchstart', 'keydown'].forEach(ev =>
  addEventListener(ev, function first(e) {
    if (e.target.closest && e.target.closest('.music, .song-btn, .song-panel')) return;
    removeEventListener(ev, first);
    if (!userPaused && bgm.paused) playMusic();
  }, { passive: true }));

/* ---------- Hero animation ---------- */
(function heroAnim() {
  /* split title into letters; the index keeps counting across both lines */
  let n = 0;
  document.querySelectorAll('.hero [data-split]').forEach(el => {
    const text = el.textContent; el.textContent = '';
    [...text].forEach(chr => {
      const s = document.createElement('span');
      s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', n++); s.textContent = chr;
      el.appendChild(s);
    });
  });
  /* bunting flags */
  const bun = $('#bunting');
  for (let i = 0; i < 14; i++) {
    const f = document.createElement('i');
    f.style.setProperty('--i', i); f.style.setProperty('--c', colors[i % colors.length]);
    bun.appendChild(f);
  }
  /* twinkling stars and rising balloons */
  const deco = $('#heroDeco');
  for (let i = 0; i < 45; i++) {
    const s = document.createElement('span'); s.className = 'star';
    s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;animation-delay:${rand(0, 2.5)}s`;
    deco.appendChild(s);
  }
  for (let i = 0; i < 9; i++) {
    const b = document.createElement('span'); b.className = 'hb';
    b.style.cssText = `left:${rand(2, 95)}%;background:${colors[i % colors.length]};animation-duration:${rand(10, 18)}s;animation-delay:${rand(-12, 0)}s`;
    deco.appendChild(b);
  }
  /* extra confetti burst when the title finishes landing */
  setTimeout(() => confettiBurst(120), 2400);
})();
/* ---------- Gallery: photos drop in one after another ---------- */
(function galleryReveal() {
  const figs = [...document.querySelectorAll('.grid figure')];
  figs.forEach(f => f.classList.add('reveal'));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const f = e.target;
    f.style.transitionDelay = (figs.indexOf(f) % 3) * 160 + 'ms';
    f.classList.add('in'); io.unobserve(f);
    setTimeout(() => { f.style.transitionDelay = ''; }, 1500);
  }), { threshold: .2 });
  figs.forEach(f => io.observe(f));
})();