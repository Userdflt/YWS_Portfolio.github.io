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