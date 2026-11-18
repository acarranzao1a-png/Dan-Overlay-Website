/* ═══════════════════════════════════════════════════════════
   DanOverlay — script.js (v3 — dynamic interactions)
   ═══════════════════════════════════════════════════════════ */

// ── Header scroll state ──────────────────────────────────
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ── Gradient BG: interactive mouse-following bubble ──────
(function () {
  const interBubble = document.querySelector('.gradient-bg .interactive');
  if (!interBubble) return;

  let curX = 0, curY = 0, tgX = 0, tgY = 0;

  window.addEventListener('mousemove', e => {
    tgX = e.clientX;
    tgY = e.clientY;
  }, { passive: true });

  function move() {
    if (!document.hidden) {
      curX += (tgX - curX) / 20;
      curY += (tgY - curY) / 20;
      interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
    }
    requestAnimationFrame(move);
  }
  move();
})();

// ── Scroll reveal with stagger ───────────────────────────
(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // once visible, never hide again
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.anim-in').forEach(el => observer.observe(el));
})();

// ── 3D Tilt cards — direct positional tilt when on card ──
(function () {
  const TILT_CARDS = [];
  let mouseX = -9999, mouseY = -9999;

  function collectCards() {
    TILT_CARDS.length = 0;
    document.querySelectorAll('.tilt-card').forEach(el => {
      TILT_CARDS.push({ el, rx: 0, ry: 0 });
    });
  }
  collectCards();
  window.addEventListener('load', collectCards);

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouseX = -9999; mouseY = -9999;
  });

  const MAX_TILT = 15;
  const RANGE = 260;

  function loop() {
    if (document.hidden) { requestAnimationFrame(loop); return; }
    const wH = window.innerHeight;
    TILT_CARDS.forEach(item => {
      const el = item.el;
      const rect = el.getBoundingClientRect();

      // Skip cards fully off-screen — avoid expensive math
      if (rect.bottom < -RANGE || rect.top > wH + RANGE) {
        if (Math.abs(item.rx) > 0.02 || Math.abs(item.ry) > 0.02) {
          item.rx = 0; item.ry = 0;
          el.style.transform = '';
        }
        return;
      }

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const dist = Math.hypot(dx, dy);

      let targetRx = 0, targetRy = 0;
      const onCard = Math.abs(dx) < rect.width / 2 + 8 &&
        Math.abs(dy) < rect.height / 2 + 8;

      if (onCard && mouseX > -9998) {
        // Full positional tilt: center = 0°, edge = MAX_TILT
        targetRx = (dy / (rect.height / 2)) * MAX_TILT;
        targetRy = -(dx / (rect.width / 2)) * MAX_TILT;
        item.rx += (targetRx - item.rx) * 0.12;
        item.ry += (targetRy - item.ry) * 0.12;
      } else if (dist < RANGE && mouseX > -9998) {
        // Approach glow: softly tilts toward cursor
        const factor = (1 - dist / RANGE) * 0.35;
        targetRx = (dy / rect.height) * MAX_TILT * factor;
        targetRy = -(dx / rect.width) * MAX_TILT * factor;
        item.rx += (targetRx - item.rx) * 0.08;
        item.ry += (targetRy - item.ry) * 0.08;
      } else {
        item.rx += (0 - item.rx) * 0.07;
        item.ry += (0 - item.ry) * 0.07;
      }

      const angle = Math.sqrt(item.rx ** 2 + item.ry ** 2);
      if (angle > 0.02) {
        const lift = angle * 1.5; // card rises toward viewer
        el.style.transform =
          `perspective(500px) rotateX(${item.rx}deg) rotateY(${item.ry}deg) translateZ(${lift}px)`;
      } else {
        el.style.transform = '';
      }
    });
    requestAnimationFrame(loop);
  }
  loop();
})();

