/* ============================================================
   KORA — nav hover (sliding green pill + page blur) and
   page transition (green curtain with arced edges).
   Loaded EARLY (right after <body> opens) so a transition-entry
   cover state paints before the page content does.
   No dependencies — tiny rAF tweener, GSAP not needed here.
   ============================================================ */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SAG = 60;      // control-point offset; visible arc depth is SAG/2 (30vh) — deep, circle-like
  var FLAG = "kora-pt";

  /* ---------- tiny tweener ----------
     Progress accumulates with a per-frame delta cap: if the main thread
     stalls (image decode, GSAP init on a fresh page), the animation
     pauses and resumes instead of time-jumping to its end. */
  function tween(from, to, dur, ease, onU, onC) {
    var acc = 0, last = null;
    (function step(now) {
      if (last !== null) acc += Math.min(now - last, 48);
      last = now;
      var p = Math.min(1, acc / dur);
      onU(from + (to - from) * ease(p));
      if (p < 1) requestAnimationFrame(step);
      else if (onC) onC();
    })(performance.now());
  }
  var easeIn = function (p) { return p * p; };
  var easeOut = function (p) { return 1 - (1 - p) * (1 - p) * (1 - p); };

  /* ---------- curtain overlay: circular iris ----------
     A giant green square (240vmax, centered on the viewport) with a TRUE
     circular hole cut out (fill-rule=evenodd; square viewBox, so arcs
     stay circles). Only the hole radius animates: the page collapses
     into a shrinking circle at screen center, and the next page opens
     from a growing one. Animated via WAAPI on the CSS `d` property
     (browser-managed timing), with an rAF fallback. ---------- */
  var R_OPEN = 62, R_MIN = 0.05;    // hole radius in vmax (62 > half-diagonal)
  var wrap = null, hole = null;
  function dFor(r) {
    return 'path("M0 0H240V240H0Z M' + (120 - r) + ' 120A' + r + ' ' + r +
           ' 0 1 0 ' + (120 + r) + ' 120A' + r + ' ' + r + ' 0 1 0 ' +
           (120 - r) + ' 120Z")';
  }
  function makeCurtain(r) {
    wrap = document.createElement("div");
    wrap.className = "pt-curtain";
    wrap.innerHTML =
      '<svg viewBox="0 0 240 240" ' +
      'style="position:absolute;left:50%;top:50%;width:240vmax;height:240vmax;' +
      'transform:translate(-50%,-50%);display:block">' +
      '<path fill="#5dc39b" fill-rule="evenodd"/></svg>';
    document.body.appendChild(wrap);
    hole = wrap.querySelector("path");
    hole.style.d = dFor(r);
    if (!hole.style.d) hole.setAttribute("d", dFor(r).slice(6, -2)); // no CSS d support
  }
  function iris(fromR, toR, dur, easing, onDone) {
    var cssD = "d" in hole.style && hole.style.d;
    if (hole.animate && cssD) {
      hole.style.d = dFor(fromR);
      var a = hole.animate([{ d: dFor(fromR) }, { d: dFor(toR) }],
        { duration: dur, easing: easing, fill: "forwards" });
      a.onfinish = function () { hole.style.d = dFor(toR); if (onDone) onDone(); };
    } else {
      tween(fromR, toR, dur, easeOut, function (v) {
        hole.setAttribute("d", dFor(v).slice(6, -2));
      }, onDone);
    }
  }
  /* start the reveal only once the fresh page's main thread has calmed
     down (two consecutive quick frames), or after a hard deadline */
  function whenCalm(cb, deadline) {
    var t0 = performance.now(), last = null, quick = 0;
    (function probe(now) {
      if (last !== null) quick = (now - last < 40) ? quick + 1 : 0;
      last = now;
      if (quick >= 2 || now - t0 > deadline) cb();
      else requestAnimationFrame(probe);
    })(performance.now());
  }
  function coverThen(url) {
    if (reduced) { location.href = url; return; }
    if (!wrap) makeCurtain(R_OPEN);
    iris(R_OPEN, R_MIN, 560, "cubic-bezier(0.55, 0, 0.8, 0.45)", function () {
      try { sessionStorage.setItem(FLAG, "1"); } catch (e) {}
      // keep the unload gap green as well
      document.documentElement.classList.add("pt-in");
      location.href = url;
    });
  }
  function reveal() {
    makeCurtain(R_MIN);               // solid green (pin-hole) before first paint
    var go = function () {
      whenCalm(function () {
        iris(R_MIN, R_OPEN, 780, "cubic-bezier(0.22, 1, 0.36, 1)", function () {
          wrap.remove(); wrap = null; hole = null;
          document.documentElement.classList.remove("pt-in");
        });
      }, 1300);
    };
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", go);
    else go();
  }
  var entering = false;
  try { entering = sessionStorage.getItem(FLAG) === "1"; sessionStorage.removeItem(FLAG); } catch (e) {}
  if (entering && !reduced) reveal();

  /* ---------- link interception ---------- */
  document.addEventListener("click", function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    var href = a.getAttribute("href");
    if (!href || !/\.html(#.*)?$/.test(href) || /^https?:/i.test(href)) return;
    e.preventDefault();
    coverThen(href);
  }, true);

  /* ---------- nav: sliding green pill + page blur ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var navPill = document.querySelector(".nav__pill");
    if (!navPill || reduced) return;
    var links = [].slice.call(navPill.querySelectorAll(".lnk"));
    if (!links.length) return;

    var hp = document.createElement("span");
    hp.className = "nav-hpill";
    hp.setAttribute("aria-hidden", "true");
    navPill.insertBefore(hp, navPill.firstChild);

    var shown = false;
    function moveTo(l) {
      // match the link's own pill box exactly (links are fixed-width pills)
      hp.style.width = l.offsetWidth + "px";
      hp.style.top = l.offsetTop + "px";
      hp.style.height = l.offsetHeight + "px";
      hp.style.transform = "translateX(" + l.offsetLeft + "px)";
      if (!shown) { hp.style.transition = "opacity .2s ease"; requestAnimationFrame(function(){ hp.style.transition = ""; }); }
      hp.style.opacity = "1";
      shown = true;
      links.forEach(function (x2) { x2.classList.toggle("is-hov", x2 === l); });
      document.documentElement.classList.add("nav-blur");
    }
    function clearAll() {
      hp.style.opacity = "0";
      shown = false;
      links.forEach(function (x2) { x2.classList.remove("is-hov"); });
      document.documentElement.classList.remove("nav-blur");
    }
    // after a page load the cursor is often parked over a link — the
    // original engages hover only on a real mouse move, so gate on that
    var armed = false;
    window.addEventListener("mousemove", function () { armed = true; }, { once: true });
    var current = null;
    links.forEach(function (l) {
      l.addEventListener("mousemove", function () {
        if (!armed || current === l) return;
        current = l; moveTo(l);
      });
    });
    navPill.addEventListener("mouseleave", function () { current = null; clearAll(); });
    // scrolling with the cursor parked on the nav would blur mid-pin scenes —
    // drop the state on scroll, it re-arms on the next mousemove over a link
    window.addEventListener("scroll", function () {
      if (shown) clearAll();
    }, { passive: true });
  });
})();
