/**
 * Motion — GSAP + ScrollTrigger + SplitText + Lenis
 * Progressive enhancement: content stays visible without JS.
 */
(function () {
  "use strict";

  var docEl = document.documentElement;
  docEl.classList.add("js");

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  var isMobile = window.matchMedia("(max-width: 767px)").matches;
  var hasFinePointer = window.matchMedia("(pointer: fine)").matches;

  function revealAll() {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-revealed");
    });
    document.querySelectorAll(".statement__word").forEach(function (el) {
      el.classList.add("is-lit");
    });
  }

  /* Reduced motion: no Lenis, no animations */
  if (prefersReducedMotion) {
    docEl.classList.add("reduced-motion");
    revealAll();
    return;
  }

  if (typeof gsap === "undefined") {
    revealAll();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (typeof SplitText !== "undefined" && typeof SplitText.register === "function") {
    SplitText.register(gsap);
  }
  docEl.classList.add("js-motion");

  var DESKTOP_MIN = 768;
  var lenis = null;

  /* ----------------------------------------------------------
     1. Lenis ↔ ScrollTrigger
     ---------------------------------------------------------- */
  function initLenis() {
    if (typeof Lenis === "undefined") return;

    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      autoRaf: false,
    });
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  initLenis();

  /* ----------------------------------------------------------
     2. Intro loader (once per session)
     ---------------------------------------------------------- */
  function runLoader() {
    return new Promise(function (resolve) {
      var seen = false;
      try {
        seen = sessionStorage.getItem("portfolio-intro-seen") === "1";
      } catch (e) {}

      if (seen) {
        resolve();
        return;
      }

      var loader = document.createElement("div");
      loader.className = "intro-loader";
      loader.setAttribute("aria-hidden", "true");
      loader.innerHTML =
        '<div class="intro-loader__inner">' +
        '<p class="intro-loader__name">Bilawal Ali</p>' +
        '<p class="intro-loader__count"><span class="intro-loader__num">0</span></p>' +
        "</div>";
      document.body.appendChild(loader);
      document.body.classList.add("is-loading");

      var numEl = loader.querySelector(".intro-loader__num");
      var counter = { value: 0 };

      var tl = gsap.timeline({
        onComplete: function () {
          try {
            sessionStorage.setItem("portfolio-intro-seen", "1");
          } catch (e) {}
          document.body.classList.remove("is-loading");
          loader.remove();
          resolve();
        },
      });

      tl.to(counter, {
        value: 100,
        duration: 0.85,
        ease: "power2.out",
        onUpdate: function () {
          numEl.textContent = String(Math.round(counter.value));
        },
      })
        .to(
          loader,
          {
            yPercent: -100,
            duration: 0.35,
            ease: "power3.inOut",
          },
          "+=0.05"
        );

      /* Hard cap ~1.2s */
      gsap.delayedCall(1.2, function () {
        if (tl.isActive()) {
          tl.progress(1);
        }
      });
    });
  }

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */
  function splitCreate(target, vars) {
    if (typeof SplitText === "undefined") return null;
    if (typeof SplitText.create === "function") {
      return SplitText.create(target, vars);
    }
    return new SplitText(target, vars);
  }

  /* ----------------------------------------------------------
     3. Hero entrance + scroll (editorial)
     ---------------------------------------------------------- */
  function initHero() {
    var section = document.querySelector(".hero");
    if (!section) return;

    var bgImg = section.querySelector(".hero__bg-img");
    var words = section.querySelector(".hero__words");
    var chips = section.querySelectorAll(".hero__chip");
    var heading = section.querySelector(".hero__heading");
    var mobileStats = section.querySelector(".hero__mobile-stats");
    var arrow = section.querySelector(".hero__arrow");
    var topBar = section.querySelector(".hero__top");
    var bottom = section.querySelector(".hero__bottom");
    var navPill = document.getElementById("site-nav-pill");
    var wordEls = section.querySelectorAll("[data-split]");

    if (prefersReducedMotion) {
      if (bgImg) gsap.set(bgImg, { scale: 1 });
      return;
    }

    /* Letter split with overflow masks */
    wordEls.forEach(function (word) {
      var text = word.textContent;
      word.textContent = "";
      var chars = Array.from(text);
      chars.forEach(function (ch) {
        var mask = document.createElement("span");
        mask.className = "hero__letter-mask";
        mask.style.overflow = "hidden";
        mask.style.display = "inline-block";
        mask.style.verticalAlign = "top";
        var letter = document.createElement("span");
        letter.className = "hero__letter";
        letter.style.display = "inline-block";
        letter.textContent = ch;
        mask.appendChild(letter);
        word.appendChild(mask);
      });
    });

    var row1Letters = section.querySelectorAll(".hero__row--1 .hero__word:not(.hero__word--amp) .hero__letter");
    var ampLetters = section.querySelectorAll(".hero__word--amp .hero__letter");
    var row2Letters = section.querySelectorAll(".hero__row--2 .hero__letter");
    var row3Letters = section.querySelectorAll(".hero__row--3 .hero__word .hero__letter");

    if (bgImg) gsap.set(bgImg, { scale: 1.12, transformOrigin: "center center" });
    gsap.set([].concat(
      Array.from(row1Letters),
      Array.from(ampLetters),
      Array.from(row2Letters),
      Array.from(row3Letters)
    ), { yPercent: 110 });
    gsap.set(chips, { y: -150, opacity: 0 });
    gsap.set([heading, mobileStats].filter(Boolean), { y: 70, opacity: 0 });
    if (arrow) gsap.set(arrow, { opacity: 0, y: 20 });
    gsap.set([topBar, bottom].filter(Boolean), { opacity: 0 });

    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    if (bgImg) {
      tl.to(bgImg, { scale: 1, duration: 2.6, ease: "expo.out" }, 0);
    }

    if (row1Letters.length) {
      tl.to(row1Letters, { yPercent: 0, duration: 0.9, stagger: 0.035 }, 0.15);
    }
    if (ampLetters.length) {
      tl.to(ampLetters, { yPercent: 0, duration: 0.9, stagger: 0.035 }, 0.5);
    }
    if (row2Letters.length) {
      tl.to(row2Letters, { yPercent: 0, duration: 0.9, stagger: 0.035 }, 0.6);
    }
    if (row3Letters.length) {
      tl.to(row3Letters, { yPercent: 0, duration: 0.9, stagger: 0.035 }, 0.95);
    }
    if (arrow) {
      tl.to(arrow, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, 1.35);
    }

    tl.to(chips, { y: 0, opacity: 1, duration: 0.9, ease: "back.out(1.6)", stagger: 0.08 }, 1.7);
    tl.to([heading, mobileStats].filter(Boolean), { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.4)" }, 1.9);
    tl.to([topBar, bottom].filter(Boolean), { opacity: 1, duration: 0.8, ease: "power2.out" }, 2.1);

    /* Scroll parallax — desktop */
    if (window.innerWidth >= DESKTOP_MIN) {
      if (words) {
        gsap.to(words, {
          y: -80,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
      if (bgImg) {
        gsap.to(bgImg, {
          y: 120,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }

    /* Pin nav pill to viewport after leaving hero */
    if (navPill) {
      ScrollTrigger.create({
        trigger: section,
        start: "bottom top+=80",
        onEnter: function () {
          navPill.classList.add("is-fixed");
        },
        onLeaveBack: function () {
          navPill.classList.remove("is-fixed");
        },
      });
    }
  }

  /* ----------------------------------------------------------
     4. Marquee — removed with old hero
     ---------------------------------------------------------- */
  function initMarquee() {
    /* no-op: editorial hero has no marquee */
  }

  /* ----------------------------------------------------------
     5. H2 line reveals
     ---------------------------------------------------------- */
  function initHeadings() {
    document.querySelectorAll("h2").forEach(function (h2) {
      var split = splitCreate(h2, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.85,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: h2,
              start: "top 85%",
              once: true,
            },
          });
        },
      });
      if (!split) {
        gsap.from(h2, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: h2, start: "top 85%", once: true },
        });
      }
    });
  }

  /* ----------------------------------------------------------
     6. Statement word lighting (scrub)
     ---------------------------------------------------------- */
  function initStatement() {
    var text = document.querySelector(".statement__text");
    var section = document.querySelector(".statement");
    if (!text || !section) return;

    var split = splitCreate(text, {
      type: "words",
      wordsClass: "statement__word",
    });

    if (!split || !split.words) return;

    gsap.set(split.words, { opacity: 0.18 });

    gsap.to(split.words, {
      opacity: 1,
      stagger: 0.05,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
        end: "center 35%",
        scrub: true,
      },
    });
  }

  /* ----------------------------------------------------------
     7. Featured work stack + image parallax
     ---------------------------------------------------------- */
  function initProjects() {
    var stickies = gsap.utils.toArray(".projects__sticky");
    if (!stickies.length) return;

    stickies.forEach(function (wrapper, index) {
      var card = wrapper.querySelector(".project-card");
      var img = wrapper.querySelector(".project-card__img");
      var next = stickies[index + 1];

      if (img) {
        gsap.fromTo(
          img,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: wrapper,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }

      if (!card || !next || window.innerWidth < DESKTOP_MIN) return;

      gsap.fromTo(
        card,
        { scale: 1 },
        {
          scale: 0.9,
          ease: "none",
          transformOrigin: "center top",
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: "top 20%",
            scrub: 1,
            onUpdate: function (self) {
              card.style.setProperty("--stack-dim", String(self.progress * 0.5));
            },
          },
        }
      );
    });
  }

  /* ----------------------------------------------------------
     8. Custom cursor (fine pointer + desktop)
     ---------------------------------------------------------- */
  function initCursor() {
    if (!hasFinePointer || isMobile) return;

    var cursor = document.createElement("div");
    cursor.className = "cursor-dot";
    cursor.innerHTML =
      '<span class="cursor-dot__inner" aria-hidden="true"></span>' +
      '<span class="cursor-dot__label">VIEW</span>';
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);

    var inner = cursor.querySelector(".cursor-dot__inner");
    var label = cursor.querySelector(".cursor-dot__label");
    var pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var mouse = { x: pos.x, y: pos.y };

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    gsap.set(inner, { scale: 1 });
    gsap.set(label, { opacity: 0, scale: 0.6 });

    window.addEventListener(
      "mousemove",
      function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      },
      { passive: true }
    );

    gsap.ticker.add(function () {
      pos.x += (mouse.x - pos.x) * 0.18;
      pos.y += (mouse.y - pos.y) * 0.18;
      gsap.set(cursor, { x: pos.x, y: pos.y });
    });

    document.querySelectorAll(".project-card").forEach(function (card) {
      card.addEventListener("mouseenter", function () {
        cursor.classList.add("is-view");
        gsap.to(inner, { scale: 9, duration: 0.35, ease: "power3.out" });
        gsap.to(label, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", function () {
        cursor.classList.remove("is-view");
        gsap.to(inner, { scale: 1, duration: 0.35, ease: "power3.out" });
        gsap.to(label, { opacity: 0, scale: 0.6, duration: 0.25, ease: "power2.in" });
      });
    });
  }

  /* ----------------------------------------------------------
     9. Magnetic primary buttons
     ---------------------------------------------------------- */
  function initMagnetic() {
    if (!hasFinePointer || isMobile) return;

    document
      .querySelectorAll(".btn--primary, .hero__nav-cta, .quiz__next, .quiz__submit")
      .forEach(function (btn) {
        btn.addEventListener("mousemove", function (e) {
          var r = btn.getBoundingClientRect();
          var x = gsap.utils.clamp(-8, 8, e.clientX - (r.left + r.width / 2));
          var y = gsap.utils.clamp(-8, 8, e.clientY - (r.top + r.height / 2));
          gsap.to(btn, { x: x, y: y, duration: 0.25, ease: "power2.out" });
        });
        btn.addEventListener("mouseleave", function () {
          gsap.to(btn, { x: 0, y: 0, duration: 0.45, ease: "power3.out" });
        });
      });
  }

  /* ----------------------------------------------------------
     10. Process horizontal pin (desktop)
     ---------------------------------------------------------- */
  function initProcess() {
    var section = document.querySelector(".process");
    var pin = document.querySelector(".process__pin");
    var steps = document.querySelector(".process__steps");
    var fill = document.querySelector(".process__progress-fill");

    if (!section || !pin || !steps) return;

    if (window.innerWidth < DESKTOP_MIN) {
      gsap.from(".process__step", {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: steps,
          start: "top 85%",
          once: true,
        },
      });
      return;
    }

    var track = steps;

    var getTravel = function () {
      return Math.max(0, track.scrollWidth - window.innerWidth);
    };

    gsap.to(track, {
      x: function () {
        return -getTravel();
      },
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: function () {
          return "+=" + getTravel() * 1.5;
        },
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (fill) {
            gsap.set(fill, { scaleX: self.progress });
          }
        },
      },
    });
  }

  /* ----------------------------------------------------------
     11. Service cards stagger
     ---------------------------------------------------------- */
  function initServices() {
    var items = gsap.utils.toArray(".services__grid > li");
    if (!items.length) {
      items = gsap.utils.toArray(".service-card");
    }
    if (!items.length) return;

    gsap.from(items, {
      y: 60,
      rotate: 2,
      opacity: 0,
      duration: 0.75,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".services__grid",
        start: "top 85%",
        once: true,
      },
    });
  }

  /* ----------------------------------------------------------
     Generic data-reveal — GSAP owns initial state
     ---------------------------------------------------------- */
  function initReveals() {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.closest(".services__grid")) return;

      var delay = parseFloat(el.getAttribute("data-reveal-delay") || "0", 10);

      gsap.from(el, {
        opacity: 0,
        y: 48,
        duration: 0.8,
        delay: delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    });
  }

  /* ----------------------------------------------------------
     12. Footer giant letters
     ---------------------------------------------------------- */
  function initFooter() {
    var giant = document.querySelector(".site-footer__giant");
    if (!giant) return;

    var split = splitCreate(giant, {
      type: "chars",
      mask: "chars",
    });

    if (!split || !split.chars) {
      gsap.from(giant, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: ".site-footer", start: "top 85%", once: true },
      });
      return;
    }

    gsap.from(split.chars, {
      yPercent: 110,
      duration: 0.7,
      stagger: 0.03,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".site-footer",
        start: "top 85%",
        once: true,
      },
    });
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
  function refreshTriggers() {
    ScrollTrigger.refresh();
  }

  function start() {
    initMarquee();
    initHeadings();
    initStatement();
    initProjects();
    initServices();
    initProcess();
    initReveals();
    initFooter();
    initCursor();
    initMagnetic();
    initHero();
    refreshTriggers();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refreshTriggers).catch(function () {});
    }
    window.addEventListener("load", refreshTriggers, { once: true });
  }

  runLoader().then(start);

  window.addEventListener(
    "resize",
    function () {
      ScrollTrigger.refresh();
    },
    { passive: true }
  );
})();
