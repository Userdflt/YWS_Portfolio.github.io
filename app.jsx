// Main portfolio app — paper/ink editorial.
const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "azure",
  "density": "regular"
}/*EDITMODE-END*/;

// One entry per palette, TWO accents per entry: the tone scopes in theme.css
// pick the pair that reads on their own surface. A single accent cannot serve
// both — anything legible on #f0f1f4 is too dark for #0e1228 and vice versa.
// Every `accent` is >= 4.5:1 on its surface, every `accent2` >= 3:1
// (verified: scratchpad contrast.cjs).
const PALETTES = {
  azure:  { label: "Azure",  accent: "#2c46d8", accent2: "#5a70e8", soft: "rgba(44,70,216,0.10)",
            accentDark: "#9db4ff", accent2Dark: "#c3d1ff", softDark: "rgba(157,180,255,0.14)" },
  teal:   { label: "Teal",   accent: "#0f6f66", accent2: "#1d7fa8", soft: "rgba(15,111,102,0.10)",
            accentDark: "#5eead4", accent2Dark: "#7dd3fc", softDark: "rgba(94,234,212,0.14)" },
  cyber:  { label: "Cyber",  accent: "#0e7490", accent2: "#6d28d9", soft: "rgba(14,116,144,0.10)",
            accentDark: "#22d3ee", accent2Dark: "#a78bfa", softDark: "rgba(34,211,238,0.14)" },
  matrix: { label: "Matrix", accent: "#3f6212", accent2: "#15803d", soft: "rgba(63,98,18,0.10)",
            accentDark: "#84cc16", accent2Dark: "#22c55e", softDark: "rgba(132,204,22,0.14)" },
  amber:  { label: "Amber",  accent: "#92400e", accent2: "#9a3412", soft: "rgba(146,64,14,0.10)",
            accentDark: "#fbbf24", accent2Dark: "#fb923c", softDark: "rgba(251,191,36,0.14)" },
  bone:   { label: "Bone",   accent: "#57534e", accent2: "#78716c", soft: "rgba(87,83,78,0.10)",
            accentDark: "#e7e5e4", accent2Dark: "#a8a29e", softDark: "rgba(231,229,228,0.12)" },
};

// Hero image band — the LCP element, so it is eager + high priority and carries
// its intrinsic size to reserve the box before the bytes land.
const HERO_IMAGE = {
  src: "images/optimized/masterplan_1_render_2.webp",
  width: 1088,
  height: 960,
  alt: "Aerial masterplan render: a residential development with landscaped parkland, a central clubhouse and pool, and detached houses across a rural site.",
};

// Shared runtime, consumed as window globals — this file owns home sections only:
//   scripts/scroll.jsx    -> useReveal, useScrollProgress, useScrollSpy,
//                            useHeroScrollLink, CountUp
//   scripts/shared-ui.jsx -> Nav, Footer
// Re-declaring any of those names at top level here would shadow the shared copy.

