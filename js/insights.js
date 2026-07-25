/* ============================================================
   KORA — Insights page: category filter + search.
   Base behaviors (Lenis, appear, buttons, footer) come from cases.js.
   ============================================================ */
(function () {
  var chips = [].slice.call(document.querySelectorAll(".fchip"));
  var posts = [].slice.call(document.querySelectorAll(".ins-post"));
  var search = document.getElementById("insSearch");
  var empty = document.getElementById("insEmpty");
  var activeCat = "All";

  function apply(animate) {
    var q = (search && search.value ? search.value : "").trim().toLowerCase();
    var shown = 0;
    posts.forEach(function (p) {
      var okCat = activeCat === "All" || p.getAttribute("data-cat") === activeCat;
      var okQ = !q || p.textContent.toLowerCase().indexOf(q) !== -1;
      var show = okCat && okQ;
      if (show) shown++;
      if (show && p.style.display === "none") {
        p.style.display = "";
        if (animate && window.gsap) gsap.fromTo(p, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" });
      } else if (!show) {
        p.style.display = "none";
      }
    });
    if (empty) empty.hidden = shown > 0;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      chips.forEach(function (x) { x.classList.remove("is-on"); });
      c.classList.add("is-on");
      activeCat = c.getAttribute("data-cat");
      apply(true);
    });
  });

  if (search) search.addEventListener("input", function () { apply(false); });
})();
