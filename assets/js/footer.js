/* Shared closing CTA + footer for every inside page (not the homepage).
   Single source of truth: edit the markup here and it updates site-wide.
   Each inside page just needs:  <div id="site-footer"></div>  +  this script. */
(function () {
  var html = `
  <section class="pcta pcta--full pcta--final">
    <div class="finalcta__fx" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="wrap finalcta">
      <div class="finalcta__text">
        <span class="overline">Let's Learn and Innovate Together</span>
        <h2 class="finalcta__title">This is the<br><span class="finalcta__accent">beginning.</span></h2>
        <p class="finalcta__lead">Ready to move forward? Bring your idea, business challenge or training goals. Find the people and practical support to take your next step.</p>
      </div>
      <div class="finalcta__grid">
        <div class="finalcta__card">
          <span class="finalcta__label">Let's Connect</span>
          <a class="finalcta__val" href="mailto:hello@alexic.ca">hello@alexic.ca</a>
        </div>
        <div class="finalcta__card">
          <span class="finalcta__label">Founders</span>
          <a class="finalcta__val" href="founders-lab.html">Join Founders Lab</a>
        </div>
        <div class="finalcta__card">
          <span class="finalcta__label">Organizations</span>
          <a class="finalcta__val" href="learn.html">Training &amp; AI Adoption</a>
        </div>
        <div class="finalcta__card">
          <span class="finalcta__label">Follow</span>
          <div class="finalcta__social">
            <a href="https://www.linkedin.com/company/alexinnovationc/" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4z"/></svg></a>
            <a href="https://x.com/alexinnovationc" target="_blank" rel="noopener" aria-label="X"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.4l8.1-9.3L1 2h7l4.9 6.5L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z"/></svg></a>
            <a href="https://facebook.com/alexinnovationc" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z"/></svg></a>
            <a href="https://instagram.com/alexinnovationc" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a>
          </div>
          <span class="finalcta__val">@alexinnovationc</span>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="wrap footer__inner">
      <img class="footer__logo" src="assets/img/aic-logo-white.png" alt="Alexander Innovation Centre" width="1397" height="655">
      <p class="footer__tag">Connect. Learn. Build. Validate. Accelerate. Scale.</p>
      <p class="footer__meta">Alexander Innovation Centre · #101 - 570 Dunsmuir Street, Vancouver, BC V6B 1Y1 · <a href="https://alexic.ca">alexic.ca</a> · <a href="mailto:hello@alexic.ca">hello@alexic.ca</a></p>
      <p class="footer__links"><a href="contact.html">Contact</a> · <a href="about-aic.html">About</a> · <a href="privacy.html">Privacy Policy</a> · <a href="https://www.linkedin.com/company/alexinnovationc/" target="_blank" rel="noopener">LinkedIn</a></p>
    </div>
  </footer>`;

  var mount = document.getElementById("site-footer");
  if (mount) {
    var prefix = /\/events\//.test(location.pathname) ? "../" : "";
    mount.innerHTML = html.replace(/(href|src)="(?!https?:|mailto:|#)([^"]+)"/g, function (_, attr, value) { return attr + '="' + prefix + value + '"'; });
  }
})();
