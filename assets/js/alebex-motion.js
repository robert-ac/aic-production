(function () {
  var roots = document.querySelectorAll("[data-alebex-motion]");
  if (!roots.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  roots.forEach(function (root) {
    var items = root.querySelectorAll(":scope > li, .alebex-feature-card");
    if (!items.length) items = root.children;
    if (reduce) {
      Array.prototype.forEach.call(items, function (c) { c.classList.add("is-in"); });
      root.classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var kids = entry.target.querySelectorAll(":scope > li, .alebex-feature-card");
          if (!kids.length) kids = entry.target.children;
          Array.prototype.forEach.call(kids, function (el, i) {
            window.setTimeout(function () { el.classList.add("is-in"); }, i * 100);
          });
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(root);
  });
})();
