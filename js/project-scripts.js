document.addEventListener('DOMContentLoaded', function() {
    // E-ink style project page initialization
    console.log('📄 E-ink Project Page Scripts Loading...');

    // Mobile Menu Toggle with e-ink effects
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
            
            // E-ink flicker effect
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

    // E-ink smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // E-ink page turn effect
                document.body.classList.add('page-transition');
                
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                setTimeout(() => {
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    setTimeout(() => {
                        document.body.classList.remove('page-transition');
                    }, 800);
                }, 100);
            }
        });
    });

    // E-ink style navigation highlighting
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

    // E-ink style interactive elements
    const interactiveElements = document.querySelectorAll('.btn, .feature-card, .architecture-component, .social-link');
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

    // E-ink style section reveal on scroll
    const revealElements = document.querySelectorAll('.feature-card, .architecture-component, .result-card, .analysis-card');
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

    // E-ink style back button behavior
    const backButtons = document.querySelectorAll('a[href*="index.html"]');
    backButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // E-ink page turn effect
            this.classList.add('e-ink-transition');
            document.body.classList.add('page-transition');
            
            setTimeout(() => {
                window.location.href = this.href;
            }, 400);
        });
    });

    // E-ink style tech table interactions
    const tableRows = document.querySelectorAll('.tools-table tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 150);
        });
    });

    // E-ink style copy button functionality (if present)
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('e-ink-transition');
            
            // Find the code content to copy
            const codeBlock = this.closest('.json-container, .code-container')?.querySelector('code, pre');
            if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    const originalText = this.textContent;
                    this.textContent = 'Copied!';
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('e-ink-transition');
                    }, 2000);
                });
            }
        });
    });

    // E-ink style workflow controls (if present)
    const workflowButtons = document.querySelectorAll('.workflow-btn');
    workflowButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('e-ink-transition');
            
            // Remove active class from all buttons
            workflowButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide workflow content with e-ink effect
            const targetId = this.getAttribute('data-target');
            const allContent = document.querySelectorAll('.workflow-content');
            const targetContent = document.querySelector(`#${targetId}`);
            
            allContent.forEach(content => {
                content.classList.add('e-ink-transition');
                content.classList.remove('active');
            });
            
            if (targetContent) {
                setTimeout(() => {
                    targetContent.classList.add('active');
                    targetContent.classList.add('e-ink-transition');
                    setTimeout(() => {
                        targetContent.classList.remove('e-ink-transition');
                    }, 300);
                }, 200);
            }
            
            setTimeout(() => this.classList.remove('e-ink-transition'), 300);
        });
    });

    // E-ink style link hover effects
    const allLinks = document.querySelectorAll('a:not(.btn):not(.project-card)');
    allLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.classList.add('e-ink-transition');
            setTimeout(() => this.classList.remove('e-ink-transition'), 150);
        });
    });

    // Disable AOS animations if present
    if (typeof AOS !== 'undefined') {
        console.log('📖 Disabling AOS animations for e-ink style');
        AOS.init({
            disable: true
        });
    }

    // E-ink page loading completion
    setTimeout(() => {
        document.body.classList.add('e-ink-transition');
        setTimeout(() => {
            document.body.classList.remove('e-ink-transition');
            console.log('📚 E-ink Project Page Scripts Ready');
        }, 300);
    }, 100);

    console.log('📄 E-ink Project Page Scripts Initialized Successfully!');
});