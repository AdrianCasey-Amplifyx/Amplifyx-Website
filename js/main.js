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
                const items = entry.target.querySelectorAll('.product-card, .audience-card');
                items.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('visible');
                    }, index * 20);
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
document.querySelectorAll('.products-grid, .audience-grid').forEach(grid => {
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
document.querySelectorAll('.product-card, .audience-card').forEach(card => {
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
    // Scroll to contact section
    const contact = document.querySelector('#contact');
    if (contact) {
        contact.scrollIntoView({ behavior: 'smooth' });
    }
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

// Enquiry form handler
const enquiryForm = document.getElementById('enquiry-form');
if (enquiryForm) {
    enquiryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = enquiryForm.querySelector('.enquiry-submit');
        const successMsg = document.getElementById('enquiry-success');
        const errorMsg = document.getElementById('enquiry-error');

        // Hide previous messages
        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';

        // Disable button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const formData = {
            name: document.getElementById('enquiry-name').value,
            email: document.getElementById('enquiry-email').value,
            company: document.getElementById('enquiry-company').value,
            mobile: document.getElementById('enquiry-mobile').value,
            help: document.getElementById('enquiry-help').value,
            budget: document.getElementById('enquiry-budget').value,
            message: document.getElementById('enquiry-message').value
        };

        // Use EmailJS if configured
        const config = window.AMPLIFYX_CONFIG;
        if (config && config.emailJS && config.emailJS.serviceId !== 'YOUR_SERVICE_ID') {
            emailjs.send(config.emailJS.serviceId, config.emailJS.templateId, {
                from_name: formData.name,
                from_email: formData.email,
                company: formData.company,
                mobile: formData.mobile,
                help: formData.help,
                budget: formData.budget,
                message: formData.message
            }, config.emailJS.userId).then(() => {
                successMsg.style.display = 'block';
                enquiryForm.reset();
            }).catch(() => {
                errorMsg.style.display = 'block';
            }).finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Book a Discovery Call';
            });
        } else {
            // Fallback: show success (form data logged)
            console.log('Enquiry form submission:', formData);
            successMsg.style.display = 'block';
            enquiryForm.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book a Discovery Call';
        }
    });
}