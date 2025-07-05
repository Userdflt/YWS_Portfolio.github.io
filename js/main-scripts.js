document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100
        });
    }

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
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
        if (window.scrollY > 50) {
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
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation();

    // Animated skill bars on scroll
    const skillBars = document.querySelectorAll('.skill-bar');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => {
        skillObserver.observe(bar);
    });

    // Professional project card click animation
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        // Snappy fade-away animation
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Prevent multiple clicks during animation
            if (this.classList.contains('clicking')) return;
            
            // Add clicking class for fade-away animation
            this.classList.add('clicking');
            
            // Navigate after fade-away completes
            setTimeout(() => {
                if (this.href) {
                    window.location.href = this.href;
                }
            }, 280);
        });
    });

    // Parallax effect for tech elements
    const techElements = document.querySelectorAll('.floating-shape');
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        techElements.forEach((element, index) => {
            const speed = 0.3 + (index * 0.15);
            const currentTransform = window.getComputedStyle(element).transform;
            if (currentTransform && currentTransform !== 'none') {
                element.style.transform = `${currentTransform} translateZ(${scrolled * speed * 0.1}px)`;
            } else {
                element.style.transform = `translateY(${scrolled * speed}px)`;
            }
        });
    });

    // Dynamic cursor effect for interactive elements
    const interactiveElements = document.querySelectorAll('.btn, .project-card, .skill-tag, .skill-category');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            document.body.style.cursor = 'pointer';
        });
        
        element.addEventListener('mouseleave', function() {
            document.body.style.cursor = 'default';
        });
    });

    // Smooth reveal animation for sections
    const revealSections = document.querySelectorAll('section');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    revealSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        revealObserver.observe(section);
    });

    // Project Filtering System
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterableCards = document.querySelectorAll('.project-card');
    
    if (filterButtons.length > 0 && filterableCards.length > 0) {
        console.log(`Found ${filterButtons.length} filter buttons and ${filterableCards.length} project cards`);
        
        // Initialize all cards as visible and reset any animation classes
        filterableCards.forEach((card, index) => {
            // Clean up all animation classes
            card.classList.remove('fade-out', 'hidden', 'initial-hidden', 'initial-visible');
            card.classList.add('fade-in');
            
            // Set proper display and visibility
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.visibility = 'visible';
            
            // Add staggered entrance animation
            card.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Ensure "All" button is active by default
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.removeProperty('color');
            btn.style.removeProperty('border-color');
            btn.style.removeProperty('transform');
            btn.style.removeProperty('box-shadow');
        });
        
        const allButton = document.querySelector('.filter-btn[data-filter="all"]');
        if (allButton) {
            allButton.classList.add('active');
        }
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const filter = this.getAttribute('data-filter');
                console.log(`Filter clicked: ${filter}`);
                
                // Update active button with explicit removal
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.style.removeProperty('color');
                    btn.style.removeProperty('border-color');
                    btn.style.removeProperty('transform');
                    btn.style.removeProperty('box-shadow');
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                console.log(`Active button set to: ${this.textContent}`);
                
                // Filter projects with smooth animation
                filterProjects(filter);
            });
        });
    }
    
    function filterProjects(category) {
        console.log(`Filtering projects by category: ${category}`);
        let visibleCount = 0;
        
        filterableCards.forEach((card, index) => {
            const cardCategory = card.getAttribute('data-category');
            const shouldShow = category === 'all' || cardCategory === category;
            
            if (shouldShow) {
                visibleCount++;
                // Show card with staggered animation
                card.classList.remove('fade-out', 'hidden');
                card.style.display = 'block';
                card.style.visibility = 'visible';
                setTimeout(() => {
                    card.classList.add('fade-in');
                    card.style.opacity = '1';
                }, index * 50);
            } else {
                // Hide card
                card.classList.remove('fade-in');
                card.classList.add('fade-out');
                setTimeout(() => {
                    card.classList.add('hidden');
                    card.style.display = 'none';
                    card.style.opacity = '0';
                }, 300);
            }
        });
        
        console.log(`${visibleCount} projects will be visible`);
    }

    console.log('🚀 Portfolio website initialized successfully!');


}); 