// Main portfolio app — techy mono variant.
const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "azure",
  "typePairing": "jetbrains",
  "heroVariant": "centered",
  "projectLayout": "editorial",
  "density": "regular"
}/*EDITMODE-END*/;

const PALETTES = {
  azure:  { label: "Azure",  accent: "#6f8bff", accent2: "#9db4ff", glow: "rgba(111,139,255,0.42)", soft: "rgba(111,139,255,0.16)" },
  teal:   { label: "Teal",   accent: "#5eead4", accent2: "#7dd3fc", glow: "rgba(94,234,212,0.42)",  soft: "rgba(94,234,212,0.16)" },
  cyber:  { label: "Cyber",  accent: "#22d3ee", accent2: "#a78bfa", glow: "rgba(34,211,238,0.42)",  soft: "rgba(34,211,238,0.16)" },
  matrix: { label: "Matrix", accent: "#84cc16", accent2: "#22c55e", glow: "rgba(132,204,22,0.42)",  soft: "rgba(132,204,22,0.16)" },
  amber:  { label: "Amber",  accent: "#fbbf24", accent2: "#fb923c", glow: "rgba(251,191,36,0.42)",  soft: "rgba(251,191,36,0.16)" },
  bone:   { label: "Bone",   accent: "#e7e5e4", accent2: "#a8a29e", glow: "rgba(231,229,228,0.32)", soft: "rgba(231,229,228,0.10)" },
};

// ───────────────────────── Reveal hook ─────────────────────────
function useReveal(){
  useEffect(() => {
    let io = null;
    function attach(){
      const els = document.querySelectorAll('.reveal:not(.in), .principle:not(.in), .stack-cell:not(.in)');
      // Anything already on screen at mount: reveal immediately (no IO wait).
      const vh = window.innerHeight;
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if(r.top < vh * 0.95 && r.bottom > 0){ el.classList.add('in'); }
      });
      // Observe the rest for scroll-in.
      io && io.disconnect();
      io = new IntersectionObserver((entries) => {
        for(const e of entries){
          if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
        }
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      document.querySelectorAll('.reveal:not(.in), .principle:not(.in), .stack-cell:not(.in)').forEach(el => io.observe(el));
    }
    attach();
    // Re-attach when layout/content changes (e.g. project layout swap, hero variant swap).
    const mo = new MutationObserver(() => attach());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io && io.disconnect(); mo.disconnect(); };
  }, []);
}

// ───────────────────────── Frame-by-frame helpers ─────────────────────────

// Quick per-char scramble: each letter cycles glyphs briefly (≈180ms) then locks
// to its real character. Letters start in a left-to-right wave so the word
// resolves as a clean cascade — no partial misspellings linger.
function GlyphShuffle({ text, perChar = 60, scrambleMs = 180, fps = 28 }){
  const [frame, setFrame] = useState(0);
  const startRef = useRef(0);
  useEffect(() => {
    startRef.current = performance.now();
    let raf;
    function tick(){
      setFrame(f => f + 1);
      raf = requestAnimationFrame(() => setTimeout(tick, 1000 / fps));
    }
    tick();
    // Stop scrambling once the last char has locked.
    const stopAt = perChar * text.length + scrambleMs + 80;
    const stop = setTimeout(() => cancelAnimationFrame(raf), stopAt);
    return () => { cancelAnimationFrame(raf); clearTimeout(stop); };
  }, [text]);

  const glyphs = "▓▒░█ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}<>/=*_-";
  const now = performance.now() - startRef.current;

  const words = text.split(" ");
  let globalI = 0;
  const nodes = [];
  words.forEach((word, wi) => {
    nodes.push(
      <span key={`w${wi}`} style={{ display:'inline-block', whiteSpace:'nowrap' }}>
        {[...word].map((ch) => {
          const i = globalI++;
          const charStart = i * perChar;
          const charEnd = charStart + scrambleMs;
          let display = ch;
          let glow = false;
          if(now < charStart){ display = ""; }
          else if(now < charEnd){ display = glyphs[(Math.random() * glyphs.length) | 0]; glow = true; }
          return <span key={i} className={"gs-char" + (glow ? " gs-flash" : "")}>{display || "\u00A0"}</span>;
        })}
      </span>
    );
    if(wi < words.length - 1){ globalI++; nodes.push(<span key={`s${wi}`}> </span>); }
  });
  return <span className="glyph-shuffle">{nodes}</span>;
}

