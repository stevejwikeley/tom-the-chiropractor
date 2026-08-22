document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReviews();
});

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

  show(0);
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
