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

    console.log('📚 E-ink Portfolio interactions initialized successfully!');
});