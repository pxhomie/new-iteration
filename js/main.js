/* ============================================================
   KORA — native rebuild v2 (matched to video reference)
   Scroll mechanics:
   1) intro pin: hero → shrink to card → expand full-bleed →
      blur → word-fill statement
   2) comparison pin: title split L/R → Before card → After card
   3) sticky service stack, horizontal phase accordion,
      testimonial accordion, pricing selector, counters, bars
   ============================================================ */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav: hide Book-a-call after hero ---------- */
  ScrollTrigger.create({
    trigger: "#introPin", start: "top -2%",
    onEnter: function () { document.getElementById("navBook").classList.add("is-hidden"); },
    onLeaveBack: function () { document.getElementById("navBook").classList.remove("is-hidden"); }
  });

  /* ---------- PRELOADER (load animation, not scroll!) ----------
     page opens with a small centered card that expands into
     the full hero; hero UI then fades in                        */
  var heroUi = document.getElementById("heroUi");
  /* split the statement into word spans BEFORE any initIntroScroll() call:
     on transition arrival (pt-in) the scroll timeline is created right here
     at parse time — if the spans don't exist yet, the word-fill tween binds
     to an empty selector and the statement text never appears */
  var stTxt = document.getElementById("statementTxt");
  if (stTxt && !stTxt.querySelector(".w")) {
    stTxt.innerHTML = stTxt.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="w">' + w + "</span>";
    }).join(" ");
  }
  // when the page opens already scrolled (restored position, anchor) or via
  // a page transition, the load animation must not run: it would shrink the
  // stage while the scroll timeline captures those small values as its start
  var skipLoad = window.scrollY > 50 || document.documentElement.classList.contains("pt-in");
  if (reduced || skipLoad) {
    document.documentElement.classList.remove("preload");
    initIntroScroll(); // hoisted; no load animation to wait for
  }
  if (!reduced && !skipLoad) {
    // if the visitor scrolls before the load animation ends, jump it to its
    // final state. Guards: ignore phantom scroll events at the very top
    // (Lenis fires some on startup), and kill the timeline after the jump —
    // otherwise a delayed timeline would replay once its delay elapses.
    var ffDone = false;
    var fastForward = function () {
      if (ffDone) return;
      var tl = window.__loadTl;
      if (tl && tl.progress() >= 1) { ffDone = true; return; }
      if (window.scrollY < 30) return;
      ffDone = true;
      if (tl) {
        tl.progress(1); // fires onComplete → initIntroScroll
        tl.kill();      // prevent delayed replay
        // progress(1) snapped the nav to opacity 1 — ease it in instead.
        // Safe: the nav is not part of the intro scroll timeline, so this
        // post-tween can't poison any scrubbed start values.
        gsap.fromTo(".nav", { opacity: 0, y: -14 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", overwrite: true, clearProps: "transform" });
      }
    };
    window.addEventListener("wheel", fastForward, { passive: true });
    window.addEventListener("touchmove", fastForward, { passive: true });
    window.addEventListener("scroll", fastForward, { passive: true });
  }
  if (!reduced && !skipLoad) {
    // shared.js set lagSmoothing(0) for Lenis accuracy; during the load
    // animation smoothing must be ON so a main-thread stall pauses the
    // animation instead of jumping it. initIntroScroll switches back to 0.
    gsap.ticker.lagSmoothing(500, 33);
    gsap.set("#stage", { width: "min(18.75rem, 30vw)", height: "min(13.75rem, 28svh)", borderRadius: "1.125rem" });
    gsap.set(heroUi, { opacity: 0 });
    gsap.set(".nav", { opacity: 0, y: -14 });
    /* split the hero title into word spans so it can rise word-by-word */
    var heroH1 = document.querySelector(".hero-ui__txt h1");
    if (heroH1 && heroH1.children.length === 0) {
      heroH1.innerHTML = heroH1.textContent.trim().split(/\s+/).map(function (w) {
        return '<span class="aw">' + w + "</span>";
      }).join(" ");
    }
    /* hide the staggered hero children EXPLICITLY at parse time — relying on
       the from-tweens' immediateRender proved unreliable (on slow machines
       the from-state wasn't applied until the tween started, so the title
       flashed visible through the fading-in parent and snapped to 0) */
    gsap.set(".hero-ui__txt h1 .aw, .hero-ui__txt .sub, .hero-ui__cta", { y: 34, opacity: 0 });
    gsap.set(".hero-ui__foot, .case-mini", { y: 24, opacity: 0 });
    // inline styles now match the pre-paint CSS state — drop the guard class
    document.documentElement.classList.remove("preload");
    var loadTl = gsap.timeline({ delay: 0.35, onComplete: function () { initIntroScroll(); } });
    window.__loadTl = loadTl;
    loadTl
      .to("#stage", {
        width: function () {
          var e = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stage-edge")) || 20;
          return (document.documentElement.clientWidth - 2 * e) + "px";
        },
        height: function () {
          var e = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stage-edge")) || 20;
          return (window.innerHeight - 2 * e) + "px";
        },
        borderRadius: function () {
          return (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stage-r")) || 40) + "px";
        },
        duration: 1.1, ease: "power3.inOut",
        onComplete: function () {
          // hand geometry back to the stylesheet so the scroll tween
          // starts from clean, parseable values (no inline var()/calc())
          gsap.set("#stage", { clearProps: "width,height,borderRadius" });
        }
      })
      .to(heroUi, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.25")
      /* .to (not .from): the hidden start state was applied by the explicit
         gsap.set above, so these simply animate to the final values —
         no immediateRender dependence, deterministic on every machine */
      .to(".hero-ui__txt h1 .aw", {
        y: 0, opacity: 1, stagger: 0.05, duration: 0.7, ease: "back.out(1.7)", clearProps: "transform"
      }, "-=0.45")
      .to(".hero-ui__txt .sub, .hero-ui__cta", {
        y: 0, opacity: 1, stagger: 0.09, duration: 0.8, ease: "back.out(1.7)", clearProps: "transform"
      }, "-=0.75")
      /* split motion from fade: back.out on opacity finishes the fade in the
         first ~0.25s and reads as an abrupt pop — the spring stays on the
         movement, the fade gets its own longer, gentle curve */
      .to(".hero-ui__foot, .case-mini", { y: 0, duration: 0.7, ease: "back.out(1.6)", clearProps: "transform" }, "-=0.5")
      .to(".hero-ui__foot, .case-mini", { opacity: 1, duration: 0.95, ease: "power2.inOut" }, "<")
      .to(".nav", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", clearProps: "transform" }, "-=0.55");
  }

  /* ---------- INTRO PIN (scroll) ----------
     0.00-0.20  hero UI slides away
     0.12-0.42  stage expands from inset card to full-bleed
     0.42-0.56  media blurs + dims, statement fades in
     0.55-1.00  statement words fill                       */
  // (statement word-split moved above the preloader — see comment there)

  /* ---------- intro scroll timeline: created only AFTER the load
     animation has finished (or been fast-forwarded), so its tweens never
     capture the preloader's small stage / hidden hero as start values */
  var introInited = false;
  function initIntroScroll() {
    if (introInited) return;
    introInited = true;
    // load animation is over — switch to Lenis-accurate ticker timing
    if (window.Lenis && !reduced) gsap.ticker.lagSmoothing(0);
    // last word ("it.") finishes filling at local timeline time 1.26
    // (0.4 start + 8*0.07 stagger + 0.3 duration); pad the timeline with a
    // no-op tween after that so the text sits fully-visible for a beat
    // before the pin releases, instead of finishing exactly at release.
    var TEXT_DONE_LOCAL_TIME = 1.26;
    var HOLD_PAD = 1.16;  // longer hold: the fill completes well before the ride-over
    var TL_TOTAL = TEXT_DONE_LOCAL_TIME + HOLD_PAD;

    var introTl = gsap.timeline({
      scrollTrigger: { trigger: "#introPin", start: "top top", end: "bottom bottom", scrub: 0.35, invalidateOnRefresh: true }
    });
    introTl
      .to("#heroUi", { opacity: 0, y: -60, duration: 0.18, ease: "none" }, 0.02)
      .set("#heroUi", { visibility: "hidden" }, 0.22)
      // expand to full-bleed
      .to("#stage", {
        width: "100%", height: "100svh", borderRadius: 0,
        duration: 0.3, ease: "power1.inOut"
      }, 0.12)
      // blur + dim (starts while still expanding)
      .to("#stageMedia", { filter: "blur(26px)", scale: 1.06, duration: 0.16, ease: "none" }, 0.3)
      .to("#stageDim", { backgroundColor: "rgba(13,13,13,0.36)", duration: 0.16, ease: "none" }, 0.3)
      // statement rises from below while words fill
      .fromTo("#statement", { opacity: 0, y: "28vh" }, { opacity: 1, y: 0, duration: 0.45, ease: "none" }, 0.36)
      .to("#statementTxt .w", { opacity: 1, stagger: 0.07, duration: 0.3, ease: "none" }, 0.4)
      // no-op hold: keeps the fully-filled text on screen for a beat before release
      .to({}, { duration: HOLD_PAD }, TEXT_DONE_LOCAL_TIME);
    ScrollTrigger.refresh();
  }


  /* ---------- COMPARISON PIN ----------
     0.00-0.15  title fades in (center)
     0.18-0.34  title lines split left/right, fade
     0.26-0.45  Before card scales in (center, solo)
     0.50-0.80  Before shifts left, After slides in right     */
  // both cards stacked dead-center; After hides UNDER Before, then slides out
  gsap.set(["#beforeCard", "#afterCard"], { xPercent: -50, yPercent: -50 });
  // hide both immediately (not inside the scrubbed timeline — otherwise they
  // are visible until the pin starts, then pop off before animating back in)
  gsap.set("#beforeCard", { opacity: 0, scale: 0.82 });
  gsap.set("#afterCard", { opacity: 0, scale: 0.96 });
  // bullets hidden at parse time (same reason as the cards above): a .from()
  // inside the scrubbed timeline would let them show with the card first and
  // then snap back to 0 before staggering in
  gsap.set("#afterCard li", { opacity: 0, y: 20 });
  var cardShift = function () {
    var w = document.getElementById("beforeCard").offsetWidth;
    return w / 2 + Math.max(8, w * 0.022);
  };
  var compTl = gsap.timeline({
    scrollTrigger: {
      // start while the section is still scrolling in, so the title is
      // already visible the moment the white curtain lifts
      trigger: "#comparePin", start: "top 70%", end: "bottom bottom",
      scrub: 0.35, invalidateOnRefresh: true
    }
  });
  // timeline runs from "top 70%": the curtain lifts around progress ~0.28,
  // so the title fades in under the curtain, HOLDS through the lift, and
  // only then splits apart and hands over to the cards
  // the curtain lifts around progress ~0.28 of this trigger; the title's
  // fade-in starts just AFTER that, so the entrance is actually seen
  compTl
    .fromTo("#compareTitle", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.12, ease: "none" }, 0.12)
    // words split far to the edges (viewport-based, no card overlap)
    .to("#compareTitle .l1", { x: function () { return -window.innerWidth * 0.45; }, duration: 0.14, ease: "power1.inOut" }, 0.34)
    .to("#compareTitle .l2", { x: function () { return window.innerWidth * 0.45; }, duration: 0.14, ease: "power1.inOut" }, 0.34)
    // Before card enters alone, dead-center (After sits hidden beneath it)
    .to("#beforeCard", { scale: 1, opacity: 1, duration: 0.18, ease: "back.out(1.3)" }, 0.40)
    .set("#afterCard", { opacity: 1 }, 0.54)
    // edge words fade out as the pair separates
    .to("#compareTitle", { opacity: 0, duration: 0.08, ease: "none" }, 0.54)
    // After slides out FROM UNDER Before; Before shifts left
    .to("#beforeCard", { x: function () { return -cardShift(); }, duration: 0.18, ease: "back.out(1.15)" }, 0.58)
    .to("#afterCard", { x: function () { return cardShift(); }, scale: 1, duration: 0.18, ease: "back.out(1.15)" }, 0.58)
    .to("#beforeCard", { filter: "grayscale(0.5)", duration: 0.14, ease: "none" }, 0.64)
    .to("#beforeCard > *", { opacity: 0.45, duration: 0.14, ease: "none" }, 0.64)
    // bullets finish building exactly at 0.54, i.e. the moment the card itself
    // is revealed, so the card is never seen with an empty list and the bullets
    // are never shown-then-hidden
    .to("#afterCard li", { y: 0, opacity: 1, stagger: 0.02, duration: 0.08, ease: "back.out(1.3)" }, 0.40);

  /* ---------- Services head recedes as the card stack rides over it ---------- */
  gsap.to("#svcHead", {
    scale: 0.9, opacity: 0, transformOrigin: "50% 12%", ease: "none",
    scrollTrigger: {
      // starts later than the stack's first appearance, so the head (title +
      // ARR chart) holds still for an extra beat before it begins to recede
      trigger: ".svc-stack", start: "top 64%", end: "top 14%",
      scrub: 0.3, invalidateOnRefresh: true
    }
  });

  /* ---------- Service cards: a settled card stays perfectly still during
     the dwell, and shrinks only while the NEXT card approaches ---------- */
  var svcCenterTop = function () {
    var ch = Math.min(680, window.innerHeight * 0.78);
    return (window.innerHeight - ch) / 2;
  };
  gsap.utils.toArray(".svc-card").forEach(function (card, i, arr) {
    if (i === arr.length - 1) return;
    // shrink runs the whole approach...
    gsap.to(card, {
      scale: 0.965, ease: "none",
      scrollTrigger: {
        trigger: arr[i + 1],
        start: "top 100%",
        end: function () { return "top " + svcCenterTop() + "px"; },
        scrub: true, invalidateOnRefresh: true
      }
    });
    // ...but the fade-out only once the next card has almost fully arrived
    gsap.to(card, {
      opacity: 0, ease: "none",
      scrollTrigger: {
        trigger: arr[i + 1],
        start: function () { return "top " + (svcCenterTop() + Math.min(680, window.innerHeight * 0.78) * 0.35) + "px"; },
        end: function () { return "top " + svcCenterTop() + "px"; },
        scrub: true, invalidateOnRefresh: true
      }
    });
  });

  /* ---------- Incoming service card fades + grows in as it arrives ---------- */
  gsap.utils.toArray(".svc-card").forEach(function (card, i) {
    if (i === 0) return; // the first card arrives with the receding head instead
    // opacity completes BEFORE the card starts overlapping the settled
    // one above (overlap begins around "top 78%"); scale keeps growing
    gsap.fromTo(card, { opacity: 0 }, {
      opacity: 1, ease: "none",
      scrollTrigger: {
        trigger: card, start: "top 112%", end: "top 84%",
        scrub: true, invalidateOnRefresh: true
      }
    });
    gsap.fromTo(card, { scale: 0.92 }, {
      scale: 1, ease: "none",
      scrollTrigger: {
        trigger: card, start: "top 102%", end: "top 45%",
        scrub: true, invalidateOnRefresh: true
      }
    });
  });

  /* ---------- Glass quotes on service cards: appear when card settles ---------- */
  gsap.utils.toArray(".svc-card .glass-quote").forEach(function (q) {
    gsap.set(q, { opacity: 0, y: 34, transition: "none" });
    gsap.to(q, {
      opacity: 1, y: 0, duration: 0.85, ease: "back.out(1.6)",
      scrollTrigger: {
        trigger: q.closest(".svc-card"),
        start: "top 32%",
        once: true, invalidateOnRefresh: true
      },
      onComplete: function () {
        // return transform/transition to CSS so the hover lift keeps working
        gsap.set(q, { clearProps: "transform,transition,opacity" });
      }
    });
  });

  /* ---------- Chart bars (horizontal) ---------- */
  document.querySelectorAll("[data-bar]").forEach(function (bar, i) {
    gsap.fromTo(bar, { scaleX: 0 }, {
      scaleX: 1, duration: 1.3, delay: i * 0.15, ease: "back.out(1.2)",
      scrollTrigger: { trigger: bar.closest(".chart"), start: "top 80%", once: true }
    });
  });

  /* ---------- Horizontal phase accordion ---------- */
  var phases = document.querySelectorAll("#phases .phase");
  /* ensure every card has a 4-dot progress row */
  phases.forEach(function (p) {
    if (!p.querySelector(".dots")) {
      var s = document.createElement("span");
      s.className = "dots";
      s.innerHTML = "<i></i><i></i><i></i><i></i>";
      p.querySelector(".head").appendChild(s);
    }
  });
  function openPhase(idx) {
    phases.forEach(function (p, j) {
      p.classList.toggle("is-open", j === idx);
      var head = p.querySelector(".head span");
      head.innerHTML = j === idx ? "Phase&nbsp; <b>0" + (j + 1) + "</b>" : "0" + (j + 1);
      var dots = p.querySelector(".dots");
      dots.style.display = j === idx ? "flex" : "none";
      [].forEach.call(dots.children, function (d, k) {
        d.classList.toggle("on", k <= idx);
      });
    });
  }
  phases.forEach(function (p, i) {
    p.addEventListener("click", function () { openPhase(i); });
    p.addEventListener("mouseenter", function () { openPhase(i); });
  });
  openPhase(0);

  /* ---------- Testimonial accordion cards ---------- */
  var tCards = document.querySelectorAll("#tCards .t-card");
  var tRow = document.getElementById("tCards");
  /* lock the row to the tallest open-state height: while a card expands,
     its bigger text transiently rewraps and the row height spiked for a
     frame, shoving the whole page. Measured with transitions off. */
  var lockTRow = function () {
    if (!tRow || !tCards.length) return;
    if (window.innerWidth <= 860) { tRow.style.height = ""; return; }
    var prevOpen = tRow.querySelector(".t-card.is-open");
    tRow.classList.add("no-anim");
    tRow.style.height = "auto";
    var max = 0;
    tCards.forEach(function (c) {
      tCards.forEach(function (o) { o.classList.remove("is-open"); });
      c.classList.add("is-open");
      max = Math.max(max, tRow.offsetHeight);
    });
    tCards.forEach(function (o) { o.classList.remove("is-open"); });
    if (prevOpen) prevOpen.classList.add("is-open");
    void tRow.offsetHeight; // flush layout before re-enabling transitions
    tRow.classList.remove("no-anim");
    tRow.style.height = max + "px";
  };
  tCards.forEach(function (c) {
    c.addEventListener("mouseenter", function () {
      tCards.forEach(function (o) { o.classList.remove("is-open"); });
      c.classList.add("is-open");
    });
  });
  lockTRow();
  /* re-measure once the real webfont is in (fallback metrics differ) and
     again on full load — the lock must reflect final text wrapping */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockTRow);
  window.addEventListener("load", lockTRow);
  var tRowRsz;
  window.addEventListener("resize", function () {
    clearTimeout(tRowRsz);
    tRowRsz = setTimeout(lockTRow, 150);
  });

  /* ---------- Pricing selector ---------- */
  var PLANS = [
    {
      price: "$2500<span>/mo</span>", btn: "Get Started",
      desc: "A focused, 8-week engagement to diagnose your biggest growth blocker and build the plan to fix it.",
      feats: ["Full-funnel diagnostic audit", "90-day growth roadmap", "Weekly strategy sessions", "Conversion optimization plan", "30-day post-engagement check-in"]
    },
    {
      price: "$8500<span>/mo</span>", btn: "Get Started",
      desc: "Ongoing, hands-on growth partnership across strategy, operations, and execution.",
      feats: ["Everything in Growth Sprint", "Hands-on execution support", "Revenue systems build-out", "Monthly leadership reviews", "Priority access to the team", "Quarterly strategy resets"]
    },
    {
      price: "Custom", btn: "Get a quote",
      desc: "For complex, multi-workstream engagements that need a tailored scope and team.",
      feats: ["Tailored engagement design", "Multiple workstreams", "Senior-led team", "Custom reporting cadence", "Flexible duration"]
    }
  ];
  var planRows = document.querySelectorAll("#planList .plan-row");
  function setPlan(i) {
    planRows.forEach(function (r, j) { r.classList.toggle("is-on", i === j); });
    var p = PLANS[i];
    document.getElementById("pdPrice").innerHTML = p.price;
    var pdBtn = document.getElementById("pdBtn");
    var bt1 = pdBtn.querySelector(".t1"), bt2 = pdBtn.querySelector(".t2");
    if (bt1) { bt1.textContent = p.btn; bt2.textContent = p.btn; }
    else pdBtn.textContent = p.btn;
    document.getElementById("pdDesc").textContent = p.desc;
    document.getElementById("pdFeats").innerHTML = p.feats.map(function (f) {
      return '<li><span class="ck">✓</span>' + f + "</li>";
    }).join("");
    gsap.fromTo("#planDetail", { opacity: 0.4, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" });
  }
  planRows.forEach(function (r) {
    r.addEventListener("click", function () { setPlan(+r.getAttribute("data-plan")); });
  });
  setPlan(0);

})();
