/* ============================================================
   KORA — Insight article page: TOC scrollspy + share links.
   Base behaviors (Lenis, appear, buttons, footer) come from shared.js.
   ============================================================ */
(function () {
  var links = [].slice.call(document.querySelectorAll("#tocList a"));
  var sections = links.map(function (a) {
    return document.querySelector(a.getAttribute("href"));
  });

  function spy() {
    var y = window.scrollY + 180;
    var idx = 0;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) idx = i; });
    links.forEach(function (a, i) { a.classList.toggle("is-on", i === idx); });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  /* share links: open platform share dialogs for the current URL */
  var url = encodeURIComponent(location.href);
  var title = encodeURIComponent(document.title);
  var map = {
    Facebook: "https://www.facebook.com/sharer/sharer.php?u=" + url,
    X: "https://twitter.com/intent/tweet?url=" + url + "&text=" + title,
    LinkedIn: "https://www.linkedin.com/sharing/share-offsite/?url=" + url
  };
  document.querySelectorAll(".art-toc__share a").forEach(function (a) {
    var k = a.getAttribute("aria-label");
    if (map[k]) { a.href = map[k]; a.target = "_blank"; a.rel = "noopener"; }
  });
})();
