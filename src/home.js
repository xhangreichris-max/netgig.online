/* ============================================
   netgig.online — Homepage
   Mobile nav toggle only. The planner engine
   (planner.js) is not loaded on this page.
   ============================================ */

(function () {
  'use strict';

  var menuBtn = document.getElementById('mobile-menu-btn');
  var nav = document.getElementById('mobile-nav');
  if (!menuBtn || !nav) return;

  menuBtn.addEventListener('click', function () {
    nav.classList.toggle('is-open');
  });
})();
