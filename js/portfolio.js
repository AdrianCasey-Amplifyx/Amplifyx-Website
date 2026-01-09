/**
 * Portfolio Page JavaScript
 * Handles Splide slideshows, scroll animations, counter animations, and parallax effects
 */

document.addEventListener('DOMContentLoaded', () => {
    initSlideshows();
    initScrollAnimations();
    initCounterAnimations();
    initParallaxOrbs();
    initSmoothScrollNav();
});

/**
 * Initialize Splide slideshows for each case study
 */
function initSlideshows() {
    const slideshowConfigs = [
        { selector: '.process-ai-slideshow', name: 'Process AI' },
        { selector: '.qualitas-slideshow', name: 'Qualitas' },
        { selector: '.irealty-slideshow', name: 'iRealty' }
    ];

    slideshowConfigs.forEach(config => {
        const element = document.querySelector(config.selector);
        if (element) {
            try {
                new Splide(element, {
                    type: 'loop',
                    perPage: 1,
                    autoplay: false,
                    pauseOnHover: true,
                    pauseOnFocus: true,
                    arrows: true,
                    pagination: true,
                    gap: '1rem',
                    lazyLoad: 'nearby',
                    preloadPages: 1,
                    speed: 500,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                    breakpoints: {
                        768: {
                            arrows: false,
                            pagination: true
                        }
                    },
                    classes: {
                        arrow: 'splide__arrow',
                        prev: 'splide__arrow--prev',
                        next: 'splide__arrow--next',
                    }
                }).mount();
            } catch (error) {
                console.warn(`Failed to initialize ${config.name} slideshow:`, error);
            }
        }
    });
}

/**
 * Initialize fade-in animations on scroll using Intersection Observer
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optionally unobserve after animation to improve performance
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with fade-in-section class
    document.querySelectorAll('.fade-in-section').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Initialize animated counter effects for metrics
 */
function initCounterAnimations() {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const target = parseInt(entry.target.dataset.value, 10);
                if (!isNaN(target)) {
                    animateCounter(entry.target, target);
                    entry.target.dataset.animated = 'true';
                }
            }
        });
    }, { threshold: 0.5 });

    // Observe all metric values with data-value attribute
    document.querySelectorAll('.metric-value[data-value]').forEach(el => {
        counterObserver.observe(el);
    });
}

/**
 * Animate a counter from 0 to target value
 * @param {HTMLElement} element - The element to update
 * @param {number} target - The target value to count to
 * @param {number} duration - Animation duration in milliseconds
 */
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOutQuart * target);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }

    requestAnimationFrame(updateCounter);
}

/**
 * Initialize parallax effect for gradient orbs
 */
function initParallaxOrbs() {
    const orbs = document.querySelectorAll('.gradient-orb');

    if (orbs.length === 0) return;

    let ticking = false;

    function updateOrbPositions() {
        const scrolled = window.pageYOffset;

        orbs.forEach((orb, index) => {
            const speed = 0.15 + (index * 0.05);
            const yOffset = scrolled * speed;
            const rotation = scrolled * 0.02 * (index % 2 === 0 ? 1 : -1);

            orb.style.transform = `translateY(${yOffset}px) rotate(${rotation}deg)`;
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateOrbPositions);
            ticking = true;
        }
    }, { passive: true });
}

/**
 * Initialize smooth scroll for client navigation cards
 */
function initSmoothScrollNav() {
    document.querySelectorAll('.client-nav-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = card.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                const navHeight = 80; // Account for fixed nav height
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL without triggering scroll
                history.pushState(null, null, targetId);
            }
        });
    });

    // Handle direct links to sections (e.g., from bookmarks)
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                const navHeight = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
}

/**
 * Optional: Add hover effects to cards with debouncing
 */
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.service-card, .methodology-card, .client-nav-card, .metric');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.willChange = 'transform, box-shadow';
        });

        card.addEventListener('mouseleave', () => {
            card.style.willChange = 'auto';
        });
    });
}

// Initialize card hover effects
initCardHoverEffects();

/**
 * Handle window resize for responsive adjustments
 */
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Reinitialize slideshows if needed on significant size changes
        // This is handled by Splide's built-in responsive handling
    }, 250);
}, { passive: true });

/**
 * Preload critical images for better slideshow performance
 */
function preloadImages() {
    const criticalImages = [
        'assets/images/portfolio/qualitas/fund-report-hero.png',
        'assets/images/portfolio/process-ai/slide-01.png',
        'assets/images/portfolio/irealty/product-discovery-1.png'
    ];

    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Preload images after initial page load
window.addEventListener('load', preloadImages);