// ───────────────────────── Hero ─────────────────────────
// Three stacked blocks: the type lead, a full-bleed image band, and a paper
// title card pulled up over the band. The band is a direct child of the
// section — inside .wrap it would be capped at the content width.
function Hero(){
  const heroRef = useRef(null);
  useHeroScrollLink(heroRef);
  return (
    <section id="top" ref={heroRef} className="hero" data-tone="light">
      <div className="wrap hero-lead">
        <p className="hero-status eyebrow">ai specialist · ignite · auckland · hybrid</p>

        <h1 className="reveal reveal-1 text-ink display-1">Young Woo Song</h1>

        <p className="hero-role reveal reveal-2">Applied AI</p>

        <div className="scroll-cue" aria-hidden="true">
          <span>scroll</span>
          <span className="line"></span>
        </div>
      </div>

      <div className="hero-band reveal reveal-2">
        <img
          src={HERO_IMAGE.src}
          alt={HERO_IMAGE.alt}
          width={HERO_IMAGE.width}
          height={HERO_IMAGE.height}
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      </div>

      <div className="wrap">
        <div className="panel-overlap hero-panel reveal reveal-3">
          <p className="hero-tag">
            ai specialist at ignite. i build internal ai tools — knowledge retrieval, workflow automation, document and compliance support — and establish governance, evaluation, and adoption frameworks for design and architecture teams.
          </p>

          <div className="hero-foot">
            <div className="col">
              <span className="k">role</span>
              <span className="v">ai specialist · ignite</span>
            </div>
            <div className="col">
              <span className="k">based</span>
              <span className="v">auckland · nz · hybrid</span>
            </div>
            <div className="col">
              <span className="k">since</span>
              <span className="v">jan 2026 → present</span>
            </div>
            <div className="col">
              <span className="k">channels</span>
              <span className="v">
                <a href="https://github.com/Userdflt">github</a>{" · "}
                <a href="https://www.linkedin.com/in/young-woo-song-145488217/">linkedin</a>{" · "}
                <a href="mailto:youngwoo930@gmail.com">email</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Work: editorial list ─────────────────────────
function WorkEditorial({ projects, previewRef }){
  const onMove = (e, p) => {
    const el = previewRef.current; if(!el) return;
    el.style.left = e.clientX + 'px';
    el.style.top = e.clientY + 'px';
    el.classList.add('show');
    const markEl = document.getElementById('preview-mark');
    const imgEl = document.getElementById('preview-img');
    const thumb = (typeof window.getProjectThumbnail === 'function') ? window.getProjectThumbnail(p) : null;
    if (imgEl) {
      if (thumb) {
        if (imgEl.getAttribute('src') !== thumb) imgEl.src = thumb;
        imgEl.alt = p.title || '';
        imgEl.style.display = 'block';
        if (markEl) markEl.style.display = 'none';
      } else {
        imgEl.removeAttribute('src');
        imgEl.style.display = 'none';
        if (markEl) markEl.style.display = '';
      }
    }
    if (markEl) markEl.textContent = p.mark || '⟁';
    document.getElementById('preview-cat').textContent = p.category;
    document.getElementById('preview-tag').textContent = `${p.year} · open →`;
  };
  const onLeave = () => previewRef.current?.classList.remove('show');

  return (
    <div className="work-list">
      {projects.map((p, i) => (
        <a key={p.id} href={`project.html?id=${p.id}`}
           className="work-row reveal"
           style={{ transitionDelay: `${0.03 * i}s` }}
           onMouseMove={(e) => onMove(e, p)}
           onMouseLeave={onLeave}>
          <div className="idx">{String(i + 1).padStart(2, '0')}</div>
          <div className="title-col">
            <div className="title">{p.title}</div>
            <div className="blurb">{p.subtitle} — {p.blurb}</div>
          </div>
          <div className="cat">{p.category}</div>
          <div className="arrow" aria-hidden="true">↗</div>
        </a>
      ))}
    </div>
  );
}

// The dark band of the index. Editorial is the ONLY work renderer — the card
// and table variants were competing surfaces for the same content, so the page
// no longer has to declare which one it wants.
function Work(){
  const previewRef = useRef(null);
  useEffect(() => { previewRef.current = document.getElementById('work-preview'); }, []);
  return (
    <section id="work" className="sec-dark" data-tone="dark">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[01]</span>
          <span className="eyebrow">selected work</span>
          <span className="rule"></span>
          <span>{PROJECTS.length} projects</span>
        </div>

        <div className="stats reveal">
          <div className="stat"><span className="sn"><CountUp end={PROJECTS.length} /></span><span className="sl">shipped projects</span></div>
          <div className="stat"><span className="sn"><CountUp end={7} /></span><span className="sl">yrs in architecture</span></div>
          <div className="stat"><span className="sn"><CountUp end={4} /></span><span className="sl">multi-agent systems</span></div>
          <div className="stat"><span className="sn"><CountUp end={2} /></span><span className="sl">ibm specializations · 2025</span></div>
        </div>

        <WorkEditorial projects={PROJECTS} previewRef={previewRef} />
      </div>
    </section>
  );
}

// ───────────────────────── Approach ─────────────────────────
function Approach(){
  return (
    <section id="approach" className="approach" data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[02]</span>
          <span className="eyebrow">approach</span>
          <span className="rule"></span>
        </div>
        <div className="approach-grid">
          <div>
            <h2 className="reveal text-ink">from architecture to <span className="acc">applied ai</span>.</h2>
            <p className="reveal reveal-1">seven years across new zealand architecture practices — ignite, woods bagot, rcg — taught me to work with constraints and ship under pressure. now back at ignite as ai specialist, applying generative ai and machine learning to real architecture and design workflows.</p>
            <p className="reveal reveal-2">i build internal tools — rag, workflow automation, document and compliance support — and stand up the governance, evals, and adoption frameworks that make them safe to scale. aut-accredited in data science &amp; ai (institute of data) and ibm-certified across ai engineering and ai development.</p>
          </div>
          <div className="principles">
            {PRINCIPLES.map((p) => (
              <div className="principle" key={p.n}>
                <div className="pn">{p.n}</div>
                <div>
                  <div className="pt">{p.t}</div>
                  <div className="pd">{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Stack ─────────────────────────
function Stack(){
  return (
    <section id="stack" className="band-paper" data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[03]</span>
          <span className="eyebrow">stack</span>
          <span className="rule"></span>
        </div>
        <div className="stack-grid">
          {STACK.map((s) => (
            <div className="stack-cell" key={s.head}>
              <div className="sh">{s.head}</div>
              <div className="st">{s.title}</div>
              <div className="stags">
                {s.tags.map(t => <span className="tag" key={t}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Contact ─────────────────────────
function Contact(){
  return (
    <section id="contact" className="contact sec-dark" data-tone="dark">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[04]</span>
          <span className="eyebrow">contact</span>
          <span className="rule"></span>
        </div>
        <div className="contact-card reveal">
          <h2 className="text-ink display-2">let&rsquo;s build<br/>something <span className="acc">real</span>.</h2>
          <p>open to interesting work in applied ai, ai governance and adoption, multi-agent systems, and tools for architecture and design.</p>
          <div className="contact-actions">
            <a className="btn btn-primary" href="mailto:youngwoo930@gmail.com">youngwoo930@gmail.com <span className="ar">↗</span></a>
            <a className="btn btn-ghost" href="https://www.linkedin.com/in/young-woo-song-145488217/">linkedin <span className="ar">↗</span></a>
            <a className="btn btn-ghost" href="https://github.com/Userdflt">github <span className="ar">↗</span></a>
          </div>
        </div>
      </div>
      <div className="wrap">
        <Footer page="index" />
      </div>
    </section>
  );
}

// ───────────────────────── App + Tweaks ─────────────────────────

// Document order — useScrollSpy returns the first of these still intersecting
// the band under the nav, which is what the nav highlights.
const SPY_SECTIONS = ['top', 'work', 'approach', 'stack', 'contact'];

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Palette writes the tone-NEUTRAL base vars, never --accent itself: an
  // inline --accent on documentElement would reach the light scope only,
  // because .sec-dark re-declares --accent for its own subtree.
  useEffect(() => {
    const p = PALETTES[t.palette] || PALETTES.azure;
    const r = document.documentElement;
    r.style.setProperty('--accent-l', p.accent);
    r.style.setProperty('--accent-2-l', p.accent2);
    r.style.setProperty('--accent-soft-l', p.soft);
    r.style.setProperty('--accent-d', p.accentDark);
    r.style.setProperty('--accent-2-d', p.accent2Dark);
    r.style.setProperty('--accent-soft-d', p.softDark);
    r.classList.remove('density-compact','density-regular','density-spacious');
    r.classList.add(`density-${t.density}`);
  }, [t.palette, t.density]);

  useReveal();
  useScrollProgress();
  const activeId = useScrollSpy(SPY_SECTIONS);

  return (
    <>
      <Nav page="index" activeId={activeId} />
      <Hero />
      <Work />
      <Approach />
      <Stack />
      <Contact />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette" />
        <TweakColor
          label="Accent"
          value={PALETTES[t.palette]?.accent}
          options={Object.values(PALETTES).map(p => p.accent)}
          onChange={(hex) => {
            const key = Object.keys(PALETTES).find(k => PALETTES[k].accent === hex) || 'teal';
            setTweak('palette', key);
          }}
        />

        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "regular", "spacious"]}
          onChange={(v) => setTweak('density', v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
