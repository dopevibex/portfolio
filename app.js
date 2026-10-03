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

  // Persistent interaction unlockers: triggers audio upon ANY first interaction
  const events = ['click', 'pointerdown', 'pointermove', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel'];
  
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
    window.addEventListener(evt, handleUserGesture, { passive: true });
    document.addEventListener(evt, handleUserGesture, { passive: true });
  });

  // Try immediate autoplay at script load
  attemptAutoPlay();

  // Manual Toggle Button Handler
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
        showToast('Click anywhere on the screen to allow audio');
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
        .catch((err) => {
          console.warn('Initial autoplay waiting for user interaction:', err);
        });
    }
  }
}

/* ========================================================= */
/* 02. DEMONIC GATE PRELOADER (AUTOMATIC GATE TEAR)          */
/* ========================================================= */
function initPreloaderGate() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const seamFill = document.querySelector('.pl-seam-fill');
  const replayBtn = document.getElementById('replayGateBtn');

  // Lock scroll during preloader
  document.body.style.overflow = 'hidden';

  let currentPct = 0;
  let targetPct = 0;
  let rafId;
  let isDone = false;

  function advance() {
    if (targetPct < 100) {
      targetPct += Math.floor(Math.random() * 12 + 10);
      if (targetPct >= 100) targetPct = 100;
    }
  }

  function loop() {
    currentPct += (targetPct - currentPct) * 0.16;
    if (targetPct >= 100 && currentPct >= 98.5) {
      currentPct = 100;
    }
    const rounded = Math.min(Math.round(currentPct), 100);

    if (seamFill) seamFill.style.height = `${rounded}%`;

    if (rounded >= 100 && !isDone) {
      isDone = true;
      clearInterval(advanceInterval);
      cancelAnimationFrame(rafId);
      if (seamFill) seamFill.style.height = '100%';

      // Hold at 100% seam for 160ms, then slide doors open
      setTimeout(() => {
        openGatesSequence();
      }, 160);
      return;
    }

    rafId = requestAnimationFrame(loop);
  }

  // START PRELOADER SEAM FILL IMMEDIATELY
  let advanceInterval = setInterval(advance, 70);
  loop();

  function openGatesSequence() {
    // 1. Establish initial hidden state so nothing shows before gate clears
    setHeroInitialState();

    // 2. Slide Gates Apart
    preloader.classList.add('hidden');

    // 3. Trigger Hero Entrance with a deliberate beat as gates reach outer edge (750ms)
    setTimeout(() => {
      triggerHeroEntrance();
    }, 750);

    // 4. Turn on music cleanly
    setTimeout(() => {
      startSoundtrack();
    }, 1100);

    setTimeout(() => {
      document.body.style.overflow = '';
      preloader.style.display = 'none';
    }, 1300);
  }

  // Clicking anywhere on preloader or pressing Enter/Space accelerates/opens gates
  preloader.addEventListener('click', () => {
    if (!isDone) {
      targetPct = 100;
      currentPct = 100;
      isDone = true;
      clearInterval(advanceInterval);
      cancelAnimationFrame(rafId);
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
      cancelAnimationFrame(rafId);
      if (seamFill) seamFill.style.height = '100%';
      openGatesSequence();
    }
  });

  // Replay Gate Opening
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
      cancelAnimationFrame(rafId);
      advanceInterval = setInterval(advance, 70);
      loop();
      showToast('Replaying Gate Entrance');
    });
  }
}

function setHeroInitialState() {
  if (typeof gsap === 'undefined') return;
  gsap.set('.top-navbar', { y: -25, opacity: 0 });
  gsap.set('.hero-deathmetal-floating-wrap', { x: 48, y: 0, opacity: 0, scale: 0.95 });
  gsap.set('.hero-kicker', { y: 30, opacity: 0 });
  gsap.set('.hero-main-title', { y: 45, opacity: 0 });
  gsap.set('.hero-italic-subtitle', { y: 35, opacity: 0 });
  gsap.set('.hero-description', { y: 35, opacity: 0 });
  gsap.set('.hero-btn-row > *', { y: 30, opacity: 0 });
  gsap.set('.hero-stats-row .stat-item', { y: 35, opacity: 0 });
}

