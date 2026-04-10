(function () {
  'use strict';

  var SKIP_KEY = 'ss_home_intro_seen';

  function initHomeCaseStudyReveals() {
    var root = document.getElementById('case-studies');
    if (!root || root.dataset.homeRevealInit === '1') return;
    root.dataset.homeRevealInit = '1';
    var els = root.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.07 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
    if (typeof io.takeRecords === 'function') {
      io.takeRecords().forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }
  }

  window.initHomeCaseStudyReveals = initHomeCaseStudyReveals;

  /* PJAX home: shell has no #animScreen (only #page-body swapped) — show main + init reveals */
  var hasAnimScreen = !!document.getElementById('animScreen');
  var hasHomeCaseStudies = !!document.getElementById('case-studies');
  if (!hasAnimScreen && hasHomeCaseStudies) {
    skipIntro();
    if (window.location.hash === '#case-studies') {
      setTimeout(function () {
        var block = document.getElementById('case-studies');
        if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
    return;
  }

  function skipIntro() {
    var overlay = document.getElementById('animScreen');
    var main = document.getElementById('mainPage');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (main) main.classList.add('show');
    initHomeCaseStudyReveals();
  }

  if (sessionStorage.getItem(SKIP_KEY) === '1') {
    skipIntro();
    if (window.location.hash === '#case-studies') {
      setTimeout(function () {
        var block = document.getElementById('case-studies');
        if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
    return;
  }
  /* Land on case studies from another page: skip intro, no typewriter */
  if (window.location.hash === '#case-studies' && document.getElementById('animScreen')) {
    try {
      sessionStorage.setItem(SKIP_KEY, '1');
    } catch (e) { /* ignore */ }
    skipIntro();
    setTimeout(function () {
      var block = document.getElementById('case-studies');
      if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return;
  }

  var NAME  = 'Shreya Shanmugam';
  var S_IDX = [0, 7];

  var nameEl   = document.getElementById('heroName');
  var cursorEl = document.getElementById('cursor');
  var sSpans   = [], allSpans = [], idx = 0;

  function markIntroComplete() {
    try {
      sessionStorage.setItem(SKIP_KEY, '1');
    } catch (e) { /* ignore */ }
  }

  function typeChar() {
    if (!nameEl || !cursorEl) {
      revealPage(null, null, null);
      return;
    }
    if (idx >= NAME.length) { setTimeout(beginFormation, 650); return; }
    var ch = NAME[idx], span = document.createElement('span');
    if (ch === ' ') {
      var br = document.createElement('br');
      nameEl.insertBefore(br, cursorEl);
      idx++;
      setTimeout(typeChar, 120);
      return;
    } else if (S_IDX.indexOf(idx) !== -1) {
      span.className = 'ch ch-s'; span.textContent = ch;
      sSpans.push(span);
    } else {
      span.className = 'ch'; span.textContent = ch;
    }
    nameEl.insertBefore(span, cursorEl);
    allSpans.push(span);
    idx++;
    setTimeout(typeChar, ch === ' ' ? 160 : 46 + Math.random() * 70);
  }

  function beginFormation() {
    if (!cursorEl) {
      revealPage(null, null, null);
      return;
    }
    cursorEl.classList.add('off');
    var s1 = sSpans[0], s2 = sSpans[1];
    if (!s1 || !s2) { revealPage(null, null, null); return; }

    var r1 = s1.getBoundingClientRect(), r2 = s2.getBoundingClientRect();
    var fs = parseFloat(window.getComputedStyle(s1).fontSize);
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    var darkIntro = document.documentElement.classList.contains('theme-dark');
    var circleBg = darkIntro ? '#141c24' : '#ecf6fa';
    var flyStart = darkIntro ? '#b8dff5' : '#00354c';
    var fly2End = darkIntro ? '#e8f4fa' : '#00354c';

    allSpans.forEach(function (sp) {
      if (!sp.classList.contains('ch-s')) {
        sp.style.transition = 'opacity 0.42s ease';
        sp.style.opacity = '0';
      }
    });
    s1.style.transition = s2.style.transition = 'opacity 0.12s';
    s1.style.opacity = s2.style.opacity = '0';

    var cd = fs * 1.5, circle = document.createElement('div');
    circle.style.cssText = [
      'position:fixed','z-index:600','pointer-events:none',
      'border-radius:50%','background:'+circleBg,
      'left:'+cx+'px','top:'+cy+'px',
      'width:0','height:0','opacity:0',
      'transform:translate(-50%,-50%)',
      'transition:'+[
        'width .65s cubic-bezier(.34,1.08,.64,1) .25s',
        'height .65s cubic-bezier(.34,1.08,.64,1) .25s',
        'opacity .4s ease .25s'
      ].join(',')
    ].join(';');
    document.body.appendChild(circle);

    var TR = 'left .8s cubic-bezier(.4,0,.2,1),top .8s cubic-bezier(.4,0,.2,1),color .55s ease .2s,transform .8s cubic-bezier(.4,0,.2,1)';
    function makeFlyer(rect) {
      var el = document.createElement('span');
      el.textContent = 'S';
      el.style.cssText = [
        'position:fixed','z-index:700','pointer-events:none',
        "font-family:'Playfair Display',Georgia,serif",
        'font-weight:500','font-style:normal',
        'font-size:'+fs+'px','line-height:1','color:'+flyStart,
        'left:'+(rect.left+rect.width/2)+'px',
        'top:'+(rect.top+rect.height/2)+'px',
        'transform:translate(-50%,-50%)',
        'will-change:left,top,color,transform',
        'transition:'+TR
      ].join(';');
      document.body.appendChild(el);
      return el;
    }

    var fly1 = makeFlyer(r1), fly2 = makeFlyer(r2);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fly1.style.left = cx+'px'; fly1.style.top = cy+'px';
        fly1.style.color = '#7fd0f3';
        fly1.style.transform = 'translate(-50%,-50%) rotate(90deg)';
        fly2.style.left = cx+'px'; fly2.style.top = cy+'px';
        fly2.style.color = fly2End;
        setTimeout(function () {
          circle.style.width = cd+'px'; circle.style.height = cd+'px';
          circle.style.opacity = '1';
        }, 250);
      });
    });

    setTimeout(function () { revealPage(fly1, fly2, circle, fs); }, 1000);
  }

  function revealPage(fly1, fly2, circle, flyFs) {
    var overlay = document.getElementById('animScreen');
    if (overlay) overlay.classList.add('out');
    var mainPage = document.getElementById('mainPage');
    if (mainPage) mainPage.classList.add('show');
    markIntroComplete();
    initHomeCaseStudyReveals();

    if (fly1) {
      circle.style.transition = 'opacity 0.4s ease';
      circle.style.opacity = '0';

      requestAnimationFrame(function () {
        var logoEl = document.querySelector('.ss-logo');
        var lr = logoEl ? logoEl.getBoundingClientRect() : null;

        if (lr && flyFs) {
          var logoCx = lr.left + lr.width / 2;
          var logoCy = lr.top + lr.height / 2;
          var scale = 64.71 / flyFs;
          var TR = 'left 0.8s cubic-bezier(.4,0,.2,1), top 0.8s cubic-bezier(.4,0,.2,1),' +
                   'transform 0.8s cubic-bezier(.4,0,.2,1), opacity 0.45s ease 0.4s';

          fly1.style.transition = TR;
          fly1.style.left = logoCx + 'px';
          fly1.style.top  = logoCy + 'px';
          fly1.style.transform = 'translate(-50%,-50%) rotate(90deg) scale(' + scale + ')';
          fly1.style.opacity = '0';

          fly2.style.transition = TR;
          fly2.style.left = logoCx + 'px';
          fly2.style.top  = logoCy + 'px';
          fly2.style.transform = 'translate(-50%,-50%) scale(' + scale + ')';
          fly2.style.opacity = '0';
        } else {
          [fly1, fly2].forEach(function (el) {
            el.style.transition = 'opacity 0.55s ease';
            el.style.opacity = '0';
          });
        }

        setTimeout(function () {
          [fly1, fly2, circle].forEach(function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); });
          if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 1100);
      });
    } else {
      setTimeout(function () {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 720);
    }
  }

  if (hasAnimScreen) {
    setTimeout(typeChar, 450);
  }
}());
