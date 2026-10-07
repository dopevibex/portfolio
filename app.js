document.addEventListener('DOMContentLoaded', () => {
  setHeroInitialState();
  initTKTSoundtrack();
  initPreloaderGate();
  initEmberCanvas();
  initArsenalFilters();
  initNavigation();
  initMobileDrawer();
  initClipboardAndForms();
  initIdentityTitleAnimation();
  initDomainTitleAnimation();
  initSummonTitleAnimation();
});

/* ========================================================= */
/* 01. T-KT SOUNDTRACK AUDIO ENGINE                         */
/* ========================================================= */
let isMusicPlaying = false;
let bgAudio = null;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function initTKTSoundtrack() {
  bgAudio = document.getElementById('bgAudio');
  const audioBtn = document.getElementById('audioToggleBtn');
  const audioStatusTxt = document.getElementById('audioStatusTxt');

  if (bgAudio) {
    bgAudio.volume = 0.85;
    bgAudio.loop = true;

    bgAudio.addEventListener('play', () => {
      isMusicPlaying = true;
      if (audioBtn) audioBtn.classList.add('playing');
      if (audioStatusTxt) audioStatusTxt.textContent = 'T-KT: ON';
      removeUnlockListeners();
    });

    bgAudio.addEventListener('pause', () => {
      isMusicPlaying = false;
      if (audioBtn) audioBtn.classList.remove('playing');
      if (audioStatusTxt) audioStatusTxt.textContent = 'AUDIO OFF';
    });
  }

  const events = ['click', 'pointerdown', 'keydown', 'touchstart'];

  function handleUserGesture() {
    attemptAutoPlay();
  }

  function removeUnlockListeners() {
    events.forEach(evt => {
      window.removeEventListener(evt, handleUserGesture);
      document.removeEventListener(evt, handleUserGesture);
    });
  }

  function attemptAutoPlay() {
    if (!bgAudio) bgAudio = document.getElementById('bgAudio');
    if (bgAudio && bgAudio.paused) {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();

      const playPromise = bgAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isMusicPlaying = true;
            removeUnlockListeners();
          })
          .catch(() => {});
      }
    }
  }

  events.forEach(evt => {
    window.addEventListener(evt, handleUserGesture, { passive: true, once: true });
    document.addEventListener(evt, handleUserGesture, { passive: true, once: true });
  });

  attemptAutoPlay();

  if (audioBtn) {
    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSoundtrack();
    });
  }
}

function toggleSoundtrack() {
  if (!bgAudio) bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) return;

  const audioBtn = document.getElementById('audioToggleBtn');
  const audioStatusTxt = document.getElementById('audioStatusTxt');

  if (bgAudio.paused) {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();

    bgAudio.play()
      .then(() => {
        isMusicPlaying = true;
        if (audioBtn) audioBtn.classList.add('playing');
        if (audioStatusTxt) audioStatusTxt.textContent = 'T-KT: ON';
        showToast('Soundtrack: T-KT (Attack on Titan OST) Playing');
      })
      .catch(() => {
        showToast('Click anywhere to allow audio');
      });
  } else {
    bgAudio.pause();
    isMusicPlaying = false;
    if (audioBtn) audioBtn.classList.remove('playing');
    if (audioStatusTxt) audioStatusTxt.textContent = 'AUDIO OFF';
    showToast('Soundtrack: MUTED');
  }
}

function startSoundtrack() {
  if (!bgAudio) bgAudio = document.getElementById('bgAudio');
  if (bgAudio && bgAudio.paused) {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();

    const playPromise = bgAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isMusicPlaying = true;
          const audioBtn = document.getElementById('audioToggleBtn');
          const audioStatusTxt = document.getElementById('audioStatusTxt');
          if (audioBtn) audioBtn.classList.add('playing');
          if (audioStatusTxt) audioStatusTxt.textContent = 'T-KT: ON';
        })
        .catch(() => {});
    }
  }
}

