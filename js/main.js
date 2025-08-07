// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Add scroll effect to navbar
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.style.boxShadow = 'none';
    } else {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Add stagger effect for grid items - much faster
            if (entry.target.classList.contains('stagger-item')) {
                const items = entry.target.querySelectorAll('.solution-card, .service-card, .client-type');
                items.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('visible');
                    }, index * 20); // Was 100ms, now 20ms
                });
            }
        }
    });
}, observerOptions);

// Observe sections for animations
document.querySelectorAll('section').forEach(section => {
    section.classList.add('fade-in-section');
    observer.observe(section);
});

// Observe grids for stagger animations
document.querySelectorAll('.solutions-grid, .services-grid, .clients-grid').forEach(grid => {
    grid.classList.add('stagger-item');
    observer.observe(grid);
});

// Parallax effect for gradient orbs
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    
    orbs.forEach((orb, index) => {
        const speed = 0.5 + (index * 0.1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Add hover effect to cards
document.querySelectorAll('.solution-card, .service-card, .testimonial-card').forEach(card => {
    card.addEventListener('mouseenter', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.style.setProperty('--mouse-x', `${x}px`);
        this.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Form handling (if adding a contact form later)
function handleContactForm(e) {
    e.preventDefault();
    // Add form submission logic here
    // For now, redirect to Calendly
    window.open('https://calendly.com/amplifyx', '_blank');
}

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Performance: Lazy load images
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// Interactive Demo Functionality
const demoButtons = document.querySelectorAll('.demo-btn');
const demoScreens = document.querySelectorAll('.demo-screen');

demoButtons.forEach(button => {
    button.addEventListener('click', () => {
        const demoType = button.getAttribute('data-demo');
        
        // Remove active class from all buttons and screens
        demoButtons.forEach(btn => btn.classList.remove('active'));
        demoScreens.forEach(screen => screen.classList.remove('active'));
        
        // Add active class to clicked button and corresponding screen
        button.classList.add('active');
        const targetScreen = document.getElementById(`demo-${demoType}`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            
            // Reset animations when switching screens
            if (demoType === 'integrate') {
                // Reset chat animation
                const chatBubbles = targetScreen.querySelectorAll('.chat-bubble');
                chatBubbles.forEach((bubble, index) => {
                    bubble.style.animation = 'none';
                    setTimeout(() => {
                        bubble.style.animation = 'slideUp 0.5s ease-out';
                        bubble.style.animationDelay = `${index * 0.5}s`;
                    }, 10);
                });
                
                // Reset AI thinking dots
                const thinkingDots = targetScreen.querySelectorAll('.ai-thinking span');
                thinkingDots.forEach((dot, index) => {
                    dot.style.animation = 'none';
                    setTimeout(() => {
                        dot.style.animation = 'thinking 1.4s infinite';
                        dot.style.animationDelay = `${index * 0.2}s`;
                    }, 10);
                });
            }
            
            if (demoType === 'automation') {
                // Reset automation nodes animation
                const aiNodes = targetScreen.querySelectorAll('.ai-node');
                aiNodes.forEach((node, index) => {
                    node.style.animation = 'none';
                    setTimeout(() => {
                        node.style.animation = 'nodeFloat 0.6s ease-out';
                        node.style.animationDelay = `${index * 0.1}s`;
                    }, 10);
                });
                
                // Reset stats animation
                const statValues = targetScreen.querySelectorAll('.stat-value');
                statValues.forEach(stat => {
                    stat.style.animation = 'none';
                    setTimeout(() => {
                        stat.style.animation = 'countUp 1s ease-out';
                    }, 10);
                });
            }
        }
    });
});

// Auto-cycle through demos every 5 seconds
let currentDemoIndex = 0;
const demoCycle = setInterval(() => {
    currentDemoIndex = (currentDemoIndex + 1) % demoButtons.length;
    // Only auto-cycle if user hasn't manually clicked recently
    if (!document.querySelector('.demo-btn:hover')) {
        demoButtons[currentDemoIndex].click();
    }
}, 5000);

// Stop auto-cycle when user interacts
demoButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        clearInterval(demoCycle);
    });
});

// Add typed effect to hero title (optional enhancement)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Removed typing effect for faster load
// document.addEventListener('DOMContentLoaded', () => {
//     const heroTagline = document.querySelector('.hero-tagline');
//     if (heroTagline) {
//         const originalText = heroTagline.textContent;
//         setTimeout(() => {
//             typeWriter(heroTagline, originalText, 50);
//         }, 500);
//     }
// });