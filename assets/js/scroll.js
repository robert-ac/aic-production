/* ==========================================================================
   Alexander Innovation Centre, scroll engine
   - Whole-document scroll progress (0→1) drives video.currentTime (0%→100%).
   - One requestAnimationFrame loop; scroll listened passively. Easing (lerp)
     gives continuous, smooth scrubbing instead of jumpy seeks.
   - Parallax: background is fixed (speed 0) while content scrolls (speed 1);
     [data-parallax] elements add extra depth at their own rates.
   - Canvas particle/orbit field renders immediately as a branded fallback and
     is retired the moment a real video can paint.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------- CONFIG -------------------------------- */
  const VIDEO_SRC = "assets/video/aic-background.mp4?v=20260615m"; // bump ?v= when you swap the file
  // For HLS, set VIDEO_SRC to a .m3u8 and load hls.js, or use an <source> list.
  const EASE      = 0.18;    // 0..1, lower = smoother/heavier scrub, higher = snappier
  const SEEK_MIN  = 0.008;   // seconds, ignore micro-seeks to spare the decoder

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------- ELEMENTS ------------------------------ */
  const video   = document.getElementById("bgVideo");
  const fill     = document.getElementById("scrollFill");
  const nav      = document.getElementById("nav");
  const orbits   = document.getElementById("orbits");
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));

  /* --------------------------- SCROLL STATE ---------------------------- */
  let target = 0;        // raw scroll progress 0..1
  let smooth = 0;        // eased progress 0..1 (drives everything visible)
  let videoReady = false;
  let duration = 0;
  let lastSeek = -1;
  let winH = window.innerHeight;
  let frameId = 0;
  function wake() { if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame); }

  function computeTarget() {
    const max = document.documentElement.scrollHeight - winH;
    target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    wake();
  }

  /* ------------------------------ VIDEO -------------------------------- */
  function initVideo() {
    video.muted = true;            // required for programmatic control on most browsers
    video.playsInline = true;
    video.preload = "auto";
    // Media fragment makes the browser decode/paint the chosen frame first,
    // so the hero never flashes t=0 before the scrub logic kicks in.
    var startAt = parseFloat(video.dataset.start) || 0;
    video.src = VIDEO_SRC + (startAt ? "#t=" + startAt : "");

    video.addEventListener("loadedmetadata", () => {
      duration = video.duration || 0;
      if (duration > 0) {
        videoReady = true;
        // With data-start we hold the poster still until the video has really
        // landed on that frame, so the hero never flashes the opening frame.
        if (startAt > 0 && startAt < duration) {
          video.addEventListener("seeked", function reveal() {
            // Some decoders ignore the seek and land back on 0; in that case we
            // keep the still rather than reveal the flat opening frame.
            if (Math.abs(video.currentTime - startAt) > 0.5) return;
            video.removeEventListener("seeked", reveal);
            video.classList.add("is-live");
            stopCanvas();
            wake();
          });
          try { video.currentTime = startAt; lastSeek = startAt; } catch (e) {}
        } else {
          video.classList.add("is-live");
          stopCanvas();   // the building now fills the screen, so the fallback is never seen
        }
        wake();
      }
    });
    // If the file is missing/unsupported, we simply keep the canvas fallback.
    video.addEventListener("error", () => { videoReady = false; });
    video.load();

    // Some mobile browsers gate seeking until the element has "played" once.
    const nudge = () => {
      const p = video.play();
      if (p && p.then) p.then(() => video.pause()).catch(() => {});
      window.removeEventListener("touchstart", nudge);
      window.removeEventListener("pointerdown", nudge);
    };
    window.addEventListener("touchstart", nudge, { once: true, passive: true });
    window.addEventListener("pointerdown", nudge, { once: true });
  }

  /* ----------------------------- RAF LOOP ------------------------------ */
  function frame() {
    frameId = 0;
    if (document.hidden) return;
    // ease toward the scroll target for buttery, continuous motion
    smooth += (target - smooth) * (reduceMotion ? 1 : EASE);
    if (Math.abs(target - smooth) < 0.0002) smooth = target;

    // 1, scrub the video (the building plays day→night as you scroll).
    //     No scale/transform: the shot is shown whole, so we never crop it.
    if (videoReady && duration && !reduceMotion) {
      // Optional data-start: hold the hero on a chosen frame (e.g. the lit
      // building) and scrub from there, instead of always opening on t=0.
      const start = Math.min(parseFloat(video.dataset.start) || 0, duration - 0.1);
      const span  = Math.max(0.1, duration - start);
      const t = Math.min(start + smooth * span, Math.max(0, duration - 0.04));
      if (!video.seeking && Math.abs(t - lastSeek) > SEEK_MIN) {
        try { video.currentTime = t; lastSeek = t; } catch (e) {}
      }
    }

    // 2, progress bar
    fill.style.width = (smooth * 100).toFixed(2) + "%";

    // 3, orbit glow: gentle constant drift in the navy margins behind the building
    if (orbits && !reduceMotion) {
      orbits.style.transform = "translateX(-50%) translateY(" + (smooth * -70).toFixed(1) + "px)";
    }

    // 4, generic parallax layers
    for (const el of (reduceMotion ? [] : parallaxEls)) {
      if (el === orbits) continue;
      const rate = parseFloat(el.dataset.parallax) || 0;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - winH / 2;   // distance from viewport centre
      el.style.transform = "translate3d(0," + (-center * rate).toFixed(1) + "px,0)";
    }

    if (canvasActive) drawCanvas();
    if (canvasActive || Math.abs(target - smooth) > 0.0002) wake();
  }

  /* ----------------------- REVEALS + NAV STATE ------------------------- */
  function initObservers() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = Math.min(i * 60, 240) + "ms";
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal, .pillar").forEach((el) => io.observe(el));

    const navIo = new IntersectionObserver(([e]) => {
      nav.classList.toggle("is-stuck", !e.isIntersecting);
    }, { rootMargin: "-72px 0px 0px 0px" });
    const heroSentinel = document.getElementById("hero");
    if (heroSentinel) navIo.observe(heroSentinel);
  }

  /* ============================ CANVAS FIELD ===========================
     Branded ambient fallback: depth-layered luminous particles drifting
     over two faint orbital rings (an echo of the AIC atom mark). Scroll
     parallaxes the particles and rotates the rings. Retired when video paints.
  ===================================================================== */
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");
  let canvasActive = !reduceMotion;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let cw = 0, ch = 0;
  let particles = [];

  function sizeCanvas() {
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedParticles() {
    const count = Math.round(Math.min(120, (cw * ch) / 16000));
    particles = [];
    for (let i = 0; i < count; i++) {
      const depth = Math.random();               // 0 far → 1 near
      particles.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        z: depth,
        r: 0.6 + depth * 2.2,
        vx: (Math.random() - 0.5) * (0.05 + depth * 0.18),
        vy: (Math.random() - 0.5) * (0.05 + depth * 0.18),
        ember: Math.random() < 0.12,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, cw, ch);
    const cx = cw * 0.5, cy = ch * (0.42 - smooth * 0.1);

    // faint orbital rings, rotate with scroll progress
    const rings = [
      { rx: cw * 0.30, ry: ch * 0.12, rot: smooth * 1.4,        col: "rgba(31,166,255,0.18)" },
      { rx: cw * 0.20, ry: ch * 0.22, rot: -smooth * 1.1 + 0.7, col: "rgba(230,57,70,0.16)" },
      { rx: cw * 0.40, ry: ch * 0.07, rot: smooth * 0.8 + 1.9,  col: "rgba(135,210,255,0.12)" },
    ];
    for (const ring of rings) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ring.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = ring.col;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    // particles, parallax offset by depth & scroll
    const shift = smooth * 220;
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.tw += 0.02;
      if (p.x < -10) p.x = cw + 10; if (p.x > cw + 10) p.x = -10;
      if (p.y < -10) p.y = ch + 10; if (p.y > ch + 10) p.y = -10;

      const py = p.y - shift * p.z;                 // nearer particles move more
      const yy = ((py % (ch + 20)) + (ch + 20)) % (ch + 20) - 10;
      const a = (0.25 + p.z * 0.55) * (0.7 + 0.3 * Math.sin(p.tw));

      ctx.beginPath();
      ctx.arc(p.x, yy, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.ember
        ? "rgba(255,90,102," + a.toFixed(3) + ")"
        : "rgba(120,200,255," + a.toFixed(3) + ")";
      ctx.shadowBlur = p.r * 4; ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function stopCanvas() {
    canvasActive = false;
    if (ctx) ctx.clearRect(0, 0, cw, ch);
    canvas.style.display = "none";
  }

  /* ----------------------------- WIRING -------------------------------- */
  function onResize() {
    winH = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvasActive) { sizeCanvas(); seedParticles(); }
    computeTarget();
  }

  // pause canvas work when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    canvasActive = !document.hidden && !reduceMotion && !videoReady;
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; } else wake();
  });

  window.addEventListener("scroll", computeTarget, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  // init
  if (canvasActive) { sizeCanvas(); seedParticles(); }
  computeTarget();
  smooth = target;
  initVideo();
  initObservers();
  video.addEventListener("seeked", wake);
  wake();
})();
