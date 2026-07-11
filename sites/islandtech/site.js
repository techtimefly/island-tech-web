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

  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    const status = contactForm.querySelector('.form-status');
    const submit = contactForm.querySelector('button[type="submit"]');
    const keyField = contactForm.querySelector('input[name="access_key"]');
    const serviceField = contactForm.querySelector('select[name="service"]');
    const subjectField = contactForm.querySelector('input[name="subject"]');

    const setStatus = (message, tone = '') => {
      if (!status) return;
      status.textContent = message;
      status.dataset.tone = tone;
    };

    const composeMailto = (formData) => {
      const service = formData.get('service') || 'Website inquiry';
      const subject = `[Island Tech IO] ${service}`;
      const body = [
        `Name: ${formData.get('name') || ''}`,
        `Email: ${formData.get('email') || ''}`,
        `Organization: ${formData.get('organization') || ''}`,
        `Service interest: ${service}`,
        '',
        'Message:',
        formData.get('message') || '',
      ].join('\n');

      return `mailto:contact@islandtech.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    if (serviceField && subjectField) {
      serviceField.addEventListener('change', () => {
        subjectField.value = `[Island Tech IO] ${serviceField.value || 'Website inquiry'}`;
      });
    }

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!contactForm.reportValidity()) return;

      const formData = new FormData(contactForm);
      const accessKey = (keyField?.value || '').trim();
      const endpoint = contactForm.dataset.web3formsEndpoint;
      const hasLiveKey = accessKey && accessKey !== 'YOUR_WEB3FORMS_ACCESS_KEY';

      if (!hasLiveKey) {
        setStatus('The secure form endpoint is not configured yet. Opening your email client instead.', 'warning');
        window.location.href = composeMailto(formData);
        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending...';
      }
      setStatus('Sending your inquiry...', 'pending');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'Form submission failed');
        }

        setStatus('Thanks, your inquiry was sent.', 'success');
        contactForm.reset();
        window.location.href = contactForm.dataset.thanksUrl || 'thanks.html';
      } catch (error) {
        setStatus('I could not send the form right now. Please email contact@islandtech.io directly.', 'error');
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = 'Send Inquiry';
        }
      }
    });
  }
})();
