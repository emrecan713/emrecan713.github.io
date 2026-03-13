/* ===================================
   Dr. Emrecan Gulay - Portfolio Site
   Main JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Navbar scroll effect ----------
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // ---------- Mobile nav toggle ----------
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      navToggle.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
      });
    });
  }

  // ---------- Scroll reveal (progressive enhancement) ----------
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  let timerOk = false;
  const t0 = performance.now();
  requestAnimationFrame(() => {
    const elapsed = performance.now() - t0;
    if (elapsed < 200) {
      timerOk = true;
      revealElements.forEach(el => {
        if (!el.classList.contains('visible')) {
          el.style.opacity = '0';
          el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          if (el.classList.contains('reveal-left')) el.style.transform = 'translateX(-40px)';
          else if (el.classList.contains('reveal-right')) el.style.transform = 'translateX(40px)';
          else el.style.transform = 'translateY(30px)';
        }
      });
    }
  });

  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (timerOk) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
        obs.unobserve(el);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -30px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ---------- Stagger children index assignment ----------
  document.querySelectorAll('.stagger-children').forEach(container => {
    Array.from(container.children).forEach((child, i) => {
      child.style.setProperty('--stagger-index', i);
    });
  });

  // ---------- Active nav link highlighting ----------
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---------- Publications year toggle ----------
  document.querySelectorAll('.pub-year').forEach(yearHeader => {
    yearHeader.addEventListener('click', () => {
      const content = yearHeader.nextElementSibling;
      if (content) {
        yearHeader.classList.toggle('collapsed');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      }
    });
  });

  // ---------- Typing effect for greeting ----------
  const greeting = document.querySelector('.hero-greeting');
  if (greeting) {
    const text = greeting.textContent;
    greeting.textContent = '';
    greeting.style.opacity = '1';
    let i = 0;
    const typeInterval = setInterval(() => {
      greeting.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(typeInterval);
    }, 60);
  }

  // ---------- SVG flow path lengths (for draw-in animation) ----------
  document.querySelectorAll('.hero-swirl .flow').forEach(path => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
  });

  // ---------- Organic breathing: animate feTurbulence seed ----------
  const turbulence = document.querySelector('#organic-breathe feTurbulence');
  if (turbulence) {
    let seed = 5;
    setInterval(() => {
      seed = (seed % 100) + 1;
      turbulence.setAttribute('seed', seed);
    }, 3000);
  }

  // ---------- Parallax on hero swirl ----------
  const swirl = document.querySelector('.hero-swirl');
  if (swirl) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      swirl.style.transform = `translateY(${scrolled * 0.12}px)`;
    });
  }

  // ---------- Scroll progress bar ----------
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? window.scrollY / docHeight : 0;
      scrollProgress.style.transform = `scaleX(${scrolled})`;
    });
  }

  // ---------- Back to top button ----------
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 300);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