// Typing line — types char by char.
function TypeLine({ text, speed = 4, onDone, className }){
  const [n, setN] = useState(0);
  useEffect(() => {
    if(n >= text.length){ onDone && onDone(); return; }
    // Batch a few chars per tick to stay fast even under timer throttling.
    const id = setTimeout(() => setN(Math.min(text.length, n + 2)), speed + Math.random()*6);
    return () => clearTimeout(id);
  }, [n, text]);
  return <span className={className}>{text.slice(0, n)}</span>;
}

// Boot sequence — frame-by-frame typed lines with delays
function BootSequence(){
  const [step, setStep] = useState(0);
  const lines = [
    { cls: "dim",  text: "$ boot --portfolio --user=youngwoo-song" },
    { cls: "dim",  text: "→ loading modules ............ ", suffix: "ok" },
    { cls: "dim",  text: "→ connecting agents .......... ", suffix: "ok" },
    { cls: "dim",  text: "→ render pipeline ............ ", suffix: "ok" },
    { cls: "acc",  text: "→ ready. type --view to begin." },
  ];
  return (
    <pre className="boot" aria-hidden="true">
      {lines.slice(0, step+1).map((ln, i) => (
        <span className="line" key={i}>
          {i < step
            ? <span className={ln.cls}>{ln.text}{ln.suffix && <span className="ok"> [{ln.suffix}]</span>}</span>
            : <span className={ln.cls}>
                <TypeLine text={ln.text} speed={3} onDone={() => setStep(s => Math.min(lines.length-1, s+1))} />
                {ln.suffix && step === lines.length-1 && <span className="ok"> [{ln.suffix}]</span>}
              </span>}
        </span>
      ))}
    </pre>
  );
}

