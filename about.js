(function () {
  'use strict';

  function teardownAboutPage() {
    document.querySelectorAll('.hobbies-tooltip').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function initReveal() {
    var root = document.querySelector('body.page-about #page-body');
    if (!root) return;
    var els = root.querySelectorAll('[data-reveal]');
    els.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add('is-visible');
      }, 100 + i * 75);
    });
  }

  function initOutsideDesign() {
    var trigger = document.getElementById('outsideTrigger');
    var hobbiesWrap = document.getElementById('hobbiesWrap');
    var hobbiesSection = document.querySelector('.hobbies-section');
    if (!trigger || !hobbiesWrap) return;
    if (trigger.dataset.outsideBound === '1') return;
    trigger.dataset.outsideBound = '1';

    trigger.addEventListener('click', function () {
      var open = hobbiesWrap.classList.toggle('is-open');
      trigger.classList.toggle('is-active', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (hobbiesSection) hobbiesSection.classList.toggle('is-open', open);
      if (open && hobbiesSection) {
        window.requestAnimationFrame(function () {
          hobbiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });
  }

  function initHobbyTooltips() {
    document.querySelectorAll('.hobbies-cell[data-caption]:not([data-tip-bound])').forEach(function (cell) {
      cell.setAttribute('data-tip-bound', '1');
      var text = cell.getAttribute('data-caption');
      if (!text) return;

      var tip = document.createElement('div');
      tip.className = 'hobbies-tooltip';
      tip.setAttribute('role', 'tooltip');
      tip.textContent = text;
      document.body.appendChild(tip);

      function positionTip(e) {
        var pad = 14;
        tip.style.left = e.clientX + pad + 'px';
        tip.style.top = e.clientY + pad + 'px';
      }

      cell.addEventListener('mouseenter', function (e) {
        positionTip(e);
        tip.classList.add('is-visible');
      });
      cell.addEventListener('mousemove', positionTip);
      cell.addEventListener('mouseleave', function () {
        tip.classList.remove('is-visible');
      });
    });
  }

  function initAboutPage() {
    initReveal();
    initOutsideDesign();
    initHobbyTooltips();
  }

  document.addEventListener('DOMContentLoaded', initAboutPage);
  window.initAboutPage = initAboutPage;
  window.teardownAboutPage = teardownAboutPage;
}());
