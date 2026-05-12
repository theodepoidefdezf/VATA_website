   
(() => {
  'use strict';

  /* 1. RESET IMMEDIAT (Avant toute chose) */
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  /* ========== LENIS SMOOTH SCROLL ========== */
  let lenis = null;
  if (!reduceMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    // Forcer Lenis à 0 dès son instanciation
    lenis.scrollTo(0, { immediate: true });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ========== LANCEMENT ========== */
  // On utilise DOMContentLoaded pour agir le plus vite possible
  document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true });
  });

  // On utilise window.load pour confirmer quand les images sont là
  window.addEventListener('load', () => {
    // Petit délai de sécurité pour laisser Lenis se stabiliser
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (lenis) lenis.scrollTo(0, { immediate: true });
      runHeroIntro();
    }, 50); 
  });

  /* ========== CUSTOM CURSOR ========== */
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  let tx = cx, ty = cy;
  let dx = cx, dy = cy;

  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      dx = e.clientX; dy = e.clientY;
    });
    const animateCursor = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    document.querySelectorAll('[data-cursor]').forEach((el) => {
      const type = el.dataset.cursor;
      el.addEventListener('mouseenter', () => cursor.classList.add(`is-${type}`));
      el.addEventListener('mouseleave', () => cursor.classList.remove(`is-${type}`));
    });
  }

  /* ========== NAVIGATION SCROLL STATE + SCROLL PROGRESS ========== */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('scrollProgress');
  ScrollTrigger.create({
    start: 'top -10',
    end: 99999,
    onUpdate: (self) => {
      if (self.scroll() > 40) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (self.scroll() / max) * 100 : 0;
      if (progress) progress.style.width = pct + '%';
    },
  });

  /* ========== ANCHOR LINKS (work with Lenis) ========== */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ========== TYPEWRITER ELEMENTS — mark before split runs ========== */
  document.querySelectorAll('h2.section__title, h2.contact__title, h1.hero__headline').forEach((el) => {
    el.dataset.typewriter = '';
    el.dataset.tw = el.innerText.trim();
    el.textContent = '';
  });

  /* ========== TEXT SPLIT ========== */
  function splitText(el) {
    if (el.dataset.split === 'done') return;
    const text = el.innerHTML;
    const lines = text.split(/<br\s*\/?>/i);
    el.innerHTML = lines
      .map((line) => {
        const words = line.trim().split(/\s+/);
        return (
          '<span class="split-line">' +
          words
            .map((w) => `<span class="split-word">${w}&nbsp;</span>`)
            .join('') +
          '</span>'
        );
      })
      .join('');
    el.dataset.split = 'done';
  }

  document.querySelectorAll('[data-split]:not([data-typewriter])').forEach((el) => splitText(el));

  /* Helper: reveal/hide a split element */
  function setSplitState(el, visible) {
    const lines = el.querySelectorAll('.split-line');
    lines.forEach((l) => {
      if (visible) {
        l.querySelectorAll('.split-word').forEach((w) => gsap.set(w, { clearProps: 'transform' }));
      }
      l.classList.toggle('in', visible);
    });
  }

  /* ========== TYPEWRITER ========== */
  const TW_SPEED = 32;

  function typewrite(el, onDone, speed) {
    const text = el.dataset.tw;
    if (!text) return;
    const ms = speed || TW_SPEED;
    el.innerHTML = '<span class="tw-cursor" aria-hidden="true"></span>';
    const cursor = el.querySelector('.tw-cursor');
    let i = 0;
    (function tick() {
      const ch = text[i];
      if (ch === '\n') cursor.insertAdjacentElement('beforebegin', document.createElement('br'));
      else cursor.insertAdjacentText('beforebegin', ch);
      i++;
      if (i < text.length) setTimeout(tick, ms);
      else setTimeout(() => { cursor.remove(); if (onDone) onDone(); }, 900);
    })();
  }

  // Hero eyebrow — store text, clear for typewriter in runHeroIntro
  const heroEyebrowText = document.querySelector('.hero__eyebrow-text');
  if (heroEyebrowText) {
    heroEyebrowText.dataset.tw = heroEyebrowText.textContent.trim();
    heroEyebrowText.textContent = '';
  }

  /* ========== HERO INTRO ========== */
  function runHeroIntro() {
    const heroLogo = document.querySelector('.hero__logo');
    if (heroLogo) requestAnimationFrame(() => heroLogo.classList.add('is-revealed'));