// Number counter that animates when in viewport
function CountUp({ end, duration = 1200, suffix = "" }){
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if(!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      for(const e of entries){
        if(e.isIntersecting){
          const t0 = performance.now();
          function tick(now){
            const t = Math.min(1, (now - t0)/duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(Math.round(end * eased));
            if(t < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          io.disconnect();
        }
      }
    }, { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [end]);
  return <span ref={ref} className="num">{val}{suffix}</span>;
}

// ───────────────────────── Nav ─────────────────────────
function Nav(){
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#top" className="brand">
          <span className="dot"></span>
          <span>y_w_song.sh</span>
        </a>
        <div className="nav-links">
          <a href="#work">work</a>
          <a href="#approach">approach</a>
          <a href="#stack">stack</a>
          <a href="#contact">contact</a>
        </div>
        <a className="nav-cta" href="mailto:youngwoo930@gmail.com">connect</a>
      </div>
    </nav>
  );
}

// ───────────────────────── Hero ─────────────────────────
function Hero({ variant }){
  return (
    <section id="top" className={`hero variant-${variant}`}>
      {variant === "coords" && (
        <div className="coord-grid" aria-hidden="true">
          <div>// 36.85°S / 174.76°E</div><div></div><div>v2 / 2026</div>
          <div></div><div></div><div></div>
          <div>Auckland · AOT</div><div></div><div>● available</div>
        </div>
      )}

      <div className="wrap">
        <BootSequence />

        <div className="hero-meta reveal">
          <span className="status-pill"><span className="pulse"></span><span>ai specialist · ignite · auckland · hybrid</span></span>
        </div>

        {variant === "split" ? (
          <h1 className="reveal reveal-1">
            young woo<br/>
            <span className="acc"><GlyphShuffle text="song" /></span>
          </h1>
        ) : variant === "coords" ? (
          <h1 className="reveal reveal-1">
            young woo song<br/>
            <span className="acc"><GlyphShuffle text="applied ai" /></span> · architecture
          </h1>
        ) : (
          <h1 className="reveal reveal-1">
            young woo song<br/>
            <span className="acc"><GlyphShuffle text="applied" /></span> ai.
          </h1>
        )}

        <p className="hero-tag reveal reveal-2">
          <span className="prompt">$</span>
          ai specialist at ignite. i build internal ai tools — knowledge retrieval, workflow automation, document and compliance support — and establish governance, evaluation, and adoption frameworks for design and architecture teams.
        </p>

        <div className="hero-foot reveal reveal-3">
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

      <div className="scroll-cue" aria-hidden="true">
        <span>scroll</span>
        <span className="line"></span>
      </div>
    </section>
  );
}

// ───────────────────────── Work: editorial list ─────────────────────────
function WorkEditorial({ projects, previewRef }){
  const onMove = (e, p, i) => {
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
    document.getElementById('preview-frame-l').textContent = `FRAME ${String(i+1).padStart(2,'0')}`;
    document.getElementById('preview-frame-r').textContent = `● REC`;
  };
  const onLeave = () => previewRef.current?.classList.remove('show');

  return (
    <div className="work-list">
      {projects.map((p, i) => (
        <a key={p.id} href={`project.html?id=${p.id}`}
           className="work-row reveal"
           style={{ transitionDelay: `${0.03 * i}s` }}
           onMouseMove={(e) => onMove(e, p, i)}
           onMouseLeave={onLeave}>
          <div className="idx">{String(i + 1).padStart(2, '0')}</div>
          <div className="title-col">
            <div className="title">{p.title.toLowerCase()}</div>
            <div className="blurb">{p.subtitle} — {p.blurb}</div>
          </div>
          <div className="cat">{p.category}</div>
          <div className="arrow" aria-hidden="true">↗</div>
        </a>
      ))}
    </div>
  );
}

function WorkCards({ projects }){
  return (
    <div className="work-grid">
      {projects.map((p, i) => (
        <a key={p.id} href={`project.html?id=${p.id}`} className="work-card reveal" style={{ transitionDelay: `${0.04 * (i % 6)}s` }}>
          <div className="thumb">{p.mark}</div>
          <div className="ccat">{p.category} / {p.year}</div>
          <div className="ctitle">{p.title.toLowerCase()}</div>
          <div className="cblurb">{p.blurb}</div>
        </a>
      ))}
    </div>
  );
}

function WorkIndex({ projects }){
  return (
    <div className="work-index">
      <div className="head">
        <span>idx</span><span>project</span><span>category</span><span>stack</span><span></span>
      </div>
      {projects.map((p, i) => (
        <a key={p.id} href={`project.html?id=${p.id}`} className="row reveal" style={{ transitionDelay: `${0.025 * i}s` }}>
          <span>{String(i + 1).padStart(2, '0')}</span>
          <span className="tname">{p.title.toLowerCase()}</span>
          <span>{p.category}</span>
          <span>{p.tech.slice(0,3).join(' · ')}</span>
          <span>↗</span>
        </a>
      ))}
    </div>
  );
}

function Work({ layout }){
  const previewRef = useRef(null);
  useEffect(() => { previewRef.current = document.getElementById('work-preview'); }, []);
  return (
    <section id="work">
      <div className="wrap">
        <div className="section-tag reveal">
          <span className="marker">[01]</span>
          <span>selected work</span>
          <span className="rule"></span>
          <span>{PROJECTS.length} projects</span>
        </div>

        <div className="stats reveal">
          <div className="stat"><span className="sn"><CountUp end={12} /></span><span className="sl">shipped projects</span></div>
          <div className="stat"><span className="sn"><CountUp end={7} /></span><span className="sl">yrs in architecture</span></div>
          <div className="stat"><span className="sn"><CountUp end={4} /></span><span className="sl">multi-agent systems</span></div>
          <div className="stat"><span className="sn"><CountUp end={2} /></span><span className="sl">ibm specializations · 2025</span></div>
        </div>

        {layout === "editorial" && <WorkEditorial projects={PROJECTS} previewRef={previewRef} />}
        {layout === "cards" && <WorkCards projects={PROJECTS} />}
        {layout === "index" && <WorkIndex projects={PROJECTS} />}
      </div>
    </section>
  );
}

// ───────────────────────── Approach ─────────────────────────
function Approach(){
  return (
    <section id="approach" className="approach">
      <div className="wrap">
        <div className="section-tag reveal">
          <span className="marker">[02]</span>
          <span>approach</span>
          <span className="rule"></span>
        </div>
        <div className="approach-grid">
          <div>
            <h2 className="reveal">from architecture to <span className="acc">applied ai</span>.</h2>
            <p className="reveal reveal-1">seven years across new zealand architecture practices — ignite, woods bagot, rcg — taught me to work with constraints and ship under pressure. now back at ignite as ai specialist, applying generative ai and machine learning to real architecture and design workflows.</p>
            <p className="reveal reveal-2">i build internal tools — rag, workflow automation, document and compliance support — and stand up the governance, evals, and adoption frameworks that make them safe to scale. aut-accredited in data science &amp; ai (institute of data) and ibm-certified across ai engineering and ai development.</p>
          </div>
          <div className="principles">
            {PRINCIPLES.map((p) => (
              <div className="principle" key={p.n}>
                <div className="pn">{p.n}</div>
                <div>
                  <div className="pt">{p.t.toLowerCase()}</div>
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
    <section id="stack">
      <div className="wrap">
        <div className="section-tag reveal">
          <span className="marker">[03]</span>
          <span>stack</span>
          <span className="rule"></span>
        </div>
        <div className="stack-grid">
          {STACK.map((s) => (
            <div className="stack-cell" key={s.head}>
              <div className="sh">{s.head}</div>
              <div className="st">{s.title.toLowerCase()}</div>
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
    <section id="contact" className="contact">
      <div className="wrap">
        <div className="section-tag reveal">
          <span className="marker">[04]</span>
          <span>contact</span>
          <span className="rule"></span>
        </div>
        <div className="contact-card reveal">
          <h2>let&rsquo;s build<br/>something <span className="acc">real</span>.</h2>
          <p>open to interesting work in applied ai, ai governance and adoption, multi-agent systems, and tools for architecture and design.</p>
          <div className="contact-actions">
            <a className="btn btn-primary" href="mailto:youngwoo930@gmail.com">youngwoo930@gmail.com <span className="ar">↗</span></a>
            <a className="btn btn-ghost" href="https://www.linkedin.com/in/young-woo-song-145488217/">linkedin <span className="ar">↗</span></a>
            <a className="btn btn-ghost" href="https://github.com/Userdflt">github <span className="ar">↗</span></a>
          </div>
        </div>
      </div>
      <div className="wrap">
        <div className="footer">
          <div className="footer-inner">
            <span>© 2026 young woo song <span className="acc">·</span> auckland, nz</span>
            <span>build <span className="acc">v2.0</span> · last sync may 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── App + Tweaks ─────────────────────────
function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const p = PALETTES[t.palette] || PALETTES.teal;
    const r = document.documentElement;
    r.style.setProperty('--accent', p.accent);
    r.style.setProperty('--accent-2', p.accent2);
    r.style.setProperty('--accent-glow', p.glow);
    r.style.setProperty('--accent-soft', p.soft);
    r.classList.remove('density-compact','density-regular','density-spacious');
    r.classList.add(`density-${t.density}`);
    r.setAttribute('data-type-pairing', t.typePairing);
  }, [t.palette, t.density, t.typePairing]);

  useReveal();

  return (
    <>
      <Nav />
      <Hero variant={t.heroVariant} />
      <Work layout={t.projectLayout} />
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

        <TweakSection label="Typography" />
        <TweakRadio
          label="Mono"
          value={t.typePairing}
          options={["jetbrains", "plex", "geist"]}
          onChange={(v) => setTweak('typePairing', v)}
        />

        <TweakSection label="Layout" />
        <TweakRadio
          label="Hero"
          value={t.heroVariant}
          options={["centered", "coords", "split"]}
          onChange={(v) => setTweak('heroVariant', v)}
        />
        <TweakSelect
          label="Projects"
          value={t.projectLayout}
          options={["editorial", "cards", "index"]}
          onChange={(v) => setTweak('projectLayout', v)}
        />
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
