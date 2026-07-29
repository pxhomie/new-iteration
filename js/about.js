/* ============================================================
   KORA — About page: scroll-driven text fills.
   Base behaviors come from js/shared.js.
   ============================================================ */
(function () {
  "use strict";
  var K = window.KORA;
  if (!K || K.degraded) return;   // shared.js ran in degraded mode: no GSAP to fill with

  /* story: word-fill title & lead */
  K.fillWords(document.getElementById("storyTitle"), { stagger: 0.09, end: "top 40%" });
  K.fillWords(document.getElementById("storyLead"), { stagger: 0.09, end: "top 40%" });

  /* philosophy: per-letter fill */
  K.fillWords(document.getElementById("philo"), { letters: true, stagger: 0.012 });
})();
