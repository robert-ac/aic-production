/* Layout studies move approved content instead of repeating its facts. */
(function () {
  'use strict';
  var main = document.querySelector('.adoption-page main');
  if (!main) return;
  var requested = new URLSearchParams(location.search).get('design');
  var design = ['business', 'services', 'delivery'].indexOf(requested) >= 0 ? requested : 'business';
  document.body.dataset.design = design;
  var version = '<p class="design-model">Corporate AI Adoption · 2027 program model</p>';
  var hero = document.getElementById('top');
  if (design === 'services') {
    var engagements = document.getElementById('engagements');
    var articles = [].slice.call(engagements.querySelectorAll('.adoption-route'));
    hero.className = 'design-hero design-hero--services';
    hero.innerHTML = '<div class="design-inner">' + version + '<div class="design-service-intro"><h1>Where should your<br>AI journey start?</h1><p class="design-lead">Select a starting point for your organization.</p></div><div class="design-service-choice"><div class="design-tabs" role="tablist" aria-label="Explore engagement options"><button type="button" id="design-tab-readiness" role="tab" aria-selected="true" aria-controls="design-service-readiness" data-service="readiness">Readiness &amp; Adoption</button><button type="button" id="design-tab-implementation" role="tab" aria-selected="false" aria-controls="design-service-implementation" data-service="implementation" tabindex="-1">Implementation &amp; Delivery</button><button type="button" id="design-tab-training" role="tab" aria-selected="false" aria-controls="design-service-training" data-service="training" tabindex="-1">Training &amp; Upskilling</button></div><div class="design-service-panels"></div></div></div>';
    var keys = ['readiness', 'implementation', 'training'];
    var host = hero.querySelector('.design-service-panels');
    articles.forEach(function (article, index) {
      article.querySelector('h3').remove(); // The controlling tab already names this service.
      article.id = 'design-service-' + keys[index];
      article.setAttribute('role', 'tabpanel');
      article.setAttribute('aria-labelledby', 'design-tab-' + keys[index]);
      article.tabIndex = 0;
      article.hidden = index !== 0;
      host.appendChild(article);
    });
    engagements.remove();
    hero.querySelector('.design-service-choice').id = 'engagements';
    var tabs = [].slice.call(hero.querySelectorAll('[role=tab]'));
    function select(button, focus) {
      tabs.forEach(function (tab) {
        var selected = tab === button;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
      });
      if (focus) button.focus();
    }
    tabs.forEach(function (button, index) {
      button.addEventListener('click', function () { select(button, false); });
      button.addEventListener('keydown', function (event) {
        var next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
      });
    });
  } else if (design === 'delivery') {
    var delivery = document.getElementById('delivery');
    var template = document.getElementById('delivery-hero-template');
    hero.className = 'design-hero design-hero--delivery';
    hero.replaceChildren(template.content.cloneNode(true));
    delivery.classList.replace('arch-band--navy', 'arch-band--paper');
    delivery.tabIndex = -1;
    hero.after(delivery);
    // The delivery stages now precede the engagement options.
    main.querySelectorAll('#engagements a[href^="#delivery-"]').forEach(function (link) {
      link.remove();
    });
  }
  if (requested) {
    document.body.classList.add('has-design-preview');
    var preview = document.createElement('nav');
    preview.className = 'design-preview-switch';
    preview.setAttribute('aria-label', 'Design previews');
    preview.innerHTML = '<a class="design-preview-back" href="corporate-ai-adoption-designs.html">Compare</a>' + [['business', 'A · Business'], ['services', 'B · Services'], ['delivery', 'C · Delivery']].map(function (item) { return '<a href="?design=' + item[0] + '"' + (item[0] === design ? ' aria-current="page"' : '') + '>' + item[1] + '</a>'; }).join('');
    document.body.appendChild(preview);
  }
})();
