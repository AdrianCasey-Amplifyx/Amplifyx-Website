// Proposal Landing Page Interactions

// Mobile Navigation Toggle
const navToggle = document.getElementById('proposalNavToggle');
const navMenu = document.getElementById('proposalNavMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.proposal-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    });
});

// Navbar scroll shadow
const navbar = document.querySelector('.proposal-nav');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.style.boxShadow = window.pageYOffset > 0
            ? '0 2px 20px rgba(0, 0, 0, 0.3)'
            : 'none';
    });
}

// Intersection Observer for fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Card expand/collapse
document.querySelectorAll('.automation-card-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.automation-card');
        card.classList.toggle('collapsed');
        btn.textContent = card.classList.contains('collapsed') ? 'Show details' : 'Hide details';
    });
});

// Expand all / Collapse all
const expandAllBtn = document.getElementById('expandAllCards');
if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => {
        const cards = document.querySelectorAll('.automation-card');
        const allExpanded = ![...cards].some(c => c.classList.contains('collapsed'));
        cards.forEach(card => {
            if (allExpanded) {
                card.classList.add('collapsed');
            } else {
                card.classList.remove('collapsed');
            }
        });
        document.querySelectorAll('.automation-card-toggle').forEach(btn => {
            btn.textContent = allExpanded ? 'Show details' : 'Hide details';
        });
        expandAllBtn.textContent = allExpanded ? 'Expand all' : 'Collapse all';
    });
}
