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

    // Professional project card animations
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        // Clean staggered entrance animation with classes
        card.classList.add('initial-hidden');
        
        setTimeout(() => {
            card.classList.remove('initial-hidden');
            card.classList.add('initial-visible');
        }, index * 200 + 300);

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

    // Define category groups for similarity-based filtering
    const categoryGroups = {
        'ai-rag-systems': ['ai-rag-systems', 'multi-agent-rag', 'rag-systems', 'ai-agent', 'llm-systems'],
        'computer-vision-genai': ['computer-vision-genai', 'generative-ai', 'computer-vision', 'genai', 'stable-diffusion'],
        'app-development': ['app-development', 'web-development', 'mobile-development', 'flutter', 'frontend'],
        'data-science-analytics': ['data-science-analytics', 'data-analytics', 'analytics', 'data-visualization'],
        'data-science-ml': ['data-science-ml', 'machine-learning', 'ml', 'predictive-modeling', 'classification', 'regression']
    };

    function isInCategory(cardCategory, filterCategory) {
        if (filterCategory === 'all') return true;
        
        // Check if the card's category matches any of the similar categories
        const similarCategories = categoryGroups[filterCategory] || [filterCategory];
        return similarCategories.some(cat => 
            cardCategory.includes(cat) || 
            cat.includes(cardCategory) || 
            cardCategory === cat
        );
    }

    function filterProjects(category) {
        console.log('Filtering projects for category:', category);
        
        // SEAMLESS FILTERING: No visible reordering - smooth fade out/in only
        
        // Determine which cards should show/hide
        const cardsToShow = [];
        const cardsToHide = [];
        
        projectCards.forEach((card) => {
            const cardCategory = card.getAttribute('data-category');
            const shouldShow = isInCategory(cardCategory, category);
            
            // Clear all inline styles to let CSS classes control everything
            card.removeAttribute('style');
            
            if (shouldShow) {
                cardsToShow.push(card);
            } else {
                cardsToHide.push(card);
            }
        });
        
        console.log(`Showing ${cardsToShow.length} cards, hiding ${cardsToHide.length} cards`);
        
        // PHASE 1: Fade out ALL cards to hide reordering
        projectCards.forEach(card => {
            card.classList.remove('filtered-in', 'filtered-out', 'filtering-in', 'filtering-out', 'prepare-fade-in');
            card.classList.add('global-fade-out');
        });
        
        // PHASE 2: After fade-out completes, remove hidden cards and prepare visible ones
        const fadeOutDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 200 : 400;
        setTimeout(() => {
            // Remove hidden cards from layout (no animation visible since all are faded out)
            cardsToHide.forEach(card => {
                card.classList.remove('global-fade-out');
                card.classList.add('filtered-out');
            });
            
            // Prepare visible cards for fade-in (invisible but positioned)
            cardsToShow.forEach(card => {
                card.classList.remove('global-fade-out');
                card.classList.add('prepare-fade-in');
            });
            
            // PHASE 3: After brief positioning delay, fade in visible cards
            setTimeout(() => {
                cardsToShow.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.remove('prepare-fade-in', 'initial-hidden');
                        card.classList.add('filtered-in', 'initial-visible');
                    }, index * 50); // Staggered fade-in for elegance
                });
            }, 50); // Brief delay for positioning
            
        }, fadeOutDuration);
        
        // Grid state management for smooth layout adjustments
        const projectsGrid = document.querySelector('.projects-grid');
        if (projectsGrid) {
            const totalDuration = fadeOutDuration + 50 + (cardsToShow.length * 50) + 300;
            projectsGrid.classList.add('filtering');
            setTimeout(() => {
                projectsGrid.classList.remove('filtering');
            }, totalDuration);
        }
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Filter button clicked:', this.getAttribute('data-filter'));
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter category
            const filterCategory = this.getAttribute('data-filter');
            
            // Filter projects
            filterProjects(filterCategory);
        });
    });

    // Initialize with all projects visible
    console.log('Initializing filters...');
    console.log('Found filter buttons:', filterButtons.length);
    console.log('Found project cards:', projectCards.length);
    
    filterProjects('all');

    console.log('🚀 Portfolio website with smooth animations and filtering initialized successfully!');


}); 