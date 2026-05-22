document.addEventListener('DOMContentLoaded', function() {
    // Modern Project Page Scripts
    console.log('✨ Modern Project Page Scripts Loading...');

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
        });
        
        mobileToggle.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        mobileToggle.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (mainNav.classList.contains('active') && 
                !mainNav.contains(e.target) && 
                !mobileToggle.contains(e.target)) {
                mobileToggle.classList.remove('active');
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileToggle) {
                mobileToggle.classList.remove('active');
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Header Scroll Effect
    const header = document.querySelector('.header');
    
    function handleScroll() {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavigation() {
        const scrollPosition = window.scrollY + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                });
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation();

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.feature-card, .architecture-component, .result-card, .analysis-card');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        revealObserver.observe(element);
    });

    // Copy button functionality
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const codeBlock = this.closest('.json-container, .code-container')?.querySelector('code, pre');
            if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    const originalText = this.textContent;
                    this.textContent = 'Copied!';
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 2000);
                });
            }
        });
    });

    // Workflow controls
    const workflowButtons = document.querySelectorAll('.workflow-btn');
    workflowButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            workflowButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide workflow content
            const targetId = this.getAttribute('data-target');
            const allContent = document.querySelectorAll('.workflow-content');
            const targetContent = document.querySelector(`#${targetId}`);
            
            allContent.forEach(content => {
                content.classList.remove('active');
                content.style.opacity = '0';
                content.style.display = 'none';
            });
            
            if (targetContent) {
                targetContent.style.display = 'block';
                // Trigger reflow
                void targetContent.offsetWidth;
                targetContent.classList.add('active');
                targetContent.style.opacity = '1';
                targetContent.style.transition = 'opacity 0.3s ease';
            }
        });
    });

    // Initialize image optimization
    // Lazy Loading Implementation
    function initLazyLoading() {
        console.log('🖼️ Initializing project page lazy loading...');
        
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });

        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            if (img.complete || img.classList.contains('no-lazy') || img.classList.contains('critical-image')) {
                return;
            }
            
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.top > 0) {
                return; // Already visible, let it load normally
            }
            
            img.dataset.src = img.src;
            // img.src = createPlaceholder(img.width || 400, img.height || 300); // Optional
            img.classList.add('lazy-loading');
            
            lazyImageObserver.observe(img);
        });
    }

    function loadImage(img) {
        const originalSrc = img.dataset.src;
        if (!originalSrc) return;
        
        const newImg = new Image();
        newImg.onload = () => {
            img.src = originalSrc;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            img.style.opacity = '0';
            setTimeout(() => {
                img.style.opacity = '1';
                img.style.transition = 'opacity 0.5s ease-in-out';
            }, 50);
        };
        newImg.src = originalSrc;
    }

    initLazyLoading();

    // Mobile orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            
            if (mobileToggle && mainNav) {
                mobileToggle.classList.remove('active');
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            const mermaidElements = document.querySelectorAll('.mermaid');
            if (mermaidElements.length > 0 && typeof mermaid !== 'undefined') {
                setTimeout(() => {
                    mermaid.init();
                }, 300);
            }
        }, 100);
    });
    
    console.log('✨ Modern Project Page Scripts Initialized!');
});

/* ════════════════════════════════════════════════════════════════════════
   COSMIC TERMINAL THEME — shared background, scroll progress, and reveals.
   Injected at runtime so every project page matches root index.html with
   no per-page HTML edits. Mirrors the inline theme module in index.html.
   ════════════════════════════════════════════════════════════════════════ */
