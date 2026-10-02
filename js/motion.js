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
     3. Hero entrance + scroll
     ---------------------------------------------------------- */
  function initHero() {
    var name = document.querySelector(".hero__name");
    var role = document.querySelector(".hero__role");
    var tagline = document.querySelector(".hero__tagline");
    var actions = document.querySelector(".hero__actions");
    var badge = document.querySelector(".hero__badge");
    var clock = document.querySelector(".hero__clock");
    var portrait = document.querySelector(".hero__portrait");
    var content = document.querySelector(".hero__content");

    if (!name) return;

    gsap.set([badge, clock, role, tagline, actions].filter(Boolean), {
      opacity: 0,
      y: 28,
    });
    if (portrait) {
      gsap.set(portrait, {
        clipPath: "inset(100% 0 0 0)",
        scale: 1.15,
        transformOrigin: "center center",
      });
    }

    var nameSplit = splitCreate(name, {
      type: "chars",
      mask: "chars",
      charsClass: "hero-char",
    });

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (nameSplit && nameSplit.chars) {
      gsap.set(nameSplit.chars, { yPercent: 110 });
      tl.to(nameSplit.chars, {
        yPercent: 0,
        duration: 0.9,
        stagger: 0.03,
      });
    } else {
      gsap.set(name, { opacity: 1, y: 0 });
    }

    if (role) {
      tl.to(role, { opacity: 1, y: 0, duration: 0.55 }, "-=0.35");
    }
    if (tagline) {
      tl.to(tagline, { opacity: 1, y: 0, duration: 0.55 }, "-=0.35");
    }
    if (actions) {
      tl.to(actions, { opacity: 1, y: 0, duration: 0.55 }, "-=0.35");
    }
    if (badge || clock) {
      tl.to([badge, clock].filter(Boolean), { opacity: 1, y: 0, duration: 0.45 }, "-=0.55");
    }
    if (portrait) {
      tl.to(
        portrait,
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 1.1,
          ease: "power3.out",
        },
        "-=0.85"
      );
    }

    if (window.innerWidth >= DESKTOP_MIN && content && portrait) {
      gsap.to(content, {
        y: -120,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(portrait, {
        y: 140,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }

  /* ----------------------------------------------------------
     4. Marquee — velocity + direction
     ---------------------------------------------------------- */
  function initMarquee() {
    var track = document.querySelector(".hero__marquee-track");
    if (!track) return;

    gsap.set(track, { xPercent: 0 });

    var xPos = 0;
    var dir = -1;
    var boost = 1;
    var targetBoost = 1;
    var BASE_PX_PER_SEC = 40;
    var MAX_BOOST = 1.6;
    var BOOST_EASE_SEC = 0.6;

    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity();
        if (Math.abs(v) > 20) {
          dir = v > 0 ? 1 : -1;
        }
      },
    });

    gsap.ticker.add(function (time, deltaTime) {
      var dt = deltaTime / 1000;
      if (!dt || dt > 0.2) {
        dt = 1 / 60;
      }

      if (lenis && typeof lenis.velocity === "number") {
        var scrollV = lenis.velocity;
        if (Math.abs(scrollV) > 0.2) {
          dir = scrollV > 0 ? 1 : -1;
        }
        var extra = Math.min(Math.abs(scrollV) * 0.12, MAX_BOOST - 1);
        targetBoost = 1 + extra;
      } else {
        targetBoost = 1;
      }

      var blend = Math.min(1, dt / BOOST_EASE_SEC);
      boost += (targetBoost - boost) * blend;

      var trackW = track.offsetWidth || 1;
      var deltaPx = BASE_PX_PER_SEC * boost * dir * dt;
      xPos += (deltaPx / trackW) * 100;

      if (xPos <= -50) xPos += 50;
      if (xPos >= 0) xPos -= 50;
      gsap.set(track, { xPercent: xPos });
    });
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
              start: "top 88%",
              toggleActions: "play none none none",
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
          scrollTrigger: { trigger: h2, start: "top 88%" },
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
      .querySelectorAll(".btn--primary, .hero__btn--primary, .quiz__next, .quiz__submit")
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
      /* Mobile: simple stagger reveal */
      gsap.from(".process__step", {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: steps,
          start: "top 85%",
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
    var items = gsap.utils.toArray(".services__grid > [data-reveal], .services__grid > li");
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
        start: "top 80%",
      },
      onComplete: function () {
        items.forEach(function (el) {
          el.classList.add("is-revealed");
        });
      },
    });
  }

  /* ----------------------------------------------------------
     Generic data-reveal (mobile + fallback sections)
     ---------------------------------------------------------- */
  function initReveals() {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.closest(".services__grid") || el.closest(".process")) return;

      var delay = parseFloat(el.getAttribute("data-reveal-delay") || "0", 10);

      gsap.fromTo(
        el,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          onComplete: function () {
            el.classList.add("is-revealed");
          },
        }
      );
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
        scrollTrigger: { trigger: ".site-footer", start: "top 85%" },
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
      },
    });
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
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
    ScrollTrigger.refresh();
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
