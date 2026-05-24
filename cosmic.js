// Cosmic / techy background: starfield with cyan tint + grid is on a CSS layer.
(function(){
  const canvas = document.getElementById('cosmic-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [];
  let pointer = { x: 0.5, y: 0.5 };
  let scrollY = 0;
  let running = true;
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    seed();
  }
  function seed(){
    const count = Math.min(160, Math.floor((W*H) / 11000));
    stars = new Array(count).fill(0).map(() => {
      const layer = Math.random();
      return {
        x: Math.random() * W, y: Math.random() * H,
        z: layer, r: 0.4 + layer * 1.5,
        tw: Math.random() * Math.PI * 2,
        tws: 0.4 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.04 * (layer + 0.2),
        vy: (Math.random() - 0.5) * 0.04 * (layer + 0.2),
        tint: Math.random() < 0.18  // teal-tinted
      };
    });
  }

  let t0 = performance.now();
  function frame(now){
    if(!running) return;
    const dt = Math.min(40, now - t0); t0 = now;
    ctx.clearRect(0,0,W,H);
    const parX = (pointer.x - 0.5) * 18;
    const parY = (pointer.y - 0.5) * 18 + scrollY * 0.05;

    for(const s of stars){
      s.x += s.vx * dt; s.y += s.vy * dt;
      if(s.x < -10) s.x = W + 10; if(s.x > W + 10) s.x = -10;
      if(s.y < -10) s.y = H + 10; if(s.y > H + 10) s.y = -10;
      s.tw += dt * 0.001 * s.tws;

      const twinkle = 0.55 + 0.45 * Math.sin(s.tw);
      const px = s.x + parX * (s.z + 0.2);
      const py = s.y + parY * (s.z + 0.2);
      const alpha = (0.22 + s.z * 0.6) * twinkle;

      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.tint ? `rgba(94,234,212,${alpha})` : `rgba(216,228,231,${alpha})`;
      ctx.fill();

      if(s.z > 0.86){
        ctx.beginPath();
        ctx.arc(px, py, s.r * 3.4, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(px,py,0,px,py,s.r*3.4);
        g.addColorStop(0, s.tint ? `rgba(94,234,212,${alpha*0.32})` : `rgba(255,255,255,${alpha*0.25})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / window.innerWidth;
    pointer.y = e.clientY / window.innerHeight;
  }, { passive: true });
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    // update progress bar
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (scrollY / h) * 100 : 0;
    const bar = document.getElementById('scroll-bar');
    if(bar) bar.style.width = p + '%';
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ running = false; }
    else { running = true; t0 = performance.now(); requestAnimationFrame(frame); }
  });

  resize();
  if(!reduced) requestAnimationFrame(frame);
  else { ctx.clearRect(0,0,W,H); for(const s of stars){ ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fillStyle = `rgba(216,228,231,${0.22 + s.z*0.5})`; ctx.fill(); } }
})();
