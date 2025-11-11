document.addEventListener('DOMContentLoaded', function() {
    // E-ink style page initialization
    console.log('📖 E-ink Portfolio Loading...');

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
            
            // E-ink flicker effect for menu
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 300);
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

    // Header Scroll Effect - E-ink Style
    const header = document.querySelector('.header');
    
    function handleScroll() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // Smooth scrolling for anchor links with e-ink page turn effect
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // E-ink refresh effect
                document.body.classList.add('e-ink-page-refresh');
                
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                setTimeout(() => {
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    setTimeout(() => {
                        document.body.classList.remove('e-ink-page-refresh');
                    }, 800);
                }, 100);
            }
        });
    });

    // Active navigation highlighting with e-ink transitions
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavigation() {
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    link.classList.add('e-ink-transition');
                    setTimeout(() => link.classList.remove('e-ink-transition'), 200);
                });
                if (navLink) {
                    navLink.classList.add('active');
                    navLink.classList.add('e-ink-transition');
                    setTimeout(() => navLink.classList.remove('e-ink-transition'), 200);
                }
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation();

    // E-ink style skill bar animations
    const skillBars = document.querySelectorAll('.skill-bar');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Delayed e-ink style animation
                setTimeout(() => {
                    entry.target.classList.add('animate');
                    entry.target.classList.add('e-ink-transition');
                    setTimeout(() => {
                        entry.target.classList.remove('e-ink-transition');
                    }, 300);
                }, Math.random() * 500); // Staggered timing
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => {
        skillObserver.observe(bar);
    });

    // E-ink style project card interactions
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            // E-ink refresh effect before navigation
            this.classList.add('e-ink-transition');
            document.body.classList.add('e-ink-page-refresh');
            
            setTimeout(() => {
                if (this.href) {
                    window.location.href = this.href;
                }
            }, 400); // Delay for e-ink effect
        });

        // E-ink hover effects
        card.addEventListener('mouseenter', function() {
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 200);
        });
    });

    // E-ink style filter system - Simple and clean
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterableCards = document.querySelectorAll('.project-card');
    
    if (filterButtons.length > 0 && filterableCards.length > 0) {
        console.log(`📚 Found ${filterButtons.length} filter buttons and ${filterableCards.length} project cards`);
        
        // Initialize all cards as visible
        filterableCards.forEach((card) => {
            card.style.display = 'flex';
            card.style.opacity = '1';
            card.style.visibility = 'visible';
        });
        
        // Set "All" button as active by default
        filterButtons.forEach(btn => btn.classList.remove('active'));
        const allButton = document.querySelector('.filter-btn[data-filter="all"]');
        if (allButton) allButton.classList.add('active');
        
        // E-ink style filtering
        filterButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const filter = this.getAttribute('data-filter');
                
                // E-ink transition effect
                this.classList.add('e-ink-transition');
                setTimeout(() => this.classList.remove('e-ink-transition'), 300);
                
                // Update active button
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.classList.add('e-ink-transition');
                    setTimeout(() => btn.classList.remove('e-ink-transition'), 200);
                });
                this.classList.add('active');
                
                // E-ink style project filtering
                eInkFilterProjects(filter);
            });
        });
    }
    
    function eInkFilterProjects(category) {
        console.log(`📖 Filtering projects by: ${category}`);
        
        filterableCards.forEach((card, index) => {
            const cardCategory = card.getAttribute('data-category');
            const shouldShow = category === 'all' || cardCategory === category;
            
            // E-ink style show/hide with staggered timing
            setTimeout(() => {
                card.classList.add('e-ink-transition');
                
                if (shouldShow) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.visibility = 'visible';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.visibility = 'hidden';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 200);
                }
                
                setTimeout(() => {
                    card.classList.remove('e-ink-transition');
                }, 300);
            }, index * 50); // Staggered timing for e-ink effect
        });
    }

    // E-ink style interactive element effects
    const interactiveElements = document.querySelectorAll('.btn, .tech-category, .skill-category, .social-link');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 200);
        });
        
        element.addEventListener('click', function() {
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 300);
        });
    });

    // E-ink style scroll indicator functionality
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            this.classList.add('e-ink-transition');
            
            const aboutSection = document.querySelector('#about');
            if (aboutSection) {
                // E-ink refresh effect
                document.body.classList.add('e-ink-page-refresh');
                
                setTimeout(() => {
                    aboutSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    setTimeout(() => {
                        document.body.classList.remove('e-ink-page-refresh');
                        this.classList.remove('e-ink-transition');
                    }, 800);
                }, 100);
            }
        });
    }

    // E-ink style section reveal on scroll
    const revealElements = document.querySelectorAll('.tech-category, .skill-category, .project-card');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('e-ink-transition');
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    setTimeout(() => {
                        entry.target.classList.remove('e-ink-transition');
                    }, 300);
                }, Math.random() * 300);
            }
        });
    }, { threshold: 0.1, rootMargin: '50px' });

    revealElements.forEach(element => {
        element.style.opacity = '0.7';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        revealObserver.observe(element);
    });

    // E-ink style typing effect for hero text (subtle)
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.opacity = '1';
        
        let index = 0;
        function typeText() {
            if (index < text.length) {
                heroTitle.textContent += text.charAt(index);
                index++;
                
                // E-ink style irregular timing
                const delay = Math.random() * 20 + 30;
                setTimeout(typeText, delay);
                
                // Occasional flicker effect
                if (Math.random() < 0.2) {
                    heroTitle.classList.add('e-ink-transition');
                    setTimeout(() => heroTitle.classList.remove('e-ink-transition'), 200);
                }
            }
        }
        
        setTimeout(typeText, 100); // Start after 0.5s delay
    }

    // E-ink style tech tag interactions
    const techTags = document.querySelectorAll('.tech-tag');
    techTags.forEach(tag => {
        tag.addEventListener('mouseenter', function() {
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 200);
        });
    });

    // Remove any existing AOS animations that conflict with e-ink style
    if (typeof AOS !== 'undefined') {
        console.log('📖 Disabling AOS animations for e-ink style');
        AOS.init({
            disable: true
        });
    }

    // E-ink style form interactions if any
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 300);
        });
    });

    // E-ink page finish loading effect
    setTimeout(() => {
        document.body.classList.add('e-ink-transition');
        console.log('📖 E-ink Portfolio Loaded Successfully');
        setTimeout(() => {
            document.body.classList.remove('e-ink-transition');
        }, 500);
    }, 100);

    // E-ink style link hover effects
    const allLinks = document.querySelectorAll('a:not(.btn):not(.project-card)');
    allLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 150);
        });
    });

    // ===== IMAGE OPTIMIZATION SYSTEM =====
    
    // Lazy Loading Implementation
    function initLazyLoading() {
        console.log('🖼️ Initializing lazy loading system...');
        
        // Create intersection observer for lazy loading
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // Start loading 50px before image enters viewport
            threshold: 0.01
        });

        // Find all images and set up lazy loading
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            // Skip if already loaded or is critical above-fold image
            if (img.complete || img.classList.contains('no-lazy') || img.classList.contains('critical-image')) {
                return;
            }
            
            // Skip images that are already in viewport (above fold)
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.top > 0) {
                return; // Already visible, let it load normally
            }
            
            // Store original src and replace with placeholder
            img.dataset.src = img.src;
            img.src = createPlaceholder(img.width || 400, img.height || 300);
            img.classList.add('lazy-loading');
            
            // Observe for intersection
            lazyImageObserver.observe(img);
        });
    }

    // Create optimized placeholder
    function createPlaceholder(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // E-ink style placeholder
        ctx.fillStyle = '#f7f7f2';
        ctx.fillRect(0, 0, width, height);
        
        // Add subtle pattern
        ctx.fillStyle = '#e8e8e8';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', width/2, height/2);
        
        return canvas.toDataURL();
    }

    // Load image with WebP fallback
    function loadImage(img) {
        const originalSrc = img.dataset.src;
        if (!originalSrc) return;
        
        // Try WebP version first if supported
        if (supportsWebP()) {
            // Create WebP path - handle both main images and ai_visual_images
            let webpSrc;
            if (originalSrc.includes('ai_visual_images/')) {
                // For ai_visual_images, replace images/ with images/optimized/
                webpSrc = originalSrc.replace('images/', 'images/optimized/').replace(/\.(jpg|jpeg|png)$/i, '.webp');
            } else {
                // For main images, add optimized folder
                webpSrc = originalSrc.replace('images/', 'images/optimized/').replace(/\.(jpg|jpeg|png)$/i, '.webp');
            }
            
            // Test if WebP version exists
            const testImg = new Image();
            testImg.onload = () => {
                // WebP version exists, use it
                img.src = webpSrc;
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
                console.log(`✅ Loaded WebP: ${webpSrc.split('/').pop()}`);
            };
            testImg.onerror = () => {
                // WebP doesn't exist, use original
                console.log(`⚠️ WebP not found, using original: ${originalSrc.split('/').pop()}`);
                loadOriginalImage(img, originalSrc);
            };
            testImg.src = webpSrc;
        } else {
            // Browser doesn't support WebP, use original
            loadOriginalImage(img, originalSrc);
        }
    }

    // Load original image
    function loadOriginalImage(img, src) {
        const newImg = new Image();
        newImg.onload = () => {
            img.src = src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            
            // E-ink style fade-in effect
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                img.style.opacity = '1';
            }, 50);
        };
        newImg.onerror = () => {
            console.warn('Failed to load image:', src);
            img.classList.add('lazy-error');
        };
        newImg.src = src;
    }

    // Check WebP support
    function supportsWebP() {
        if (typeof supportsWebP.result !== 'undefined') {
            return supportsWebP.result;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        supportsWebP.result = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return supportsWebP.result;
    }

    // Preload critical images
    function preloadCriticalImages() {
        const criticalImages = [
            'images/me_light.png', // Hero image
            'images/Vision Studio logo.png' // If on project page
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    // Responsive image loading
    function setupResponsiveImages() {
        const images = document.querySelectorAll('img[data-responsive]');
        
        images.forEach(img => {
            const baseSrc = img.dataset.responsive;
            const sizes = {
                small: baseSrc.replace(/(\.[^.]+)$/, '_small$1'),
                medium: baseSrc.replace(/(\.[^.]+)$/, '_medium$1'),
                large: baseSrc
            };
            
            // Determine appropriate size based on viewport
            const viewportWidth = window.innerWidth;
            let selectedSrc;
            
            if (viewportWidth <= 768) {
                selectedSrc = sizes.small;
            } else if (viewportWidth <= 1200) {
                selectedSrc = sizes.medium;
            } else {
                selectedSrc = sizes.large;
            }
            
            img.src = selectedSrc;
        });
    }

    // Image compression for uploads (if any)
    function compressImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Initialize image optimization system
    function initImageOptimization() {
        console.log('🚀 Starting image optimization system...');
        
        // Preload critical images first
        preloadCriticalImages();
        
        // Set up lazy loading after a short delay to let critical images load first
        setTimeout(() => {
            initLazyLoading();
        }, 100);
        
        // Set up responsive images
        setupResponsiveImages();
        
        // Handle window resize for responsive images
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(setupResponsiveImages, 250);
        });
        
        // Add performance monitoring
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark('image-optimization-start');
            window.addEventListener('load', () => {
                performance.mark('image-optimization-complete');
                performance.measure('image-optimization-duration', 'image-optimization-start', 'image-optimization-complete');
            });
        }
        
        console.log('✅ Image optimization system initialized');
    }

    // Start image optimization
    initImageOptimization();

    console.log('📚 E-ink Portfolio interactions initialized successfully!');
});