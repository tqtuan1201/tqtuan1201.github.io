// ═══════════════════════════════════════════════════════════════════
// Proximity Lock — Website Scripts (Enhanced)
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollProgress();
  initScrollReveal();
  initLanguageToggle();
  initMobileMenu();
  initSmoothScroll();
  initShowcaseTabs();
  initParallaxHero();
  initParticleNetwork();
  initVideoPlayer();
  initChallengeHashtagCopy();
});

// ── Ambient Particle Canvas — Premium Smooth ────────────────────────
function initParticleNetwork() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, time = 0;
  let particles = [];
  let mouse = { x: -9999, y: -9999, smooth: { x: -9999, y: -9999 } };
  let animationId;

  const isMobile = window.innerWidth < 768;
  const CONFIG = {
    count: isMobile ? 18 : 35,
    maxDistance: isMobile ? 120 : 160,
    mouseRadius: 200,
    lineOpacity: 0.06,
    colors: [
      { r: 0, g: 122, b: 255 },    // accent blue
      { r: 100, g: 210, b: 255 },   // teal
      { r: 48, g: 209, b: 88 },     // green
      { r: 88, g: 86, b: 214 },     // purple
    ],
  };

  function resize() {
    const hero = canvas.closest('.hero-bg') || canvas.parentElement;
    width = canvas.width = hero.offsetWidth;
    height = canvas.height = hero.offsetHeight;
  }

  function createParticle(i) {
    const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    return {
      // Base position — scattered evenly
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      x: 0, y: 0,
      // Organic sine-wave drift parameters (unique per particle)
      driftAmpX: 30 + Math.random() * 60,
      driftAmpY: 20 + Math.random() * 50,
      driftSpeedX: 0.0003 + Math.random() * 0.0004,
      driftSpeedY: 0.0002 + Math.random() * 0.0005,
      driftPhaseX: Math.random() * Math.PI * 2,
      driftPhaseY: Math.random() * Math.PI * 2,
      // Appearance
      size: 1 + Math.random() * 1.5,
      color,
      baseOpacity: 0.15 + Math.random() * 0.25,
      pulseSpeed: 0.001 + Math.random() * 0.002,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.count; i++) {
      particles.push(createParticle(i));
    }
  }

  function update(dt) {
    time += dt;

    // Smooth mouse position (lerp for fluid feel)
    mouse.smooth.x += (mouse.x - mouse.smooth.x) * 0.05;
    mouse.smooth.y += (mouse.y - mouse.smooth.y) * 0.05;

    for (const p of particles) {
      // Organic sine-wave drift
      p.x = p.baseX + Math.sin(time * p.driftSpeedX + p.driftPhaseX) * p.driftAmpX;
      p.y = p.baseY + Math.cos(time * p.driftSpeedY + p.driftPhaseY) * p.driftAmpY;

      // Gentle mouse avoidance (smooth)
      const dx = p.x - mouse.smooth.x;
      const dy = p.y - mouse.smooth.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius && dist > 0) {
        const push = (1 - dist / CONFIG.mouseRadius) * 30;
        p.x += (dx / dist) * push;
        p.y += (dy / dist) * push;
      }

      // Pulse opacity
      p.pulsePhase += p.pulseSpeed * dt;
      p.currentOpacity = p.baseOpacity + Math.sin(p.pulsePhase) * 0.08;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Connection lines — very subtle
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.maxDistance) {
          const fade = 1 - dist / CONFIG.maxDistance;
          const opacity = fade * fade * CONFIG.lineOpacity; // quadratic fade for smoothness
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(100, 180, 255, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw particles with soft glow
    for (const p of particles) {
      const { r, g, b } = p.color;

      // Outer glow halo
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.currentOpacity * 0.25})`);
      grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${p.currentOpacity * 0.06})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.currentOpacity * 0.8})`;
      ctx.fill();
    }
  }

  let lastTime = performance.now();
  function animate(now) {
    const dt = Math.min(now - lastTime, 50); // cap delta to avoid jumps
    lastTime = now;
    update(dt);
    draw();
    animationId = requestAnimationFrame(animate);
  }

  // Events
  window.addEventListener('resize', () => {
    resize();
    for (const p of particles) {
      if (p.baseX > width) p.baseX = Math.random() * width;
      if (p.baseY > height) p.baseY = Math.random() * height;
    }
  });

  const heroEl = canvas.closest('.hero') || document;
  heroEl.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  heroEl.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Pause off-screen
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!animationId) { lastTime = performance.now(); animationId = requestAnimationFrame(animate); }
      } else {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });
  }, { threshold: 0 });
  io.observe(heroEl);

  resize();
  initParticles();
  animationId = requestAnimationFrame(animate);
}

