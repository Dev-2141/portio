(() => {
  const C = window.CONTENT || {};
  const links = C.links || {};
  const chapters = C.chapters || [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad2 = n => String(n).padStart(2, '0');
  const body = document.body;

  // Palettes shared with the 3D scene (scene.js reads window.DEVAN.palettes)
  const palettes = [
    ['#0a3b4a', '#20e3d4', '#2b6cff'],
    ['#5a1a06', '#ff7a1c', '#ffd166'],
    ['#2a0b55', '#8a3cff', '#ff3cac'],
    ['#3d0a0a', '#ff3b3b', '#f2c14e'],
    ['#06301e', '#3cff9e', '#1ec8ff']
  ];

  // ---------- content ----------
  $$('[data-link]').forEach(a => {
    const key = a.dataset.link;
    if (key === 'email') { if (C.email) a.href = 'mailto:' + C.email; return; }
    const url = links[key];
    a.href = url || '#';
    if (!url || url === '#') a.removeAttribute('target');
  });
  $$('[data-email]').forEach(el => { if (C.email) el.textContent = C.email; });
  $$('[data-fullname]').forEach(el => { if (C.fullName) el.textContent = C.fullName; });
  $('#year').textContent = new Date().getFullYear();

  // split titles into letters for the bounce / drop effects
  $$('[data-split]').forEach(el => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((c, i) => `<span class="ch" style="--i:${i}" aria-hidden="true">${c === ' ' ? ' ' : c.replace('&', '&amp;')}</span>`).join('');
  });

  // ---------- intro entrance ----------
  requestAnimationFrame(() => body.classList.add('is-loaded'));

  // ---------- motion-reveal (stagger .075s within each block) ----------
  const groups = new Map();
  $$('.motion-reveal').forEach(el => {
    const g = el.closest('.gg-svc__grid, .team-profile, .team-heading, .about, .founder-content') || body;
    const n = groups.get(g) || 0;
    groups.set(g, n + 1);
    el.style.setProperty('--d', ((n % 5) * 0.075).toFixed(3) + 's');
  });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('.motion-reveal').forEach(el => io.observe(el));

  // ---------- in-page links ----------
  function goTo(hash) {
    const target = $(hash);
    if (!target) return;
    const top = hash === '#intro' ? 0 : target.getBoundingClientRect().top + scrollY;
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', hash);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const h = a.getAttribute('href');
    if (h.length < 2) { e.preventDefault(); return; }
    e.preventDefault();
    closeMenu();
    goTo(h);
  }));

  // ---------- header: language menu + mobile menu ----------
  const lang = $('#langSelector'), langBtn = $('#langToggle');
  langBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = lang.classList.toggle('open');
    langBtn.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', e => { if (!lang.contains(e.target)) { lang.classList.remove('open'); langBtn.setAttribute('aria-expanded', false); } });

  const nav = $('#mainNav'), menuBtn = $('#menuBtn');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); menuBtn.textContent = 'MENU'; }
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'CLOSE ×' : 'MENU';
  });

  // ---------- cookie panel ----------
  const banner = $('#cookieBanner');
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  if (!store.get('devan-cookies')) setTimeout(() => banner.classList.add('open'), 1500);
  $('#cookieSettings').addEventListener('click', () => banner.classList.toggle('open'));
  $('#cookieAccept').addEventListener('click', () => { store.set('devan-cookies', 'accepted'); banner.classList.remove('open'); });
  $('#cookieReject').addEventListener('click', () => { store.set('devan-cookies', 'rejected'); banner.classList.remove('open'); });

  // ---------- scroll-driven state ----------
  const work = $('#work'), about = $('#about'), team = $('#team'), contact = $('#contact');
  const header = $('.site-header');
  const chapterEl = $('#chapter'), cIndex = $('#chapterIndex'), cTitle = $('#chapterTitle'), cDesc = $('#chapterDesc');
  const progressBar = $('#progress');
  const manifest = $$('.manifest span');
  const founderPhoto = $('#founderPhoto'), founderFrames = $('#founderFrames'), founderBar = $('#founderVideoProgress');
  const founderName = $('.founder-photo-name');

  const DEVAN = window.DEVAN = {
    palettes, chapters,
    progress: 0, target: 0, chapter: 0,
    sceneActive: true, world: -1,
    openWorld, closeWorld
  };

  function workTarget() {
    const top = work.offsetTop, h = work.offsetHeight;
    return clamp((scrollY - top + innerHeight * 0.25) / (h - innerHeight * 0.5), 0, 1);
  }
  const chapterFor = p => clamp(Math.floor((p + 0.07) / 0.17), 0, chapters.length - 1);

  let shownChapter = 0, switchTimer;
  function setChapter(i) {
    if (i === shownChapter) return;
    shownChapter = i;
    chapterEl.classList.add('is-switching');
    clearTimeout(switchTimer);
    switchTimer = setTimeout(() => {
      const ch = chapters[i];
      cIndex.textContent = pad2(i + 1) + ' / ' + pad2(chapters.length);
      cTitle.textContent = ch.title;
      cDesc.innerHTML = ch.desc;
      chapterEl.classList.toggle('right', i % 2 === 0);
      chapterEl.classList.toggle('left', i % 2 === 1);
      chapterEl.classList.remove('is-switching');
    }, 260);
  }

  function updateBodyState() {
    const introGone = scrollY > work.offsetTop - innerHeight * 0.45;
    const aboutIn = about.getBoundingClientRect().top < innerHeight * 0.55;
    body.classList.toggle('is-intro', !introGone);
    body.classList.toggle('is-about', aboutIn);
    DEVAN.sceneActive = !aboutIn || DEVAN.world >= 0;

    // manifest: light one line per page third
    const docP = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const lit = scrollY < 40 ? -1 : Math.min(2, Math.floor(docP * 3));
    manifest.forEach((s, i) => s.classList.toggle('is-lit', i === lit));

    header.classList.toggle('is-light', contact.getBoundingClientRect().top < 60 && !nav.classList.contains('open'));

    // founder "video" scrub
    const r = team.getBoundingClientRect();
    const t = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    if (!reduce) {
      founderPhoto.style.setProperty('--zoom', (1.14 - 0.12 * t).toFixed(4));
      founderPhoto.style.setProperty('--px', (-1.5 + 3 * t).toFixed(2) + '%');
      founderPhoto.style.setProperty('--py', (1 - 2 * t).toFixed(2) + '%');
      founderFrames.style.setProperty('--spin', (t * 160).toFixed(2) + 'deg');
    }
    founderBar.style.width = (t * 100).toFixed(2) + '%';
    founderName.style.setProperty('--nameO', r.top < innerHeight * 0.4 && t < 0.92 ? 1 : 0);
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    DEVAN.target = workTarget();
    // same feel as 7.5% per frame at 60fps, regardless of the actual frame rate
    const k = reduce ? 1 : 1 - Math.pow(1 - 0.075, dt * 60);
    DEVAN.progress += (DEVAN.target - DEVAN.progress) * k;
    if (Math.abs(DEVAN.target - DEVAN.progress) < 0.0001) DEVAN.progress = DEVAN.target;
    const p = DEVAN.progress;
    progressBar.style.width = (p * 100).toFixed(2) + '%';
    DEVAN.chapter = chapterFor(p);
    setChapter(DEVAN.chapter);
    chapterEl.style.opacity = p > 0.86 ? 0 : '';
    requestAnimationFrame(tick);
  }
  addEventListener('scroll', updateBodyState, { passive: true });
  addEventListener('resize', updateBodyState);
  updateBodyState();
  requestAnimationFrame(tick);

  // ---------- service tile effects ----------
  const tc = ms => { const f = Math.floor(ms / 40) % 25, s = Math.floor(ms / 1000); return `00:${pad2(Math.floor(s / 60))}:${pad2(s % 60)}:${pad2(f)}`; };
  function onHover(el, start, stop) {
    let state = null;
    el.addEventListener('mouseenter', () => { state = start(); });
    el.addEventListener('mouseleave', () => { if (stop) stop(state); state = null; });
  }
  // 01 film timecode
  const film = $('.fx-film'), filmTime = $('.fx-time', film);
  onHover(film, () => { const t0 = performance.now(); return setInterval(() => filmTime.textContent = tc(performance.now() - t0), 40); },
    id => { clearInterval(id); filmTime.textContent = '00:00:00:00'; });
  // 02 hearts + likes
  const social = $('.fx-social'), hearts = $('.fx-hearts', social), likes = $('.fx-likes', social);
  let likeCount = 1204;
  onHover(social, () => setInterval(() => {
    const h = document.createElement('i');
    h.textContent = '♥';
    h.style.left = (55 + Math.random() * 40) + '%';
    h.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    hearts.appendChild(h);
    setTimeout(() => h.remove(), 1700);
    likeCount += 1 + Math.floor(Math.random() * 4);
    likes.textContent = '♥ ' + likeCount.toLocaleString('en').replace(/,/g, ' ');
  }, 220), id => clearInterval(id));
  // 04 spotlight follows cursor
  const spot = $('.fx-spot'), spotlight = $('.fx-spotlight', spot);
  spot.addEventListener('mousemove', e => {
    const b = spot.getBoundingClientRect();
    spotlight.style.setProperty('--mx', (e.clientX - b.left) + 'px');
    spotlight.style.setProperty('--my', (e.clientY - b.top) + 'px');
  });
  // 05 cgi tilt
  const cgi = $('.fx-cgi'), cgiTitle = $('.gg-svc__title', cgi);
  cgi.addEventListener('mousemove', e => {
    const b = cgi.getBoundingClientRect();
    cgiTitle.style.setProperty('--ry', (((e.clientX - b.left) / b.width - 0.5) * 22).toFixed(1) + 'deg');
    cgiTitle.style.setProperty('--rx', (-((e.clientY - b.top) / b.height - 0.5) * 18).toFixed(1) + 'deg');
  });
  cgi.addEventListener('mouseleave', () => { cgiTitle.style.setProperty('--rx', '0deg'); cgiTitle.style.setProperty('--ry', '0deg'); });
  // 06 arcade score
  const game = $('.fx-game'), score = $('.fx-score', game);
  onHover(game, () => { let s = 0; return setInterval(() => { s += 10 + Math.floor(Math.random() * 40); score.textContent = 'SCORE ' + String(s).padStart(6, '0'); }, 90); },
    id => { clearInterval(id); score.textContent = 'SCORE 000000'; });
  // 07 prompt typing
  const prompt = $('.fx-prompt'), typed = $('.fx-typed', prompt);
  const promptText = 'prompt: build something with devan';
  onHover(prompt, () => { let i = 0; typed.textContent = ''; return setInterval(() => { if (i <= promptText.length) typed.textContent = promptText.slice(0, i++); }, 45); },
    id => { clearInterval(id); typed.textContent = ''; });

  // ---------- full-screen chapter view ----------
  const world = $('#worldScreen'), wArt = $('#worldArt'), wIdx = $('#overlayIndex'), wTitle = $('#overlayTitle'), wDesc = $('#overlayDesc');
  const wTime = $('#worldTime'), wProg = $('#worldProgress'), closeBtn = $('#close');
  const ctx = wArt.getContext('2d');
  let worldRaf = 0, worldT0 = 0, openTimer;
  const LEN = 15000;

  function drawWorld(now) {
    const i = DEVAN.world;
    if (i < 0) return;
    const w = wArt.width = innerWidth, h = wArt.height = innerHeight;
    const t = (now - worldT0) / 1000;
    const [c1, c2, c3] = palettes[i];
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    [[c2, .62, .38, .55], [c3, .78, .62, .45], [c1, .35, .7, .6], [c2, .9, .2, .3]].forEach(([c, x, y, r], k) => {
      const cx = w * (x + Math.sin(t * .23 + k * 1.7) * .08), cy = h * (y + Math.cos(t * .19 + k) * .08);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * r);
      g.addColorStop(0, c + 'cc'); g.addColorStop(1, c + '00');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    ctx.globalCompositeOperation = 'source-over';
    // the chapter's letter, huge and dark, drifting
    ctx.save();
    ctx.fillStyle = 'rgba(5,5,6,.82)';
    ctx.font = `900 ${Math.round(h * 1.25)}px "Arial Black", Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('DEVAN'[i], w * 0.52 + Math.sin(t * .3) * 20 - t * 6, h * 0.55);
    ctx.restore();
    const el = (now - worldT0) % LEN;
    const secs = Math.floor(el / 1000);
    wTime.textContent = pad2(Math.floor(secs / 60)) + ':' + pad2(secs % 60);
    wProg.style.width = (el / LEN * 100).toFixed(2) + '%';
    worldRaf = requestAnimationFrame(drawWorld);
  }

  function openWorld(i) {
    if (DEVAN.world >= 0) return;
    i = clamp(i ?? DEVAN.chapter, 0, chapters.length - 1);
    DEVAN.world = i;
    DEVAN.sceneActive = true;
    const ch = chapters[i];
    wIdx.textContent = pad2(i + 1) + ' / ' + pad2(chapters.length);
    wTitle.innerHTML = ch.world;
    wDesc.textContent = ch.worldDesc;
    body.classList.add('world-transitioning');
    body.style.overflow = 'hidden';
    world.setAttribute('aria-hidden', 'false');
    openTimer = setTimeout(() => {
      body.classList.remove('world-transitioning');
      body.classList.add('world-active');
      worldT0 = performance.now();
      cancelAnimationFrame(worldRaf);
      worldRaf = requestAnimationFrame(drawWorld);
      closeBtn.focus({ preventScroll: true });
    }, reduce ? 0 : 650);
  }
  function closeWorld() {
    if (DEVAN.world < 0) return;
    clearTimeout(openTimer);
    body.classList.remove('world-active', 'world-transitioning');
    body.style.overflow = '';
    world.setAttribute('aria-hidden', 'true');
    setTimeout(() => { cancelAnimationFrame(worldRaf); DEVAN.world = -1; updateBodyState(); }, 450);
  }
  $('#enter').addEventListener('click', () => openWorld(DEVAN.chapter));
  closeBtn.addEventListener('click', closeWorld);
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeWorld(); lang.classList.remove('open'); closeMenu(); } });
})();