/* ========================================================= */
/* 03. REFINED CINEMATIC HERO ENTRANCE ANIMATION             */
/* ========================================================= */
function triggerHeroEntrance() {
  if (typeof gsap === 'undefined') return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // 1. Floating pill top navbar drops into position
  tl.to('.top-navbar', 
    { y: 0, opacity: 1, duration: 0.9 }, 
    0
  );

  // 2. Right Column Deathmetal artwork glides in smoothly from right
  tl.to('.hero-deathmetal-floating-wrap', 
    { x: 0, opacity: 1, scale: 1, duration: 1.35, ease: 'power4.out' }, 
    0.1
  );

  // 3. Hero Kicker rises from bottom
  tl.to('.hero-kicker', 
    { y: 0, opacity: 1, duration: 0.8 }, 
    0.25
  );

  // 4. Hero Main Title DOPE rises smoothly from bottom
  tl.to('.hero-main-title', 
    { y: 0, opacity: 1, duration: 1.05, ease: 'power4.out' }, 
    0.38
  );

  // 5. Italic Subtitle rises smoothly from bottom right behind title
  tl.to('.hero-italic-subtitle', 
    { y: 0, opacity: 1, duration: 0.95, ease: 'power4.out' }, 
    0.5
  );

  // 6. Hero Description paragraph appears smoothly from bottom with a distinct delay
  tl.to('.hero-description', 
    { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out' }, 
    0.75
  );

  // 7. Hero CTA Buttons rise smoothly from bottom
  tl.to('.hero-btn-row > *', 
    { y: 0, opacity: 1, stagger: 0.15, duration: 0.85, ease: 'power3.out' }, 
    0.95
  );

  // 8. Hero Stats Numbers Row rises smoothly from bottom last
  tl.to('.hero-stats-row .stat-item', 
    { y: 0, opacity: 1, stagger: 0.15, duration: 0.9, ease: 'power3.out' }, 
    1.2
  );
}

/* ========================================================= */
/* 04. EMBER & ATMOSPHERIC CANVAS                            */
/* ========================================================= */
function initEmberCanvas() {
  const canvas = document.getElementById('emberCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = 45;

  class Ember {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.radius = Math.random() * 2.0 + 0.6;
      this.speedY = Math.random() * 0.9 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.alpha = Math.random() * 0.6 + 0.2;
      this.color = Math.random() > 0.4 ? '#ff1e42' : '#ff758f';
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      if (this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = '#ff1e42';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < count; i++) {
    particles.push(new Ember());
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(render);
  }

  render();
}

/* ========================================================= */
/* 04. ARSENAL (SKILLS) CATEGORY FILTERS                     */
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
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px)';
          setTimeout(() => {
            card.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 30);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ========================================================= */
/* 05. NAVIGATION & SCROLL HANDLERS                          */
/* ========================================================= */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function updateActiveNav() {
    const scrollY = window.scrollY;
    const sections = document.querySelectorAll('section');

    sections.forEach(sec => {
      const top = sec.offsetTop - 180;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
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
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
}

/* ========================================================= */
/* 06. DEMONIC MOBILE DRAWER MENU CONTROLLER                 */
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

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }

  backdrop.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* ========================================================= */
/* 06. CLIPBOARD COPY & FORM DISPATCH                        */
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

  // Handle Discord Nav Click
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
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/* ========================================================= */
/* 07. IDENTITY 3D ELECTRIC & BLOOD ANIMATION ENGINE         */
/* ========================================================= */
function initIdentityTitleAnimation() {
  const stage = document.getElementById('identityStage');
  const graphic = document.getElementById('identitySwordGraphic');
  const canvas = document.getElementById('identityElectricCanvas');
  if (!stage || !graphic || !canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0, height = 0;
  let dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    width = rect.width * 1.3;
    height = Math.max(rect.height * 1.5, 260);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 3D Tilt Interaction
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  let isHovered = false;

  stage.addEventListener('mousemove', (e) => {
    isHovered = true;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    targetRotY = dx * 10;
    targetRotX = -dy * 8;
  });

  stage.addEventListener('mouseenter', () => {
    isHovered = true;
    triggerElectricBurst();
  });

  stage.addEventListener('mouseleave', () => {
    isHovered = false;
    targetRotX = 0;
    targetRotY = 0;
  });

  // Electric Arcs & Blood Sparks
  const activeBolts = [];
  const bloodSparks = [];

  class LightningBolt {
    constructor(startX, startY, endX, endY, color = '#ff1e42', maxLife = 12) {
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
      const steps = Math.max(4, Math.floor(dist / 16));

      let cx = sx;
      let cy = sy;

      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const nx = sx + dx * progress;
        const ny = sy + dy * progress;
        const offset = (Math.random() - 0.5) * 24 * (1 - Math.abs(progress - 0.5) * 0.4);
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
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      for (let i = 1; i < this.segments.length; i++) {
        ctx.lineTo(this.segments[i].x, this.segments[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = alpha * 0.95;
      ctx.shadowBlur = 4;
      ctx.stroke();

      ctx.restore();
    }
  }

  function createBloodSpark(x, y) {
    bloodSparks.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2.2,
      vy: -Math.random() * 2.2 - 0.4,
      radius: Math.random() * 1.8 + 1,
      alpha: 1,
      color: Math.random() > 0.35 ? '#ff1e42' : '#ffffff'
    });
  }

  function triggerElectricBurst() {
    if (width === 0 || height === 0) return;
    const cx = width / 2;
    const cy = height / 2;

    const pommel = { x: cx, y: cy - height * 0.40 };
    const skull = { x: cx, y: cy - height * 0.16 };
    const tip = { x: cx, y: cy + height * 0.42 };
    const leftWing = { x: cx - width * 0.38, y: cy - height * 0.05 };
    const rightWing = { x: cx + width * 0.38, y: cy - height * 0.05 };

    const colors = ['#ff1e42', '#ff4d6d', '#ffffff', '#e11d48'];

    activeBolts.push(new LightningBolt(pommel.x, pommel.y, skull.x, skull.y, colors[Math.floor(Math.random() * colors.length)], 10));
    activeBolts.push(new LightningBolt(skull.x, skull.y, tip.x, tip.y, '#ff1e42', 12));

    if (Math.random() > 0.25) {
      activeBolts.push(new LightningBolt(skull.x, skull.y, leftWing.x, leftWing.y, '#ff3366', 10));
    }
    if (Math.random() > 0.25) {
      activeBolts.push(new LightningBolt(skull.x, skull.y, rightWing.x, rightWing.y, '#ff3366', 10));
    }

    for (let i = 0; i < 6; i++) {
      createBloodSpark(cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 100);
    }
  }

  setInterval(() => {
    if (Math.random() < 0.7 || isHovered) {
      triggerElectricBurst();
    }
  }, 2400);

  function animate() {
    currentRotX += (targetRotX - currentRotX) * 0.1;
    currentRotY += (targetRotY - currentRotY) * 0.1;

    const scale = isHovered ? 1.03 : 1.0;
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
      p.alpha -= 0.025;

      if (p.alpha <= 0) {
        bloodSparks.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* ========================================================= */
/* 07b. DOMAIN 3D INTERACTIVE TILT ANIMATION ENGINE          */
/* ========================================================= */
function initDomainTitleAnimation() {
  const stage = document.getElementById('domainStage');
  const graphic = document.getElementById('domainTitleGraphic');
  if (!stage || !graphic) return;

  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  let isHovered = false;

  stage.addEventListener('mousemove', (e) => {
    isHovered = true;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    targetRotY = dx * 10;
    targetRotX = -dy * 8;
  });

  stage.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  stage.addEventListener('mouseleave', () => {
    isHovered = false;
    targetRotX = 0;
    targetRotY = 0;
  });

  function animate() {
    currentRotX += (targetRotX - currentRotX) * 0.1;
    currentRotY += (targetRotY - currentRotY) * 0.1;

    const scale = isHovered ? 1.03 : 1.0;
    graphic.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`;

    requestAnimationFrame(animate);
  }

  animate();
}

/* ========================================================= */
/* 08. SUMMON 3D INTERACTIVE TILT ANIMATION ENGINE           */
/* ========================================================= */
function initSummonTitleAnimation() {
  const stage = document.getElementById('summonStage');
  const graphic = document.getElementById('summonTitleGraphic');
  if (!stage || !graphic) return;

  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  let isHovered = false;

  stage.addEventListener('mousemove', (e) => {
    isHovered = true;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    targetRotY = dx * 10;
    targetRotX = -dy * 8;
  });

  stage.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  stage.addEventListener('mouseleave', () => {
    isHovered = false;
    targetRotX = 0;
    targetRotY = 0;
  });

  function animate() {
    currentRotX += (targetRotX - currentRotX) * 0.1;
    currentRotY += (targetRotY - currentRotY) * 0.1;

    const scale = isHovered ? 1.03 : 1.0;
    graphic.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`;

    requestAnimationFrame(animate);
  }

  animate();
}
