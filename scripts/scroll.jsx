// ═══════════════════════════════════════════════════════════════════════════
// scroll.jsx — the scroll/motion runtime.
//
// Single responsibility: every scroll-derived UI effect on the site (scrubbed
// keyframe entries, reveals, progress bar, scroll-spy, parallax, desktop smooth
// scrolling) and the one motion switch they all consult.
//
// ONE dispatcher for the whole page. Every effect below is an *entry* in a
// shared registry; a single scroll/resize-driven rAF tick walks it twice per
// frame — all reads first (viewport, trigger rects, viewport-unit resolution),
// then all writes. Nothing in this file may read layout during the write pass,
// because that is what turns N cheap effects into N forced reflows.
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
  const { useState, useEffect, useLayoutEffect, useRef } = React;

  // ─────────────── Tuning constants (Design Spec ranges) ───────────────

  const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  // A media query that can never match. It is the default for `opts.offQuery`
  // so the number of hooks useScrub calls never depends on the caller.
  const NEVER_QUERY = 'not all';

  // Reveals: pre-reveal anything already on screen at mount, observe the rest.
  const REVEAL_SELECTOR =
    '.reveal:not(.in), .mask-reveal:not(.in), .principle:not(.in), .stack-cell:not(.in), .approach .row:not(.in), .cell:not(.in)';
  const REVEALED_CLASS = 'in';
  const REVEAL_THRESHOLD = 0.12;
  const REVEAL_ROOT_MARGIN = '0px 0px -6% 0px';
  const PRE_REVEAL_VH_RATIO = 0.95;

  // Scroll-spy: a narrow band under the fixed nav decides the active section.
  const SPY_ROOT_MARGIN = '-40% 0px -55% 0px';

  // Scrub engine.
  const SCRUB_CLASS = 'motion-scrub';
  const SCRUB_DEFAULT_MODE = 'cross';
  const SCRUB_DEFAULT_END_AT = 0.6;          // `enter` mode: 1 at 0.6vh from the top
  const SCRUB_SETTLE_EPSILON = 0.001;        // damped entries stop ticking below this
  const SCRUB_DECIMALS = 4;                  // unitless output precision

  // Parallax: ±24px of travel, off on narrow viewports.
  const PARALLAX_MAX_PX = 24;
  const PARALLAX_OFF_QUERY = '(max-width: 720px)';
  const PARALLAX_CLASS = 'motion-parallax';

  // Smooth scroll (desktop only — every gate below must hold).
  const SMOOTH_POINTER_QUERY = '(pointer: fine) and (hover: hover)';
  // 561px is the first height that still pins: it mirrors the 560px pin-off
  // breakpoint shared by theme.css and HERO_PIN_OFF_QUERY (app.jsx).
  const SMOOTH_VIEWPORT_QUERY = '(min-width: 900px) and (min-height: 561px)';
  const SMOOTH_LERP = 0.12;                 // gap fraction closed per baseline frame
  const SMOOTH_FRAME_MS = 16.7;             // the 60Hz baseline SMOOTH_LERP is defined against
  const SMOOTH_MAX_FRAME_MS = 50;           // a stalled tab must not teleport the page
  const SMOOTH_SETTLE_PX = 0.5;             // below this the glide snaps exactly and sleeps
  const SMOOTH_EXTERNAL_PX = 2;             // a bigger gap than this was opened from outside
  const WHEEL_LINE_PX = 16;                 // deltaMode 1 (lines) → px
  const WHEEL_AXIS_DOMINANCE = 1.2;         // |deltaX| past this multiple of |deltaY| is horizontal
  const SCROLL_LOCK_VALUE = 'hidden';       // the inline body overflow the lightbox writes
  const HASH_TOP = '#top';

  const PROGRESS_BAR_ID = 'scroll-bar';

  // Wake sources beyond scroll/resize: a shared ResizeObserver over every
  // registered node, plus media that changes a box only once its bytes land.
  const MEDIA_SELECTOR = 'img, video, iframe';
  const MEDIA_WAKE_EVENTS = ['load', 'loadedmetadata'];

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

  // ═════════════════ Shared dispatcher ═════════════════
  //
  // An entry is `{ nodes, read(ctx), write(ctx) -> boolean, dispose() }`.
  // `nodes` are the elements whose resize/media-load should wake the tick;
  // `write` returns true while the entry still needs another frame (damping).

  const entries = [];
  let dispatcherFrame = 0;
  let dispatcherAttached = false;
  let resizeObserver = null;
  let initialFlushQueued = false;
  // Refcounted so unregistering one entry cannot blind another that shares the
  // same trigger node.
  const observedNodes = new Map();

  /**
   * Runs the whole registry once: the smoother's scroll write, then every read,
   * then every write. Damped entries ask for the next frame themselves, and so
   * does an unsettled glide; everything else sleeps until the next wake event.
   * requestAnimationFrame never returns 0, so `dispatcherFrame` doubles as the
   * "pending" flag.
   *
   * `now` is the rAF timestamp, and is absent on the mount flush (a microtask,
   * not a frame) — the smoother falls back to its baseline step there.
   */
  function runDispatch(now){
    dispatcherFrame = 0;
    // The glide writes the scroll position FIRST, so every rect read below
    // reflects this frame's movement instead of trailing it by one.
    const smooth = stepSmoother(now);
    if(entries.length === 0 && !smoothingNeedsFrame) return;
    const ctx = { vh: window.innerHeight, vw: window.innerWidth, scrollY: window.scrollY, smooth: smooth };
    for(let i = 0; i < entries.length; i++) entries[i].read(ctx);
    let again = false;
    for(let i = 0; i < entries.length; i++){
      if(entries[i].write(ctx) === true) again = true;
    }
    if(again || smoothingNeedsFrame) dispatcherFrame = requestAnimationFrame(runDispatch);
  }

  function scheduleDispatch(){
    if(!dispatcherFrame) dispatcherFrame = requestAnimationFrame(runDispatch);
  }

  function attachDispatcher(){
    if(dispatcherAttached) return;
    dispatcherAttached = true;
    window.addEventListener('scroll', scheduleDispatch, { passive: true });
    window.addEventListener('resize', scheduleDispatch, { passive: true });
    if(typeof ResizeObserver !== 'undefined') resizeObserver = new ResizeObserver(scheduleDispatch);
  }

  function detachDispatcher(){
    if(!dispatcherAttached) return;
    dispatcherAttached = false;
    window.removeEventListener('scroll', scheduleDispatch);
    window.removeEventListener('resize', scheduleDispatch);
    if(resizeObserver){ resizeObserver.disconnect(); resizeObserver = null; }
    observedNodes.clear();
    if(dispatcherFrame){ cancelAnimationFrame(dispatcherFrame); dispatcherFrame = 0; }
    // The smoother is not a registry entry: an emptied registry must not cancel
    // a glide that still owes the page frames.
    if(smoothingNeedsFrame) scheduleDispatch();
  }

  function observeNode(node){
    if(!node) return;
    const n = observedNodes.get(node) || 0;
    observedNodes.set(node, n + 1);
    if(n === 0 && resizeObserver) resizeObserver.observe(node);
  }

  function unobserveNode(node){
    if(!node) return;
    const n = observedNodes.get(node) || 0;
    if(n > 1){ observedNodes.set(node, n - 1); return; }
    observedNodes.delete(node);
    if(resizeObserver) resizeObserver.unobserve(node);
  }

  function attachWake(entry){
    const nodes = entry.nodes || [];
    const media = [];
    for(const node of nodes){
      observeNode(node);
      if(node.matches && node.matches(MEDIA_SELECTOR)) media.push(node);
      if(node.querySelectorAll){
        node.querySelectorAll(MEDIA_SELECTOR).forEach(m => media.push(m));
      }
    }
    media.forEach(m => MEDIA_WAKE_EVENTS.forEach(ev => m.addEventListener(ev, scheduleDispatch)));
    entry.wakeMedia = media;
  }

  function detachWake(entry){
    (entry.nodes || []).forEach(unobserveNode);
    if(entry.wakeMedia){
      entry.wakeMedia.forEach(m => MEDIA_WAKE_EVENTS.forEach(ev => m.removeEventListener(ev, scheduleDispatch)));
      entry.wakeMedia = null;
    }
  }

  /**
   * The initial write must be the entry's ACTUAL progress, not a blind `at: 0`
   * — a page restored mid-scroll would otherwise paint the from-state once and
   * snap. Registration happens in a layout effect, so a microtask still lands
   * before paint, and batching every sibling registration into ONE flush keeps
   * the read/write split intact on mount too.
   */
  function queueInitialFlush(){
    if(initialFlushQueued) return;
    initialFlushQueued = true;
    Promise.resolve().then(() => {
      initialFlushQueued = false;
      if(dispatcherFrame){ cancelAnimationFrame(dispatcherFrame); dispatcherFrame = 0; }
      runDispatch();
    });
  }

  function registerEntry(entry){
    if(!entry) return () => {};
    attachDispatcher();
    entries.push(entry);
    attachWake(entry);
    queueInitialFlush();
    return function unregister(){
      const i = entries.indexOf(entry);
      if(i >= 0) entries.splice(i, 1);
      detachWake(entry);
      entry.dispose();
      if(entries.length === 0) detachDispatcher();
    };
  }

  // ═════════════════ Smooth scroll (desktop, gated) ═════════════════
  //
  // The wheel is intercepted and accumulates a VIRTUAL target; each dispatcher
  // frame lerps the REAL scroll position toward it (window.scrollTo) ahead of
  // the read pass. Because the real scroll position IS the smoothed one, every
  // consumer stays correct without knowing this exists: position:sticky pins,
  // progress math, IntersectionObservers (reveals, spy, nav tone), the progress
  // bar, and browser scroll restoration.
  //
  // Every other input stays native. A keyboard, a scrollbar drag or a history
  // restore moves the page out from under the glide; the engine notices the gap
  // and adopts the new position instead of fighting it back.

  let smoothEnabled = false;         // gates hold AND the listeners are attached
  let smoothingNeedsFrame = false;   // an unsettled glide owes the page a frame
  let smoothTargetY = 0;             // where the wheel (or an anchor) says we are going
  let smoothCurrentY = 0;            // the glide's own float position; scrollY rounds it
  let smoothLastWrittenY = 0;        // the last position THIS engine put on the page
  let smoothLastTs = 0;              // rAF timestamp of the previous advance

  const maxScrollY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const clampScrollY = (y) => Math.min(maxScrollY(), Math.max(0, y));

  // The lightbox's scroll-lock contract: an inline `overflow:hidden` on body.
  const isScrollLocked = () => document.body.style.overflow === SCROLL_LOCK_VALUE;

  /** Adopts the page's current position as the entire smoother state. */
  function syncSmoothToPage(){
    smoothTargetY = smoothCurrentY = smoothLastWrittenY = window.scrollY;
    smoothLastTs = 0;
  }

  /**
   * Absorbs a move nobody here made — keyboard, scrollbar drag, anchor default,
   * history restore. Adopting it is what makes those land EXACTLY where the
   * browser put them instead of being dragged back by a stale target.
   */
  function absorbExternalScroll(){
    if(Math.abs(window.scrollY - smoothLastWrittenY) <= SMOOTH_EXTERNAL_PX) return false;
    syncSmoothToPage();
    return true;
  }

  function setSmoothTarget(y){
    smoothTargetY = clampScrollY(y);
    smoothingNeedsFrame = true;
    scheduleDispatch();
  }

  /** Cancels any pending travel and leaves the page exactly where it stands. */
  function cancelGlide(){
    syncSmoothToPage();
    smoothingNeedsFrame = false;
  }

  /**
   * One glide step, run as the FIRST thing in a dispatcher frame. Returns true
   * on frames it actually moved (or exactly settled) the page — that is what
   * `ctx.smooth` reports to the entries, so per-entry damping only applies on
   * the frames the global glide did NOT already provide the inertia.
   */
  function stepSmoother(now){
    if(!smoothEnabled || !smoothingNeedsFrame) return false;
    // A locked page (lightbox open) must not be glided out from under the
    // overlay: drop the pending travel and adopt wherever the page is parked.
    if(isScrollLocked()){ cancelGlide(); return false; }
    absorbExternalScroll();

    // Re-read the end of the document every frame: lazy media, font swaps and
    // reveals change it mid-glide, and a target past the end never arrives.
    smoothTargetY = clampScrollY(smoothTargetY);
    const distance = smoothTargetY - smoothCurrentY;
    if(Math.abs(distance) <= SMOOTH_SETTLE_PX){
      smoothCurrentY = smoothTargetY;
      smoothingNeedsFrame = false;
      smoothLastTs = 0;
    } else {
      const usable = (typeof now === 'number' && isFinite(now));
      const elapsed = (smoothLastTs && usable) ? now - smoothLastTs : 0;
      const dtMs = (elapsed > 0) ? Math.min(elapsed, SMOOTH_MAX_FRAME_MS) : SMOOTH_FRAME_MS;
      smoothLastTs = usable ? now : 0;
      // Frame-rate corrected: SMOOTH_LERP is a per-60Hz-frame fraction, so a
      // 120Hz display closes the same share of the gap per unit TIME.
      smoothCurrentY += distance * (1 - Math.pow(1 - SMOOTH_LERP, dtMs / SMOOTH_FRAME_MS));
    }
    window.scrollTo(0, smoothCurrentY);
    // What the page ACTUALLY took, never what was asked for: a clamp at the
    // document end or device-pixel rounding is not an external scroll.
    smoothLastWrittenY = window.scrollY;
    return true;
  }

  // ─────────────── Wheel capture ───────────────

  function normalizedWheelDelta(e){
    if(e.deltaMode === 1) return e.deltaY * WHEEL_LINE_PX;      // lines
    if(e.deltaMode === 2) return e.deltaY * window.innerHeight;  // pages
    return e.deltaY;
  }

  /**
   * The nearest ancestor that scrolls its own content — the tweaks panel today,
   * any future scroll region for free. A wheel inside one is left alone:
   * intercepting there would steal the region's own scrolling.
   */
  function scrollableAncestor(node){
    let el = (node && node.nodeType === 1) ? node : null;
    while(el && el !== document.body && el !== document.documentElement){
      // The cheap geometry test first: getComputedStyle is the expensive half
      // and most ancestors cannot scroll at all.
      if(el.scrollHeight > el.clientHeight){
        const overflowY = window.getComputedStyle(el).overflowY;
        if(overflowY === 'auto' || overflowY === 'scroll') return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * The ONLY place the page's own wheel is prevented. Every bail-out below
   * leaves the event untouched, so the browser's native behaviour is what
   * happens — zoom, horizontal history gestures, an inner scroll region, a
   * locked page, or an event another handler already claimed.
   */
  function onWheel(e){
    if(e.ctrlKey || e.shiftKey || e.defaultPrevented) return;
    if(Math.abs(e.deltaX) > Math.abs(e.deltaY) * WHEEL_AXIS_DOMINANCE) return;
    if(isScrollLocked()){ cancelGlide(); return; }
    if(scrollableAncestor(e.target)) return;
    const delta = normalizedWheelDelta(e);
    if(!delta) return;
    e.preventDefault();
    // The page may have moved natively since the last glide (keyboard, drag):
    // accumulate onto where it IS, not onto a target that describes the past.
    absorbExternalScroll();
    setSmoothTarget(smoothTargetY + delta);
  }

  // ─────────────── Anchor glide ───────────────

  /** The element a hash points at; null when it resolves to nothing. */
  function hashTarget(hash){
    const raw = hash.slice(1);
    if(!raw) return null;
    const byId = document.getElementById(raw);
    if(byId) return byId;
    let decoded = null;
    try { decoded = decodeURIComponent(raw); } catch(err){ return null; }
    return (decoded !== raw) ? document.getElementById(decoded) : null;
  }

  /**
   * Same-document hash links glide instead of jumping. Everything else is left
   * to the browser: modified clicks, keyboard activation, new-tab/download
   * links, cross-document hashes, and any hash that resolves to no element (the
   * browser scrolls nowhere for those too — forging a history entry for one
   * would be worse than doing nothing).
   */
  function onAnchorClick(e){
    if(e.defaultPrevented || e.button !== 0) return;
    if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if(e.detail === 0) return;                    // keyboard activation stays native
    const link = (e.target && e.target.closest) ? e.target.closest('a[href]') : null;
    if(!link || link.hasAttribute('target') || link.hasAttribute('download')) return;

    // Same DOCUMENT, not merely same origin: `index.html#work` from a project
    // page is a real navigation and must stay native.
    let url = null;
    try { url = new URL(link.href, document.baseURI); } catch(err){ return; }
    if(url.origin !== location.origin) return;
    if(url.pathname !== location.pathname || url.search !== location.search) return;

    const href = link.getAttribute('href') || '';
    // A bare '#' carries no hash of its own through the URL parser.
    const hash = url.hash || (href.indexOf('#') >= 0 ? '#' : '');
    if(!hash) return;

    let y = 0;
    if(hash !== '#' && hash !== HASH_TOP){
      const el = hashTarget(hash);
      if(!el) return;
      y = el.getBoundingClientRect().top + window.scrollY;
    }
    e.preventDefault();
    absorbExternalScroll();
    setSmoothTarget(y);
    if(history.pushState) history.pushState(null, '', hash);
  }

  // ─────────────── Enable / disable ───────────────

  function enableSmoothScroll(){
    if(smoothEnabled) return;
    smoothEnabled = true;
    cancelGlide();
    // Non-passive: preventing the page's own wheel is this listener's whole job.
    window.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('click', onAnchorClick);
  }

  function disableSmoothScroll(){
    if(!smoothEnabled) return;
    smoothEnabled = false;
    window.removeEventListener('wheel', onWheel);
    document.removeEventListener('click', onAnchorClick);
    cancelGlide();
  }

  // ═════════════════ Keyframe value model ═════════════════
  //
  // A resolved value is either `{ n, u }` (number + css unit, '' = unitless) or
  // `{ poly: [...] }` (flat list of polygon percentages). Resolution happens in
  // the READ pass, so viewport units track the live innerHeight and value
  // functions see the same frame context every other entry sees.

  const LENGTH_RE = /^(-?(?:\d+\.?\d*|\.\d+))(px|%|vh|svh|dvh|lvh|vw|svw|dvw|lvw)?$/;

  const SCRUB_PROP_KIND = {
    opacity: 'number',
    scale: 'number',
    scaleX: 'number',
    translateX: 'length',
    translateY: 'length',
    clipPath: 'polygon',
  };

  // Which custom property carries each transform channel when the target has an
  // authored CSS transform and the engine must compose instead of overwrite.
  const COMPOSED_PROP = {
    translateX: '--scrub-x',
    translateY: '--scrub-y',
    scale: '--scrub-s',
    scaleX: '--scrub-sx',
  };

  const isCustomProp = (prop) => prop.slice(0, 2) === '--';

  function kindOf(prop){
    if(SCRUB_PROP_KIND[prop]) return SCRUB_PROP_KIND[prop];
    // A custom property carries whatever the author wrote: a bare number stays
    // unitless (--scrub: 0..1), a string is parsed as a length.
    if(isCustomProp(prop)) return 'auto';
    return null;
  }

  function resolveLength(value, ctx){
    if(typeof value === 'number') return { n: value, u: 'px' };
    if(typeof value !== 'string') return null;
    const m = LENGTH_RE.exec(value.trim());
    if(!m) return null;
    const n = parseFloat(m[1]);
    const unit = m[2] || 'px';
    if(unit === 'px' || unit === '%') return { n: n, u: unit };
    // svh/dvh/lvh collapse onto vh: innerHeight is the only viewport baseline
    // this engine tracks, and it is the one the pinned scene is sized against.
    if(unit.slice(-2) === 'vh') return { n: n / 100 * ctx.vh, u: 'px' };
    if(unit.slice(-2) === 'vw') return { n: n / 100 * ctx.vw, u: 'px' };
    return null;
  }

  function resolveNumber(value){
    if(typeof value === 'number') return isFinite(value) ? { n: value, u: '' } : null;
    if(typeof value === 'string'){
      const n = parseFloat(value);
      if(!isNaN(n)) return { n: n, u: '' };
    }
    return null;
  }

  /**
   * `polygon(x% y%, …)` → flat percentage list. Anything else — a different
   * basic shape, a non-% unit, a malformed vertex — returns null, which the
   * caller turns into a warn-and-skip rather than a half-clipped element.
   */
  function parsePolygon(value){
    if(typeof value !== 'string') return null;
    const s = value.trim();
    if(s.slice(0, 8) !== 'polygon(' || s.slice(-1) !== ')') return null;
    const vertices = s.slice(8, -1).split(',');
    const nums = [];
    for(const vertex of vertices){
      const parts = vertex.trim().split(/\s+/);
      if(parts.length !== 2) return null;
      for(const part of parts){
        if(part.slice(-1) !== '%') return null;
        const n = parseFloat(part);
        if(isNaN(n)) return null;
        nums.push(n);
      }
    }
    return nums.length ? nums : null;
  }

  function formatPolygon(nums){
    const out = [];
    for(let i = 0; i < nums.length; i += 2){
      out.push(nums[i].toFixed(2) + '% ' + nums[i + 1].toFixed(2) + '%');
    }
    return 'polygon(' + out.join(', ') + ')';
  }

  function resolveByKind(kind, value, ctx){
    const raw = (typeof value === 'function') ? value(ctx) : value;
    if(kind === 'number') return resolveNumber(raw);
    if(kind === 'length') return resolveLength(raw, ctx);
    if(kind === 'polygon'){ const poly = parsePolygon(raw); return poly ? { poly: poly } : null; }
    if(kind === 'auto') return (typeof raw === 'number') ? resolveNumber(raw) : resolveLength(raw, ctx);
    return null;
  }

  function resolveStyle(style, ctx){
    const out = {};
    for(const prop in style) out[prop] = resolveByKind(kindOf(prop), style[prop], ctx);
    return out;
  }

  function mixResolved(a, b, t){
    if(a.poly && b.poly && a.poly.length === b.poly.length){
      const out = new Array(a.poly.length);
      for(let i = 0; i < a.poly.length; i++) out[i] = a.poly[i] + (b.poly[i] - a.poly[i]) * t;
      return { poly: out };
    }
    // Units can only disagree if a value function returned a different one this
    // frame; hold the destination rather than emit nonsense.
    if(a.u === undefined || b.u === undefined || a.u !== b.u) return b;
    return { n: a.n + (b.n - a.n) * t, u: a.u };
  }

  function formatResolved(v){
    if(v.poly) return formatPolygon(v.poly);
    if(v.u === '') {
      const scale = Math.pow(10, SCRUB_DECIMALS);
      return String(Math.round(v.n * scale) / scale);
    }
    return v.n.toFixed(2) + v.u;
  }

  // ═════════════════ Scrub entries ═════════════════

  /**
   * Static keyframe validation. Everything checkable without a frame context is
   * checked ONCE, at registration, so a malformed table can never reach a write
   * pass and leave content clipped away. Returns a reason string, or null.
   */
  function keyframeFault(keyframes){
    if(!Array.isArray(keyframes) || keyframes.length < 2) return 'keyframes must be an array of at least two stops';
    const props = [];
    let previousAt = -Infinity;
    let vertexCount = -1;
    for(const kf of keyframes){
      if(!kf || typeof kf.at !== 'number' || !(kf.at >= 0) || !(kf.at <= 1)) return 'every keyframe needs a numeric `at` between 0 and 1';
      if(kf.at <= previousAt) return '`at` values must strictly increase';
      previousAt = kf.at;
      if(!kf.style || typeof kf.style !== 'object') return 'every keyframe needs a `style` object';
      const keys = Object.keys(kf.style);
      if(props.length === 0) props.push.apply(props, keys);
      else if(keys.length !== props.length || keys.some(k => props.indexOf(k) < 0)){
        return 'every keyframe must declare the same properties';
      }
      for(const prop of keys){
        if(!kindOf(prop)) return 'unsupported property `' + prop + '`';
        if(kindOf(prop) !== 'polygon') continue;
        const value = kf.style[prop];
        if(typeof value === 'function') continue;           // resolved per frame
        const poly = parsePolygon(value);
        if(!poly) return 'clipPath must be a polygon() of `<number>% <number>%` vertices';
        if(vertexCount >= 0 && poly.length !== vertexCount) return 'clipPath vertex counts must match across keyframes';
        vertexCount = poly.length;
      }
    }
    return null;
  }

  /**
   * The css properties this entry will own, given its keyframe props. Transform
   * channels collapse to ONE `transform` write, or to the composed custom
   * properties when the target already carries an authored transform.
   */
  function ownedProps(props, compose){
    const out = [];
    let needsTransform = false;
    for(const prop of props){
      if(COMPOSED_PROP[prop]){
        if(!compose){ needsTransform = true; continue; }
        if(out.indexOf(COMPOSED_PROP[prop]) < 0) out.push(COMPOSED_PROP[prop]);
      }
      else if(prop === 'opacity') out.push('opacity');
      else if(prop === 'clipPath') out.push('clip-path');
      else out.push(prop);                                  // custom property, verbatim
    }
    if(needsTransform) out.push('transform');
    return out;
  }

  function progressOf(mode, rect, ctx, endAt){
    if(mode === 'pin'){
      const span = rect.height - ctx.vh;
      if(span <= 0) return rect.top <= 0 ? 1 : 0;
      return clamp01(-rect.top / span);
    }
    if(mode === 'enter'){
      const span = ctx.vh * (1 - endAt);
      if(span <= 0) return rect.top <= 0 ? 1 : 0;
      return clamp01((ctx.vh - rect.top) / span);
    }
    // cross: 0 = top edge entering from the bottom, 1 = bottom edge leaving the top.
    const span = ctx.vh + rect.height;
    if(span <= 0) return 0;
    return clamp01((ctx.vh - rect.top) / span);
  }

  function createScrubEntry(el, trigger, keyframes, opts){
    const mode = opts.mode || SCRUB_DEFAULT_MODE;
    const endAt = (typeof opts.endAt === 'number') ? opts.endAt : SCRUB_DEFAULT_END_AT;
    const delay = (typeof opts.delay === 'number' && opts.delay > 0 && opts.delay < 1) ? opts.delay : 0;
    const damping = (typeof opts.damping === 'number' && opts.damping > 0 && opts.damping < 1) ? opts.damping : 0;
    const releaseOnComplete = !!opts.releaseOnComplete;

    // An authored transform is COMPOSED, never overwritten: the engine hands CSS
    // its channel through a custom property and lets the authored rule keep its
    // own terms (e.g. .scroll-cue's translateX(-50%) centring).
    const computed = window.getComputedStyle(el).transform;
    const compose = !!computed && computed !== 'none';

    // Property-scoped release: remember the pre-registration INLINE value of
    // every property this entry writes, so release and cleanup restore exactly
    // what the author put there (authored inline aspect-ratio, sizing, …).
    const owned = new Map();
    ownedProps(Object.keys(keyframes[0].style), compose)
      .forEach(prop => owned.set(prop, el.style.getPropertyValue(prop)));

    let target = 0;
    let current = 0;
    let primed = false;
    let released = false;
    let resolved = null;

    function restore(){
      owned.forEach((original, prop) => {
        if(original) el.style.setProperty(prop, original);
        else el.style.removeProperty(prop);
      });
    }

    /** The interpolated style at progress `p`, from THIS frame's resolved values. */
    function sample(p){
      if(!resolved) return null;
      const last = keyframes.length - 1;
      if(p <= keyframes[0].at) return resolved[0];
      if(p >= keyframes[last].at) return resolved[last];
      let i = 1;
      while(i < last && p > keyframes[i].at) i++;
      const a = keyframes[i - 1].at;
      const b = keyframes[i].at;
      const t = b > a ? (p - a) / (b - a) : 1;
      const from = resolved[i - 1];
      const to = resolved[i];
      const out = {};
      for(const prop in to){
        const fv = from[prop];
        const tv = to[prop];
        out[prop] = (fv && tv) ? mixResolved(fv, tv, t) : (tv || fv);
      }
      return out;
    }

    function apply(style){
      if(!style) return;
      let tx = null, ty = null, sc = null, scx = null;
      for(const prop in style){
        const v = style[prop];
        if(!v) continue;
        if(prop === 'translateX') tx = v;
        else if(prop === 'translateY') ty = v;
        else if(prop === 'scale') sc = v;
        else if(prop === 'scaleX') scx = v;
        else if(prop === 'opacity') el.style.opacity = formatResolved(v);
        else if(prop === 'clipPath') el.style.setProperty('clip-path', formatResolved(v));
        else el.style.setProperty(prop, formatResolved(v));
      }
      if(!tx && !ty && !sc && !scx) return;
      if(compose){
        if(tx) el.style.setProperty(COMPOSED_PROP.translateX, formatResolved(tx));
        if(ty) el.style.setProperty(COMPOSED_PROP.translateY, formatResolved(ty));
        if(sc) el.style.setProperty(COMPOSED_PROP.scale, formatResolved(sc));
        if(scx) el.style.setProperty(COMPOSED_PROP.scaleX, formatResolved(scx));
        return;
      }
      const parts = [];
      if(tx) parts.push('translateX(' + formatResolved(tx) + ')');
      if(ty) parts.push('translateY(' + formatResolved(ty) + ')');
      if(sc) parts.push('scale(' + formatResolved(sc) + ')');
      if(scx) parts.push('scaleX(' + formatResolved(scx) + ')');
      el.style.transform = parts.join(' ');
    }

    return {
      nodes: (trigger === el) ? [el] : [el, trigger],
      read(ctx){
        const rect = trigger.getBoundingClientRect();
        const p = progressOf(mode, rect, ctx, endAt);
        // A delayed entry REMAPS its range rather than truncating it, so it
        // still reaches 1 (and still releases) at the end of the trigger's run.
        target = delay ? clamp01((p - delay) / (1 - delay)) : p;
        const frame = new Array(keyframes.length);
        for(let i = 0; i < keyframes.length; i++) frame[i] = resolveStyle(keyframes[i].style, ctx);
        resolved = frame;
      },
      write(ctx){
        // Under the global glide the page ITSELF is already lerped, so a second
        // per-entry lerp would only double the lag. Damping stays live on every
        // native frame — keyboard, scrollbar, touch, resize (Design Note D3).
        const lag = (ctx && ctx.smooth) ? 0 : damping;
        if(!primed){ current = target; primed = true; }
        else if(lag){
          const distance = target - current;
          if(Math.abs(distance) < SCRUB_SETTLE_EPSILON) current = target;
          else current += distance * lag;
        }
        else current = target;

        const settled = current === target;
        if(releaseOnComplete && settled && current >= 1){
          if(!released){ restore(); released = true; }
          return false;
        }
        released = false;
        apply(sample(current));
        return !settled;
      },
      dispose(){
        restore();
        el.classList.remove(SCRUB_CLASS);
      },
    };
  }

  // ═════════════════ Internal entry types ═════════════════

  function createParallaxEntry(el, maxPx){
    let offset = 0;
    return {
      nodes: [el],
      read(ctx){
        const rect = el.getBoundingClientRect();
        const span = ctx.vh + rect.height;
        if(span <= 0) return;
        offset = (clamp01((ctx.vh - rect.top) / span) - 0.5) * 2 * maxPx;
      },
      write(){ el.style.transform = 'translateY(' + offset.toFixed(2) + 'px)'; return false; },
      dispose(){ el.style.transform = ''; },
    };
  }

  function createProgressEntry(){
    let bar = document.getElementById(PROGRESS_BAR_ID);
    let width = 0;
    return {
      nodes: [],
      read(ctx){
        if(!bar) bar = document.getElementById(PROGRESS_BAR_ID);
        if(!bar) return;
        // Re-read document height every frame rather than caching it, so lazy
        // media, font swaps, and layout changes cannot leave the bar mis-scaled.
        const scrollable = document.documentElement.scrollHeight - ctx.vh;
        width = scrollable > 0 ? clamp01(ctx.scrollY / scrollable) * 100 : 0;
      },
      write(){ if(bar) bar.style.width = width + '%'; return false; },
      dispose(){},
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

  // ─────────────── Scrub ───────────────

  /**
   * Scrubs `targetRef`'s style along `keyframes` as `opts.triggerRef` (default:
   * the target) crosses the viewport. Position-driven and fully reversible —
   * there is no time in the mapping at all.
   *
   *   keyframes  [{ at: 0..1, style: { … } }, …], `at` strictly increasing, the
   *              SAME property set in every stop. Interpolable properties:
   *              opacity, translateX/translateY, scale, scaleX, clipPath
   *              (polygon() with matching vertex counts) and any `--custom`
   *              property. Values are numbers, px/%/vh-family strings, or
   *              functions of the frame context.
   *   opts.mode  'cross' (default) | 'enter' (with opts.endAt) | 'pin'.
   *              'pin' REQUIRES opts.triggerRef — the pin wrapper.
   *   opts.damping           lerp factor; the entry self-ticks until settled.
   *   opts.releaseOnComplete at progress 1 the entry's inline properties are
   *                          restored to their pre-registration values.
   *   opts.delay             0..1 range remap (staggering).
   *   opts.offQuery          media query that disables the entry entirely.
   *
   * Progress is NEVER read from a node this entry writes a transform to: pass a
   * separate `triggerRef` whenever the target itself moves, or the measurement
   * feeds back into its own input.
   *
   * Under reduced motion nothing registers and nothing is written — the element
   * renders its natural CSS. A live preference change unregisters the entry and
   * restores every property it owned.
   */
  function useScrub(targetRef, keyframes, opts){
    const settings = opts || {};
    const reduced = useReducedMotion();
    const off = useMediaQuery(settings.offQuery || NEVER_QUERY);

    // Snapshot into refs: callers pass JSX-literal tables, whose identity
    // changes every render. Registration keys on refs and stable scalars only,
    // so a re-render never re-registers (precedent: useScrollSpy's `key`).
    const keyframesRef = useRef(keyframes);
    const settingsRef = useRef(settings);
    keyframesRef.current = keyframes;
    settingsRef.current = settings;

    const triggerRef = settings.triggerRef || null;
    const key = [
      settings.mode || SCRUB_DEFAULT_MODE,
      settings.endAt,
      settings.delay,
      settings.damping,
      settings.releaseOnComplete ? 1 : 0,
    ].join('|');

    useLayoutEffect(() => {
      if(reduced || off) return;
      const el = targetRef && targetRef.current;
      if(!el) return;

      const active = settingsRef.current;
      const trigger = (active.triggerRef && active.triggerRef.current) || el;
      if((active.mode || SCRUB_DEFAULT_MODE) === 'pin' && trigger === el){
        console.warn('[scroll] useScrub: mode "pin" needs opts.triggerRef (the pin wrapper) — entry skipped', el);
        return;
      }

      const fault = keyframeFault(keyframesRef.current);
      if(fault){
        console.warn('[scroll] useScrub: ' + fault + ' — entry skipped, element left in its natural state', el);
        return;
      }

      el.classList.add(SCRUB_CLASS);
      return registerEntry(createScrubEntry(el, trigger, keyframesRef.current, active));
    }, [targetRef, triggerRef, key, reduced, off]);
  }

  // ─────────────── Smooth scroll ───────────────

  /**
   * Desktop inertial scrolling. Call ONCE per page root — the engine keeps a
   * single virtual target for the document (same contract as useScrollProgress).
   *
   * Every gate must hold: a fine hovering pointer, a viewport with room to pin,
   * and no reduced-motion preference. All of them are LIVE — plug in a display,
   * rotate a hybrid, turn on reduce-motion, and the listeners come off
   * mid-session and the page is native again, with the glide cancelled where it
   * stands (never mid-travel).
   *
   * The pointer query is the WHOLE device discriminator: a touchscreen laptop
   * reports `maxTouchPoints > 0` and would be permanently excluded by a
   * touch-point gate, yet its trackpad is exactly the input this is built for.
   * Touch panning emits no cancelable wheel event, so it cannot reach the
   * engine on a phone regardless; touch, keyboard and scrollbar input are never
   * intercepted on any device.
   */
  function useSmoothScroll(){
    const reduced = useReducedMotion();
    const finePointer = useMediaQuery(SMOOTH_POINTER_QUERY);
    const roomy = useMediaQuery(SMOOTH_VIEWPORT_QUERY);
    const enabled = !reduced && finePointer && roomy;

    useEffect(() => {
      if(!enabled) return;
      enableSmoothScroll();
      return disableSmoothScroll;
    }, [enabled]);
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
        // A `.mask-reveal` parks at translateY(130%) — fully OUTSIDE its
        // `.mask-line{overflow:hidden}` box. IntersectionObserver intersects a
        // target against every ancestor clip rect, so a fully clipped target
        // never reports isIntersecting. Observe the mask container instead
        // (it is never clipped) and reveal the child when the CONTAINER enters.
        const sentinelFor = (el) => {
          const mask = el.parentElement;
          return (el.classList.contains('mask-reveal') && mask && mask.classList.contains('mask-line')) ? mask : el;
        };
        const childOf = new Map(); // sentinel element -> reveal target
        io = new IntersectionObserver((entries) => {
          for(const e of entries){
            if(e.isIntersecting){
              const target = childOf.get(e.target) || e.target;
              target.classList.add(REVEALED_CLASS);
              io.unobserve(e.target);
            }
          }
        }, { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN });
        els.forEach(el => {
          if(el.classList.contains(REVEALED_CLASS)) return;
          const sentinel = sentinelFor(el);
          if(sentinel !== el) childOf.set(sentinel, el);
          io.observe(sentinel);
        });
      }

      attach();

      // Re-attach when content changes (project layout swap, hero variant
      // swap). childList/subtree only: writing a class is an attribute
      // mutation, so this observer can never retrigger itself — and neither can
      // the scrub engine's inline style writes.
      const mo = new MutationObserver(() => attach());
      mo.observe(document.body, { childList: true, subtree: true });

      return () => { io && io.disconnect(); mo.disconnect(); };
    }, [selector, reduced]);
  }

  // ─────────────── Scroll progress ───────────────

  /**
   * The SOLE writer of the #scroll-bar element. Call once per page root.
   * Runs as an entry on the shared tick; no-ops gracefully when the page has no
   * progress bar.
   */
  function useScrollProgress(){
    useEffect(() => registerEntry(createProgressEntry()), []);
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
      const unregister = registerEntry(createParallaxEntry(el, maxPx));
      return () => { unregister(); el.classList.remove(PARALLAX_CLASS); };
    }, [ref, maxPx, reduced, narrow]);
  }

  // ─────────────── Public entrypoint ───────────────

  Object.assign(window, {
    useReducedMotion,
    useSmoothScroll,
    useScrub,
    useReveal,
    useScrollProgress,
    useScrollSpy,
    useParallax,
  });
})();