/* ========================================================= */
/* 02. DEMONIC GATE PRELOADER (SMOOTH HARDWARE ACCELERATED)  */
/* ========================================================= */
function initPreloaderGate() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const seamFill = document.querySelector('.pl-seam-fill');
  const replayBtn = document.getElementById('replayGateBtn');

  document.body.style.overflow = 'hidden';

  let currentPct = 0;
  let targetPct = 0;
  let rafId = null;
  let isDone = false;

  function advance() {
    if (targetPct < 100) {
      targetPct += Math.floor(Math.random() * 14 + 12);
      if (targetPct >= 100) targetPct = 100;
    }
  }

  function loop() {
    currentPct += (targetPct - currentPct) * 0.20;
    if (targetPct >= 100 && currentPct >= 98.5) {
      currentPct = 100;
    }
    const rounded = Math.min(Math.round(currentPct), 100);

    if (seamFill) seamFill.style.height = `${rounded}%`;

    if (rounded >= 100 && !isDone) {
      isDone = true;
      clearInterval(advanceInterval);
      if (rafId) cancelAnimationFrame(rafId);
      if (seamFill) seamFill.style.height = '100%';

      setTimeout(() => {
        openGatesSequence();
      }, 140);
      return;
    }

    rafId = requestAnimationFrame(loop);
  }

  let advanceInterval = setInterval(advance, 60);
  rafId = requestAnimationFrame(loop);

  function openGatesSequence() {
    setHeroInitialState();
    preloader.classList.add('hidden');

    setTimeout(() => {
      triggerHeroEntrance();
    }, 650);

    setTimeout(() => {
      startSoundtrack();
    }, 900);

    setTimeout(() => {
      document.body.style.overflow = '';
      preloader.style.display = 'none';
    }, 1100);
  }

  preloader.addEventListener('click', () => {
    if (!isDone) {
      targetPct = 100;
      currentPct = 100;
      isDone = true;
      clearInterval(advanceInterval);
      if (rafId) cancelAnimationFrame(rafId);
      if (seamFill) seamFill.style.height = '100%';
      openGatesSequence();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDone && preloader.style.display !== 'none') {
      targetPct = 100;
      currentPct = 100;
      isDone = true;
      clearInterval(advanceInterval);
      if (rafId) cancelAnimationFrame(rafId);
      if (seamFill) seamFill.style.height = '100%';
      openGatesSequence();
    }
  });

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      preloader.style.display = 'flex';
      preloader.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      isDone = false;
      targetPct = 0;
      currentPct = 0;
      if (seamFill) seamFill.style.height = '0%';
      clearInterval(advanceInterval);
      if (rafId) cancelAnimationFrame(rafId);
      advanceInterval = setInterval(advance, 60);
      rafId = requestAnimationFrame(loop);
      showToast('Replaying Gate Entrance');
    });
  }
}

function setHeroInitialState() {
  if (typeof gsap === 'undefined') return;
  gsap.set('.top-navbar', { y: -25, opacity: 0 });
  gsap.set('.hero-deathmetal-floating-wrap', { x: 40, y: 0, opacity: 0, scale: 0.96 });
  gsap.set('.hero-kicker', { y: 25, opacity: 0 });
  gsap.set('.hero-main-title', { y: 35, opacity: 0 });
  gsap.set('.hero-italic-subtitle', { y: 30, opacity: 0 });
  gsap.set('.hero-description', { y: 30, opacity: 0 });
  gsap.set('.hero-btn-row > *', { y: 25, opacity: 0 });
  gsap.set('.hero-stats-row .stat-item', { y: 25, opacity: 0 });
}

