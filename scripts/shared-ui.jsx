// ═══════════════════════════════════════════════════════════════════════════
// shared-ui.jsx — the shared page chrome.
//
// Single responsibility: the components that must look and behave identically
// on every page — the top nav, the footer, and the glyph-scramble headline
// treatment. index.html and project.html render the SAME components from here,
// so the chrome can no longer drift between the two pages.
//
// Public entrypoint: the Object.assign(window, …) at the bottom of this file
// (pattern: data.jsx:477, scripts/scroll.jsx:324). Nothing above it is
// reachable from another script.
//
// Why the IIFE: Babel standalone runs each text/babel file as a classic
// script, so top-level `const`/`function` declarations share ONE global
// lexical scope. app.jsx:2 and project.jsx:3 already declare
// `const { useState, useEffect, useRef } = React` at top level — a second
// top-level `const useState` here would be a SyntaxError that kills the whole
// file. Wrapping keeps every internal name off the shared scope and makes the
// window export the only door.
//
// Load order: AFTER scripts/scroll.jsx (GlyphShuffle consumes its
// useReducedMotion) and BEFORE app.jsx / project.jsx.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  const { useState, useEffect, useRef } = React;

  // ─────────────── Site constants (single source of truth) ───────────────

  const CONTACT_EMAIL = 'youngwoo930@gmail.com';
  const GITHUB_URL = 'https://github.com/Userdflt';
  const LINKEDIN_URL = 'https://www.linkedin.com/in/young-woo-song-145488217/';

  const INDEX_URL = 'index.html';
  const WORK_URL = 'index.html#work';
  const TOP_ANCHOR = '#top';

  const PAGE_INDEX = 'index';
  const NAV_SECTIONS = ['work', 'approach', 'stack', 'contact'];

  const BRAND_LABEL = 'y_w_song.sh';
  const SITE_COPYRIGHT = '© 2026 young woo song';
  const SITE_LOCATION = 'auckland, nz';
  const BUILD_LABEL = 'v2.0';
  const BUILD_SYNC = 'last sync may 2026';

  // ─────────────── Glyph scramble ───────────────

  const GLYPHS = '▓▒░█ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}<>/=*_-';
  const GLYPH_PER_CHAR_MS = 60;   // wave step — chars start left to right
  const GLYPH_SCRAMBLE_MS = 180;  // how long one char churns before it locks
  const GLYPH_FPS = 28;
  const GLYPH_TAIL_MS = 80;       // grace period after the last char locks
  const GLYPH_BLANK = '\u00A0';   // non-breaking space holds a not-yet-started slot open

  /**
   * Splits `text` into word-safe spans — each word is an inline-block with
   * nowrap, so a line break can only land between words and never mid-scramble
   * inside one. `resolveChar` decides what each character paints, so the
   * animated path and the reduced-motion path emit IDENTICAL markup and
   * identical metrics; only the resolver differs.
   */
  function renderGlyphNodes(text, resolveChar){
    const words = text.split(' ');
    const nodes = [];
    let index = 0;
    words.forEach((word, wi) => {
      nodes.push(
        <span key={`w${wi}`} style={{ display:'inline-block', whiteSpace:'nowrap' }}>
          {[...word].map((ch) => {
            const i = index++;
            const { display, glow } = resolveChar(ch, i);
            return <span key={i} className={'gs-char' + (glow ? ' gs-flash' : '')}>{display || GLYPH_BLANK}</span>;
          })}
        </span>
      );
      // The space between words consumes a wave slot so the cascade stays even.
      if(wi < words.length - 1){ index++; nodes.push(<span key={`s${wi}`}> </span>); }
    });
    return nodes;
  }

  /**
   * Per-char scramble that resolves left to right into the real word.
   *
   * Under reduced motion the final text renders on the first paint: no rAF
   * loop, no timers, no blank frames — the reader never sees a placeholder.
   */
  function GlyphShuffle({ text, perChar = GLYPH_PER_CHAR_MS, scrambleMs = GLYPH_SCRAMBLE_MS, fps = GLYPH_FPS }){
    const reduced = useReducedMotion();
    const [, nextFrame] = useState(0);
    const startRef = useRef(0);

    useEffect(() => {
      if(reduced) return;
      startRef.current = performance.now();
      let frame = 0;
      let timer = 0;
      function tick(){
        nextFrame(n => n + 1);
        frame = requestAnimationFrame(() => { timer = setTimeout(tick, 1000 / fps); });
      }
      tick();
      // Stop repainting once the last char has locked.
      const stopAt = perChar * text.length + scrambleMs + GLYPH_TAIL_MS;
      const stop = setTimeout(() => { cancelAnimationFrame(frame); clearTimeout(timer); }, stopAt);
      return () => { cancelAnimationFrame(frame); clearTimeout(timer); clearTimeout(stop); };
    }, [text, perChar, scrambleMs, fps, reduced]);

    if(reduced){
      return <span className="glyph-shuffle">{renderGlyphNodes(text, (ch) => ({ display: ch, glow: false }))}</span>;
    }

    const elapsed = performance.now() - startRef.current;
    return (
      <span className="glyph-shuffle">
        {renderGlyphNodes(text, (ch, i) => {
          const charStart = i * perChar;
          const charEnd = charStart + scrambleMs;
          if(elapsed < charStart) return { display: '', glow: false };
          if(elapsed < charEnd) return { display: GLYPHS[(Math.random() * GLYPHS.length) | 0], glow: true };
          return { display: ch, glow: false };
        })}
      </span>
    );
  }

  // ─────────────── Nav ───────────────

  /**
   * The one nav for both pages.
   *
   * page='index'   — section links are in-page hashes, and the link matching
   *                  `activeId` (from useScrollSpy) wears `.active`.
   * page='project' — section links point back at index.html, and a distinct
   *                  back-to-work affordance sits beside the brand. Scroll-spy
   *                  does not apply, so no link is ever marked active.
   */
  function Nav({ page = PAGE_INDEX, activeId = null }){
    const onIndex = page === PAGE_INDEX;
    const sectionHref = (id) => (onIndex ? '#' + id : INDEX_URL + '#' + id);
    return (
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-lead">
            <a href={onIndex ? TOP_ANCHOR : INDEX_URL} className="brand">
              <span className="dot"></span>
              <span>{BRAND_LABEL}</span>
            </a>
            {!onIndex && <a className="nav-back" href={WORK_URL}>back to work</a>}
          </div>
          <div className="nav-links">
            {NAV_SECTIONS.map((id) => {
              const active = onIndex && activeId === id;
              return (
                <a key={id} href={sectionHref(id)}
                   className={active ? 'active' : undefined}
                   aria-current={active ? 'true' : undefined}>{id}</a>
              );
            })}
          </div>
          <a className="nav-cta" href={`mailto:${CONTACT_EMAIL}`}>connect</a>
        </div>
      </nav>
    );
  }

  // ─────────────── Footer ───────────────

  /**
   * The one footer for both pages. Only the trailing home affordance is
   * page-dependent — index scrolls back to the top, a project page returns to
   * the index — everything else is identical by construction.
   */
  function Footer({ page = PAGE_INDEX }){
    const onIndex = page === PAGE_INDEX;
    return (
      <div className="footer">
        <div className="footer-inner">
          <span>{SITE_COPYRIGHT} <span className="acc">·</span> {SITE_LOCATION}</span>
          <span className="footer-links">
            <a href={GITHUB_URL}>github</a>
            <a href={LINKEDIN_URL}>linkedin</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>email</a>
            <a href={onIndex ? TOP_ANCHOR : INDEX_URL}>{onIndex ? '↑ top' : '↑ index'}</a>
          </span>
          <span>build <span className="acc">{BUILD_LABEL}</span> · {BUILD_SYNC}</span>
        </div>
      </div>
    );
  }

  // ─────────────── Public entrypoint ───────────────

  Object.assign(window, {
    GlyphShuffle,
    Nav,
    Footer,
  });
})();
