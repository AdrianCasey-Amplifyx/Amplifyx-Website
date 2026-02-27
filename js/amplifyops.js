// AmplifyOps Page Interactions

// Mobile Navigation Toggle
const navToggle = document.getElementById('opsNavToggle');
const navMenu = document.getElementById('opsNavMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.ops-nav .nav-link').forEach(link => {
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
const navbar = document.querySelector('.ops-nav');
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 0) {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.boxShadow = 'none';
    }
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
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Hero stats counter animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statValues = entry.target.querySelectorAll('.stat-value[data-target]');
            statValues.forEach(stat => {
                const target = stat.dataset.target;
                const numericMatch = target.match(/^(\d+)/);
                if (numericMatch) {
                    const targetNum = parseInt(numericMatch[1]);
                    let current = 0;
                    const increment = Math.max(1, Math.floor(targetNum / 40));
                    const prefix = target.match(/^[^\d]*/)[0] || '';
                    const suffix = target.replace(/^[^\d]*\d+/, '') || '';
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= targetNum) {
                            current = targetNum;
                            clearInterval(timer);
                        }
                        stat.textContent = prefix + current + suffix;
                    }, 30);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// ===== Recipe Builder — Live Preview =====
const previewTrigger = document.getElementById('previewTrigger');
const previewProcess = document.getElementById('previewProcess');
const previewOutput = document.getElementById('previewOutput');

function updatePreview() {
    // Trigger (radio)
    const triggerChecked = document.querySelector('input[name="trigger"]:checked');
    if (triggerChecked && previewTrigger) {
        previewTrigger.innerHTML = triggerChecked.closest('.builder-option').querySelector('.option-icon').textContent +
            ' ' + triggerChecked.value;
        previewTrigger.classList.add('filled');
    } else if (previewTrigger) {
        previewTrigger.innerHTML = '<span class="preview-placeholder">Trigger</span>';
        previewTrigger.classList.remove('filled');
    }

    // Process (checkboxes)
    const processChecked = document.querySelectorAll('input[name="process"]:checked');
    if (processChecked.length > 0 && previewProcess) {
        const labels = Array.from(processChecked).map(cb =>
            cb.closest('.builder-option').querySelector('.option-icon').textContent
        );
        previewProcess.innerHTML = labels.join(' ') + ' Process';
        previewProcess.classList.add('filled');
    } else if (previewProcess) {
        previewProcess.innerHTML = '<span class="preview-placeholder">Process</span>';
        previewProcess.classList.remove('filled');
    }

    // Output (checkboxes)
    const outputChecked = document.querySelectorAll('input[name="output"]:checked');
    if (outputChecked.length > 0 && previewOutput) {
        const labels = Array.from(outputChecked).map(cb =>
            cb.closest('.builder-option').querySelector('.option-icon').textContent
        );
        previewOutput.innerHTML = labels.join(' ') + ' Output';
        previewOutput.classList.add('filled');
    } else if (previewOutput) {
        previewOutput.innerHTML = '<span class="preview-placeholder">Output</span>';
        previewOutput.classList.remove('filled');
    }
}

// Attach listeners to all builder inputs
document.querySelectorAll('.builder-options input').forEach(input => {
    input.addEventListener('change', updatePreview);
});

// ===== Form Submission via EmailJS =====
const enquiryForm = document.getElementById('opsEnquiryForm');
if (enquiryForm) {
    enquiryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = enquiryForm.querySelector('.form-submit .btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        const formData = new FormData(enquiryForm);

        // Gather builder selections
        const trigger = formData.get('trigger') || 'Not selected';
        const processSteps = [];
        enquiryForm.querySelectorAll('input[name="process"]:checked').forEach(cb => {
            processSteps.push(cb.value);
        });
        const outputs = [];
        enquiryForm.querySelectorAll('input[name="output"]:checked').forEach(cb => {
            outputs.push(cb.value);
        });

        const templateParams = {
            from_name: formData.get('name'),
            from_email: formData.get('email'),
            company: formData.get('company') || 'Not provided',
            phone: formData.get('phone') || 'Not provided',
            trigger: trigger,
            process: processSteps.join(', ') || 'Not selected',
            output: outputs.join(', ') || 'Not selected',
            automations: formData.get('automations') || 'Not specified',
            source: 'AmplifyOps Recipe Builder'
        };

        const config = window.AMPLIFYX_CONFIG;
        if (config && config.emailJS && config.emailJS.serviceId !== 'YOUR_SERVICE_ID') {
            emailjs.send(config.emailJS.serviceId, config.emailJS.templateId, templateParams, config.emailJS.userId)
                .then(function() {
                    document.getElementById('enquiryFormContent').style.display = 'none';
                    document.getElementById('enquirySuccess').classList.add('show');
                })
                .catch(function(error) {
                    console.error('EmailJS error:', error);
                    alert('Something went wrong. Please try again or email us directly.');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        } else {
            console.log('Recipe Builder submission:', templateParams);
            document.getElementById('enquiryFormContent').style.display = 'none';
            document.getElementById('enquirySuccess').classList.add('show');
        }
    });
}

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});