/* ========================================================= */
/* 03. CINEMATIC HERO ENTRANCE (GSAP HARDWARE ACCELERATED)   */
/* ========================================================= */
function triggerHeroEntrance() {
  if (typeof gsap === 'undefined') return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

  tl.to('.top-navbar', { y: 0, opacity: 1, duration: 0.8 }, 0);
  tl.to('.hero-deathmetal-floating-wrap', { x: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power4.out' }, 0.08);
  tl.to('.hero-kicker', { y: 0, opacity: 1, duration: 0.7 }, 0.2);
  tl.to('.hero-main-title', { y: 0, opacity: 1, duration: 0.95, ease: 'power4.out' }, 0.32);
  tl.to('.hero-italic-subtitle', { y: 0, opacity: 1, duration: 0.85, ease: 'power4.out' }, 0.44);
  tl.to('.hero-description', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0.65);
  tl.to('.hero-btn-row > *', { y: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: 'power3.out' }, 0.82);
  tl.to('.hero-stats-row .stat-item', { y: 0, opacity: 1, stagger: 0.12, duration: 0.85, ease: 'power3.out' }, 1.05);
}

/* ========================================================= */
/* 04. HIGH-PERFORMANCE LIGHTWEIGHT EMBER CANVAS            */
/* ========================================================= */
function initEmberCanvas() {
  const canvas = document.getElementById('emberCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  let isRunning = true;

  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, 150);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
    if (isRunning) requestAnimationFrame(render);
  });

  const particles = [];
  const count = 28; // Optimized particle budget

  class Ember {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.radius = Math.random() * 1.8 + 0.5;
      this.speedY = Math.random() * 0.7 + 0.25;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.55 + 0.25;
      this.isCrimson = Math.random() > 0.4;
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      if (this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }
    draw() {
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.isCrimson ? '#ff1e42' : '#ff6b8b';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer soft corona without expensive shadowBlur
      ctx.globalAlpha = this.alpha * 0.25;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < count; i++) {
    particles.push(new Ember());
  }

  function render() {
    if (!isRunning) return;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < count; i++) {
      particles[i].update();
      particles[i].draw();
    }
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/* ========================================================= */
/* 05. ARSENAL (SKILLS) CATEGORY FILTERS                     */
/* ========================================================= */
function initArsenalFilters() {
  const filterBtns = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.arsenal-item-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
          card.style.opacity = '1';
          card.style.transform = 'translate3d(0, 0, 0)';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ========================================================= */
/* 06. SMOOTH ZERO-LAG NAVIGATION (INTERSECTION OBSERVER)    */
/* ========================================================= */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const drawerLinks = document.querySelectorAll('.drawer-link');
  const sections = document.querySelectorAll('section[id]');

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        drawerLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-25% 0px -40% 0px',
    threshold: 0.1
  });

  sections.forEach(sec => observer.observe(sec));
}

/* ========================================================= */
/* 07. DEMONIC MOBILE DRAWER MENU CONTROLLER                 */
/* ========================================================= */
function initMobileDrawer() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  if (!drawer || !backdrop) return;

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (menuBtn) {
      menuBtn.classList.add('active');
      menuBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (menuBtn) {
      menuBtn.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* ========================================================= */
/* 08. CLIPBOARD COPY & FORM DISPATCH                        */
/* ========================================================= */
function initClipboardAndForms() {
  document.querySelectorAll('.copy-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Copied ${textToCopy} to clipboard`);
        });
      }
    });
  });

  const discordNavBtn = document.getElementById('discordNavBtn');
  if (discordNavBtn) {
    discordNavBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('dopevibez');
      showToast('Copied Discord handle: dopevibez');
    });
  }
}

