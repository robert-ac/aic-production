(function () {
  var roots = document.querySelectorAll("[data-alebex-motion]");
  if (!roots.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  roots.forEach(function (root) {
    var cards = root.querySelectorAll(".alebex-feature-card");
    if (reduce) {
      cards.forEach(function (c) { c.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var kids = entry.target.querySelectorAll(".alebex-feature-card");
          kids.forEach(function (card, i) {
            window.setTimeout(function () {
              card.classList.add("is-in");
            }, i * 90);
          });
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(root);
  });
})();
