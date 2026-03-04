/* =========================================================
   LORAIN PORT & FINANCE AUTHORITY — MAIN JAVASCRIPT
   ========================================================= */

'use strict';

// ---------------------------------------------------------
// 1. DOM READY
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initDropdowns();
  initScrollAnimations();
  initSmoothScroll();
  initNewsletter();
  initContactForm();
  setActiveNavLink();
  initThemeToggle();
});

// ---------------------------------------------------------
// 2. HEADER — hide on scroll down, show on scroll up
// ---------------------------------------------------------
function initHeader() {
  const header = document.getElementById('site-header');
  const nav = document.getElementById('main-nav');
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        // Add scrolled shadow class to nav
        if (nav) {
          nav.classList.toggle('scrolled', currentY > 40);
        }

        // Hide header when scrolling down past 200px
        if (currentY > 200) {
          if (currentY > lastY) {
            header.classList.add('hidden');
          } else {
            header.classList.remove('hidden');
          }
        } else {
          header.classList.remove('hidden');
        }

        lastY = currentY;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ---------------------------------------------------------
// 3. MOBILE NAVIGATION TOGGLE
// ---------------------------------------------------------
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen.toString());
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) closeMenu();
    });
  });

  function closeMenu() {
    menu.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

// ---------------------------------------------------------
// 4. MOBILE DROPDOWN TOGGLE
// ---------------------------------------------------------
function initDropdowns() {
  const dropdownParents = document.querySelectorAll('.has-dropdown');

  dropdownParents.forEach(parent => {
    const link = parent.querySelector('a');
    if (!link) return;

    link.addEventListener('click', (e) => {
      // On mobile, toggle dropdown instead of navigating
      if (window.innerWidth < 768) {
        e.preventDefault();
        parent.classList.toggle('dropdown-open');
      }
    });
  });
}

// ---------------------------------------------------------
// 5. SCROLL ANIMATIONS (Intersection Observer)
// ---------------------------------------------------------
function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;

        setTimeout(() => {
          el.classList.add('animated');
        }, delay);

        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// ---------------------------------------------------------
// 6. SMOOTH SCROLL FOR ANCHOR LINKS
// ---------------------------------------------------------
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerHeight = document.getElementById('site-header')?.offsetHeight || 110;
      const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });
}

// ---------------------------------------------------------
// 7. NEWSLETTER FORM
// ---------------------------------------------------------
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button[type="submit"]');

    if (!emailInput?.value.trim()) {
      showFormMessage(form, 'Please enter your email address.', 'error');
      return;
    }

    if (!isValidEmail(emailInput.value)) {
      showFormMessage(form, 'Please enter a valid email address.', 'error');
      return;
    }

    // Simulate submission
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';

    setTimeout(() => {
      showFormMessage(form, 'Thank you for subscribing! You\'ll hear from us soon.', 'success');
      form.reset();
      btn.disabled = false;
      btn.innerHTML = 'Subscribe <i class="fas fa-arrow-right"></i>';
    }, 1200);
  });
}

// ---------------------------------------------------------
// 8. CONTACT FORM
// ---------------------------------------------------------
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;

    requiredFields.forEach(field => {
      field.classList.remove('field-error');
      if (!field.value.trim()) {
        field.classList.add('field-error');
        valid = false;
      }
    });

    if (!valid) {
      showFormMessage(form, 'Please fill in all required fields.', 'error');
      return;
    }

    const emailField = form.querySelector('input[type="email"]');
    if (emailField && !isValidEmail(emailField.value)) {
      emailField.classList.add('field-error');
      showFormMessage(form, 'Please enter a valid email address.', 'error');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    setTimeout(() => {
      showFormMessage(form, 'Thank you! We\'ll be in touch within 2 business days.', 'success');
      form.reset();
      btn.disabled = false;
      btn.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
    }, 1500);
  });
}

// ---------------------------------------------------------
// 9. HELPERS
// ---------------------------------------------------------
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFormMessage(form, text, type) {
  // Remove existing messages
  form.querySelectorAll('.form-message').forEach(m => m.remove());

  const msg = document.createElement('div');
  msg.className = `form-message form-message-${type}`;
  msg.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${text}`;
  form.appendChild(msg);

  // Apply styles
  Object.assign(msg.style, {
    marginTop: '1rem',
    padding: '0.875rem 1.25rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-body)',
    background: type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
    color: type === 'success' ? '#059669' : '#DC2626',
    border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
  });

  if (type === 'success') {
    setTimeout(() => msg.remove(), 6000);
  }
}

// ---------------------------------------------------------
// 10. SET ACTIVE NAV LINK
// ---------------------------------------------------------
function setActiveNavLink() {
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-menu > li > a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkFile = href.split('/').pop().split('#')[0] || 'index.html';
    link.classList.toggle('active', linkFile === filename);
  });
}

// ---------------------------------------------------------
// 11. THEME TOGGLE (light/dark mode)
// ---------------------------------------------------------
function initThemeToggle() {
  var STORAGE_KEY = 'lpfa-theme';
  var toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(STORAGE_KEY, 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(STORAGE_KEY, 'dark');
    }
  });
}

// ---------------------------------------------------------
// 12. FIELD ERROR STYLES (injected)
// ---------------------------------------------------------
const errorStyles = document.createElement('style');
errorStyles.textContent = `
  .field-error {
    border-color: #DC2626 !important;
    box-shadow: 0 0 0 3px rgba(220,38,38,0.12) !important;
  }
  .field-error::placeholder { color: rgba(220,38,38,0.5); }
`;
document.head.appendChild(errorStyles);
