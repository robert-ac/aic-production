/* Lightweight gallery lightbox: click a .gallery img to open full-screen,
   navigate with arrows / keyboard / swipe, close with × / backdrop / Esc. */
(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll(".gallery img"));
  if (!imgs.length) return;

  var i = 0;
  var ov = document.createElement("dialog");
  ov.className = "lightbox";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-label", "Photo viewer");
  ov.innerHTML =
    '<button type="button" class="lightbox__close" aria-label="Close photo viewer" autofocus>×</button>' +
    '<button type="button" class="lightbox__nav lightbox__prev" aria-label="Previous photo">‹</button>' +
    '<img class="lightbox__img" alt="" />' +
    '<button type="button" class="lightbox__nav lightbox__next" aria-label="Next photo">›</button>' +
    '<span class="lightbox__count" aria-live="polite"></span>';
  document.body.appendChild(ov);

  var imgEl = ov.querySelector(".lightbox__img");
  var countEl = ov.querySelector(".lightbox__count");
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  var currentTrigger;
  var previousOverflow;
  var imageAnimation;

  imgEl.addEventListener("load", function () {
    if (reduceMotion.matches || !ov.open) return;
    imageAnimation?.cancel();
    imageAnimation = imgEl.animate([
      { opacity: .55, scale: .98 },
      { opacity: 1, scale: 1 }
    ], { duration: 250, easing: "cubic-bezier(.22,1,.36,1)" });
  });

  function show(n) {
    i = (n + imgs.length) % imgs.length;
    imgEl.src = imgs[i].currentSrc || imgs[i].src;
    imgEl.alt = imgs[i].alt || "";
    countEl.textContent = (i + 1) + " / " + imgs.length;
  }
  function open(n, trigger) {
    show(n);
    currentTrigger = trigger;
    previousOverflow = document.body.style.overflow;
    ov.classList.add("is-open");
    ov.showModal();
    document.body.style.overflow = "hidden";
  }

  function close() { ov.close(); }
  ov.addEventListener("close", function () {
    imageAnimation?.cancel();
    ov.classList.remove("is-open");
    document.body.style.overflow = previousOverflow;
    currentTrigger?.focus({ preventScroll: true });
  });

  imgs.forEach(function (im, idx) {
    var trigger = im.closest("button, a");
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "gallery__photo-button";
      im.replaceWith(trigger);
      trigger.appendChild(im);
    }
    trigger.setAttribute("aria-label", "Open photo " + (idx + 1) + (im.alt ? ": " + im.alt : ""));
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      open(idx, trigger);
    });
  });
  ov.querySelector(".lightbox__close").addEventListener("click", close);
  ov.querySelector(".lightbox__prev").addEventListener("click", function (e) { e.stopPropagation(); show(i - 1); });
  ov.querySelector(".lightbox__next").addEventListener("click", function (e) { e.stopPropagation(); show(i + 1); });
  ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  ov.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      show(i + (e.key === "ArrowLeft" ? -1 : 1));
    }
  });

  // touch swipe
  var sx = 0;
  ov.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  ov.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
  });
})();
