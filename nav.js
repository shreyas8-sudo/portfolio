(function () {
  'use strict';

  var THEME_KEY = 'ss-theme';
  var THEME_CSS = 'case-study-themes.css';
  var DARK_CSS = 'dark-mode.css';

  function applyStoredTheme() {
    try {
      document.documentElement.classList.toggle(
        'theme-dark',
        localStorage.getItem(THEME_KEY) === 'dark'
      );
    } catch (e) {
      /* ignore */
    }
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function toggleTheme() {
    var root = document.documentElement;
    var next = !root.classList.contains('theme-dark');

    function apply() {
      root.classList.toggle('theme-dark', next);
      try {
        localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      } catch (e) {
        /* ignore */
      }
    }

    if (prefersReducedMotion()) {
      apply();
      return;
    }

    root.classList.add('theme-is-changing');
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        apply();
        window.setTimeout(function () {
          root.classList.remove('theme-is-changing');
        }, 480);
      });
    });
  }

  function ensureDarkModeCss() {
    if (document.querySelector('link[href*="dark-mode"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = DARK_CSS;
    document.head.appendChild(link);
  }

  function setLogoThemeHint() {
    document.querySelectorAll('.case-home-logo').forEach(function (a) {
      a.setAttribute('aria-label', 'Toggle light or dark theme');
      a.setAttribute('title', 'Toggle theme');
    });
  }

  function ensureThemeCss() {
    if (document.querySelector('link[href*="case-study-themes"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = THEME_CSS;
    document.head.appendChild(link);
  }

  function ensureScriptLoaded(src, done) {
    if (document.querySelector('script[src="' + src + '"]')) {
      if (typeof done === 'function') done();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () {
      if (typeof done === 'function') done();
    };
    s.onerror = function () {
      if (typeof done === 'function') done();
    };
    document.body.appendChild(s);
  }

  function getPill() {
    return document.querySelector('header.case-header nav.pill');
  }

  function ensureNavIndicator() {
    var pill = getPill();
    if (!pill || pill.querySelector('.nav-pill-indicator')) return;
    var ind = document.createElement('span');
    ind.className = 'nav-pill-indicator';
    ind.setAttribute('aria-hidden', 'true');
    pill.insertBefore(ind, pill.firstChild);
  }

  function positionNavIndicator() {
    var pill = getPill();
    var ind = pill && pill.querySelector('.nav-pill-indicator');
    var active = pill && pill.querySelector('.nav-item.active');
    if (!pill || !ind) return;
    if (!active) {
      ind.style.opacity = '0';
      return;
    }
    ind.style.left = active.offsetLeft + 'px';
    ind.style.top = active.offsetTop + 'px';
    ind.style.width = active.offsetWidth + 'px';
    ind.style.height = active.offsetHeight + 'px';
    ind.style.opacity = '1';
  }

  function syncNavFromFetchedDoc(doc) {
    navActiveBeforeContact = null;
    var active = doc.querySelector('header.case-header nav.pill .nav-item.active');
    var href = active && active.getAttribute('href');
    document.querySelectorAll('header.case-header nav.pill .nav-item').forEach(function (a) {
      a.classList.toggle('active', !!(href && a.getAttribute('href') === href));
    });
    positionNavIndicator();
  }

  /** In-page Contact highlight: remember HOME / ABOUT / etc. to restore when footer leaves view. */
  var navActiveBeforeContact = null;
  var footerNavObserver = null;

  function setContactNavActive() {
    var pre = document.querySelector('header.case-header nav.pill .nav-item.active');
    var ph = pre && pre.getAttribute('href');
    if (ph && ph !== '#site-footer') navActiveBeforeContact = ph;
    document.querySelectorAll('header.case-header nav.pill .nav-item').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#site-footer');
    });
    positionNavIndicator();
  }

  function restoreNavAfterContact() {
    var pill = getPill();
    if (!pill) return;
    var target = navActiveBeforeContact;
    pill.querySelectorAll('.nav-item').forEach(function (a) {
      a.classList.toggle('active', !!(target && a.getAttribute('href') === target));
    });
    positionNavIndicator();
  }

  function syncNavActiveToDocumentRoute() {
    var pill = getPill();
    if (!pill) return;
    var curPath = window.location.pathname.split('/').pop() || 'index.html';
    if (curPath === '') curPath = 'index.html';
    var matched = false;
    pill.querySelectorAll('.nav-item').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || h.indexOf('#') === 0 || h.indexOf('mailto:') === 0 || h.indexOf('http') === 0) {
        a.classList.remove('active');
        return;
      }
      try {
        var resolved = new URL(h, window.location.href);
        if (resolved.origin !== window.location.origin) {
          a.classList.remove('active');
          return;
        }
        var itemPath = resolved.pathname.split('/').pop() || 'index.html';
        if (itemPath === '') itemPath = 'index.html';
        var isMatch = itemPath === curPath;
        a.classList.toggle('active', isMatch);
        if (isMatch) matched = true;
      } catch (e) {
        a.classList.remove('active');
      }
    });
    if (!matched) {
      pill.querySelectorAll('.nav-item').forEach(function (a) {
        a.classList.remove('active');
      });
    }
    positionNavIndicator();
  }

  function restoreNavAfterFooterScrollAway() {
    if (navActiveBeforeContact) restoreNavAfterContact();
    else syncNavActiveToDocumentRoute();
  }

  function initFooterNavRestore() {
    if (footerNavObserver) {
      footerNavObserver.disconnect();
      footerNavObserver = null;
    }
    var ft = document.getElementById('site-footer');
    if (!ft) return;
    var contactPinned = false;
    footerNavObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var showContact = entry.isIntersecting && entry.intersectionRatio >= 0.2;
          if (showContact && !contactPinned) {
            contactPinned = true;
            setContactNavActive();
          } else if (!showContact && contactPinned) {
            contactPinned = false;
            restoreNavAfterFooterScrollAway();
          }
        });
      },
      { threshold: [0, 0.15, 0.2, 0.35] }
    );
    footerNavObserver.observe(ft);
  }

  function applyBodyFromDoc(doc) {
    var wasAbout = document.body.classList.contains('page-about');
    document.body.className = doc.body.className;
    if (wasAbout && !document.body.classList.contains('page-about')) {
      if (typeof window.teardownAboutPage === 'function') {
        window.teardownAboutPage();
      }
    }
    if (!document.body.classList.contains('page-playground')) {
      if (typeof window.teardownPlaygroundPage === 'function') {
        window.teardownPlaygroundPage();
      }
    }
  }

  function ensureMainPageVisibleForRoute(pathname) {
    var main = document.getElementById('mainPage');
    if (!main) return;
    var file = (pathname || '').split('/').pop() || '';
    if (file === '' || file === 'index.html') {
      main.classList.add('show');
    }
  }

  function runPageInits(doc) {
    if (doc.body.classList.contains('page-about')) {
      if (typeof window.initAboutPage === 'function') {
        window.initAboutPage();
      } else {
        ensureScriptLoaded('about.js', function () {
          if (typeof window.initAboutPage === 'function') window.initAboutPage();
        });
      }
    }
    if (doc.body.classList.contains('page-case-study')) {
      if (typeof window.initCaseStudyPage === 'function') {
        window.initCaseStudyPage();
      } else {
        ensureScriptLoaded('case-study.js', function () {
          if (typeof window.initCaseStudyPage === 'function') window.initCaseStudyPage();
        });
      }
    }
    if (doc.body.classList.contains('page-playground')) {
      var pgMain = document.querySelector('.pg-main');
      if (pgMain) delete pgMain.dataset.pgRevealInit;
      function runPlaygroundPageInit() {
        if (typeof window.initPlaygroundPage === 'function') {
          window.initPlaygroundPage();
        } else {
          ensureScriptLoaded('playground.js', function () {
            if (typeof window.initPlaygroundPage === 'function') window.initPlaygroundPage();
          });
        }
      }
      if (typeof window.initMoreCaseStudyTiles === 'function') {
        runPlaygroundPageInit();
      } else {
        ensureScriptLoaded('case-study.js', runPlaygroundPageInit);
      }
    }
    if (doc.getElementById('case-studies')) {
      function runHomeCaseStudyReveals() {
        var homeRoot = document.getElementById('case-studies');
        if (homeRoot) delete homeRoot.dataset.homeRevealInit;
        if (typeof window.initHomeCaseStudyReveals === 'function') {
          window.initHomeCaseStudyReveals();
        }
      }
      if (typeof window.initHomeCaseStudyReveals === 'function') {
        runHomeCaseStudyReveals();
      } else {
        ensureScriptLoaded('main.js', runHomeCaseStudyReveals);
      }
    }
  }

  function fetchPathForLink(absoluteUrl) {
    var u = new URL(absoluteUrl, window.location.href);
    if (u.origin !== window.location.origin) return null;
    var path = u.pathname.split('/').pop() || 'index.html';
    if (path === '') path = 'index.html';
    return path + (u.search || '');
  }

  function loadPage(url, pushState) {
    if (pushState === undefined) pushState = true;
    var absolute = new URL(url, window.location.href).href;
    var fetchUrl = absolute.split('#')[0];

    fetch(fetchUrl, { credentials: 'same-origin', headers: { Accept: 'text/html' } })
      .then(function (r) {
        if (!r.ok) throw new Error('fetch failed');
        return r.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var nextBody = doc.getElementById('page-body');
        if (!nextBody) {
          window.location.href = absolute;
          return;
        }

        ensureThemeCss();
        document.title = doc.title || document.title;
        applyBodyFromDoc(doc);

        var shell = document.getElementById('page-body');
        if (!shell) {
          window.location.href = absolute;
          return;
        }

        shell.classList.add('is-pjax-swapping');
        window.requestAnimationFrame(function () {
          shell.innerHTML = nextBody.innerHTML;
          shell.classList.remove('is-pjax-swapping');
          syncNavFromFetchedDoc(doc);
          ensureMainPageVisibleForRoute(new URL(absolute).pathname);
          runPageInits(doc);
          initFooterNavRestore();
          window.scrollTo(0, 0);
          if (pushState) {
            try {
              history.pushState({ url: absolute }, '', absolute);
            } catch (e) {
              /* ignore */
            }
          }
        });
      })
      .catch(function () {
        window.location.href = absolute;
      });
  }

  function onNavClick(e) {
    var a = e.target && e.target.closest && e.target.closest('a');
    if (!a) return;
    if (a.getAttribute('target') === '_blank') return;
    if (a.getAttribute('download')) return;

    var inHeader =
      a.closest('header.case-header') &&
      (a.classList.contains('nav-item') || a.classList.contains('case-home-logo'));
    if (!inHeader) return;

    if (a.classList.contains('case-home-logo')) {
      e.preventDefault();
      toggleTheme();
      return;
    }

    var href = a.getAttribute('href');
    if (!href) return;

    if (href.indexOf('mailto:') === 0) return;

    if (href === '#site-footer') {
      e.preventDefault();
      var ft = document.getElementById('site-footer');
      if (ft) ft.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setContactNavActive();
      try {
        history.pushState({ url: window.location.pathname + '#site-footer' }, '', window.location.pathname + '#site-footer');
      } catch (err) {
        /* ignore */
      }
      return;
    }

    var resolved = new URL(href, window.location.href);
    if (resolved.origin !== window.location.origin) return;

    var path = resolved.pathname.split('/').pop() || 'index.html';
    if (path === '') path = 'index.html';

    var currentFile = window.location.pathname.split('/').pop() || 'index.html';
    if (currentFile === path && !resolved.search && !resolved.hash) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    e.preventDefault();
    loadPage(resolved.href, true);
  }

  function onPopState(e) {
    var url = (e.state && e.state.url) || window.location.href;
    if (url.indexOf('#site-footer') !== -1) {
      var ft = document.getElementById('site-footer');
      if (ft) ft.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setContactNavActive();
      return;
    }
    loadPage(url, false);
  }

  function initHistory() {
    try {
      history.replaceState({ url: window.location.href }, '', window.location.href);
    } catch (e) {
      /* ignore */
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    ensureDarkModeCss();
    applyStoredTheme();
    setLogoThemeHint();
    ensureThemeCss();
    ensureNavIndicator();
    positionNavIndicator();
    initHistory();
    initFooterNavRestore();
    window.addEventListener('resize', function () {
      positionNavIndicator();
    });
    document.addEventListener('click', onNavClick, true);
    window.addEventListener('popstate', onPopState);
  });
}());
