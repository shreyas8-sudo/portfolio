(function () {
  'use strict';

  var docBound = false;

  /** Match “More case studies” tooltip behaviour (case-study.js). */
  function mqMobile() {
    return window.matchMedia('(max-width: 700px)').matches;
  }

  function closeHintTiles(root, except) {
    root.querySelectorAll('[data-pg-tile].is-hint-visible').forEach(function (t) {
      if (except && t === except) return;
      t.classList.remove('is-hint-visible');
      t.setAttribute('aria-expanded', 'false');
    });
  }

  function bindPlaygroundClicksOnce() {
    if (docBound) return;
    docBound = true;

    var root = function () {
      return document.getElementById('pg-playground');
    };

    document.addEventListener(
      'click',
      function (e) {
        if (!document.body.classList.contains('page-playground')) return;
        if (!mqMobile()) return;
        var r = root();
        if (!r) return;
        r.querySelectorAll('[data-pg-tile].is-hint-visible').forEach(function (t) {
          if (!t.contains(e.target)) {
            t.classList.remove('is-hint-visible');
            t.setAttribute('aria-expanded', 'false');
          }
        });
      },
      true
    );

    document.addEventListener(
      'click',
      function (e) {
        if (!document.body.classList.contains('page-playground')) return;
        if (!mqMobile()) return;
        var r = root();
        if (!r || !r.contains(e.target)) return;

        var tile = e.target.closest('[data-pg-tile]');
        if (!tile || !r.contains(tile)) return;

        var surface = tile.querySelector('.pg-tile__surface');
        if (!surface || !surface.contains(e.target)) return;

        if (!tile.classList.contains('is-hint-visible')) {
          e.preventDefault();
          e.stopPropagation();
          closeHintTiles(r, null);
          tile.classList.add('is-hint-visible');
          tile.setAttribute('aria-expanded', 'true');
          return;
        }

        var url = (tile.getAttribute('data-entry-url') || '').trim();
        if (url) {
          e.preventDefault();
          e.stopPropagation();
          tile.classList.remove('is-hint-visible');
          tile.setAttribute('aria-expanded', 'false');
          window.location.href = url;
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        tile.classList.remove('is-hint-visible');
        tile.setAttribute('aria-expanded', 'false');
      },
      false
    );

    document.addEventListener(
      'keydown',
      function (e) {
        if (!document.body.classList.contains('page-playground')) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var el = document.activeElement;
        if (!el || !el.hasAttribute('data-pg-tile')) return;
        var tile = el;
        var r = root();
        if (!r || !r.contains(tile)) return;
        e.preventDefault();
        if (mqMobile()) {
          tile.click();
        } else {
          tile.classList.toggle('is-hint-visible');
          tile.setAttribute(
            'aria-expanded',
            tile.classList.contains('is-hint-visible') ? 'true' : 'false'
          );
        }
      },
      false
    );
  }

  function initPlaygroundScrollReveals() {
    var main = document.querySelector('body.page-playground .pg-main');
    if (!main || main.dataset.pgRevealInit === '1') return;
    main.dataset.pgRevealInit = '1';
    var els = main.querySelectorAll('[data-reveal]');
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
  }

  function hydrateTiles() {
    var r = document.getElementById('pg-playground');
    if (!r) return;
    r.querySelectorAll('[data-pg-tile]').forEach(function (tile) {
      if (tile.getAttribute('role') !== 'button') {
        tile.setAttribute('role', 'button');
      }
      if (!tile.hasAttribute('tabindex')) {
        tile.setAttribute('tabindex', '0');
      }
      if (!tile.hasAttribute('aria-expanded')) {
        tile.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function applyPlaygroundFilter(filterValue) {
    var grid = document.getElementById('pg-playground');
    if (!grid) return;
    var f = filterValue && filterValue !== '' ? filterValue : 'all';
    grid.setAttribute('data-pg-filter-active', f);
    grid.querySelectorAll('[data-pg-tile]').forEach(function (tile) {
      var cat = (tile.getAttribute('data-pg-category') || '').trim();
      var show = f === 'all' || cat === f;
      if (show) {
        tile.removeAttribute('hidden');
        tile.setAttribute('aria-hidden', 'false');
        tile.setAttribute('tabindex', '0');
      } else {
        if (document.activeElement === tile) {
          tile.blur();
        }
        tile.setAttribute('hidden', '');
        tile.setAttribute('aria-hidden', 'true');
        tile.setAttribute('tabindex', '-1');
        tile.classList.remove('is-hint-visible');
        tile.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initPlaygroundFilter() {
    var nav = document.querySelector('.pg-filter');
    var grid = document.getElementById('pg-playground');
    if (!nav || !grid) return;
    if (nav.dataset.pgFilterBound === '1') return;
    nav.dataset.pgFilterBound = '1';

    function setActiveButton(activeBtn) {
      nav.querySelectorAll('.pg-filter__btn').forEach(function (b) {
        var on = b === activeBtn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('.pg-filter__btn');
      if (!btn || !nav.contains(btn)) return;
      var raw = btn.getAttribute('data-pg-filter');
      var v = raw === null || raw === '' ? 'all' : raw;
      setActiveButton(btn);
      applyPlaygroundFilter(v);
    });

    var current = nav.querySelector('.pg-filter__btn.is-active');
    if (!current) {
      current = nav.querySelector('.pg-filter__btn[data-pg-filter="all"]');
    }
    if (current) {
      setActiveButton(current);
      applyPlaygroundFilter(current.getAttribute('data-pg-filter') || 'all');
    } else {
      applyPlaygroundFilter('all');
    }
  }

  function usePlaygroundCursorTip() {
    return (
      window.matchMedia('(min-width: 701px)').matches &&
      window.matchMedia('(pointer: fine)').matches &&
      window.matchMedia('(hover: hover)').matches
    );
  }

  function teardownPlaygroundPage() {
    var main = document.querySelector('.pg-main');
    if (main) delete main.dataset.pgRevealInit;
    var tip = document.getElementById('pg-cursor-tip');
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    var grid = document.getElementById('pg-playground');
    if (grid) {
      grid.classList.remove('pg-playground--cursor-tip');
      grid.querySelectorAll('.pg-tile__surface[data-cursor-tip-bound="1"]').forEach(function (surface) {
        var h = surface._pgCursorTipHandlers;
        if (h) {
          surface.removeEventListener('mouseenter', h.onEnter);
          surface.removeEventListener('mousemove', h.onMove);
          surface.removeEventListener('mouseleave', h.onLeave);
          delete surface._pgCursorTipHandlers;
        }
        surface.removeAttribute('data-cursor-tip-bound');
      });
    }
  }

  function initPlaygroundCursorTip() {
    var grid = document.getElementById('pg-playground');
    if (!grid) return;

    if (!usePlaygroundCursorTip()) {
      grid.classList.remove('pg-playground--cursor-tip');
      var orphan = document.getElementById('pg-cursor-tip');
      if (orphan && orphan.parentNode) orphan.parentNode.removeChild(orphan);
      return;
    }

    var oldTip = document.getElementById('pg-cursor-tip');
    if (oldTip && oldTip.parentNode) oldTip.parentNode.removeChild(oldTip);

    grid.querySelectorAll('.pg-tile__surface[data-cursor-tip-bound="1"]').forEach(function (surface) {
      var h = surface._pgCursorTipHandlers;
      if (h) {
        surface.removeEventListener('mouseenter', h.onEnter);
        surface.removeEventListener('mousemove', h.onMove);
        surface.removeEventListener('mouseleave', h.onLeave);
        delete surface._pgCursorTipHandlers;
      }
      surface.removeAttribute('data-cursor-tip-bound');
    });

    var tip = document.createElement('div');
    tip.id = 'pg-cursor-tip';
    tip.className = 'pg-cursor-tip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);

    grid.classList.add('pg-playground--cursor-tip');

    grid.querySelectorAll('.pg-tile__surface').forEach(function (surface) {
      var tile = surface.closest('[data-pg-tile]');
      var popover = tile && tile.querySelector('.pg-tile__popover');
      if (!popover) return;

      function positionTip(e) {
        var pad = 14;
        var left = e.clientX + pad;
        var top = e.clientY + pad;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
        var w = tip.offsetWidth;
        var h = tip.offsetHeight;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var margin = 8;
        if (left + w > vw - margin) left = Math.max(margin, vw - w - margin);
        if (top + h > vh - margin) top = Math.max(margin, vh - h - margin);
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
      }

      function onEnter(e) {
        tip.innerHTML = popover.innerHTML;
        positionTip(e);
        tip.classList.add('is-visible');
      }
      function onMove(e) {
        positionTip(e);
      }
      function onLeave() {
        tip.classList.remove('is-visible');
        tip.innerHTML = '';
      }

      surface._pgCursorTipHandlers = { onEnter: onEnter, onMove: onMove, onLeave: onLeave };
      surface.setAttribute('data-cursor-tip-bound', '1');
      surface.addEventListener('mouseenter', onEnter);
      surface.addEventListener('mousemove', onMove);
      surface.addEventListener('mouseleave', onLeave);
    });
  }

  function initPlaygroundVideos() {
    var r = document.getElementById('pg-playground');
    if (!r) return;

    r.querySelectorAll('video.pg-tile__visual--video').forEach(function (v) {
      var surface = v.closest('.pg-tile__surface');
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('muted', '');
      v.playsInline = true;
      v.setAttribute('playsinline', '');

      function tryPlay() {
        var p = v.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function () {});
        }
      }

      v.addEventListener(
        'error',
        function () {
          if (surface) surface.classList.add('pg-tile--video-error');
        },
        false
      );
      v.addEventListener(
        'loadeddata',
        function () {
          if (surface) surface.classList.remove('pg-tile--video-error');
        },
        false
      );

      if (typeof IntersectionObserver !== 'undefined') {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) tryPlay();
            });
          },
          { rootMargin: '80px', threshold: 0.05 }
        );
        io.observe(v);
      }

      if (v.readyState >= 2) {
        tryPlay();
      } else {
        v.addEventListener('loadeddata', tryPlay, { once: true });
        v.addEventListener('canplay', tryPlay, { once: true });
      }
    });
  }

  function initPlaygroundPage() {
    if (!document.getElementById('pg-playground')) return;
    bindPlaygroundClicksOnce();
    hydrateTiles();
    initPlaygroundScrollReveals();
    initPlaygroundFilter();
    initPlaygroundVideos();
    initPlaygroundCursorTip();
    if (typeof window.initMoreCaseStudyTiles === 'function') {
      window.initMoreCaseStudyTiles();
    }
  }

  window.initPlaygroundPage = initPlaygroundPage;
  window.teardownPlaygroundPage = teardownPlaygroundPage;

  if (document.body.classList.contains('page-playground')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPlaygroundPage);
    } else {
      initPlaygroundPage();
    }
  }
})();
