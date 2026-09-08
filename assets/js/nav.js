/* Shared nav for every page: renders one identical, page-based mega-menu into
   each .mm, injects the mobile hamburger, and drives the desktop dropdowns with
   a hover-intent delay so a panel stays reachable while you move to it.
   Dropdowns list page titles only (no descriptions). Logo = Home. */
(function () {
  var menu = [
    { label: "Founders Lab", href: "founders-lab.html", links: [
      ["Overview", "founders-lab.html"],
      ["Membership", "founders-lab.html#membership"],
      ["Founder Community", "founders-lab.html#community"],
      ["Accelerator", "accelerator.html"],
      ["Mentors & EIRs", "founders-lab.html#mentors"],
      ["Innovation Nights", "innovation-night.html"]
    ]},
    { label: "Learn", href: "learn.html", links: [
      ["Overview", "learn.html"],
      ["Executive AI", "learn.html#executive"],
      ["Corporate AI Training", "ai-workforce-sme-adoption.html"],
      ["Workforce Upskilling", "for-smes.html"],
      ["Developer → AI Engineer", "learn.html#developer"],
      ["AI Readiness Review", "ai-readiness.html"],
      ["Funding & Grants", "funding.html"]
    ]},
    { label: "Lab", href: "lab.html", links: [
      ["Overview", "lab.html"],
      ["Applied Research", "applied-research.html"],
      ["AI Pilots & Validation", "lab.html#pilots"],
      ["AI Infrastructure", "lab.html#infrastructure"],
      ["Compute Lab", "data-centre.html"],
      ["ALEBEX AI", "alebex-ai.html"]
    ]},
    { label: "Accelerator", href: "accelerator.html", links: [
      ["Overview", "accelerator.html"],
      ["Ideation", "accelerator.html#ideation"],
      ["Early Startup", "accelerator.html#early"],
      ["Investor Readiness", "accelerator.html#investor"],
      ["Growth & U.S. Capital Access", "accelerator.html#growth"],
      ["Featured Ventures", "accelerator.html#ventures"]
    ]},
    { label: "About", href: "about-aic.html", links: [
      ["About AIC", "about-aic.html"],
      ["How AIC Works", "five-pillars.html"],
      ["Innovation Nights", "innovation-night.html"],
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
    document.querySelectorAll('.mm').forEach(function(wrap,menuIndex) {
      wrap.innerHTML = menu.map(function(group,i) {
        var active=group.href===current;
        if(!menu.some(function(g){return g.href===current;})) active=group.links.some(function(l){return l[1].split('#')[0]===current;});
        var id='aic-menu-'+menuIndex+'-'+i;
        return '<div class="mm__item"><a class="mm__top'+(active?' is-active':'')+'" href="'+url(group.href)+'"'+(group.href===current?' aria-current="page"':'')+'>'+group.label+'</a><button class="mm-toggle" type="button" aria-label="'+group.label+' sections" aria-expanded="false" aria-controls="'+id+'"><span aria-hidden="true">⌄</span></button><div class="mm__panel" id="'+id+'">'+group.links.map(function(l){return '<a href="'+url(l[1])+'">'+l[0].replace(/&/g,'&amp;')+'</a>';}).join('')+'</div></div>';
      }).join('');
    });
    function closeMenus(except) {
      document.querySelectorAll('.mm__item.is-open').forEach(function(item){if(item!==except){item.classList.remove('is-open');item.querySelector('.mm-toggle').setAttribute('aria-expanded','false');}});
    }
    document.querySelectorAll('.mm__item').forEach(function(item){
      var toggle=item.querySelector('.mm-toggle');
      toggle.addEventListener('click',function(){var open=!item.classList.contains('is-open');closeMenus(item);item.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));});
      item.addEventListener('keydown',function(e){if(e.key==='Escape'){closeMenus();toggle.focus();e.stopPropagation();}});
      item.addEventListener('focusout',function(e){if(!item.contains(e.relatedTarget)){item.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');}});
    });
    document.querySelectorAll('header.nav,header.pnav').forEach(function(header,index){
      var links=header.querySelector('.nav__links,.pnav__tabs'); if(!links)return;
      links.id='aic-primary-'+index;
      var toggle=document.createElement('button');toggle.className='navmenu-toggle';toggle.type='button';toggle.setAttribute('aria-label','Open navigation');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',links.id);toggle.innerHTML='<span></span><span></span><span></span>';header.appendChild(toggle);
      function setOpen(open,focus){header.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(!open)closeMenus();if(focus)toggle.focus();}
      toggle.addEventListener('click',function(){setOpen(!header.classList.contains('is-open'));});
      header.addEventListener('keydown',function(e){if(e.key==='Escape'){setOpen(false,true);}});
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