window.handleFormSubmit = function (e) {
  e.preventDefault();
  const name = document.getElementById('formName').value;
  const feedback = document.getElementById('formFeedback');

  if (feedback) {
    feedback.innerHTML = `<span style="color:#10b981;">[✓] Message dispatched from ${escapeHTML(name)}. DOPE will respond promptly.</span>`;
  }

  showToast('Transmission Dispatched Successfully');
  document.getElementById('nexusContactForm').reset();
  return false;
};

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'demonic-toast';
  toast.innerHTML = `<i class="fa-solid fa-gem" style="color:#ff1e42; margin-right:8px;"></i> ${msg}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate3d(40px, 0, 0)';
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

/* ========================================================= */
/* 09. IDENTITY 3D TILT & LIGHTNING (VIEWPORT-AWARE)         */
/* ========================================================= */
function initIdentityTitleAnimation() {
  const stage = document.getElementById('identityStage');
  const graphic = document.getElementById('identitySwordGraphic');
  const canvas = document.getElementById('identityElectricCanvas');
  if (!stage || !graphic || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0, height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let isVisible = false;
  let isHovered = false;

  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    width = rect.width * 1.25;
    height = Math.max(rect.height * 1.4, 250);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  stage.addEventListener('mousemove', (e) => {
    isHovered = true;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetRotY = ((e.clientX - cx) / (rect.width / 2)) * 8;
    targetRotX = -((e.clientY - cy) / (rect.height / 2)) * 6;
  }, { passive: true });

  stage.addEventListener('mouseenter', () => {
    isHovered = true;
    triggerElectricBurst();
  });

  stage.addEventListener('mouseleave', () => {
    isHovered = false;
    targetRotX = 0;
    targetRotY = 0;
  });

  const activeBolts = [];
  const bloodSparks = [];

  class LightningBolt {
    constructor(startX, startY, endX, endY, color = '#ff1e42', maxLife = 9) {
      this.segments = [];
      this.color = color;
      this.life = maxLife;
      this.maxLife = maxLife;
      this.generate(startX, startY, endX, endY);
    }

    generate(sx, sy, ex, ey) {
      this.segments = [{ x: sx, y: sy }];
      const dx = ex - sx;
      const dy = ey - sy;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(3, Math.floor(dist / 22));

      let cx = sx;
      let cy = sy;

      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const nx = sx + dx * progress;
        const ny = sy + dy * progress;
        const offset = (Math.random() - 0.5) * 20 * (1 - Math.abs(progress - 0.5) * 0.4);
        const normalX = -dy / dist;
        const normalY = dx / dist;

        cx = nx + normalX * offset;
        cy = ny + normalY * offset;
        this.segments.push({ x: cx, y: cy });
      }
      this.segments.push({ x: ex, y: ey });
    }

    update() {
      this.life--;
    }

    draw(ctx) {
      if (this.segments.length < 2) return;
      const alpha = Math.max(0, this.life / this.maxLife);

      // Layer 1: Colored Wide Glow (without expensive shadowBlur)
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = alpha * 0.4;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      for (let i = 1; i < this.segments.length; i++) {
        ctx.lineTo(this.segments[i].x, this.segments[i].y);
      }
      ctx.stroke();

      // Layer 2: Sharp Core White Bolt
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = alpha * 0.95;
      ctx.beginPath();
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      for (let i = 1; i < this.segments.length; i++) {
        ctx.lineTo(this.segments[i].x, this.segments[i].y);
      }
      ctx.stroke();
    }
  }

  function createBloodSpark(x, y) {
    bloodSparks.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2.0,
      vy: -Math.random() * 2.0 - 0.4,
      radius: Math.random() * 1.5 + 0.8,
      alpha: 1,
      color: Math.random() > 0.35 ? '#ff1e42' : '#ffffff'
    });
  }

  function triggerElectricBurst() {
    if (width === 0 || height === 0) return;
    const cx = width / 2;
    const cy = height / 2;

    const pommel = { x: cx, y: cy - height * 0.38 };
    const skull = { x: cx, y: cy - height * 0.15 };
    const tip = { x: cx, y: cy + height * 0.40 };
    const leftWing = { x: cx - width * 0.35, y: cy - height * 0.05 };
    const rightWing = { x: cx + width * 0.35, y: cy - height * 0.05 };

    const colors = ['#ff1e42', '#ff4d6d', '#ffffff'];

    activeBolts.push(new LightningBolt(pommel.x, pommel.y, skull.x, skull.y, colors[Math.floor(Math.random() * colors.length)], 8));
    activeBolts.push(new LightningBolt(skull.x, skull.y, tip.x, tip.y, '#ff1e42', 10));

    if (Math.random() > 0.3) {
      activeBolts.push(new LightningBolt(skull.x, skull.y, leftWing.x, leftWing.y, '#ff3366', 8));
    }
    if (Math.random() > 0.3) {
      activeBolts.push(new LightningBolt(skull.x, skull.y, rightWing.x, rightWing.y, '#ff3366', 8));
    }

    for (let i = 0; i < 4; i++) {
      createBloodSpark(cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 80);
    }
  }

  setInterval(() => {
    if (isVisible && (Math.random() < 0.7 || isHovered)) {
      triggerElectricBurst();
    }
  }, 2600);

  function animate() {
    if (!isVisible) return;

    currentRotX += (targetRotX - currentRotX) * 0.12;
    currentRotY += (targetRotY - currentRotY) * 0.12;

    const scale = isHovered ? 1.025 : 1.0;
    graphic.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`;

    ctx.clearRect(0, 0, width, height);

    for (let i = activeBolts.length - 1; i >= 0; i--) {
      const bolt = activeBolts[i];
      bolt.update();
      bolt.draw(ctx);
      if (bolt.life <= 0) activeBolts.splice(i, 1);
    }

    for (let i = bloodSparks.length - 1; i >= 0; i--) {
      const p = bloodSparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;

      if (p.alpha <= 0) {
        bloodSparks.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  // IntersectionObserver to pause loop when off-screen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const wasVisible = isVisible;
      isVisible = entry.isIntersecting;
      if (isVisible && !wasVisible) {
        requestAnimationFrame(animate);
      }
    });
  }, { threshold: 0.05 });

  observer.observe(stage);
}

