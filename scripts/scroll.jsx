// ═══════════════════════════════════════════════════════════════════════════
// scroll.jsx — the scroll/motion runtime.
//
// Single responsibility: every scroll-derived UI effect on the site (reveals,
// progress bar, scroll-spy, hero scroll-link, parallax, viewport counters) and
// the one motion switch they all consult.
//
// Public entrypoint: the Object.assign(window, …) at the bottom of this file
// (pattern: data.jsx:477, tweaks-panel.jsx:526). Nothing above it is reachable
// from another script.
//
// Why the IIFE: Babel standalone runs each text/babel file as a classic script,
// so top-level `const`/`function` declarations share ONE global lexical scope.
// app.jsx:2 and project.jsx:3 already declare `const { useState, useEffect,
// useRef } = React` at top level — a second top-level `const useState` here
// would be a SyntaxError that kills the whole file. Wrapping keeps every
// internal name off the shared scope and makes the window export the only door.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  const { useState, useEffect, useRef } = React;

  // ─────────────── Tuning constants (Design Spec ranges) ───────────────

  const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

  // Reveals: pre-reveal anything already on screen at mount, observe the rest.
  const REVEAL_SELECTOR =
    '.reveal:not(.in), .principle:not(.in), .stack-cell:not(.in), .approach .row:not(.in), .cell:not(.in)';
  const REVEALED_CLASS = 'in';
  const REVEAL_THRESHOLD = 0.12;
  const REVEAL_ROOT_MARGIN = '0px 0px -6% 0px';
  const PRE_REVEAL_VH_RATIO = 0.95;

  // Scroll-spy: a narrow band under the fixed nav decides the active section.
  const SPY_ROOT_MARGIN = '-40% 0px -55% 0px';

  // Hero scroll-link: scale 1 → 0.96 and opacity 1 → 0.35 over the first 85vh.
  const HERO_RANGE_VH_RATIO = 0.85;
  const HERO_END_SCALE = 0.96;
  const HERO_END_OPACITY = 0.35;
  const HERO_LINK_CLASS = 'motion-hero-link';

  // Parallax: ±24px of travel, off on narrow viewports.
  const PARALLAX_MAX_PX = 24;
  const PARALLAX_OFF_QUERY = '(max-width: 720px)';
  const PARALLAX_CLASS = 'motion-parallax';

  // Viewport counter.
  const COUNTUP_THRESHOLD = 0.5;
  const COUNTUP_DURATION_MS = 1200;

  const PROGRESS_BAR_ID = 'scroll-bar';

  // ─────────────── Internal helpers (not exported) ───────────────

  const clamp01 = (n) => Math.min(1, Math.max(0, n));

  /**
   * Live-updating media-query state. Seeded synchronously so the first paint
   * already reflects the real match (no flash of the wrong motion state).
   */
  function useMediaQuery(query){
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
      const mql = window.matchMedia(query);
      const onChange = (e) => setMatches(e.matches);
      setMatches(mql.matches);
      if(mql.addEventListener) mql.addEventListener('change', onChange);
      else mql.addListener(onChange);                       // Safari < 14
      return () => {
        if(mql.removeEventListener) mql.removeEventListener('change', onChange);
        else mql.removeListener(onChange);
      };
    }, [query]);
    return matches;
  }

  /**
   * Runs `update` at most once per animation frame on scroll and resize, plus
   * once immediately so the effect's first state is correct without waiting for
   * input. Returns an unsubscribe that also cancels any frame still pending.
   * requestAnimationFrame never returns 0, so `frame` doubles as the "pending"
   * flag.
   */
  function subscribeToScroll(update){
    let frame = 0;
    function run(){ frame = 0; update(); }
    function schedule(){ if(!frame) frame = requestAnimationFrame(run); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if(frame) cancelAnimationFrame(frame);
    };
  }

  // ─────────────── Motion switch ───────────────

  /**
   * The SINGLE motion switch. Every JS motion path in this file consults it,
   * and it updates live when the OS/browser preference changes.
   */
  function useReducedMotion(){
    return useMediaQuery(REDUCED_MOTION_QUERY);
  }

  // ─────────────── Reveals ───────────────

  /**
   * Adds `.in` to reveal targets as they enter the viewport.
   *
   * The default selector covers both pages (index sections and project detail
   * sections). Under reduced motion every match is revealed immediately —
   * content is never left hidden behind an animation that will not run.
   */
  function useReveal(selector = REVEAL_SELECTOR){
    const reduced = useReducedMotion();
    useEffect(() => {
      let io = null;

      function attach(){
        const els = document.querySelectorAll(selector);
        if(els.length === 0) return;

        if(reduced){
          els.forEach(el => el.classList.add(REVEALED_CLASS));
          return;
        }

        // Anything already on screen at mount reveals now, with no IO wait.
        const vh = window.innerHeight;
        els.forEach(el => {
          const r = el.getBoundingClientRect();
          if(r.top < vh * PRE_REVEAL_VH_RATIO && r.bottom > 0) el.classList.add(REVEALED_CLASS);
        });

        io && io.disconnect();
        io = new IntersectionObserver((entries) => {
          for(const e of entries){
            if(e.isIntersecting){ e.target.classList.add(REVEALED_CLASS); io.unobserve(e.target); }
          }
        }, { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN });
        els.forEach(el => { if(!el.classList.contains(REVEALED_CLASS)) io.observe(el); });
      }

      attach();

      // Re-attach when content changes (project layout swap, hero variant
      // swap). childList/subtree only: writing a class is an attribute
      // mutation, so this observer can never retrigger itself.
      const mo = new MutationObserver(() => attach());
      mo.observe(document.body, { childList: true, subtree: true });

      return () => { io && io.disconnect(); mo.disconnect(); };
    }, [selector, reduced]);
  }

  // ─────────────── Scroll progress ───────────────

  /**
   * The SOLE writer of the #scroll-bar element. Call once per page root.
   *
   * Document height is re-read every frame rather than cached, so lazy media,
   * font swaps, and layout changes cannot leave the bar mis-scaled. No-ops
   * gracefully when the page has no progress bar.
   */
  function useScrollProgress(){
    useEffect(() => {
      let bar = document.getElementById(PROGRESS_BAR_ID);
      return subscribeToScroll(() => {
        if(!bar) bar = document.getElementById(PROGRESS_BAR_ID);
        if(!bar) return;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
        bar.style.width = (clamp01(ratio) * 100) + '%';
      });
    }, []);
  }

  // ─────────────── Scroll spy ───────────────

  /**
   * Returns the id of the section currently under the nav, for nav highlighting.
   *
   * `ids` is expected in document order, so the first intersecting id is the
   * topmost one. The last active id is held when nothing intersects, so the
   * highlight never blinks off between sections.
   */
  function useScrollSpy(ids){
    const [activeId, setActiveId] = useState(null);
    // Depend on the contents, not the array identity — callers pass literals.
    const key = Array.isArray(ids) ? ids.join(',') : '';
    useEffect(() => {
      const list = key ? key.split(',') : [];
      const els = list.map(id => document.getElementById(id)).filter(Boolean);
      if(els.length === 0) return;

      const visible = new Set();
      const io = new IntersectionObserver((entries) => {
        for(const e of entries){
          if(e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const topmost = list.find(id => visible.has(id));
        if(topmost) setActiveId(topmost);
      }, { rootMargin: SPY_ROOT_MARGIN, threshold: 0 });

      els.forEach(el => io.observe(el));
      return () => io.disconnect();
    }, [key]);
    return activeId;
  }

  // ─────────────── Hero scroll-link ───────────────

  /**
   * Scales and fades the ref'd hero as the first 85vh of the page scrolls past.
   * Transform + opacity only (no layout work), rAF-throttled.
   *
   * Under reduced motion the element's styles are never touched, and any styles
   * a previous active run wrote are cleared on cleanup.
   */
  function useHeroScrollLink(ref){
    const reduced = useReducedMotion();
    useEffect(() => {
      const el = ref && ref.current;
      if(!el || reduced) return;

      el.classList.add(HERO_LINK_CLASS);
      const unsubscribe = subscribeToScroll(() => {
        const range = window.innerHeight * HERO_RANGE_VH_RATIO;
        const t = range > 0 ? clamp01(window.scrollY / range) : 0;
        el.style.transform = 'scale(' + (1 - (1 - HERO_END_SCALE) * t) + ')';
        el.style.opacity = String(1 - (1 - HERO_END_OPACITY) * t);
      });

      return () => {
        unsubscribe();
        el.classList.remove(HERO_LINK_CLASS);
        el.style.transform = '';
        el.style.opacity = '';
      };
    }, [ref, reduced]);
  }

  // ─────────────── Parallax ───────────────

  /**
   * Drifts the ref'd element between -maxPx and +maxPx as it crosses the
   * viewport, so it reads as travelling slightly slower than the page.
   *
   * Disabled at ≤720px and under reduced motion; in both cases the element's
   * styles are left untouched.
   */
  function useParallax(ref, maxPx = PARALLAX_MAX_PX){
    const reduced = useReducedMotion();
    const narrow = useMediaQuery(PARALLAX_OFF_QUERY);
    useEffect(() => {
      const el = ref && ref.current;
      if(!el || reduced || narrow) return;

      el.classList.add(PARALLAX_CLASS);
      const unsubscribe = subscribeToScroll(() => {
        const rect = el.getBoundingClientRect();
        const span = window.innerHeight + rect.height;
        if(span <= 0) return;
        // 0 = top edge entering from the bottom, 1 = bottom edge leaving the top.
        const progress = clamp01((window.innerHeight - rect.top) / span);
        el.style.transform = 'translateY(' + ((progress - 0.5) * 2 * maxPx).toFixed(2) + 'px)';
      });

      return () => {
        unsubscribe();
        el.classList.remove(PARALLAX_CLASS);
        el.style.transform = '';
      };
    }, [ref, maxPx, reduced, narrow]);
  }

  // ─────────────── Viewport counter ───────────────

  /**
   * Counts 0 → end once the number scrolls into view.
   * Under reduced motion it renders `end` immediately, with no rAF loop and no
   * IntersectionObserver wait.
   */
  function CountUp({ end, duration = COUNTUP_DURATION_MS, suffix = "" }){
    const reduced = useReducedMotion();
    const [val, setVal] = useState(() => (reduced ? end : 0));
    const ref = useRef(null);

    useEffect(() => {
      if(reduced){ setVal(end); return; }
      if(!ref.current) return;

      let frame = 0;
      const io = new IntersectionObserver((entries) => {
        for(const e of entries){
          if(e.isIntersecting){
            const t0 = performance.now();
            function tick(now){
              const t = Math.min(1, (now - t0) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setVal(Math.round(end * eased));
              if(t < 1) frame = requestAnimationFrame(tick);
            }
            frame = requestAnimationFrame(tick);
            io.disconnect();
          }
        }
      }, { threshold: COUNTUP_THRESHOLD });

      io.observe(ref.current);
      return () => { io.disconnect(); if(frame) cancelAnimationFrame(frame); };
    }, [end, duration, reduced]);

    return <span ref={ref} className="num">{val}{suffix}</span>;
  }

  // ─────────────── Public entrypoint ───────────────

  Object.assign(window, {
    useReducedMotion,
    useReveal,
    useScrollProgress,
    useScrollSpy,
    useHeroScrollLink,
    useParallax,
    CountUp,
  });
})();
