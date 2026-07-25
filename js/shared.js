/* ============================================================
   KORA — shared behaviors (loaded on every page, before the
   page-specific script):
   Lenis smooth scroll · appear-on-scroll · word-fill helper ·
   counters · pre-footer recede · footer wordmark & arc ·
   liquid-fill buttons · form chips · FAQ accordion+tabs ·
   copy email
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.065, smoothWheel: true, wheelMultiplier: 1 });
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
  document.querySelectorAll(".btn").forEach(function (b) {
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
    /* flood disc sized to the button: edge sweeps visibly, layer stays small */
    var sizeFlood = function () {
      b.style.setProperty("--flood", Math.ceil(Math.max(b.offsetWidth, 60) * 2.3) + "px");
    };
    sizeFlood();
    window.addEventListener("resize", sizeFlood);
  });

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

  /* ---------- FAQ: single-open + bouncy open + tabs ---------- */
  var faqItems = document.querySelectorAll(".faq-item");
  var animFaqOpen = function (d) {
    if (reduced || !window.gsap) return;
    var a = d.querySelector(".a");
    if (!a) return;
    gsap.killTweensOf(a);
    var full = a.offsetHeight; /* natural height incl. padding, measured at open */
    gsap.fromTo(a,
      { height: 0, paddingBottom: 0, opacity: 0, y: -10, overflow: "hidden" },
      {
        height: full, paddingBottom: "1.25rem", opacity: 1, y: 0,
        duration: 0.6, ease: "back.out(1.6)",
        clearProps: "height,paddingBottom,overflow,transform,opacity"
      });
  };
  faqItems.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) {
        faqItems.forEach(function (o) { if (o !== d) o.open = false; });
        animFaqOpen(d);
      }
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
     other elements are never affected. */
  document.querySelectorAll("img").forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) return; // already rendered
    img.classList.add("img-fade");
    var box = img.parentElement;
    if (box) box.classList.add("img-loading"); // neutral skeleton instead of the card's dark bg
    var done = function () {
      img.classList.add("img-in");
      setTimeout(function () {
        img.classList.remove("img-fade", "img-in");
        if (box) box.classList.remove("img-loading");
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

  /* ---------- exports for page scripts ---------- */
  window.KORA = { reduced: reduced, lenis: lenis, fillWords: fillWords };
})();