(function cosmicTheme(){
    'use strict';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function ready(fn){
        if(document.readyState === 'loading'){
            document.addEventListener('DOMContentLoaded', fn);
        } else { fn(); }
    }

    /* ── Inject the cosmic stage + scroll-progress bar into the page ── */
    function injectStage(){
        if(document.getElementById('cosmic-stage')) return;

        var stage = document.createElement('div');
        stage.id = 'cosmic-stage';
        stage.setAttribute('aria-hidden', 'true');
        stage.innerHTML =
            '<canvas id="cosmic-canvas"></canvas>' +
            '<div class="scanline"></div>' +
            '<div class="vignette"></div>';
        document.body.insertBefore(stage, document.body.firstChild);

        var progress = document.createElement('div');
        progress.className = 'scroll-progress';
        progress.innerHTML = '<div class="bar" id="scroll-bar"></div>';
        document.body.insertBefore(progress, stage.nextSibling);
    }

    /* ── Drifting starfield with cursor parallax ── */
    function startStarfield(){
        var canvas = document.getElementById('cosmic-canvas');
        if(!canvas) return;
        var ctx = canvas.getContext('2d');
        var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
        var stars = [];
        var pointer = { x: 0.5, y: 0.5 };
        var scrollY = 0;
        var running = true;

        function seed(){
            var count = Math.min(160, Math.floor((W * H) / 11000));
            stars = new Array(count).fill(0).map(function(){
                var layer = Math.random();
                return {
                    x: Math.random() * W, y: Math.random() * H,
                    z: layer, r: 0.4 + layer * 1.5,
                    tw: Math.random() * Math.PI * 2,
                    tws: 0.4 + Math.random() * 1.2,
                    vx: (Math.random() - 0.5) * 0.04 * (layer + 0.2),
                    vy: (Math.random() - 0.5) * 0.04 * (layer + 0.2),
                    tint: Math.random() < 0.18
                };
            });
        }
        function resize(){
            W = window.innerWidth; H = window.innerHeight;
            canvas.width = Math.floor(W * DPR);
            canvas.height = Math.floor(H * DPR);
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            seed();
        }

        var t0 = performance.now();
        function frame(now){
            if(!running) return;
            var dt = Math.min(40, now - t0); t0 = now;
            ctx.clearRect(0, 0, W, H);
            var parX = (pointer.x - 0.5) * 18;
            var parY = (pointer.y - 0.5) * 18 + scrollY * 0.05;

            for(var i = 0; i < stars.length; i++){
                var s = stars[i];
                s.x += s.vx * dt; s.y += s.vy * dt;
                if(s.x < -10) s.x = W + 10; if(s.x > W + 10) s.x = -10;
                if(s.y < -10) s.y = H + 10; if(s.y > H + 10) s.y = -10;
                s.tw += dt * 0.001 * s.tws;

                var twinkle = 0.55 + 0.45 * Math.sin(s.tw);
                var px = s.x + parX * (s.z + 0.2);
                var py = s.y + parY * (s.z + 0.2);
                var alpha = (0.22 + s.z * 0.6) * twinkle;

                ctx.beginPath();
                ctx.arc(px, py, s.r, 0, Math.PI * 2);
                ctx.fillStyle = s.tint ? 'rgba(94,234,212,' + alpha + ')' : 'rgba(216,228,231,' + alpha + ')';
                ctx.fill();

                if(s.z > 0.86){
                    ctx.beginPath();
                    ctx.arc(px, py, s.r * 3.4, 0, Math.PI * 2);
                    var g = ctx.createRadialGradient(px, py, 0, px, py, s.r * 3.4);
                    g.addColorStop(0, s.tint ? 'rgba(94,234,212,' + (alpha * 0.32) + ')' : 'rgba(255,255,255,' + (alpha * 0.25) + ')');
                    g.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = g; ctx.fill();
                }
            }
            requestAnimationFrame(frame);
        }

        window.addEventListener('resize', resize);
        window.addEventListener('pointermove', function(e){
            pointer.x = e.clientX / window.innerWidth;
            pointer.y = e.clientY / window.innerHeight;
        }, { passive: true });
        window.addEventListener('scroll', function(){ scrollY = window.scrollY; }, { passive: true });
        document.addEventListener('visibilitychange', function(){
            if(document.hidden){ running = false; }
            else if(!reduced){ running = true; t0 = performance.now(); requestAnimationFrame(frame); }
        });

        resize();
        if(!reduced){
            requestAnimationFrame(frame);
        } else {
            ctx.clearRect(0, 0, W, H);
            for(var j = 0; j < stars.length; j++){
                var st = stars[j];
                ctx.beginPath();
                ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(216,228,231,' + (0.22 + st.z * 0.5) + ')';
                ctx.fill();
            }
        }
    }

    /* ── Top scroll-progress bar ── */
    function startScrollProgress(){
        var bar = document.getElementById('scroll-bar');
        if(!bar) return;
        function update(){
            var h = document.documentElement.scrollHeight - window.innerHeight;
            var p = h > 0 ? (window.scrollY / h) * 100 : 0;
            bar.style.width = p + '%';
        }
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    /* ── Scroll-reveal: repurpose inert data-aos hooks as fade-ups ──
       AOS is not loaded on these pages, so data-aos attributes have no
       effect. Drive them with the .reveal mechanism for parity with
       index.html. Elements already revealed by the page's own observer
       (.feature-card etc.) are left untouched to avoid double-handling. */
    function startReveals(){
        var owned = '.feature-card, .architecture-component, .result-card, .analysis-card';
        var els = [];
        document.querySelectorAll('[data-aos]').forEach(function(el){
            if(el.matches(owned)) return;
            el.classList.add('reveal');
            var delay = parseInt(el.getAttribute('data-aos-delay'), 10);
            if(delay > 0){ el.style.transitionDelay = delay + 'ms'; }
            els.push(el);
        });
        if(!els.length) return;

        if(reduced){
            els.forEach(function(el){ el.classList.add('in'); });
            return;
        }
        var vh = window.innerHeight;
        els.forEach(function(el){
            var r = el.getBoundingClientRect();
            if(r.top < vh * 0.95 && r.bottom > 0){ el.classList.add('in'); }
        });
        var io = new IntersectionObserver(function(entries){
            entries.forEach(function(e){
                if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        els.forEach(function(el){ if(!el.classList.contains('in')) io.observe(el); });
    }

    ready(function(){
        injectStage();
        startStarfield();
        startScrollProgress();
        startReveals();
    });
})();