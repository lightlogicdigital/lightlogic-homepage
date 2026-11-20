/* Light + Logic — GSAP motion: loading sequence, scroll scenes, interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const loader = $('.loader');
  const nav = $('.nav');

  // If GSAP failed to load, show the page as plain, static content.
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    loader && loader.remove();
    body.classList.remove('is-loading');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = matchMedia('(min-width: 901px)').matches;
  const H = isDesktop ? '.hero .art-d' : '.hero .art-m';
  const APEX = isDesktop ? '826 330' : '176 194';
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const refresh = () => ScrollTrigger.refresh();
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- Menu and anchors ---------- */
  const menu = $('.menu');
  const menuBtn = $('.menu-btn');
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'Close' : 'Menu';
    if (open) {
      lenis && lenis.stop();
      gsap.fromTo('.menu a', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.05 });
    } else lenis && lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      e.preventDefault();
      if (!menu.hidden) setMenu(false);
      const target = id.length > 1 && $(id);
      if (target) scrollToY(target.getBoundingClientRect().top + window.scrollY);
    })
  );

  /* ---------- Live clock (studio time) ---------- */
  const clockEl = $('[data-clock]');
  const clockFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'short' });
  const tick = () => {
    const parts = clockFmt.formatToParts(new Date());
    const g = (t) => (parts.find((p) => p.type === t) || {}).value;
    clockEl.textContent = `${g('hour')} : ${g('minute')} : ${g('second')} ${g('timeZoneName')}`;
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- Work rows (accordion) ---------- */
  const openRow = (r) => {
    const b = $('.row-body', r);
    r.classList.add('is-open');
    $('.row-head', r).setAttribute('aria-expanded', 'true');
    gsap.fromTo(b, { height: 0 }, { height: 'auto', duration: 0.9, ease: 'expo.inOut', onComplete: refresh });
    gsap.fromTo($$('.capture, .row-info', b), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.25, stagger: 0.08, ease: 'expo.out' });
  };
  const closeRow = (r) => {
    const b = $('.row-body', r);
    $('.row-head', r).setAttribute('aria-expanded', 'false');
    gsap.to(b, { height: 0, duration: 0.7, ease: 'expo.inOut', onComplete() { r.classList.remove('is-open'); gsap.set(b, { clearProps: 'height' }); refresh(); } });
  };
  $$('.row').forEach((row) =>
    $('.row-head', row).addEventListener('click', () => {
      const wasOpen = row.classList.contains('is-open');
      $$('.row.is-open').forEach(closeRow);
      if (!wasOpen) openRow(row);
    })
  );

  /* ---------- Capabilities ---------- */
  const caps = $$('.cap');
  const vigs = $$('.vig');
  const figLabels = ['Fig. 01 — Wireframe to finished page', 'Fig. 02 — A spreadsheet becomes a tool', 'Fig. 03 — A workflow that runs itself'];
  let capI = -1;
  let capPin = null;
  const setCap = (i, p) => {
    if (i !== capI) {
      capI = i;
      caps.forEach((c, k) => { c.classList.toggle('is-on', k === i); c.setAttribute('aria-selected', k === i); });
      vigs.forEach((v, k) => v.classList.toggle('is-on', k === i));
      $('[data-fig-label]').textContent = figLabels[i];
      $('[data-fig-count]').textContent = `0${i + 1} / 03`;
    }
    const v = vigs[i];
    if (i === 0) v.style.setProperty('--x', (88 - 76 * p).toFixed(1));
    else {
      const st = $$('.st', v);
      const k = Math.round(p * st.length);
      st.forEach((s, n) => s.classList.toggle('on', n < k));
    }
  };
  const playCap = (i) => {
    const o = { p: 0 };
    gsap.to(o, { p: 1, duration: 1.6, ease: 'power2.inOut', onUpdate: () => setCap(i, o.p) });
  };
  caps.forEach((c, i) =>
    c.addEventListener('click', () => {
      if (capPin) scrollToY(capPin.start + (capPin.end - capPin.start) * ((i + 0.75) / 3));
      else playCap(i);
    })
  );
  setCap(0, reduce ? 1 : 0);

  /* ---------- Lab: invoice builder ---------- */
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const baseRows = [['Demolition and site prep', '16 hr', 85, 1360], ['Framing, interior partitions', '42 hr', 85, 3570], ['Drywall materials', '1 lot', 2180, 2180]];
  const extraRows = [['Finish carpentry', '12 hr', 95, 1140], ['Paint and finishes', '1 lot', 1850, 1850], ['Final clean', '6 hr', 60, 360]];
  const rowsEl = $('.inv-rows');
  const addBtn = $('[data-add]');
  const shown = { v: 0 };
  let invRows = [...baseRows];
  const renderInvoice = (isAdd) => {
    rowsEl.innerHTML = invRows.map((r, i) => `<div class="inv-row${isAdd && i === invRows.length - 1 ? ' new' : ''}"><span>${r[0]}</span><span>${r[1]}</span><span>${fmt(r[2])}</span><span>${fmt(r[3])}</span></div>`).join('');
    const sub = invRows.reduce((a, r) => a + r[3], 0);
    gsap.to(shown, { v: sub, duration: reduce ? 0 : 0.8, ease: 'power2.out', onUpdate() {
      $('[data-sub]').textContent = fmt(shown.v);
      $('[data-tax]').textContent = fmt(shown.v * 0.06);
      $('[data-total]').textContent = '$' + fmt(shown.v * 1.06);
    } });
    if (isAdd && !reduce) gsap.from(rowsEl.lastElementChild, { height: 0, opacity: 0, duration: 0.6, ease: 'expo.out' });
  };
  renderInvoice(false);
  addBtn.addEventListener('click', () => {
    const n = invRows.length - baseRows.length;
    if (n < extraRows.length) {
      invRows.push(extraRows[n]);
      renderInvoice(true);
      addBtn.textContent = n + 1 < extraRows.length ? '+ Add a line' : 'Start over';
    } else {
      invRows = [...baseRows];
      renderInvoice(false);
      addBtn.textContent = '+ Add a line';
    }
  });

  /* ---------- Lab: workflow ---------- */
  const steps = $$('[data-step]');
  const runBtn = $('[data-run]');
  const flowState = $('[data-flow-state]');
  const flowCount = $('[data-flow-count]');
  let stage = 'idle';
  const mark = (i, prevLabel) => {
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (i > 0) { steps[i - 1].classList.add('is-done'); $('b', steps[i - 1]).textContent = prevLabel; }
    flowCount.textContent = `Step ${i + 1} of 4`;
  };
  const runFlow = () => {
    stage = 'running';
    steps.forEach((s) => { s.classList.remove('is-active', 'is-done'); $('b', s).textContent = '—'; });
    gsap.set('.bar u', { width: 0 });
    runBtn.disabled = true; runBtn.style.opacity = 0.5;
    flowState.textContent = 'Running';
    gsap.timeline()
      .call(() => mark(0))
      .to({}, { duration: 0.8 })
      .call(() => mark(1, 'Done'))
      .to({}, { duration: 0.9 })
      .call(() => mark(2, 'Yes'))
      .to('.bar u', { width: '100%', duration: 1.8, ease: 'power1.inOut', onUpdate() { $('b', steps[2]).textContent = Math.round(this.progress() * 100) + '%'; } })
      .call(() => {
        mark(3, 'Done');
        $('b', steps[3]).textContent = 'Waiting';
        stage = 'review';
        runBtn.disabled = false; runBtn.style.opacity = 1;
        runBtn.textContent = 'Approve and send';
        flowState.textContent = 'Needs you';
      });
  };
  runBtn.addEventListener('click', () => {
    if (stage === 'review') {
      steps[3].classList.remove('is-active'); steps[3].classList.add('is-done');
      $('b', steps[3]).textContent = 'Approved';
      stage = 'idle';
      runBtn.textContent = 'Run it again';
      flowState.textContent = 'Sent';
      flowCount.textContent = 'Complete';
    } else if (stage === 'idle') runFlow();
  });

  /* ---------- Brief choices ---------- */
  const choices = $$('.choice');
  choices.forEach((c) =>
    c.addEventListener('click', () => {
      choices.forEach((k) => k.setAttribute('aria-checked', k === c));
      $('.brief-next').hidden = false;
      $('[data-picked]').textContent = 'You picked: ' + $('.choice-t', c).textContent;
    })
  );

  /* ---------- Nav colour follows the section underneath ---------- */
  const navThemes = () =>
    $$('main > section').forEach((s) => {
      const light = s.classList.contains('light') || s.classList.contains('quiet');
      ScrollTrigger.create({ trigger: s, start: 'top 50px', end: 'bottom 50px', onToggle(self) { if (self.isActive) nav.classList.toggle('on-light', light); } });
    });

  /* ---------- Reduced motion: everything visible, no choreography ---------- */
  if (reduce) {
    loader && loader.remove();
    body.classList.remove('is-loading');
    navThemes();
    return;
  }

  /* ---------- Loading sequence ---------- */
  const playLoader = (onReveal) => {
    const art = $('.loader-art');
    $$('.hero .art').forEach((s) => art.appendChild(s.cloneNode(true)));
    const A = $(isDesktop ? '.art-d' : '.art-m', art);
    const sq1 = $('.a-sq1', A), sq2 = $('.a-sq2', A), ov = $('.a-ov', A), beam = $('.a-beam', A), fan = $('.a-fan', A);
    const len1 = isDesktop ? 336 : 176, len2 = isDesktop ? 330 : 170;
    const bands = $$('.loader-bands i');
    const countEl = $('.loader-count');
    const count = { v: 0 };
    gsap.set(sq1, { fillOpacity: 0, strokeDasharray: len1, strokeDashoffset: len1 });
    gsap.set(sq2, { fillOpacity: 0, strokeDasharray: len2, strokeDashoffset: len2 });
    gsap.set(ov, { opacity: 0 });
    gsap.set(beam, { scaleX: 0, svgOrigin: isDesktop ? '0 374' : '0 215' });
    gsap.set(fan, { scale: 0, svgOrigin: APEX });
    gsap.set(bands, { xPercent: -101, x: 0 });

    const tl = gsap.timeline({ onComplete: () => loader.remove() });
    tl.to('.loader-grid', { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0)
      // logic: the mark draws on a grid while the counter runs
      .to(count, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate() { countEl.textContent = String(Math.round(count.v)).padStart(3, '0'); } }, 0)
      .to(sq1, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.15)
      .to(sq2, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.35)
      // light: the beam arrives and strikes the mark
      .to(beam, { scaleX: 1, duration: 0.55, ease: 'power3.in' }, 1.25)
      .to(sq1, { fillOpacity: 1, duration: 0.12 }, 1.8)
      .to(sq2, { fillOpacity: 0.55, duration: 0.3 }, 1.8)
      .to(ov, { opacity: 1, duration: 0.3 }, 1.8)
      .to('.loader-flash', { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }, 1.8)
      .to('.loader-flash', { opacity: 0.3, duration: 0.6 }, 2.15)
      .to('.loader-grid', { opacity: 0, duration: 0.5 }, 1.8)
      // the spectrum bursts wide, then settles
      .to(fan, { scale: 1.9, duration: 0.7, ease: 'expo.out' }, 1.85)
      .to(fan, { scale: 1, duration: 0.6, ease: 'power3.inOut' }, 2.5)
      // four bands of colour wipe the screen and hand over to the page
      .addLabel('wipe', 2.8)
      .to(bands, { xPercent: 101, duration: 1.1, ease: 'power3.inOut', stagger: 0.09 }, 'wipe')
      .call(() => {
        loader.style.background = 'none';
        $$('.loader-grid, .loader-flash, .loader-art, .loader-meta').forEach((n) => (n.style.display = 'none'));
        onReveal();
      }, null, 'wipe+=0.55');
    if (sessionStorage.getItem('ll-seen')) tl.timeScale(1.9);
    sessionStorage.setItem('ll-seen', '1');
  };

  /* ---------- Hero intro ---------- */
  let heroWords = [];
  const heroIn = () => {
    body.classList.remove('is-loading');
    lenis && lenis.start();
    const movers = $$('.hero-lede, .hero-actions > *, .nav > *');
    gsap.set(movers, { transition: 'none' });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from(`${H} .a-fan`, { scale: 1.6, svgOrigin: APEX, duration: 1.8 }, 0)
      .from('.hero-glow', { opacity: 0, scale: 0.6, duration: 1.6 }, 0)
      .from('.hero-label', { opacity: 0, y: 16, duration: 0.8 }, 0.2)
      .from(heroWords, { yPercent: 115, duration: 1.2, stagger: 0.06 }, 0.25)
      .from('.nav > *', { opacity: 0, y: -20, duration: 0.9, stagger: 0.07, clearProps: 'transform,opacity,transition' }, 0.5)
      .from('.hero-lede, .hero-actions > *', { opacity: 0, y: 24, duration: 1, stagger: 0.08, clearProps: 'transform,opacity,transition' }, 0.7)
      .from('.status', { opacity: 0, y: 30, duration: 1 }, 0.9);
    gsap.to(`${H} .a-fan`, { opacity: 0.7, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });
    refresh();
  };

  /* ---------- Scroll scenes ---------- */
  const scenes = () => {
    // Headline splits (lines are masked, words rise)
    const words = new Map();
    $$('.split').forEach((el) => words.set(el, SplitText.create(el, { type: 'lines,words', linesClass: 'ln' }).words));
    heroWords = $$('.hero-title .split').flatMap((el) => words.get(el));
    $$('.sec-title, .brief-title').forEach((h) =>
      gsap.from($$('.split', h).flatMap((el) => words.get(el)), { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 88%' } })
    );

    // Hero drifts away as you leave it
    gsap.to(H, { yPercent: 14, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-content', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Manifesto: pinned, lights up word by word
    const mWords = SplitText.create('.manifesto-text', { type: 'words' }).words;
    gsap.timeline({ scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '+=130%', pin: true, scrub: 0.5 } })
      .fromTo(mWords, { opacity: 0.13 }, { opacity: 1, stagger: 0.05, ease: 'none' })
      .from('.signature', { opacity: 0, y: 20, duration: 0.6 }, '>-0.2');

    // Work rows
    gsap.from('.work .row', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: '.work-list', start: 'top 85%' } });

    // Capabilities: pinned on desktop, scroll drives the three figures
    if (isDesktop) {
      capPin = ScrollTrigger.create({
        trigger: '.caps', start: 'top top', end: '+=240%', pin: true, scrub: true,
        onUpdate(self) {
          const t = Math.min(2.999, self.progress * 3);
          const i = Math.floor(t);
          setCap(i, gsap.utils.clamp(0, 1, (t - i) * 1.25));
        },
      });
    } else {
      ScrollTrigger.create({ trigger: '.fig', start: 'top 75%', once: true, onEnter: () => playCap(0) });
    }

    // Generic rises
    $$('[data-rv]').forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));

    // Proof: the line draws, the quote lights up
    gsap.from('.prism-line', { scaleX: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.proof', start: 'top 70%' } });
    const qWords = SplitText.create('.quote', { type: 'words' }).words;
    gsap.fromTo(qWords, { opacity: 0.14 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top 80%', end: 'bottom 45%', scrub: 0.5 } });

    // Method, founder, notes
    gsap.from('.steps li', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.steps', start: 'top 82%' } });
    gsap.fromTo('.portrait', { clipPath: 'inset(100% 0% 0% 0% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.founder', start: 'top 75%' } });
    gsap.from('.founder-text > *', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.founder', start: 'top 70%' } });
    gsap.from('.note', { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.notes-list', start: 'top 85%' } });

    // Brief: the light floods in, the choices rise
    gsap.fromTo('.flood', { scaleY: 0.2, opacity: 0 }, { scaleY: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.brief', start: 'top 90%', end: 'top 10%', scrub: true } });
    gsap.set(choices, { transition: 'none' });
    gsap.from(choices, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity,transition', scrollTrigger: { trigger: '.choices', start: 'top 92%' } });

    // Ambient: blooms drift slowly
    $$('.bloom').forEach((b) => gsap.to(b, { xPercent: gsap.utils.random(-10, 10), yPercent: gsap.utils.random(-10, 10), duration: gsap.utils.random(8, 14), yoyo: true, repeat: -1, ease: 'sine.inOut' }));

    // Nav hides on the way down, returns on the way up
    let hidden = false;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate(self) {
      const hide = self.direction === 1 && self.scroll() > 300;
      if (hide !== hidden) { hidden = hide; gsap.to(nav, { yPercent: hide ? -220 : 0, duration: 0.6, ease: 'power3.out' }); }
    } });

    navThemes();
    ScrollTrigger.sort();
    refresh();
  };

  const start = () => { scenes(); playLoader(heroIn); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  window.addEventListener('load', refresh);
})();
