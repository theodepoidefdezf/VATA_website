/* =========================================================
   VATA SOLUTIONS — MAIN JS
   GSAP · ScrollTrigger · Lenis · custom interactions
   ========================================================= */


   
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

    const headline = document.querySelector('.hero__headline');
    if (headline && 'typewriter' in headline.dataset) {
      setTimeout(() => typewrite(headline, null, 14), 300);
    } else if (headline) {
      setSplitState(headline, true);
    }

    gsap.from('.hero__eyebrow .dot', {
      scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.7)', delay: 0.2,
    });
    if (heroEyebrowText) setTimeout(() => typewrite(heroEyebrowText), 250);

    gsap.from('.hero__meta-item', {
      y: 24,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.1,
      delay: 0.3,
    });
  }

  /* ========== SCROLL REVEAL — generic re-trigger ========== */
  // Toggle .in on enter / leave from both directions so the animations
  // play every single time an element crosses the viewport.
  document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-scale').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      end: 'bottom 12%',
      onEnter:     () => el.classList.add('in'),
      onLeave:     () => el.classList.remove('in'),
      onEnterBack: () => el.classList.add('in'),
      onLeaveBack: () => el.classList.remove('in'),
    });
  });

  /* ========== SECTION INDEX — underline + typewriter ========== */
  document.querySelectorAll('.section__index').forEach((el) => {
    el.dataset.tw = el.textContent.trim();
    el.textContent = '';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      end: 'bottom 12%',
      onEnter:     () => { el.classList.add('in'); typewrite(el); },
      onLeave:     () => el.classList.remove('in'),
      onEnterBack: () => { el.classList.add('in'); typewrite(el); },
      onLeaveBack: () => { el.classList.remove('in'); el.textContent = ''; },
    });
  });

  /* ========== TYPEWRITER — other labels ========== */
  document.querySelectorAll('.app-section__index, .manifesto__index, .techstack__label').forEach((el) => {
    el.dataset.tw = el.textContent.trim();
    el.textContent = '';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter:     () => typewrite(el),
      onLeaveBack: () => { el.textContent = ''; },
      onEnterBack: () => typewrite(el),
    });
  });

  /* ========== TYPEWRITER — section titles + contact ========== */
  document.querySelectorAll('h2.section__title[data-typewriter]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter:     () => typewrite(el, null, 25),
      onLeaveBack: () => { el.textContent = ''; },
      onEnterBack: () => typewrite(el, null, 25),
    });
  });

  const contactTitle = document.querySelector('h2.contact__title[data-typewriter]');
  if (contactTitle) {
    ScrollTrigger.create({
      trigger: contactTitle,
      start: 'top 88%',
      onEnter:     () => typewrite(contactTitle, null, 20),
      onLeaveBack: () => { contactTitle.textContent = ''; },
      onEnterBack: () => typewrite(contactTitle, null, 20),
    });
  }

  /* ========== SCROLL REVEAL — split text re-trigger ========== */
  document
    .querySelectorAll('.about__statement, .section__title:not([data-typewriter]), .contact__title:not([data-typewriter]), .work-card__name, .app-section__title')
    .forEach((el) => {
      if (el.matches('[data-split]') && el.dataset.split !== 'done') splitText(el);
      const lines = el.querySelectorAll('.split-line');
      if (!lines.length) return;
      // Hide initially
      lines.forEach((l) => l.classList.remove('in'));
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        end: 'bottom 12%',
        onEnter:     () => setSplitState(el, true),
        onLeave:     () => setSplitState(el, false),
        onEnterBack: () => setSplitState(el, true),
        onLeaveBack: () => setSplitState(el, false),
      });
    });

  // Initial split-word position
  gsap.set('.split-word', { y: '110%' });

  /* ========== PARALLAX HERO ========== */
  if (!reduceMotion) {
    gsap.to('.hero__logo-wrap', {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });
    gsap.to('.hero__headline, .hero__meta', {
      yPercent: 60,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }

  /* ========== DYNAMIC BACKGROUND — body bg shifts per section ========== */
  const bgMap = {
    hero:     getComputedStyle(document.documentElement).getPropertyValue('--bg-hero').trim() || '#f5f4f0',
    about:    getComputedStyle(document.documentElement).getPropertyValue('--bg-about').trim() || '#efeee9',
    services: getComputedStyle(document.documentElement).getPropertyValue('--bg-services').trim() || '#ecebe6',
    work:     getComputedStyle(document.documentElement).getPropertyValue('--bg-work').trim() || '#f2f1ec',
    app1:     '#181818',
    app2:     '#0f0f0f',
    process:  getComputedStyle(document.documentElement).getPropertyValue('--bg-process').trim() || '#e8e7e2',
    founders: getComputedStyle(document.documentElement).getPropertyValue('--bg-founders').trim() || '#efeee8',
    faq:      getComputedStyle(document.documentElement).getPropertyValue('--bg-faq').trim() || '#e9e8e3',
    contact:  getComputedStyle(document.documentElement).getPropertyValue('--bg-contact').trim() || '#0a0a0a',
  };
  const darkSections = new Set(['app1', 'app2', 'contact']);

  document.querySelectorAll('[data-bg]').forEach((sec) => {
    const key = sec.dataset.bg;
    const color = bgMap[key];
    if (!color) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter:     () => gsap.to('body', { backgroundColor: color, duration: 1.1, ease: 'power2.out' }),
      onEnterBack: () => gsap.to('body', { backgroundColor: color, duration: 1.1, ease: 'power2.out' }),
    });
  });

  /* ========== SIDE-NAV — track active section ========== */
  const sideNav = document.getElementById('sideNav');
  const sideLinks = sideNav ? Array.from(sideNav.querySelectorAll('a')) : [];

  function setActiveSide(key, isDark) {
    sideLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.section === key));
    if (sideNav) sideNav.classList.toggle('is-dark', !!isDark);
  }

  document.querySelectorAll('[data-bg]').forEach((sec) => {
    const key = sec.dataset.bg;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter:     () => setActiveSide(key === 'hero' ? 'top' : key, darkSections.has(key)),
      onEnterBack: () => setActiveSide(key === 'hero' ? 'top' : key, darkSections.has(key)),
    });
  });

  // Show side-nav after intro
  setTimeout(() => sideNav?.classList.add('is-visible'), 2200);

  /* ========== AMBIENT GRADIENT — drifts with scroll ========== */
  if (!reduceMotion) {
    const ambient = document.getElementById('ambient');
    if (ambient) {
      gsap.to(ambient, {
        backgroundPosition: '50% 100%',
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 1 },
      });
      // Also rotate slightly with scroll position
      ScrollTrigger.create({
        start: 0, end: 'max', scrub: 1.5,
        onUpdate: (self) => {
          const t = self.progress;
          ambient.style.transform = `translate(${(t - 0.5) * 60}px, ${(t - 0.5) * 80}px) scale(${1 + t * 0.15})`;
        },
      });
    }
  }

  /* ========== 3D TILT on cards ========== */
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const max = 8;
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * max * 2;
        const ry = (x - 0.5) * max * 2;
        gsap.to(card, {
          rotateX: rx,
          rotateY: ry,
          transformPerspective: 800,
          duration: 0.6,
          ease: 'power3.out',
        });
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.9,
          ease: 'elastic.out(1, 0.5)',
        });
      });
    });
  }

  /* ========== PROCESS STEPS — staggered reveal on scroll ========== */
  document.querySelectorAll('.process__step').forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 90%',
      end: 'bottom 10%',
      onEnter: () => {
        step.classList.add('in');
        gsap.fromTo(step,
          { x: -40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: i * 0.05 }
        );
      },
      onLeave: () => { step.classList.remove('in'); gsap.set(step, { opacity: 0 }); },
      onEnterBack: () => {
        step.classList.add('in');
        gsap.fromTo(step,
          { x: 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }
        );
      },
      onLeaveBack: () => { step.classList.remove('in'); gsap.set(step, { opacity: 0 }); },
    });
  });

  /* ========== SERVICE CARDS — staggered scale-in ========== */
  document.querySelectorAll('.service').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 92%',
      end: 'bottom 8%',
      onEnter:     () => gsap.fromTo(card, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: (i % 3) * 0.08 }),
      onLeave:     () => gsap.set(card, { opacity: 0, y: 60 }),
      onEnterBack: () => gsap.fromTo(card, { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }),
      onLeaveBack: () => gsap.set(card, { opacity: 0, y: -60 }),
    });
  });

  /* ========== WORK CARD MAGNETIC ARROW ========== */
  document.querySelectorAll('.work-card').forEach((card) => {
    const arrow = card.querySelector('.work-card__arrow');
    if (!arrow) return;
    card.addEventListener('mousemove', (e) => {
      const rect = arrow.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(arrow, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.6,
        ease: 'power3.out',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(arrow, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  });

  /* ========== NUMBER COUNTERS ========== */
  document.querySelectorAll('.about__num').forEach((el) => {
    const finalText = el.textContent.trim();
    const numericMatch = finalText.match(/^(\d+)(.*)$/);
    if (!numericMatch) return; // skip non-numeric like ∞
    const finalNum = parseInt(numericMatch[1], 10);
    const suffix = numericMatch[2];

    let lastTriggered = false;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      end: 'bottom 10%',
      onEnter: () => animate(),
      onEnterBack: () => animate(),
      onLeave: () => { lastTriggered = false; },
      onLeaveBack: () => { lastTriggered = false; el.textContent = '0' + suffix; },
    });

    function animate() {
      if (lastTriggered) return;
      lastTriggered = true;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: finalNum,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.round(obj.val) + suffix;
        },
      });
    }
  });

  /* ========== CONTACT MAIL — character hover scramble ========== */
  document.querySelectorAll('.contact__mail span').forEach((el) => {
    const original = el.textContent;
    const chars = '!<>-_\\/[]{}—=+*^?#';
    let interval = null;

    const parent = el.closest('.contact__mail');
    parent.addEventListener('mouseenter', () => {
      let frame = 0;
      const length = original.length;
      interval = setInterval(() => {
        const progress = frame / 14;
        const out = original
          .split('')
          .map((c, i) => {
            if (i / length < progress) return original[i];
            if (c === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
        el.textContent = out;
        frame++;
        if (frame > 14) {
          clearInterval(interval);
          el.textContent = original;
        }
      }, 35);
    });
    parent.addEventListener('mouseleave', () => {
      if (interval) clearInterval(interval);
      el.textContent = original;
    });
  });

  /* ========== FOOTER MASSIVE TEXT PARALLAX ========== */
  if (!reduceMotion) {
    gsap.to('.footer__massive', {
      yPercent: -25,
      ease: 'none',
      scrollTrigger: {
        trigger: '.footer',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 1.5,
      },
    });
  }

  /* ========== SUBTLE FLOATING — founder cards ========== */
  if (!reduceMotion) {
    document.querySelectorAll('.founder').forEach((el, i) => {
      gsap.to(el, {
        y: i % 2 === 0 ? -8 : 8,
        duration: 4 + i * 0.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    });
  }

  /* ========== HERO ORB MOUSE PARALLAX ========== */
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    const orbs = document.querySelectorAll('.orb');
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        orbs.forEach((orb, i) => {
          const depth = (i + 1) * 12;
          gsap.to(orb, {
            x: cx * depth,
            y: cy * depth,
            duration: 1.2,
            ease: 'power2.out',
          });
        });
      });
    }
  }

  /* ========== SECTION ENTRY — fade backgrounds ========== */
  document.querySelectorAll('section').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter:     () => sec.classList.add('section-active'),
      onLeave:     () => sec.classList.remove('section-active'),
      onEnterBack: () => sec.classList.add('section-active'),
      onLeaveBack: () => sec.classList.remove('section-active'),
    });
  });

  /* ========== MOBILE NAV — hamburger toggle ========== */
  const navBurger  = document.getElementById('navBurger');
  const mobileNav  = document.getElementById('mobileNav');
  const navEl      = document.getElementById('nav');

  if (navBurger && mobileNav) {
    const openMenu = () => {
      mobileNav.classList.add('is-open');
      navBurger.classList.add('is-open');
      navEl.classList.add('menu-open');
      navBurger.setAttribute('aria-expanded', 'true');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    };
    const closeMenu = () => {
      mobileNav.classList.remove('is-open');
      navBurger.classList.remove('is-open');
      navEl.classList.remove('menu-open');
      navBurger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    };

    navBurger.addEventListener('click', () => {
      mobileNav.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  /* ========== APP SECTION — fake video injection (all viewports) ========== */
  document.querySelectorAll('.app-section').forEach((section) => {
    const screen = section.querySelector('.app-mockup__screen');
    if (!screen) return;
    const videoEl = document.createElement('div');
    videoEl.className = 'app-fake-video';
    videoEl.innerHTML =
      '<span class="afv__label">App preview</span>' +
      '<div class="afv__bar"><div class="afv__fill"></div></div>';
    screen.appendChild(videoEl);
  });

  /* ========== APP SECTION DESKTOP — scroll-pinned phone + fake video ========== */
  if (!reduceMotion && window.innerWidth > 900) {
    document.querySelectorAll('.app-section').forEach((section) => {
      const mockupWrap = section.querySelector('.app-mockup');
      const device     = section.querySelector('.app-mockup__device');
      const screen     = section.querySelector('.app-mockup__screen');
      const leftCol    = section.querySelector('.app-section__left');
      const eyebrow    = section.querySelector('.app-section__eyebrow');
      const features   = section.querySelector('.app-section__features');
      if (!mockupWrap || !screen) return;

      const videoEl = screen.querySelector('.app-fake-video');
      const fill = videoEl ? videoEl.querySelector('.afv__fill') : null;

      let off = { x: 0, y: 0 };
      let targetScale = 1.8;

      function computeState() {
        const sr = section.getBoundingClientRect();
        const mr = mockupWrap.getBoundingClientRect();
        off = {
          x: window.innerWidth  / 2 - (mr.left - sr.left + mr.width  / 2),
          y: window.innerHeight / 2 - (mr.top  - sr.top  + mr.height / 2),
        };
        targetScale = Math.min(1.8, (window.innerHeight * 0.86) / (device ? device.offsetHeight : 420));
      }

      computeState();

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          onRefresh: () => { computeState(); tl.invalidate(); },
        },
      });

      // Phase 0 (0→0.50) : hold — tout visible, le visiteur lit le contenu
      // Phase 1 (0.50→0.85) : texte disparaît, téléphone glisse au centre
      // Phase 2 (0.93→2.08) : vidéo / barre de chargement joue
      // Phase 3 (2.15→2.60) : téléphone revient, texte réapparaît
      tl
        // Téléphone apparaît dès le hold (fade-in rapide)
        .to(mockupWrap, { opacity: 1, duration: 0.12 }, 0)
        // Phase 1 — texte s'efface, téléphone glisse et grossit
        .to([eyebrow, leftCol, features], { opacity: 0, y: -28, duration: 0.35, stagger: 0.04 }, 0.50)
        .to(mockupWrap, { x: () => off.x, y: () => off.y, scale: () => targetScale, zIndex: 20, duration: 0.45 }, 0.50)
        // Phase 2 — preview joue
        .to(videoEl, { opacity: 1, duration: 0.08 }, 0.93)
        .to(fill,    { width: '100%', duration: 1.1  }, 1.00)
        .to(videoEl, { opacity: 0,   duration: 0.08  }, 2.08)
        // Phase 3 — téléphone revient, texte réapparaît
        .to(mockupWrap,                   { x: 0, y: 0, scale: 1, zIndex: 0, duration: 0.45 }, 2.15)
        .to([eyebrow, leftCol, features], { opacity: 1, y: 0, duration: 0.30, stagger: 0.04  }, 2.30);
    });
  }

  /* ========== APP SECTION MOBILE — simple scroll-driven loading bar ========== */
  if (!reduceMotion && window.innerWidth <= 900) {
    document.querySelectorAll('.app-section').forEach((section) => {
      const videoEl = section.querySelector('.app-fake-video');
      const fill = section.querySelector('.afv__fill');
      if (!videoEl || !fill) return;
      // Show overlay always on mobile
      videoEl.style.opacity = '1';
      // Drive the fill bar with scroll
      gsap.fromTo(fill,
        { width: '0%' },
        {
          width: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'bottom 30%',
            scrub: 0.5,
          },
        }
      );
    });
  }

  /* ========== REFRESH ON RESIZE ========== */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
})();