// ── Charts carousel: smooth RAF-driven infinite scroll ───
(function () {
  const viewport = document.getElementById('charts-viewport');
  const track = document.getElementById('charts-track');
  if (!viewport || !track) return;

  // Disable CSS animation — JS drives the position entirely
  track.style.animation = 'none';

  let offset = 0;    // current scroll position (px)
  let extraVel = 0;    // momentum added by wheel
  let paused = false;
  let lastTime = null;
  const SPEED = 0.052; // px/ms — mirrors original 50s CSS timing

  function frame(now) {
    if (document.hidden) { lastTime = null; requestAnimationFrame(frame); return; }
    if (lastTime === null) lastTime = now;
    const dt = Math.min(now - lastTime, 50); // cap delta to avoid big jumps
    lastTime = now;

    if (!paused) offset += SPEED * dt;
    offset += extraVel;
    extraVel *= 0.92; // smooth friction decay

    // Infinite wrap: loop width = one set (half of total track width)
    const loopW = track.scrollWidth / 2;
    if (loopW > 0) offset = ((offset % loopW) + loopW) % loopW;

    track.style.transform = `translateX(${-offset}px)`;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  // Pause on hover so users can examine cards
  viewport.addEventListener('mouseenter', () => { paused = true; });
  viewport.addEventListener('mouseleave', () => { paused = false; extraVel = 0; });

  // Wheel adds momentum — smooth, not a hard jump
  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    extraVel += e.deltaY * 0.25;
  }, { passive: false });
})();

// ── Changelog accordion ──────────────────────────────────
(function () {
  document.querySelectorAll('.cl-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.cl-item');
      const wasOpen = item.classList.contains('cl-open');

      // Close all
      document.querySelectorAll('.cl-item.cl-open').forEach(o => {
        o.classList.remove('cl-open');
      });

      // Toggle clicked
      if (!wasOpen) {
        item.classList.add('cl-open');
      }
    });
  });
})();

// ── Lightbox ─────────────────────────────────────────────
(function () {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbClose = document.getElementById('lb-close');
  if (!lb) return;

  function open(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 250);
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('.lb-trigger');
    if (!trigger) return;
    const img = trigger.querySelector('img') || trigger;
    if (img.tagName === 'IMG') open(img.src, img.alt);
  });

  lbClose.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// ── Smooth scroll ────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── Magnetic hover on CTA buttons ────────────────────────
(function () {
  document.querySelectorAll('.cta-btn, .header-cta, .dl-main-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

// ── Counter animation for tier items ─────────────────────
(function () {
  let animated = false;
  const tierBar = document.querySelector('.tier-bar');
  if (!tierBar) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        const items = tierBar.querySelectorAll('.tier-item');
        items.forEach((item, i) => {
          item.style.opacity = '0';
          item.style.transform = 'translateY(10px)';
          setTimeout(() => {
            item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, i * 60);
        });
      }
    });
  }, { threshold: 0.3 });

  observer.observe(tierBar);
})();

// ── Before/After Auto-Crossfade ─────────────────────────
(function () {
  const containers = document.querySelectorAll('.ba-crossfade');
  if (containers.length === 0) return;

  let showAfter = false;

  setInterval(() => {
    showAfter = !showAfter;
    containers.forEach(container => {
      container.classList.toggle('show-after', showAfter);

      const label = container.querySelector('.ba-badge-label');
      if (label) {
        label.textContent = showAfter
          ? (container.dataset.labelAfter || 'AFTER')
          : (container.dataset.labelBefore || 'BEFORE');
      }

      const tier = container.querySelector('.ba-badge-tier');
      if (tier) {
        tier.innerHTML = showAfter
          ? (container.dataset.tierAfter || 'Zeta <small>LOW</small>')
          : (container.dataset.tierBefore || 'Delta <small>HIGH</small>');
      }

      // Sync progress bar animation with JS transition
      const bar = container.querySelector('.ba-progress-bar');
      if (bar) {
        bar.style.animation = 'none';
        void bar.offsetHeight; // force reflow to restart animation
        bar.style.animation = '';
      }
    });
  }, 5000);
})();

// ── Benchmark Suite Tabs (v3.0.0) ────────────────────────
(function () {
  const tabs = document.querySelectorAll('.bm-tab');
  if (tabs.length === 0) return;

  const panels = document.querySelectorAll('.bm-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-bm-tab');

      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      panels.forEach(panel => {
        panel.classList.toggle('is-active', panel.getAttribute('data-bm-panel') === key);
      });
    });
  });
})();