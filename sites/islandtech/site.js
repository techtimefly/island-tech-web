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

  const processFlow = document.querySelector('[data-process-flow]');
  if (processFlow) {
    const stages = {
      contact: {
        kicker: 'Stage 01',
        title: 'First Contact',
        summary: 'You share the problem you are trying to solve, the tools or workflows involved, and what a useful outcome would look like.',
        points: [
          'Initial context on AppSec, tooling, CI/CD, reporting, or veteran guidance needs.',
          'Enough detail to decide whether a discovery call makes sense.',
          'No passwords, source code, regulated data, or confidential vulnerability details through the public form.',
        ],
      },
      discovery: {
        kicker: 'Stage 02',
        title: 'Discovery',
        summary: 'We discuss your current AppSec program, engineering workflow, security tooling, CI/CD environment, stakeholders, and constraints.',
        points: [
          'Clarify the problem, goals, tool landscape, and decision makers.',
          'Identify whether the engagement is assessment-only, advisory, or hands-on implementation support.',
          'Determine whether onsite work is useful and what travel or onsite costs would be client-managed.',
        ],
      },
      scope: {
        kicker: 'Stage 03',
        title: 'Scope & Rules',
        summary: 'Objectives, deliverables, timelines, access needs, boundaries, confidentiality, and rules of engagement are agreed before review work begins.',
        points: [
          'Define what is in scope, what is out of scope, and what success looks like.',
          'Set rules for approved systems, accounts, maintenance windows, evidence handling, and escalation paths.',
          'Confirm that Island Tech IO is tool-agnostic and does not act as a reseller, vendor representative, or vendor support intermediary.',
        ],
      },
      inspection: {
        kicker: 'Stage 04',
        title: 'Inspection',
        summary: 'I review how the team works today: how findings are generated, triaged, routed, remediated, reported, and measured.',
        points: [
          'Review tool configuration, pipeline touchpoints, reports, workflow documents, and stakeholder pain points.',
          'Look for false-positive friction, unclear ownership, noisy gates, and missing developer context.',
          'Keep customer data, credentials, and equipment under customer control.',
        ],
      },
      findings: {
        kicker: 'Stage 05',
        title: 'Findings Review',
        summary: 'We walk through observations together so recommendations are understood, challenged, and mapped to practical constraints.',
        points: [
          'Separate quick wins from deeper program improvements.',
          'Validate recommendations against engineering reality and business risk.',
          'Avoid shelfware by aligning findings to owners, priority, and next actions.',
        ],
      },
      plan: {
        kicker: 'Stage 06',
        title: 'Improvement Plan',
        summary: 'I provide a practical AppSec and security improvement plan for better tooling use, integration patterns, workflows, reporting, and developer guidance.',
        points: [
          'Prioritized recommendations for the tools and processes the client already owns.',
          'Suggested integrations, triage rules, reporting patterns, and enablement artifacts.',
          'A plan that is tool-agnostic and grounded in your risk model and delivery environment.',
        ],
      },
      closeout: {
        kicker: 'Stage 07',
        title: 'Integration & Closeout',
        summary: 'If scoped, I help with hands-on implementation support, then close out access, artifacts, follow-up questions, and next steps.',
        points: [
          'Hands-on changes are performed only through approved access paths, accounts, and change windows.',
          'Client-managed hardware or access should be wiped, revoked, or reimaged by the client after the engagement.',
          'Follow-up support reviews outcomes, tunes implementation details, and identifies the next improvement cycle.',
        ],
      },
    };

    const nodes = [...processFlow.querySelectorAll('.process-node')];
    const panel = processFlow.querySelector('.process-detail');
    const kicker = processFlow.querySelector('[data-process-kicker]');
    const title = processFlow.querySelector('[data-process-title]');
    const summary = processFlow.querySelector('[data-process-summary]');
    const points = processFlow.querySelector('[data-process-points]');

    const activateStage = (stageName) => {
      const stage = stages[stageName];
      if (!stage || !panel || !kicker || !title || !summary || !points) return;

      nodes.forEach((node) => {
        const active = node.dataset.stage === stageName;
        node.classList.toggle('is-active', active);
        node.setAttribute('aria-selected', active ? 'true' : 'false');
        if (active) panel.setAttribute('aria-labelledby', node.id);
      });

      panel.classList.remove('is-refreshing');
      window.requestAnimationFrame(() => {
        kicker.textContent = stage.kicker;
        title.textContent = stage.title;
        summary.textContent = stage.summary;
        points.innerHTML = stage.points.map((point) => `<li>${point}</li>`).join('');
        panel.classList.add('is-refreshing');
      });
    };

    nodes.forEach((node) => {
      node.addEventListener('click', () => activateStage(node.dataset.stage));
    });
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
