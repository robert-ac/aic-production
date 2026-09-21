/* Shared nav for every page: renders one identical, page-based mega-menu into
   each .mm, injects the mobile hamburger, and drives the desktop dropdowns from
   a single per-bar hover-intent controller so a panel stays open for as long as
   the pointer is anywhere over its item, gap or panel, and closes on a short
   delay once the pointer has left all three.
   Dropdowns list page titles only (no descriptions). Logo = Home. */
(function () {
  var menu = [
    { label: "Founders Lab", href: "founders-lab.html", links: [
      ["Founder Pathway", "founders-lab.html#funnel"],
      ["Founder Community", "founders-lab.html#community"],
      ["Mentors & EIRs", "founders-lab.html#mentors"],
      ["Innovation Nights", "innovation-night.html"]
    ]},
    { label: "AI Adoption", href: "learn.html", links: [
      ["Learning Pathways", "learn.html#pathways"],
      ["Corporate AI Training", "ai-workforce-sme-adoption.html"],
      ["Workforce Upskilling", "for-smes.html"],
      ["AI Readiness Review", "ai-readiness.html"],
      ["Funding & Grants", "funding.html"]
    ]},
    { label: "Applied Research", href: "lab.html", links: [
      ["Research & Innovation", "applied-research.html"],
      ["AI Pilots & Validation", "lab.html#research"],
      ["AI Infrastructure", "lab.html#infrastructure"],
      ["Compute Lab", "data-centre.html"],
      ["ALEBEX AI", "alebex-ai.html"]
    ]},
    { label: "Accelerator", href: "accelerator.html", links: [
      ["Venture Stages", "accelerator.html#stages"],
      ["Featured Ventures", "accelerator.html#ventures"],
      ["ALEBEX AI", "alebex-ai.html"]
    ]},
    { label: "About", href: "about-aic.html", links: [
      ["How AIC Works", "index.html#how"],
      ["Canada's AI Strategy", "canada-ai-strategy.html"],
      ["News & Insights", "news.html"],
      ["FAQ", "faq.html"],
      ["Contact", "contact.html"]
    ]}
  ];
  var PRE = /\/events\//.test(location.pathname) ? '../' : '';
  var current = location.pathname.split('/').pop() || 'index.html';
  function url(h) { return PRE + h; }
  function init() {
    var main = document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'main';
      main.tabIndex = -1;
      var skip = document.createElement('a');
      skip.className = 'skip-link'; skip.href = '#' + main.id; skip.textContent = 'Skip to content';
      document.body.prepend(skip);
    }
    document.querySelectorAll('header.pnav').forEach(function(h) {
      if (!h.children.length) h.innerHTML = '<a class="pnav__brand" href="'+url('index.html')+'" aria-label="Alexander Innovation Centre home"><img src="'+url('assets/img/aic-logo-wide-white-font.svg')+'" alt="Alexander Innovation Centre" width="2663" height="428"></a><nav class="pnav__tabs" aria-label="Primary"><div class="mm"></div></nav><a class="btn btn--solid" href="'+url('founders-lab.html')+'#join">Join AIC</a>';
    });
    /* Exactly one top-level item may read as "you are here".
       - A group whose own href is this page wins outright.
       - Otherwise the FIRST group that lists this page claims it, so a page
         cross-listed under two groups (ALEBEX AI sits under both Applied
         Research and Accelerator) no longer lights up twice.
       - Home is nobody's section: several groups link to index.html#anchor,
         which previously made "About" the current item on the front page. */
    var activeIndex = -1;
    for (var gi = 0; gi < menu.length; gi++) {
      if (menu[gi].href === current) { activeIndex = gi; break; }
    }
    if (activeIndex < 0 && current !== 'index.html') {
      for (var gj = 0; gj < menu.length; gj++) {
        if (menu[gj].links.some(function (l) { return l[1].split('#')[0] === current; })) { activeIndex = gj; break; }
      }
    }
    document.querySelectorAll('.mm').forEach(function(wrap,menuIndex) {
      wrap.innerHTML = menu.map(function(group,i) {
        var active=i===activeIndex;
        var id='aic-menu-'+menuIndex+'-'+i;
        return '<div class="mm__item"><a class="mm__top'+(active?' is-active':'')+'" href="'+url(group.href)+'"'+(group.href===current?' aria-current="page"':'')+'>'+group.label+'</a><button class="mm-toggle" type="button" aria-label="'+group.label+' sections" aria-expanded="false" aria-controls="'+id+'"><span aria-hidden="true"></span></button><div class="mm__panel" id="'+id+'">'+group.links.map(function(l){return '<a href="'+url(l[1])+'">'+l[0].replace(/&/g,'&amp;')+'</a>';}).join('')+'</div></div>';
      }).join('');
    });
    /* ---------------------------------------------------------------------
       Desktop dropdowns. One controller per menu bar, holding ONE shared
       close timer and one openItem. Previously each item kept its own timer
       and the timeout called closeMenus() with no argument, so the pending
       close left behind by the item you just left shut the panel you had
       already moved onto - and because the pointer never re-entered, no
       further pointerenter fired and the panel stayed shut.

       The panel is a DOM child of .mm__item and its ::before bridges the
       8px gap beneath the link, so delegated pointerover/pointerout on the
       bar treat link + gap + panel as a single hover region.
       --------------------------------------------------------------------- */
    var CLOSE_DELAY = 220;
    var DESKTOP = '(min-width:1101px)';
    var bars = [];
    function desktop() { return window.matchMedia(DESKTOP).matches; }
    function itemOf(node) { return node && node.closest ? node.closest('.mm__item') : null; }
    function closeMenus() { bars.forEach(function (bar) { bar.closeAll(); }); }

    function createBar(bar) {
      var items = [].slice.call(bar.querySelectorAll('.mm__item'));
      var openItem = null;   // panel currently open
      var hoverItem = null;  // item the pointer is physically inside
      var escaped = null;    // dismissed with Escape; stays shut until the pointer leaves
      var timer = null;

      function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
      function owns(item) { return item && items.indexOf(item) >= 0; }

      function mark(item, open) {
        item.classList.toggle('is-open', open);
        var toggle = item.querySelector('.mm-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', String(open));
        var link = item.querySelector('.mm__top');
        if (link && link.hasAttribute('aria-expanded')) link.setAttribute('aria-expanded', String(open));
      }

      function open(item) {
        cancel();
        if (openItem && openItem !== item) mark(openItem, false);
        openItem = item;
        mark(item, true);
      }

      function closeAll() {
        cancel();
        items.forEach(function (item) { if (item.classList.contains('is-open')) mark(item, false); });
        openItem = null;
      }

      function scheduleClose() {
        cancel();
        timer = setTimeout(function () {
          timer = null;
          if (hoverItem) return;                                             // pointer came back
          if (openItem && openItem.contains(document.activeElement)) return; // keyboard is inside
          closeAll();
        }, CLOSE_DELAY);
      }

      /* On desktop the .mm-toggle button is display:none, so its aria-expanded
         reaches nobody. Mirror the state onto the link that actually opens the
         panel there, and drop it again on mobile where the button is in charge. */
      function syncAria() {
        items.forEach(function (item) {
          var link = item.querySelector('.mm__top');
          var panel = item.querySelector('.mm__panel');
          if (!link || !panel) return;
          if (desktop()) {
            link.setAttribute('aria-controls', panel.id);
            link.setAttribute('aria-expanded', String(item.classList.contains('is-open')));
          } else {
            link.removeAttribute('aria-controls');
            link.removeAttribute('aria-expanded');
          }
        });
      }

      bar.addEventListener('pointerover', function (e) {
        if (!desktop() || e.pointerType === 'touch') return;
        var item = itemOf(e.target);
        if (!owns(item)) return;
        hoverItem = item;
        if (escaped === item) return;
        open(item);
      });

      bar.addEventListener('pointerout', function (e) {
        if (!desktop() || e.pointerType === 'touch') return;
        var from = itemOf(e.target);
        var to = itemOf(e.relatedTarget);
        if (!from || from === to) return;          // moved within the same item
        hoverItem = owns(to) ? to : null;
        if (escaped && escaped !== to) escaped = null;
        scheduleClose();                           // a pointerover on `to` cancels this
      });

      /* Self-heal: if anything closed the panel while the pointer never left the
         item, no pointerenter will fire again. Reopen on the next move so a
         resting cursor can never end up staring at a collapsed menu. */
      bar.addEventListener('pointermove', function (e) {
        if (!desktop() || e.pointerType === 'touch') return;
        var item = itemOf(e.target);
        if (!owns(item)) return;
        hoverItem = item;
        if (escaped === item) return;
        if (!item.classList.contains('is-open')) open(item);
      });

      items.forEach(function (item) {
        var toggle = item.querySelector('.mm-toggle');
        var link = item.querySelector('.mm__top');
        var panel = item.querySelector('.mm__panel');

        link.addEventListener('focus', function () {
          if (desktop() && escaped !== item) open(item);
        });

        link.addEventListener('keydown', function (e) {
          if (!desktop() || e.key !== 'ArrowDown') return;
          e.preventDefault();
          escaped = null;
          open(item);
          var first = panel && panel.querySelector('a');
          if (first) first.focus();
        });

        link.addEventListener('click', function (e) {
          if (desktop() && window.matchMedia('(hover:none)').matches && !item.classList.contains('is-open')) {
            e.preventDefault();
            open(item);
          }
        });

        toggle.addEventListener('click', function () {
          if (item.classList.contains('is-open')) {
            cancel();
            mark(item, false);
            if (openItem === item) openItem = null;
          } else {
            open(item);
          }
        });

        item.addEventListener('keydown', function (e) {
          if (e.key !== 'Escape') return;
          /* Only swallow Escape when there is actually a panel to dismiss.
             This used to stopPropagation() unconditionally, so on mobile -
             where focus rests on the .mm-toggle button after a tap - Escape
             died here and never reached the handler that closes the drawer. */
          if (!items.some(function (it) { return it.classList.contains('is-open'); })) return;
          cancel();
          escaped = item;                       // checked by the focus handler above
          (desktop() ? link : toggle).focus();
          closeAll();
          e.stopPropagation();
        });

        item.addEventListener('focusout', function (e) {
          if (item.contains(e.relatedTarget)) return;
          if (escaped === item) escaped = null;
          if (hoverItem === item) return;       // mouse is still on it - leave it open
          if (item === openItem) scheduleClose(); else mark(item, false);
        });
      });

      syncAria();
      window.matchMedia(DESKTOP).addEventListener('change', function () {
        closeAll();
        hoverItem = null;
        escaped = null;
        syncAria();
      });

      return { closeAll: closeAll };
    }

    document.querySelectorAll('.mm').forEach(function (bar) { bars.push(createBar(bar)); });
    // Older saved stage links now lead to the illustrated pathway.
    var legacyTargets={
      'founders-lab.html':{membership:'funnel',acceleration:'funnel',growth:'funnel'},
      'learn.html':{executive:'pathways',corporate:'pathways',upskilling:'pathways',developer:'pathways'},
      'accelerator.html':{ideation:'stages',early:'stages',investor:'stages',growth:'stages'}
    };
    function resolveLegacyAnchor(){
      var target=(legacyTargets[current]||{})[location.hash.slice(1)];
      if(target){history.replaceState(null,'','#'+target);document.getElementById(target).scrollIntoView({block:'start'});}
    }
    resolveLegacyAnchor();
    window.addEventListener('hashchange',resolveLegacyAnchor);
    document.querySelectorAll('header.nav,header.pnav').forEach(function(header,index){
      var links=header.querySelector('.nav__links,.pnav__tabs'); if(!links)return;
      links.id='aic-primary-'+index;
      var toggle=document.createElement('button');toggle.className='navmenu-toggle';toggle.type='button';toggle.setAttribute('aria-label','Open navigation');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',links.id);toggle.innerHTML='<span></span><span></span><span></span>';header.appendChild(toggle);
      function setOpen(open,focus){header.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(!open)closeMenus();if(focus)toggle.focus();}
      toggle.addEventListener('click',function(){setOpen(!header.classList.contains('is-open'));});
      /* Escape must work wherever focus is. Tapping the hamburger leaves focus
         on the button on some browsers and on <body> on others, so a keydown
         bound to the header alone missed the drawer that was actually open. */
      document.addEventListener('keydown',function(e){
        if(e.key!=='Escape'||!header.classList.contains('is-open'))return;
        setOpen(false,header.contains(document.activeElement));
      });
      links.addEventListener('click',function(e){if(e.target.closest('a'))setOpen(false);});
      header.addEventListener('focusout',function(e){if(!header.contains(e.relatedTarget))setOpen(false);});
      document.addEventListener('pointerdown',function(e){if(!header.contains(e.target))setOpen(false);});
      window.matchMedia('(min-width:1101px)').addEventListener('change',function(){setOpen(false);});
    });
    // Content stays visible by default. Native details preserve keyboard behaviour.
    document.querySelectorAll('.faq__q').forEach(function(button){
      button.addEventListener('click',function(){var item=button.closest('.faq__item');if(!item)return;var open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));item.classList.toggle('is-open',open);var answer=item.querySelector('.faq__a');if(answer)answer.hidden=!open;});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