/* ========================================================= */
/* 10. DOMAIN 3D INTERACTIVE TILT (VIEWPORT-AWARE)           */
/* ========================================================= */
function initDomainTitleAnimation() {
  const stage = document.getElementById('domainStage');
  const graphic = document.getElementById('domainTitleGraphic');
  if (!stage || !graphic) return;

  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  let isHovered = false;
  let isVisible = false;

  stage.addEventListener('mousemove', (e) => {
    isHovered = true;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetRotY = ((e.clientX - cx) / (rect.width / 2)) * 8;
    targetRotX = -((e.clientY - cy) / (rect.height / 2)) * 6;
  }, { passive: true });

  stage.addEventListener('mouseenter', () => { isHovered = true; });
  stage.addEventListener('mouseleave', () => {
    isHovered = false;
    targetRotX = 0;
    targetRotY = 0;
  });

  function animate() {
    if (!isVisible) return;
    currentRotX += (targetRotX - currentRotX) * 0.12;
    currentRotY += (targetRotY - currentRotY) * 0.12;

    const scale = isHovered ? 1.025 : 1.0;
    graphic.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`;

    requestAnimationFrame(animate);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const wasVisible = isVisible;
      isVisible = entry.isIntersecting;
      if (isVisible && !wasVisible) requestAnimationFrame(animate);
    });
  }, { threshold: 0.05 });

  observer.observe(stage);
}

/* ========================================================= */
/* 11. SUMMON 3D INTERACTIVE TILT (VIEWPORT-AWARE)           */
/* ========================================================= */
function initSummonTitleAnimation() {
  const stage = document.getElementById('summonStage');
  const graphic = document.getElementById('summonTitleGraphic');
  if (!stage || !graphic) return;

  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  let isHovered = false;
  let isVisible = false;

  stage.addEventListener('mousemove', (e) => {
    isHovered = true;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetRotY = ((e.clientX - cx) / (rect.width / 2)) * 8;
    targetRotX = -((e.clientY - cy) / (rect.height / 2)) * 6;
  }, { passive: true });

  stage.addEventListener('mouseenter', () => { isHovered = true; });
  stage.addEventListener('mouseleave', () => {
    isHovered = false;
    targetRotX = 0;
    targetRotY = 0;
  });

  function animate() {
    if (!isVisible) return;
    currentRotX += (targetRotX - currentRotX) * 0.12;
    currentRotY += (targetRotY - currentRotY) * 0.12;

    const scale = isHovered ? 1.025 : 1.0;
    graphic.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`;

    requestAnimationFrame(animate);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const wasVisible = isVisible;
      isVisible = entry.isIntersecting;
      if (isVisible && !wasVisible) requestAnimationFrame(animate);
    });
  }, { threshold: 0.05 });

  observer.observe(stage);
}
