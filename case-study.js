(function () {
  'use strict';

  var subnavScrollHandler = null;
  var ACC_CLOSE_MS = 620;

  /** Two-tap tooltips for “See more cases” — align with styles.css @media (max-width: 700px) */
  function mqMoreCasesTouchMode() {
    if (!window.matchMedia) return false;
    if (window.matchMedia('(max-width: 700px)').matches) return true;
    if (
      window.matchMedia('(pointer: coarse)').matches &&
      window.matchMedia('(max-width: 900px)').matches
    ) {
      return true;
    }
    return false;
  }

  function initReveal() {
    var els = document.querySelectorAll('.page-case-study [data-reveal]');
    if (!els.length) return;
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
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  function initSubnavHighlight() {
    var nav = document.querySelector('.case-subnav-inner');
    if (!nav) return;
    if (subnavScrollHandler) {
      window.removeEventListener('scroll', subnavScrollHandler);
      subnavScrollHandler = null;
    }
    var links = nav.querySelectorAll('a[href^="#"]');
    var ids = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id) ids.push(id);
    });
    var lastCurrent = '';

    function scrollActiveLinkIntoView(link, behavior) {
      if (!link) return;
      if (nav.scrollWidth <= nav.clientWidth) return;
      try {
        link.scrollIntoView({
          block: 'nearest',
          inline: 'center',
          behavior: behavior || 'auto',
        });
        return;
      } catch (err) {
        /* fallback below */
      }
      var navRect = nav.getBoundingClientRect();
      var linkRect = link.getBoundingClientRect();
      var isOffLeft = linkRect.left < navRect.left;
      var isOffRight = linkRect.right > navRect.right;
      if (!isOffLeft && !isOffRight) return;
      var targetLeft = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
      var clamped = Math.max(0, targetLeft);
      if (typeof nav.scrollTo === 'function') {
        nav.scrollTo({ left: clamped, behavior: behavior || 'auto' });
      } else {
        nav.scrollLeft = clamped;
      }
    }

    function update() {
      var scrollY = window.scrollY || window.pageYOffset;
      var y = scrollY + 110;
      var current = '';
      if (scrollY < 140 && ids.length) {
        current = ids[0];
      } else {
        ids.forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) return;
          var docTop = el.getBoundingClientRect().top + window.scrollY;
          if (docTop <= y) current = id;
        });
      }
      links.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        a.classList.toggle('is-current', id === current);
      });
      if (current && current !== lastCurrent) {
        var active = nav.querySelector('a[href="#' + current + '"]');
        scrollActiveLinkIntoView(active, 'smooth');
        lastCurrent = current;
      }
    }

    subnavScrollHandler = update;
    window.addEventListener('scroll', subnavScrollHandler, { passive: true });
    update();
  }

  /**
   * Native <details> removes [open] before paint, so CSS cannot animate close.
   * On summary click while open: prevent toggle, animate .is-closing, then set open=false.
   */
  function initCaseDetailsAccordion() {
    document.querySelectorAll('.case-takeaways .case-details').forEach(function (details) {
      if (details.dataset.accBound === '1') return;
      details.dataset.accBound = '1';
      var summary = details.querySelector('summary');
      var body = details.querySelector('.case-details__body');
      if (!summary || !body) return;

      summary.addEventListener(
        'click',
        function (e) {
          if (!details.open) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          details.classList.add('is-closing');
          window.setTimeout(function () {
            details.open = false;
            details.classList.remove('is-closing');
          }, ACC_CLOSE_MS);
        },
        true
      );
    });
  }

  function initSubnavAnchorClick() {
    var nav = document.querySelector('.case-subnav-inner');
    if (!nav || nav.dataset.anchorBound === '1') return;
    nav.dataset.anchorBound = '1';
    nav.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || !nav.contains(a)) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        history.pushState(null, '', '#' + id);
      } catch (err) {
        /* ignore */
      }
      if (typeof subnavScrollHandler === 'function') {
        requestAnimationFrame(function () {
          subnavScrollHandler();
        });
      }
      scrollActiveLinkIntoView(a, 'smooth');
    });
  }

  function initMoreCaseStudyTiles() {
    var tiles = document.querySelectorAll('.case-more-tile[data-more-desc]');
    if (!tiles.length) return;

    tiles.forEach(function (tile) {
      if (tile.dataset.moreBound === '1') return;
      tile.dataset.moreBound = '1';

      var pop = tile.querySelector('.case-more-popover');
      var desc = tile.getAttribute('data-more-desc') || '';
      if (pop) pop.textContent = desc;
      tile.setAttribute('aria-expanded', 'false');

      function onTileActivate(e) {
        if (!mqMoreCasesTouchMode()) return;
        if (e.button != null && e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        if (!tile.classList.contains('is-hint-visible')) {
          e.preventDefault();
          e.stopPropagation();
          tile.classList.add('is-hint-visible');
          tile.setAttribute('aria-expanded', 'true');
          return;
        }

        var href = tile.getAttribute('href');
        e.preventDefault();
        e.stopPropagation();
        tile.classList.remove('is-hint-visible');
        tile.setAttribute('aria-expanded', 'false');
        if (href) {
          window.location.href = tile.href;
        }
      }

      /* Capture: intercept before navigation on first tap */
      tile.addEventListener('click', onTileActivate, true);
    });

    if (!document.body.dataset.caseMoreOutsideBound) {
      document.body.dataset.caseMoreOutsideBound = '1';
      document.addEventListener(
        'click',
        function (e) {
          if (!mqMoreCasesTouchMode()) return;
          document.querySelectorAll('.case-more-tile[data-more-desc]').forEach(function (t) {
            if (!t.contains(e.target)) {
              t.classList.remove('is-hint-visible');
              t.setAttribute('aria-expanded', 'false');
            }
          });
        },
        true
      );
    }

    if (!document.body.dataset.caseMoreMqBound) {
      document.body.dataset.caseMoreMqBound = '1';
      function clearMoreCaseHintsIfNotTouchMode() {
        if (mqMoreCasesTouchMode()) return;
        document.querySelectorAll('.case-more-tile.is-hint-visible').forEach(function (t) {
          t.classList.remove('is-hint-visible');
          t.setAttribute('aria-expanded', 'false');
        });
      }
      var mm700 = window.matchMedia('(max-width: 700px)');
      var mm900 = window.matchMedia('(max-width: 900px)');
      var mmCoarse = window.matchMedia('(pointer: coarse)');
      function onViewportChange() {
        clearMoreCaseHintsIfNotTouchMode();
      }
      if (typeof mm700.addEventListener === 'function') {
        mm700.addEventListener('change', onViewportChange);
        mm900.addEventListener('change', onViewportChange);
        mmCoarse.addEventListener('change', onViewportChange);
      } else if (typeof mm700.addListener === 'function') {
        mm700.addListener(onViewportChange);
        mm900.addListener(onViewportChange);
        mmCoarse.addListener(onViewportChange);
      }
    }
  }

  function initCaseStudyPage() {
    initReveal();
    initSubnavHighlight();
    initSubnavAnchorClick();
    initCaseDetailsAccordion();
    initMoreCaseStudyTiles();
  }

  document.addEventListener('DOMContentLoaded', initCaseStudyPage);
  window.initCaseStudyPage = initCaseStudyPage;
  window.initMoreCaseStudyTiles = initMoreCaseStudyTiles;
}());
