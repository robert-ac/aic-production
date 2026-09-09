/* Section rail, right-edge scrollspy for the homepage.
   Highlights the section in view, drives the fibre-optic progress thread,
   and fades the rail in once the visitor leaves the hero. */
(function () {
  "use strict";

  var rail = document.getElementById("secrail");
  if (!rail) return;

  var links = Array.prototype.slice.call(rail.querySelectorAll("a[data-rail]"));
  var fill = rail.querySelector(".secrail__fill");
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  }

  /* the section closest to the upper-middle of the viewport wins */
  function update() {
    var probe = window.innerHeight * 0.38;
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= probe) current = sections[i];
    }
    if (current) setActive(current.id);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (fill) fill.style.height = (p * 100).toFixed(2) + "%";

    rail.classList.toggle("is-live", window.scrollY > window.innerHeight * 0.45);
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
