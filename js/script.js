document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReviews();
  initCarousels();
  initContactForm();
  initStickyCta();
});

// Hides the fixed mobile "Book" bar once the actual booking widget it
// points to is already on screen, so there's never two book CTAs stacked.
function initStickyCta() {
  const cta = document.querySelector('.sticky-cta');
  const btn = cta && cta.querySelector('.sticky-cta__btn');
  if (!btn || !('IntersectionObserver' in window)) return;

  const href = btn.getAttribute('href');
  const target = href.startsWith('#') ? document.querySelector(href) : null;
  if (!target) return;

  new IntersectionObserver((entries) => {
    cta.classList.toggle('is-hidden', entries[0].isIntersecting);
  }, { threshold: 0.15 }).observe(target);
}

function initNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initReviews() {
  const carousel = document.getElementById('reviewsCarousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.review-card'));
  if (slides.length < 2) return;

  const dotsWrap = carousel.parentElement.querySelector('.reviews__dots');
  const INTERVAL = 7000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer = null;

  // JS is available, so switch from the stacked no-JS fallback to the carousel.
  carousel.classList.add('is-enhanced');

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'reviews__dot';
    dot.setAttribute('aria-label', `Show review ${i + 1} of ${slides.length}`);
    dot.addEventListener('click', () => {
      show(i);
      restart();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  // Fade only the cards whose text actually overflows the fixed height,
  // so short reviews don't get a pointless gradient across the bottom.
  function markClipped() {
    slides.forEach((slide) => {
      const body = slide.querySelector('.review-card__body');
      if (!body) return;
      body.classList.toggle('is-clipped', body.scrollHeight > body.clientHeight + 1);
    });
  }

  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', String(active));
    });
    // Hidden cards measure zero, so re-check once this one is on screen.
    markClipped();
  }

  function start() {
    if (reduceMotion || timer) return;
    timer = setInterval(() => show(index + 1), INTERVAL);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function restart() {
    stop();
    start();
  }

  // Don't cycle away from a review someone is reading or tabbing through.
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  // Swipe left/right to change review. Doesn't preventDefault, so a mostly
  // vertical drag still scrolls the page as normal.
  const SWIPE_THRESHOLD = 40;
  let touchStartX = 0;
  let touchStartY = 0;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    stop();
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      show(index + (deltaX < 0 ? 1 : -1));
    }
    restart();
  }, { passive: true });

  show(0);
  markClipped();
  window.addEventListener('resize', markClipped);
  start();

  // Reviews vary in length, so an off-screen slide change would shift the page
  // under someone reading further down. Pause while the section is out of view.
  // Cycling starts regardless above, so a failed observer can't leave it frozen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.2 }).observe(carousel);
  }
}

function initCarousels() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERVAL = 4500;

  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const slides = Array.from(root.querySelectorAll('.carousel__slide'));
    const dots = Array.from(root.querySelectorAll('[data-dot]'));
    if (slides.length < 2) return;

    let index = 0;
    let timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    }

    function start() {
      if (reduceMotion || timer) return;
      timer = setInterval(() => show(index + 1), INTERVAL);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function restart() {
      stop();
      start();
    }

    const prev = root.querySelector('[data-prev]');
    const next = root.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', () => { show(index - 1); restart(); });
    if (next) next.addEventListener('click', () => { show(index + 1); restart(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); restart(); }));

    // Don't cycle away from a photo someone is looking at or tabbing through.
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    show(0);
    start();

    // Pause off-screen carousels rather than burning cycles nobody sees.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.2 }).observe(root);
    }
  });
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactStatus');
  if (!form || !status || !window.fetch) return;

  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    status.className = 'contact-form__status';
    status.textContent = 'Sending…';
    button.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        form.reset();
        status.className = 'contact-form__status is-success';
        status.textContent = 'Thanks, your message has been sent. I’ll get back to you soon.';
      } else {
        throw new Error(result.message || 'Send failed');
      }
    } catch (err) {
      status.className = 'contact-form__status is-error';
      status.innerHTML = 'Sorry, that didn’t send. Please email me directly at ' +
        '<a href="mailto:hello@tomthechiropractor.co.uk">hello@tomthechiropractor.co.uk</a>.';
    } finally {
      button.disabled = false;
    }
  });
}
