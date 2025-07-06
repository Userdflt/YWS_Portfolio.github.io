document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animations
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

    // Simple project card click navigation
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        // Direct navigation without animation
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.href) {
                window.location.href = this.href;
            }
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

    // Removed smooth reveal animations for sections

    // Simple Project Filtering System (No Animations)
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterableCards = document.querySelectorAll('.project-card');
    
    if (filterButtons.length > 0 && filterableCards.length > 0) {
        console.log(`Found ${filterButtons.length} filter buttons and ${filterableCards.length} project cards`);
        
        // Initialize all cards as visible - clean and simple
        filterableCards.forEach((card) => {
            // Remove all animation classes
            card.classList.remove('fade-out', 'fade-in', 'hidden', 'initial-hidden', 'initial-visible', 'clicking');
            
            // Set all cards to visible
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.visibility = 'visible';
            card.style.removeProperty('animation-delay');
        });
        
        // Set "All" button as active by default
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const allButton = document.querySelector('.filter-btn[data-filter="all"]');
        if (allButton) {
            allButton.classList.add('active');
        }
        
        // Add click handlers to filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const filter = this.getAttribute('data-filter');
                console.log(`Filter clicked: ${filter}`);
                
                // Update active button
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                this.classList.add('active');
                console.log(`Active button set to: ${this.textContent}`);
                
                // Filter projects immediately
                filterProjects(filter);
            });
        });
    }
    
    function filterProjects(category) {
        console.log(`Filtering projects by category: ${category}`);
        let visibleCount = 0;
        
        filterableCards.forEach((card) => {
            const cardCategory = card.getAttribute('data-category');
            const shouldShow = category === 'all' || cardCategory === category;
            
            if (shouldShow) {
                visibleCount++;
                // Show card immediately
                card.style.display = 'block';
                card.style.opacity = '1';
                card.style.visibility = 'visible';
            } else {
                // Hide card immediately
                card.style.display = 'none';
                card.style.opacity = '0';
                card.style.visibility = 'hidden';
            }
        });
        
        console.log(`${visibleCount} projects will be visible`);
    }

    console.log('🚀 Portfolio website initialized successfully!');


}); 