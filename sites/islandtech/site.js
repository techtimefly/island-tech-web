(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const backToTop = document.querySelector('.back-to-top');

  const headerOffset = () => (header ? header.getBoundingClientRect().height + 18 : 18);

  const scrollToTarget = (target) => {
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;

    const hash = anchor.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    scrollToTarget(target);
    history.pushState(null, '', hash);
  });

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      window.setTimeout(() => scrollToTarget(target), 80);
    }
  }

  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 540);
    };

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    updateBackToTop();
    window.addEventListener('scroll', updateBackToTop, { passive: true });
  }

  const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
  const sections = [...document.querySelectorAll('[data-nav-section]')];
  if (sectionLinks.length && sections.length && 'IntersectionObserver' in window) {
    const byId = new Map(sectionLinks.map((link) => [link.dataset.sectionLink, link]));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      sectionLinks.forEach((link) => link.removeAttribute('aria-current'));
      const active = byId.get(visible.target.id);
      if (active) active.setAttribute('aria-current', 'true');
    }, {
      rootMargin: '-30% 0px -55% 0px',
      threshold: [0.08, 0.22, 0.38],
    });

    sections.forEach((section) => observer.observe(section));
  }
})();
