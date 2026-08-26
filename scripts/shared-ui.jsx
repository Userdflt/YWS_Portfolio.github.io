// ═══════════════════════════════════════════════════════════════════════════
// shared-ui.jsx — the shared page chrome.
//
// Single responsibility: the components that must look and behave identically
// on every page — the top nav (including its tone adaptation) and the footer.
// index.html and project.html render the SAME components from here, so the
// chrome can no longer drift between the two pages.
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
// Load order: AFTER scripts/scroll.jsx and BEFORE app.jsx / project.jsx.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  const { useState, useEffect } = React;

  // ─────────────── Site constants (single source of truth) ───────────────

  const CONTACT_EMAIL = 'youngwoo930@gmail.com';
  const GITHUB_URL = 'https://github.com/Userdflt';
  const LINKEDIN_URL = 'https://www.linkedin.com/in/young-woo-song-145488217/';

  const INDEX_URL = 'index.html';
  const WORK_URL = 'index.html#work';
  const TOP_ANCHOR = '#top';

  const PAGE_INDEX = 'index';
  const NAV_SECTIONS = ['work', 'approach', 'stack', 'contact'];

  const BRAND_LABEL = 'YOUNG WOO SONG';
  const SITE_COPYRIGHT = '© 2026 young woo song';
  const SITE_LOCATION = 'auckland, nz';
  const BUILD_LABEL = 'v2.0';
  const BUILD_SYNC = 'last sync may 2026';

  // ─────────────── Nav tone adaptation ───────────────

  // The nav is a 56px band pinned to the top of the viewport. Its skin follows
  // whatever section sits under that band, so observation is CLIPPED to exactly
  // those 56px — a full-viewport observer would report every section on screen.
  const NAV_BAND_PX = 56;
  const TONE_SELECTOR = '[data-tone]';
  const TONE_LIGHT = 'light';
  const NAV_TONE_CLASS = { light: 'nav--light', dark: 'nav--dark' };

  const toneOf = (el) => el.getAttribute('data-tone') || TONE_LIGHT;

  /**
   * Reports the tone of the topmost [data-tone] section intersecting the nav
   * band; 'light' when none does — the page top, a gap between toned sections,
   * or a page carrying no tone markers at all.
   *
   * Two resolvers, one answer:
   *  - a SYNCHRONOUS geometry pass on mount, because IntersectionObserver does
   *    not deliver its first callback until after paint — without it a mid-page
   *    load shows the default skin over a dark section for a frame;
   *  - a persistent visible-set thereafter, walked in DOM order so "topmost
   *    wins" holds even though entries arrive in observation order.
   *
   * No IntersectionObserver (or no toned sections) leaves the light skin
   * standing rather than failing to an unskinned nav.
   */
  function useNavTone(){
    const [tone, setTone] = useState(TONE_LIGHT);

    useEffect(() => {
      const sections = Array.from(document.querySelectorAll(TONE_SELECTOR));
      if(sections.length === 0) return;

      const resolveByGeometry = () => {
        for(const el of sections){
          const box = el.getBoundingClientRect();
          if(box.top < NAV_BAND_PX && box.bottom > 0) return toneOf(el);
        }
        return TONE_LIGHT;
      };
      setTone(resolveByGeometry());

      if(typeof IntersectionObserver === 'undefined') return;

      const visible = new Set();
      let io = null;

      // The clip is expressed as a bottom root-margin, so it is a function of
      // the viewport height and has to be rebuilt when that changes.
      function attach(){
        io = new IntersectionObserver((entries) => {
          for(const e of entries){
            if(e.isIntersecting) visible.add(e.target);
            else visible.delete(e.target);
          }
          const topmost = sections.find(el => visible.has(el));
          setTone(topmost ? toneOf(topmost) : TONE_LIGHT);
        }, {
          rootMargin: `0px 0px -${Math.max(0, window.innerHeight - NAV_BAND_PX)}px 0px`,
          threshold: 0,
        });
        sections.forEach(el => io.observe(el));
      }

      function reattach(){
        io.disconnect();
        visible.clear();
        attach();
        setTone(resolveByGeometry());
      }

      attach();
      window.addEventListener('resize', reattach);
      return () => { io.disconnect(); window.removeEventListener('resize', reattach); };
    }, []);

    return tone;
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
   *
   * The tone skin is orthogonal to `page`: it tracks the section under the nav
   * band on whichever page is mounted.
   */
  function Nav({ page = PAGE_INDEX, activeId = null }){
    const onIndex = page === PAGE_INDEX;
    const tone = useNavTone();
    const sectionHref = (id) => (onIndex ? '#' + id : INDEX_URL + '#' + id);
    return (
      <nav className={'nav ' + (NAV_TONE_CLASS[tone] || NAV_TONE_CLASS.light)}>
        <div className="nav-inner">
          <div className="nav-lead">
            <a href={onIndex ? TOP_ANCHOR : INDEX_URL} className="brand">
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
    Nav,
    Footer,
  });
})();
