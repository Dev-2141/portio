(() => {
  const C = window.CONTENT || {};
  const links = C.links || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- content: links, email, name ----------
  document.querySelectorAll('[data-link]').forEach(a => {
    const key = a.dataset.link;
    if (key === 'email') { if (C.email) a.href = 'mailto:' + C.email; return; }
    a.href = links[key] || '#';
    if (!links[key] || links[key] === '#') a.removeAttribute('target');
  });
  document.querySelectorAll('[data-email]').forEach(el => { if (C.email) el.textContent = C.email; });
  document.querySelectorAll('[data-fullname]').forEach(el => { if (C.fullName) el.textContent = C.fullName; });
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- reveals ----------
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .reveal-lines, .name-card').forEach(el => io.observe(el));
  requestAnimationFrame(() => setTimeout(() => document.querySelector('.mega')?.classList.add('in'), 120));

  // ---------- in-page links (also work when the hash is already set) ----------
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = a.getAttribute('href') === '#intro' ? 0 : target.getBoundingClientRect().top + scrollY;
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
  }));

  // ---------- mobile menu ----------
  const header = document.getElementById('siteHeader');
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('mainNav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    header.classList.remove('light');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'CLOSE ×' : 'MENU';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); menuBtn.textContent = 'MENU';
  }));

  // ---------- work chapters ----------
  const chapters = [
    { t: 'CODE', d: 'Clean, fast front-ends.<br>Ideas turned into working products.' },
    { t: 'DESIGN', d: 'Interfaces with a point of view,<br>built around real people.' },
    { t: 'MOTION', d: 'Scroll stories and interactions<br>that make a page feel alive.' },
    { t: 'INTERFACES', d: 'Apps, dashboards and tools<br>that are a pleasure to use.' },
    { t: 'EXPERIENCES', d: 'Where design and tech overlap:<br>creative coding and 3D web.' }
  ];
  const work = document.getElementById('work');
  const cards = [...document.querySelectorAll('.card')];
  const chapter = document.getElementById('chapter');
  const cIndex = document.getElementById('chapterIndex');
  const cTitle = document.getElementById('chapterTitle');
  const cDesc = document.getElementById('chapterDesc');
  const scrollLine = document.querySelector('.scroll-line i');
  let current = 0, swapTimer;

  function setChapter(i) {
    if (i === current) return;
    current = i;
    chapter.classList.add('swap');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      cIndex.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
      cTitle.textContent = chapters[i].t;
      cDesc.innerHTML = chapters[i].d;
      chapter.classList.toggle('right', i % 2 === 0);
      chapter.classList.toggle('left', i % 2 === 1);
      chapter.classList.remove('swap');
    }, 280);
  }

  function updateWork() {
    const r = work.getBoundingClientRect();
    const total = work.offsetHeight - innerHeight;
    const t = clamp(-r.top / total, 0, 1);
    const p = t * (cards.length - 0.6) - 0.2;
    const mobile = innerWidth <= 768;
    cards.forEach((card, i) => {
      const d = i - p;
      const side = i % 2 === 0 ? -1 : 1;
      const x = mobile ? 0 : side * 9;
      const y = d * (mobile ? 46 : 64);
      const z = -Math.abs(d) * 260;
      const rx = d * -16;
      const ry = mobile ? 0 : side * -12;
      const rz = side * 5 + d * 3;
      card.style.transform =
        `translate3d(${x}vw, ${y}vh, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
      card.style.opacity = clamp(1.35 - Math.abs(d) * 0.55, 0, 1);
      card.style.zIndex = 10 - Math.round(Math.abs(d) * 2);
    });
    setChapter(clamp(Math.round(p), 0, chapters.length - 1));
    scrollLine.style.setProperty('--p', t.toFixed(3));
  }

  // ---------- person photo scrub ----------
  const photo = document.getElementById('photo');
  function updatePhoto() {
    const r = photo.getBoundingClientRect();
    const t = clamp(1 - r.top / innerHeight, 0, 1);
    photo.style.setProperty('--clip', (8 * (1 - t)).toFixed(2) + '%');
    photo.style.setProperty('--zoom', (1.18 - 0.18 * t).toFixed(3));
  }

  // ---------- header + tagline highlight ----------
  const hl = [...document.querySelectorAll('[data-hl]')];
  const contact = document.getElementById('contact');
  function updateHeader() {
    const y = scrollY;
    header.classList.toggle('light', contact.getBoundingClientRect().top < 60 && !nav.classList.contains('open'));
    const doc = document.documentElement.scrollHeight - innerHeight;
    const prog = doc > 0 ? y / doc : 0;
    const active = Math.floor(prog * (hl.length + 1));
    hl.forEach((s, i) => s.classList.toggle('on', i === active - 1));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateWork();
      if (!reduce) updatePhoto();
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  if (reduce) { photo.style.setProperty('--clip', '0%'); photo.style.setProperty('--zoom', '1'); }
  onScroll();
})();
