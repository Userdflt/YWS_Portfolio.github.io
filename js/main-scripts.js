document.addEventListener('DOMContentLoaded', function() {
    // Modern Glass Portfolio initialization
    console.log('✨ Modern Glass Portfolio Loading...');

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
        });
        
        // Touch feedback
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

    // Skill bar animations
    const skillBars = document.querySelectorAll('.skill-bar');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, 200);
            }
        });
    }, { threshold: 0.2 });

    skillBars.forEach(bar => {
        skillObserver.observe(bar);
    });

    // Filter system
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterableCards = document.querySelectorAll('.project-card');
    
    if (filterButtons.length > 0 && filterableCards.length > 0) {
        // Initialize all cards as visible
        filterableCards.forEach((card) => {
            card.style.display = 'flex';
            card.style.opacity = '1';
            card.style.visibility = 'visible';
        });
        
        // Set "All" button as active
        filterButtons.forEach(btn => btn.classList.remove('active'));
        const allButton = document.querySelector('.filter-btn[data-filter="all"]');
        if (allButton) allButton.classList.add('active');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const filter = this.getAttribute('data-filter');
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                filterProjects(filter);
            });
        });
    }
    
    function filterProjects(category) {
        filterableCards.forEach((card, index) => {
            const cardCategory = card.getAttribute('data-category');
            const shouldShow = category === 'all' || cardCategory === category;
            
            if (shouldShow) {
                card.style.display = 'flex';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.visibility = 'visible';
                    card.style.transform = 'translateY(0)';
                }, 50 * index);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.visibility = 'hidden';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }

    // Scroll Indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const aboutSection = document.querySelector('#about');
            if (aboutSection) {
                aboutSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.tech-category, .skill-category, .project-card, .section-title, .about-text, .strength-list');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('page-transition');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        revealObserver.observe(element);
    });

    // Typing effect for hero text
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent.trim();
        // Only run if text content is simple (avoid breaking nested spans if complex)
        // For complex HTML in title, we'll skip the typing effect or handle differently
        // Assuming simple text or span structure for now
    }

    // ===== IMAGE OPTIMIZATION SYSTEM =====
    
    // Lazy Loading Implementation
    function initLazyLoading() {
        console.log('🖼️ Initializing lazy loading system...');
        
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
                return; 
            }
            
            img.dataset.src = img.src;
            // Create a glass placeholder
            // img.src = createPlaceholder(img.width || 400, img.height || 300); // Optional: disable if causes layout shift
            img.classList.add('lazy-loading');
            
            lazyImageObserver.observe(img);
        });
    }

    function loadImage(img) {
        const originalSrc = img.dataset.src;
        if (!originalSrc) return;
        
        // Simple load for now, can re-enable WebP logic if needed
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

    // Initialize image optimization
    setTimeout(initLazyLoading, 100);

    console.log('✨ Modern Glass Portfolio interactions initialized!');
});