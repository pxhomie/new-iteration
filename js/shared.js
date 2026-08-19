/* ============================================================
   KORA — shared behaviors (loaded on every page, before the
   page-specific script):
   Lenis smooth scroll · appear-on-scroll · shape reveal ·
   word-fill helper ·
   counters · pre-footer recede · footer wordmark & arc ·
   liquid-fill buttons · form chips · FAQ accordion+tabs ·
   copy email
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Everything below assumes GSAP. If the vendor bundle did not arrive, do not
     throw — the page is authored hidden and a throw here leaves it blank. Reveal
     it, mark it degraded, and publish KORA so the inline failsafe stands down. */
  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.remove("preload");
    document.documentElement.classList.add("no-js");
    window.KORA = { lenis: null, degraded: true };
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (!reduced && window.Lenis) {
    /* lerp 0.065 read as syrup — the page kept gliding long after the wheel
       stopped. 0.12 still smooths the scrub sections but catches up almost
       twice as fast, and the wheel moves ~15% more page per tick. */
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true, wheelMultiplier: 1.15 });
    lenis.on("scroll", function () { ScrollTrigger.update(); });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0); // homepage temporarily overrides during its load animation
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault();
          lenis.scrollTo(id, { offset: 0 });
        }
      });
    });
  }

  /* ---------- word/letter fill helper (scrub-driven reveal) ---------- */
  function fillWords(el, opts) {
    if (!el) return;
    opts = opts || {};
    var perLetter = !!opts.letters;
    var cls = perLetter ? "ch" : "w";
    if (perLetter) {
      el.innerHTML = el.textContent.trim().split("").map(function (c) {
        return c === " " ? " " : '<span class="' + cls + '">' + c + "</span>";
      }).join("");
    } else {
      el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) {
        return '<span class="' + cls + '">' + w + "</span>";
      }).join(" ");
    }
    var sel = "#" + el.id + " ." + cls;
    if (reduced) { gsap.set(sel, { opacity: 1 }); return; }
    gsap.to(sel, {
      opacity: 1, stagger: opts.stagger || 0.12, ease: "none",
      scrollTrigger: {
        trigger: el,
        start: opts.start || "top 85%",
        end: opts.end || "top 35%",
        scrub: 0.4
      }
    });
  }

  /* ---------- Appear-on-scroll ----------
     REBUILT for reliability:
     · every element has its OWN trigger — no batches, no queue, nothing
       waits for other sections (batching caused late pop-ins on fast scroll)
     · triggers fire early ("top 92%"), animations are short (0.6s) with a
       small in-section stagger, so content is ready by the time it's read
     · catch-up mode: if the element is already deep in the viewport when
       its trigger fires (fast scroll), it appears almost instantly
     · only HEADINGS split into words; paragraphs animate as a whole
     · images/photo cards are never hidden or animated */
  var appearEls = document.querySelectorAll("[data-appear]");
  if (appearEls.length) {
    if (reduced) {
      appearEls.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var FILL_IDS = ["ctaTitle", "storyTitle", "storyLead", "philo"];
      var HEADING = /^H[1-4]$/;
      appearEls.forEach(function (el) {
        var targets, stagger;
        var kids = [].slice.call(el.children).filter(function (k) {
          return k.getAttribute("aria-hidden") !== "true" && k.tagName !== "BR";
        });
        if (el.id && FILL_IDS.indexOf(el.id) !== -1) {
          targets = [el]; stagger = 0;
        } else if (HEADING.test(el.tagName) && el.children.length === 0 && el.textContent.trim().indexOf(" ") > 0) {
          el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) {
            return '<span class="aw">' + w + "</span>";
          }).join(" ");
          targets = [].slice.call(el.querySelectorAll(".aw")); stagger = 0.03;
        } else if (kids.length >= 2) {
          /* the container leads (its own background must not pop in),
             then its children follow in a CLEARLY sequential rhythm */
          targets = [el].concat(kids); stagger = 0.16;
        } else {
          targets = [el]; stagger = 0;
        }
        /* blur+opacity has no movement, so images animate too — a static
           photo popping into an animated section read as abrupt */
        var normal = targets;
        el.__appearTargets = normal;
        el.__appearStagger = stagger;
        /* look: opacity + blur -> sharp, strictly sequential (stagger) */
        if (normal.length) gsap.set(normal, { opacity: 0, filter: "blur(10px)" });

        ScrollTrigger.create({
          trigger: el,
          start: "top 92%",
          once: true,
          onEnter: function () {
            el.classList.add("is-in");
            if (!normal.length) return;
            /* catch-up: element already well inside the viewport → near-instant */
            var deep = el.getBoundingClientRect().top < window.innerHeight * 0.55;
            gsap.to(normal, {
              opacity: 1, filter: "blur(0px)",
              duration: deep ? 0.35 : 0.65,
              ease: "power2.out",
              stagger: deep ? stagger * 0.3 : stagger,
              overwrite: true,
              clearProps: "filter"
            });
          }
        });
      });
    }
  }

  /* ---------- Shape reveal: iris from the bottom edge ----------
     The same move as the page transition, played inside the image box: a
     true circle anchored at the bottom-centre of the container grows until
     it swallows the whole frame. Two masks ride the same circle — the box
     (green backing) opens first, the photo follows a beat later — so for
     most of the run you see a green iris with the image blooming inside it,
     echoing the green curtain between pages.

     The photo never moves or rescales — only the masks do — so it stays
     sharp. Plays once on the way in and is not scrubbed: scrolling back up
     leaves the images in place rather than closing them again. The radius
     is computed in px against a live measurement so the circle exactly
     reaches the top corners at p=1. */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (reduced) {
      revealEls.forEach(function (el) {
        el.style.clipPath = "none";
        var im = el.querySelector("img");
        if (im) im.style.clipPath = "none";
      });
    } else {
      var MIN = 0.07;          /* start size, as a fraction of the short side */
      revealEls.forEach(function (el) {
        var img = el.querySelector("img");
        var W = 0, H = 0;
        function measure() {
          var r = el.getBoundingClientRect();
          W = r.width; H = r.height;
        }
        function shape(p, anchor) {
          if (!W || !H) measure();
          /* iris anchored on the box edge: fully open when the circle
             reaches the far corners */
          var rMin = Math.min(W, H) * MIN;
          var rMax = Math.sqrt((W / 2) * (W / 2) + H * H);
          var R = rMin + (rMax - rMin) * p;
          return "circle(" + R + "px at 50% " + anchor + ")";
        }
        var st = { frame: 0, photo: 0 };
        function paint() {
          /* the green frame blooms from the bottom edge, the photo answers
             it from the top — the two irises meet mid-box */
          el.style.clipPath = shape(st.frame, "100%");
          if (img) img.style.clipPath = shape(st.photo, "0%");
        }
        measure();
        paint();
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onRefresh: function () { if (!st.frame) { measure(); paint(); } },
          onEnter: function () {
            /* Hold the reveal until the photo is actually decoded, otherwise
               the mask opens onto an empty box and the image pops in after.
               The timeout is the escape hatch: a broken or very slow image
               must never leave the block sitting closed. */
            if (img && !(img.complete && img.naturalWidth > 0)) {
              var fired = false;
              var go = function () { if (!fired) { fired = true; run(); } };
              img.addEventListener("load", go, { once: true });
              img.addEventListener("error", go, { once: true });
              setTimeout(go, 1200);
            } else { run(); }
          }
        });
        function run() {
          measure();
          gsap.to(st, { frame: 1, duration: 0.75, ease: "power3.out", onUpdate: paint });
          gsap.to(st, {
            photo: 1, duration: 0.75, delay: 0, ease: "power3.out", onUpdate: paint,
            /* drop the masks once we are done so a later resize can't
               leave a stale px-based clip behind */
            onComplete: function () {
              el.style.clipPath = "none";
              if (img) img.style.clipPath = "none";
            }
          });
        }
      });
    }
  }

  /* ---------- CTA title: word-by-word fill ---------- */
  fillWords(document.getElementById("ctaTitle"));

  /* ---------- Counters (supports decimals via data-dec) ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (String(target).split(".")[1] || "").length;
    if (el.getAttribute("data-dec")) decimals = parseInt(el.getAttribute("data-dec"), 10);
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () {
        gsap.fromTo(el, { innerText: 0 }, {
          innerText: target, duration: 1.6, ease: "power2.out",
          snap: { innerText: decimals ? 0.1 : 1 },
          onUpdate: function () {
            el.innerText = parseFloat(el.innerText).toFixed(decimals);
          }
        });
      }
    });
  });

  /* ---------- Section before footer recedes as footer rises ---------- */
  if (document.querySelector(".cta-dark, .contact-sec")) {
    gsap.to(".cta-dark, .contact-sec", {
      scale: 0.9, transformOrigin: "50% 20%", ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top 100%", end: "top 10%", scrub: 0.3 }
    });
  }

  /* ---------- Giant footer wordmark grows while scrolling in ---------- */
  if (document.querySelector(".footer__giant span")) {
    gsap.fromTo(".footer__giant span", { scale: 0.62 }, {
      scale: 1, ease: "none", transformOrigin: "50% 100%",
      scrollTrigger: { trigger: ".footer__giant", start: "top 100%", end: "bottom 100%", scrub: 0.3 }
    });
  }

  /* ---------- Green arc rises before footer ---------- */
  if (document.getElementById("footerArc")) {
    /* x:0 in BOTH states: the stylesheet centers the arc with
       translateX(-50%), which GSAP reads as a PIXEL offset — combined with
       xPercent:-50 that doubled the shift on some viewport widths and the
       arc drifted left. Zeroing the pixel x leaves only the percent. */
    gsap.fromTo("#footerArc",
      { x: 0, xPercent: -50, y: "60svh", scale: 0.82, transformOrigin: "50% 20%" },
      {
        x: 0, xPercent: -50, y: "0svh", scale: 1.15, ease: "none",
        scrollTrigger: { trigger: ".footer", start: "top 115%", end: "top 15%", scrub: 0.3 }
      });
  }

  /* ---------- Liquid-fill buttons: label flip + circle blob ---------- */
  var floodBtns = [].slice.call(document.querySelectorAll(".btn"));
  floodBtns.forEach(function (b) {
    [].slice.call(b.childNodes).forEach(function (n) {
      if (n.nodeType === 3 && n.textContent.trim()) {
        var s = document.createElement("span");
        s.className = "bt";
        var t1 = document.createElement("span"); t1.className = "t1"; t1.textContent = n.textContent.trim();
        var t2 = document.createElement("span"); t2.className = "t2"; t2.setAttribute("aria-hidden", "true"); t2.textContent = n.textContent.trim();
        s.appendChild(t1); s.appendChild(t2);
        b.replaceChild(s, n);
      }
    });
    var f = document.createElement("span");
    f.className = "fill";
    b.appendChild(f);
  });
  /* flood disc sized to the button: edge sweeps visibly, layer stays small.
     One listener for all buttons — a listener per button piles up fast on
     pages with 20+ CTAs. */
  function sizeFloods() {
    floodBtns.forEach(function (b) {
      b.style.setProperty("--flood", Math.ceil(Math.max(b.offsetWidth, 60) * 2.3) + "px");
    });
  }
  if (floodBtns.length) {
    sizeFloods();
    window.addEventListener("resize", sizeFloods);
  }

  /* ---------- Form chips ---------- */
  document.querySelectorAll("[data-chips]").forEach(function (grp) {
    var single = grp.getAttribute("data-chips") === "single";
    grp.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (single) {
          grp.querySelectorAll("button").forEach(function (x) { x.classList.remove("is-on"); });
          btn.classList.add("is-on");
        } else {
          btn.classList.toggle("is-on");
        }
      });
    });
  });

  /* ---------- FAQ: single-open, animated both ways + tabs ----------
     <details> collapses instantly the moment `open` is removed, so a closing
     panel can't be animated from a "toggle" listener — by the time it fires the
     content is already gone. The click on <summary> is intercepted instead:
     opening sets `open` first and grows the answer, closing shrinks it and only
     drops `open` when the tween lands. Enter/Space also emit a click, so the
     keyboard path goes through the same code. */
  var faqItems = document.querySelectorAll(".faq-item");
  function faqBody(d) { return d.querySelector(".a"); }
  function faqPad(a) { return parseFloat(getComputedStyle(a).paddingBottom) || 0; }

  function faqOpen(d) {
    var a = faqBody(d);
    d.open = true;
    if (reduced || !window.gsap || !a) return;
    gsap.killTweensOf(a);
    gsap.set(a, { clearProps: "height,paddingBottom,overflow,transform,opacity" });
    var full = a.offsetHeight, pb = faqPad(a); /* natural size, measured while open */
    gsap.fromTo(a,
      { height: 0, paddingBottom: 0, opacity: 0, y: -10, overflow: "hidden" },
      {
        height: full, paddingBottom: pb, opacity: 1, y: 0,
        duration: 0.55, ease: "back.out(1.4)",
        clearProps: "height,paddingBottom,overflow,transform,opacity"
      });
  }

  function faqClose(d) {
    var a = faqBody(d);
    if (reduced || !window.gsap || !a) { d.open = false; return; }
    gsap.killTweensOf(a);
    var full = a.offsetHeight, pb = faqPad(a);
    /* [open] still holds until the tween ends, so the "+" would snap back late —
       this class un-rotates it in step with the collapse. */
    d.classList.add("is-closing");
    gsap.fromTo(a,
      { height: full, paddingBottom: pb, opacity: 1, y: 0, overflow: "hidden" },
      {
        height: 0, paddingBottom: 0, opacity: 0, y: -6,
        duration: 0.38, ease: "power2.inOut",   /* no overshoot on the way out */
        onComplete: function () {
          d.open = false;
          d.classList.remove("is-closing");
          gsap.set(a, { clearProps: "height,paddingBottom,overflow,transform,opacity" });
        }
      });
  }

  faqItems.forEach(function (d) {
    var sum = d.querySelector("summary");
    if (!sum) return;
    sum.addEventListener("click", function (e) {
      e.preventDefault();
      if (d.open) { faqClose(d); return; }
      faqItems.forEach(function (o) { if (o !== d && o.open) faqClose(o); });
      faqOpen(d);
    });
  });
  var tabs = document.querySelectorAll("#faqTabs button");
  var lists = document.querySelectorAll(".faq__list[data-set]");
  tabs.forEach(function (b) {
    b.addEventListener("click", function () {
      tabs.forEach(function (o) { o.classList.remove("is-active"); });
      b.classList.add("is-active");
      if (lists.length) {
        var set = b.getAttribute("data-set");
        lists.forEach(function (l) { l.hidden = l.getAttribute("data-set") !== set; });
      }
    });
  });

  /* ---------- Copy email ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (el) {
    el.style.cursor = "pointer";
    el.addEventListener("click", function () {
      var v = el.getAttribute("data-copy");
      if (navigator.clipboard) navigator.clipboard.writeText(v);
      var old = el.innerHTML;
      el.innerHTML = '<span class="ic">✓</span> Copied!';
      setTimeout(function () { el.innerHTML = old; }, 1400);
    });
  });

  /* ---------- smooth image reveal ----------
     late-loading images (lazy/network) fade in instead of popping into an
     already-visible section. Scoped via classes so GSAP opacity tweens on
     other elements are never affected.

     The skeleton that stands in during loading gets ONE of two homes, decided
     by measurement rather than by guessing from markup:

       · the image fills its container -> the container takes the skeleton.
         That also hides the container's own dark background (no black flash)
         and lets the image cross-fade on top of it.
       · the image only occupies part of its container -> the image itself
         takes the skeleton. Putting it on the container there would paint a
         pale block behind the neighbouring text, and a square container
         behind a round avatar showed its corners until the photo landed.

     A container that hosts the skeleton also borrows the image's radius when
     it has none of its own, so a circular avatar never sits on a square. */
  var imgs = [].slice.call(document.querySelectorAll("img")).filter(function (img) {
    if (img.classList.contains("lgi")) return false; // marquee logos: tiny SVGs under a
    // flatten filter — the skeleton would paint as a solid slab riding the strip
    return !(img.complete && img.naturalWidth > 0); // already rendered: leave alone
  });
  // measure everything first, then write — so we never interleave reads and
  // writes and thrash layout once per image
  var plans = imgs.map(function (img) {
    var box = img.parentElement;
    var ir = img.getBoundingClientRect();
    var fills = false;
    if (box && ir.width > 0 && ir.height > 0) {
      var br = box.getBoundingClientRect();
      fills = Math.abs(ir.width - br.width) < 2 && Math.abs(ir.height - br.height) < 2;
    }
    var radius = "";
    if (fills) {
      var ri = getComputedStyle(img).borderRadius;
      var rb = getComputedStyle(box).borderRadius;
      if (ri && parseFloat(ri) > 0 && !(parseFloat(rb) > 0)) radius = ri;
    }
    return { img: img, box: box, fills: fills, radius: radius };
  });
  plans.forEach(function (pl) {
    var img = pl.img;
    if (pl.fills) {
      /* A [data-reveal] box paints the colour the shape reveal is supposed to
         open onto (the green backing), and the mask IS the entrance. Both the
         skeleton and the cross-fade fight that: the skeleton would override
         the backing with a pale grey for as long as the photo took to arrive,
         and the fade would make the photo materialise inside an already-open
         mask. So those boxes are left alone; the reveal waits for the image
         instead. */
      if (pl.box.hasAttribute("data-reveal")) return;
      img.classList.add("img-fade");
      pl.box.classList.add("img-loading");
      if (pl.radius) pl.box.style.borderRadius = pl.radius;
    } else {
      img.classList.add("img-skeleton"); // clipped to the image's own shape
    }
    var done = function () {
      if (!pl.fills) { img.classList.remove("img-skeleton"); return; }
      img.classList.add("img-in");
      setTimeout(function () {
        img.classList.remove("img-fade", "img-in");
        pl.box.classList.remove("img-loading");
        if (pl.radius) pl.box.style.borderRadius = "";
      }, 500);
    };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });

  /* prefetch lazy images ~1.5 viewports ahead so they're usually ready
     BEFORE the card scrolls in (no visible loading gap at all) */
  if ("IntersectionObserver" in window) {
    var pre = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.removeAttribute("loading");
          pre.unobserve(en.target);
        }
      });
    }, { rootMargin: "300% 0px" });
    document.querySelectorAll('img[loading="lazy"]').forEach(function (i) { pre.observe(i); });
  }

  /* ---------- [data-play-in-view]: run a clip when its card scrolls in ----------
     Two observers on purpose. The near one starts and stops playback at 45%
     visibility, so the clip runs while the card is actually being looked at and
     doesn't burn CPU off-screen. The far one only flips preload from "none" to
     "auto" a viewport early: the file stays off the initial page load, but it is
     buffered by the time the card arrives, so play() doesn't stall on frame one.
     Rewinding to 0 on entry means the clip replays on every pass rather than
     sitting on its last frame. play() is promise-based and rejects if the tab
     denies autoplay — caught and ignored, the poster simply stays up.
     The warm pass deliberately does NOT call load(): load() resets the element
     and aborts any play() already in flight, which is exactly what happens when
     both observers fire in the same tick (deep link straight to the card). */
  var clips = document.querySelectorAll("video[data-play-in-view]");
  if (clips.length && "IntersectionObserver" in window) {
    var warm = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.preload = "auto";
        warm.unobserve(en.target);
      });
    }, { rootMargin: "100% 0px" });

    var playing = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (reduced) return;              /* motion off: hold the poster */
          v.preload = "auto";
          try { v.currentTime = 0; } catch (e) {}
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.45 });

    clips.forEach(function (v) { warm.observe(v); playing.observe(v); });
  }

  /* ---------- no single-word last lines in body copy ----------
     CSS alone can't finish this job: text-wrap:balance is silently skipped by
     Chrome once a block runs past a few lines, so long paragraphs keep
     stranding their closing word on a line of its own. Gluing the last two
     words together with U+00A0 makes them wrap down as a pair instead.
     Scope is <p> only, on purpose: fillWords() and the appear splitter cut on
     /\s+/, which also matches nbsp, so a heading treated this way would lose
     the character outright. Paragraphs that are already word-split, or that
     are really widgets (counters), are skipped for the same reason.
     If the pair is wider than the column the glue would force an overflow, so
     that case is reverted and the paragraph keeps its natural break. */
  var tied = [];
  function tieLastPair(p) {
    if (p.querySelector(".w, .aw, .ch, [data-count]")) return;
    var node = null, walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), n;
    while ((n = walker.nextNode())) if (/\S/.test(n.textContent)) node = n;
    if (!node) return;
    var txt = node.textContent.replace(/\s+$/, "");
    var m = /\s+(?=\S+$)/.exec(txt);
    if (!m) return;                                  /* one word — nothing to tie */
    if (p.textContent.trim().split(/\s+/).length < 2) return;
    tied.push({ node: node, was: node.textContent });
    node.textContent = txt.slice(0, m.index) + " " + txt.slice(m.index + m[0].length);
    if (p.scrollWidth > p.clientWidth + 1) {         /* pair doesn't fit — undo */
      node.textContent = tied.pop().was;
    }
  }
  function retieAll() {
    while (tied.length) { var t = tied.pop(); t.node.textContent = t.was; }
    document.querySelectorAll("p").forEach(tieLastPair);
  }
  retieAll();
  var tieTimer;
  window.addEventListener("resize", function () {
    clearTimeout(tieTimer);
    tieTimer = setTimeout(retieAll, 180);
  });

  /* ---------- Nav: hide on scroll down, reveal on scroll up ----------
     A short travel budget (acc) debounces the flip so Lenis' easing tail
     and trackpad jitter can't strobe the nav. */
  if (!reduced) (function () {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var TOP_LOCK = 120;              /* never hide this close to the top */
    /* asymmetric on purpose: hiding should feel instant, but coming back
       needs a deliberate upward move — a few px of trackpad drift or the
       tail of a Lenis ease must not flash the pill back onto the page. */
    var DOWN = 10, UP = 220;         /* px of travel needed to flip state */
    var lastY = window.scrollY || 0, acc = 0, away = false;
    function set(v) {
      if (v === away) return;
      away = v;
      nav.classList.toggle("nav--away", v);
    }
    window.addEventListener("scroll", function () {
      var y = window.scrollY || 0, d = y - lastY;
      lastY = y;
      if (y <= TOP_LOCK) { acc = 0; set(false); return; }
      /* rubber-band at the document end reports phantom deltas */
      if (y + window.innerHeight >= document.documentElement.scrollHeight - 2) return;
      if (d > 0) { if (acc < 0) acc = 0; acc += d; if (acc > DOWN) set(true); }
      else if (d < 0) { if (acc > 0) acc = 0; acc += d; if (acc < -UP) set(false); }
    }, { passive: true });
    /* a revealed nav is the only sane state to land a new page in */
    window.addEventListener("pageshow", function () { lastY = window.scrollY || 0; acc = 0; set(false); });
  })();

  /* ---------- exports for page scripts ---------- */
  window.KORA = { reduced: reduced, lenis: lenis, fillWords: fillWords };
})();