// ── Navbar Scroll Effect ────────────────────────────────────────────
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Scroll Progress Bar ─────────────────────────────────────────────
function initScrollProgress() {
  const progress = document.getElementById('navProgress');
  if (!progress) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progress.style.width = scrollPercent + '%';
  }, { passive: true });
}

// ── Scroll Reveal Animation ─────────────────────────────────────────
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

// ── Language Toggle ─────────────────────────────────────────────────
let currentLang = 'en';

function initLanguageToggle() {
  const buttons = document.querySelectorAll('.lang-toggle button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang === currentLang) return;
      setLanguage(lang);
    });
  });
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const text = translations[lang][key];
    if (text) el.innerHTML = text;
  });

  document.querySelectorAll('.lang-toggle button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.documentElement.lang = lang;
}

// ── Mobile Menu ─────────────────────────────────────────────────────
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!toggle || !navLinks) return;

  function openMenu() {
    navLinks.classList.add('open');
    toggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    toggle.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close on link click
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close on background tap (outside links)
  navLinks.addEventListener('click', (e) => {
    if (e.target === navLinks) closeMenu();
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
    }
  });
}

// ── Smooth Scroll for Anchor Links ──────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 80;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });
}

// ── App Showcase Tabs ───────────────────────────────────────────────
function initShowcaseTabs() {
  const tabs = document.querySelectorAll('.showcase-tab');
  const panels = document.querySelectorAll('.showcase-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panel with animation
      panels.forEach((p) => {
        p.classList.remove('active');
        if (p.dataset.panel === target) {
          p.classList.add('active');
        }
      });
    });
  });
}

// ── Parallax Hero Elements ──────────────────────────────────────────
function initParallaxHero() {
  const heroVisual = document.querySelector('.hero-visual');
  if (!heroVisual) return;

  const badges = heroVisual.querySelectorAll('.hero-float-badge');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > window.innerHeight) return;

    const factor = scrollY * 0.15;
    badges.forEach((badge, i) => {
      const direction = i % 2 === 0 ? 1 : -1;
      badge.style.transform = `translateY(${-factor * direction * (0.3 + i * 0.2)}px)`;
    });
  }, { passive: true });
}

// ── Video Player — YouTube Inline Embed ─────────────────────────────
function initVideoPlayer() {
  const thumbnail = document.getElementById('videoThumbnail');
  const container = document.getElementById('videoContainer');
  if (!thumbnail || !container) return;

  thumbnail.addEventListener('click', () => {
    container.innerHTML = `
      <iframe 
        src="https://www.youtube-nocookie.com/embed/nFAHoENvkYc?autoplay=1&rel=0" 
        title="Proximity Lock — Setup & Demo Guide" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;">
      </iframe>
    `;
  });
}

// ── Creator Challenge — Hashtag Copy to Clipboard ─────────────────────
function initChallengeHashtagCopy() {
  const btn = document.getElementById('challengeCopyBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const hashtags = btn.getAttribute('data-hashtags') || '#ProximityLock #MacSecurity';

    try {
      await navigator.clipboard.writeText(hashtags);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = hashtags;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    // Visual feedback
    const label = btn.querySelector('span');
    const currentLang = document.documentElement.getAttribute('data-lang') || 'en';
    const copiedText = (currentLang === 'vi') ? 'Đã sao chép ✓' : 'Copied ✓';
    const originalText = label.textContent;

    btn.classList.add('copied');
    label.textContent = copiedText;

    setTimeout(() => {
      btn.classList.remove('copied');
      label.textContent = originalText;
    }, 2000);
  });
}
