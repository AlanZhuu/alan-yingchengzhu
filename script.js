const reveal = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion) {
  reveal.forEach(el => el.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
  reveal.forEach(el => observer.observe(el));
}

// Scroll progress
const bar = document.getElementById('progress-bar');
const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  bar.style.width = `${pct}%`;
};
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// Purposeful spotlight: reveal design focus as the pointer moves across work.
document.querySelectorAll('.spotlight-card').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// Restrained card tilt on desktop only.
if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add('is-tilting');
      card.style.transform = `perspective(1200px) rotateX(${(-y * 1.8).toFixed(2)}deg) rotateY(${(x * 2.2).toFixed(2)}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.transform = '';
    });
  });
}

// LINA direction comparison scrubber.
document.querySelectorAll('[data-scrubber]').forEach(scrubber => {
  const input = scrubber.querySelector('[data-scrubber-input]');
  const refined = scrubber.querySelector('[data-refined-layer]');
  const divider = scrubber.querySelector('[data-scrubber-divider]');
  const setPosition = value => {
    refined.style.clipPath = `inset(0 0 0 ${value}%)`;
    divider.style.left = `${value}%`;
  };
  setPosition(input.value);
  input.addEventListener('input', () => setPosition(input.value));
});

// Count selected metrics once they become visible.
if (!reduceMotion) {
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const duration = 700;
      const tick = now => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => counterObserver.observe(el));
}

// Active section state in navigation.
const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
const navTargets = navLinks
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if (navTargets.length) {
  const navObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
    });
  }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, .1, .3, .6] });
  navTargets.forEach(section => navObserver.observe(section));
}

// Animate evaluation workflow when the sequence enters view.
const workflow = document.querySelector('.workflow');
if (workflow && !reduceMotion) {
  const steps = [...workflow.querySelectorAll('div')];
  const workflowObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    steps.forEach((step, index) => {
      setTimeout(() => step.classList.add('workflow-active'), index * 170);
    });
    workflowObserver.disconnect();
  }, { threshold: 0.45 });
  workflowObserver.observe(workflow);
}

// Ranking evidence lightbox.
const evidenceDialog = document.getElementById('evidence-lightbox');
if (evidenceDialog) {
  const evidenceImage = evidenceDialog.querySelector('img');
  const closeButton = evidenceDialog.querySelector('.lightbox-close');
  document.querySelectorAll('[data-lightbox-src]').forEach(button => {
    button.addEventListener('click', () => {
      evidenceImage.src = button.dataset.lightboxSrc;
      evidenceImage.alt = button.dataset.lightboxAlt || '';
      if (typeof evidenceDialog.showModal === 'function') evidenceDialog.showModal();
    });
  });
  closeButton?.addEventListener('click', () => evidenceDialog.close());
  evidenceDialog.addEventListener('click', e => {
    if (e.target === evidenceDialog) evidenceDialog.close();
  });
}

// Compact navigation for tablet and mobile.
const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.getElementById('primary-nav');
if (menuToggle && primaryNav) {
  const closeNav = () => {
    document.body.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  };
  menuToggle.addEventListener('click', () => {
    const open = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  primaryNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 980) closeNav(); });
}
