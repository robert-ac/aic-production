/* Shared interaction details. Navigation and destinations stay native. */
(() => {
  const header = document.querySelector('header.nav, header.pnav');
  if (!header) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motionLibrary = new URL('vendor/motion-mini-14.14.0.mjs', document.currentScript.src);
  let library;
  function getMotion() {
    library ??= import(motionLibrary.href).catch(() => null);
    return library;
  }

  const traces = Array.from(document.querySelectorAll('.aic-pathway--timeline ol, .arch-steps, #delivery .adoption-process'), (list) => {
    list.classList.add('aic-trace');
    return { list, steps: Array.from(list.children), reached: -1, progress: -1 };
  });
  const sectionMenus = Array.from(document.querySelectorAll('main .page-sections, main .arch-jump, main .events-nav'), (menu) => {
    const entries = Array.from(menu.querySelectorAll('a[href^="#"]'), (link) => ({
      link, section: document.getElementById(link.hash.slice(1))
    })).filter(({ section }) => section);
    return { entries, active: null };
  });
  const progress = document.createElement('span');
  progress.className = 'aic-reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  header.append(progress);
  let pending = false;
  function updateProgress() {
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0) + ')';
    const menuLine = Math.min(innerHeight * .35, 250);
    for (const menu of sectionMenus) {
      let active = null;
      let nearest = -Infinity;
      for (const { link, section } of menu.entries) {
        const { top, bottom } = section.getBoundingClientRect();
        if (top > menuLine || bottom < 0 || top < nearest) continue;
        nearest = top;
        active = link;
      }
      if (active !== menu.active) {
        menu.active?.removeAttribute('aria-current');
        active?.setAttribute('aria-current', 'location');
        menu.active = active;
      }
    }
    for (const trace of traces) {
      const bounds = trace.list.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight || !bounds.height) continue;
      const readingLine = innerHeight * .62;
      const position = Math.min(1, Math.max(0, (readingLine - bounds.top) / bounds.height));
      if (position === trace.progress) continue;
      trace.progress = position;
      trace.list.style.setProperty('--trace-progress', position);
      const reached = trace.steps.filter((step) => step.getBoundingClientRect().top <= readingLine).length - 1;
      if (reached !== trace.reached) {
        trace.steps.forEach((step, index) => step.toggleAttribute('data-trace-reached', index <= reached));
        trace.reached = reached;
      }
    }
    pending = false;
  }
  function scheduleProgress() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateProgress);
  }
  addEventListener('scroll', scheduleProgress, { passive: true });
  new ResizeObserver(scheduleProgress).observe(document.body);
  updateProgress();

  const depthCards = '.tcard, .event-feature__image, .events-latest__image';
  document.querySelectorAll(depthCards + ', .pcard, .minicard, .event-row__image').forEach((card) => {
    const tilt = card.matches(depthCards);
    card.classList.add('aic-spotlight');
    if (tilt) card.classList.add('aic-depth');
    const light = document.createElement('span');
    light.className = 'aic-spotlight__light';
    light.setAttribute('aria-hidden', 'true');
    card.append(light);
    let frame = 0;
    let pointerX, pointerY;
    card.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || motion.matches || event.pointerType === 'touch') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (pointerX - box.left) / box.width));
        const y = Math.max(0, Math.min(1, (pointerY - box.top) / box.height));
        card.style.setProperty('--light-x', x * 100 + '%');
        card.style.setProperty('--light-y', y * 100 + '%');
        if (tilt) {
          card.style.setProperty('--depth-x', (.5 - y) * 6 + 'deg');
          card.style.setProperty('--depth-y', (x - .5) * 6 + 'deg');
        }
        card.dataset.depth = 'active';
        frame = 0;
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      delete card.dataset.depth;
    });
  });

  document.querySelectorAll('.design-tabs').forEach((controls) => {
    const indicator = document.createElement('span');
    indicator.className = 'aic-selection-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    controls.prepend(indicator);
    let active;
    let animation;
    let update = 0;

    function align(animateChange) {
      const selected = controls.querySelector('[aria-pressed="true"], [aria-selected="true"]');
      if (!selected || controls.hidden) return;
      const container = controls.getBoundingClientRect();
      const target = selected.getBoundingClientRect();
      if (!target.width) return;
      const previous = indicator.getBoundingClientRect();
      animation?.cancel();
      const from = previous.left - container.left;
      const to = target.left - container.left;
      indicator.style.width = target.width + 'px';
      indicator.style.transform = 'translateX(' + to + 'px)';
      indicator.dataset.ready = 'true';
      const slide = animateChange && active && active !== selected && !motion.matches;
      active = selected;
      const revision = ++update;
      if (!slide) return;
      getMotion().then((module) => {
        if (!module || revision !== update || motion.matches) return;
        animation = module.animate(indicator, {
          transform: ['translateX(' + from + 'px)', 'translateX(' + to + 'px)'],
          width: [previous.width + 'px', target.width + 'px']
        }, { duration: .34, ease: [.22, 1, .36, 1] });
      });
    }

    new ResizeObserver(() => align(false)).observe(controls);
    new MutationObserver(() => align(true)).observe(controls, {
      subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'aria-selected', 'hidden']
    });
    if (!motion.matches) getMotion();
    align(false);
  });

  const journey = document.querySelector('#how .journey');
  if (journey && !motion.matches) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      journey.classList.add('journey--motion-ready', 'is-playing');
      observer.disconnect();
    }, { threshold: .2 });
    observer.observe(journey);
  }

  const workflow = document.querySelector('.venture-workflow');
  if (workflow) {
    const visibility = new IntersectionObserver(([entry]) => {
      workflow.toggleAttribute('data-in-view', entry.intersectionRatio >= .35);
    }, { threshold: .35 });
    visibility.observe(workflow);
  }
})();
