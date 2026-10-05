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
    document.querySelectorAll(".whatido__word, .fill-statement__word").forEach(function (el) {
      el.style.color = "#d0c5ab";
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
    document.querySelectorAll("h2:not(.work__heading)").forEach(function (h2) {
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
     6. What I do — word fill + flying images
     ---------------------------------------------------------- */
  function initWhatIDo() {
    var section = document.querySelector(".whatido");
    var stage = document.querySelector(".whatido__stage");
    var statement = document.querySelector(".whatido__statement");
    if (!section || !stage || !statement) return;

    var labelText =
      statement.getAttribute("aria-label") || statement.textContent.trim();
    statement.setAttribute("aria-label", labelText);

    var words = labelText.split(/\s+/).filter(Boolean);
    statement.textContent = "";
    words.forEach(function (word) {
      var span = document.createElement("span");
      span.className = "whatido__word";
      span.setAttribute("aria-hidden", "true");
      span.textContent = word;
      statement.appendChild(span);
      statement.appendChild(document.createTextNode(" "));
    });

    var wordEls = statement.querySelectorAll(".whatido__word");
    gsap.set(wordEls, { color: "#2a2822" });

    var canPin =
      window.innerWidth >= 810 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canPin) {
      gsap.to(wordEls, {
        color: "#d0c5ab",
        stagger: 0.04,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          end: "center 40%",
          scrub: 1,
        },
      });
      return;
    }

    var flies = gsap.utils.toArray(".whatido__fly");
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: "+=250%",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    var fillDur = 4;
    var flyWindow = 6;
    var wordDur = fillDur / Math.max(wordEls.length, 1);

    wordEls.forEach(function (word, i) {
      tl.to(
        word,
        {
          color: "#d0c5ab",
          duration: wordDur,
          ease: "none",
        },
        i * wordDur
      );
    });

    flies.forEach(function (fly) {
      var speed = parseFloat(fly.getAttribute("data-speed") || "1") || 1;
      var rot = parseFloat(fly.getAttribute("data-rot") || "0") || 0;
      var offset = fly.getAttribute("data-offset") === "1";
      var startY = offset ? "170vh" : "110vh";
      var duration = flyWindow / speed;

      gsap.set(fly, { y: startY, rotation: rot, force3D: true });

      tl.to(
        fly,
        {
          y: "-110vh",
          rotation: 0,
          duration: duration,
          ease: "none",
        },
        fillDur
      );
    });
  }

  /* ----------------------------------------------------------
     7. Featured work rows
     ---------------------------------------------------------- */
  function initWork() {
    var section = document.querySelector(".work");
    if (!section) return;

    var heading = section.querySelector(".work__heading");
    if (heading) {
      var text = heading.textContent;
      heading.textContent = "";
      Array.from(text).forEach(function (ch) {
        var mask = document.createElement("span");
        mask.className = "work__letter-mask";
        mask.setAttribute("aria-hidden", "true");
        var letter = document.createElement("span");
        letter.className = "work__letter";
        letter.textContent = ch;
        mask.appendChild(letter);
        heading.appendChild(mask);
      });
      heading.setAttribute("aria-label", text.trim());

      var letters = heading.querySelectorAll(".work__letter");
      gsap.from(letters, {
        yPercent: 110,
        duration: 0.85,
        stagger: 0.03,
        ease: "expo.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 85%",
          once: true,
        },
      });
    }

    gsap.utils.toArray(".work-row").forEach(function (row) {
      var main = row.querySelector(".work-row__main");
      var img = row.querySelector(".work-row__img");
      var detail = row.querySelector(".work-row__detail");
      var infoBits = row.querySelectorAll(
        ".work-row__num, .work-row__title, .work-row__tags, .work-row__next"
      );

      if (main) {
        gsap.fromTo(
          main,
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: {
              trigger: main,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      if (img) {
        gsap.fromTo(
          img,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }

      if (detail && window.innerWidth >= 810) {
        gsap.fromTo(
          detail,
          { y: 60 },
          {
            y: -60,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }

      if (infoBits.length) {
        gsap.from(infoBits, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: row,
            start: "top 75%",
            once: true,
          },
        });
      }
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

    document.querySelectorAll(".work-row__media").forEach(function (card) {
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
     Shared statement color-fill
     ---------------------------------------------------------- */
  function initFillStatements() {
    document.querySelectorAll("[data-fill-statement]").forEach(function (statement) {
      var labelText =
        statement.getAttribute("aria-label") || statement.textContent.trim();
      statement.setAttribute("aria-label", labelText);
      var words = labelText.split(/\s+/).filter(Boolean);
      statement.textContent = "";
      words.forEach(function (word) {
        var span = document.createElement("span");
        span.className = "fill-statement__word";
        span.setAttribute("aria-hidden", "true");
        span.textContent = word;
        statement.appendChild(span);
        statement.appendChild(document.createTextNode(" "));
      });

      var wordEls = statement.querySelectorAll(".fill-statement__word");
      gsap.set(wordEls, { color: "#2a2822" });
      gsap.to(wordEls, {
        color: "#d0c5ab",
        ease: "none",
        stagger: 0.04,
        scrollTrigger: {
          trigger: statement,
          start: "top 75%",
          end: "center 40%",
          scrub: 1,
        },
      });
    });
  }

  /* ----------------------------------------------------------
     Results — pinned card stack
     ---------------------------------------------------------- */
  function initResults() {
    var section = document.querySelector(".results");
    var stage = document.querySelector(".results__stage");
    if (!section || !stage) return;

    var words = section.querySelectorAll(".results__bg-word");
    if (words.length) {
      gsap.from(words, {
        yPercent: 110,
        duration: 0.9,
        stagger: 0.04,
        ease: "expo.out",
        scrollTrigger: {
          trigger: stage,
          start: "top 80%",
          once: true,
        },
      });
    }

    var cards = gsap.utils.toArray(".results-card");
    if (!cards.length) return;

    if (window.innerWidth < 810) {
      gsap.set(cards, { clearProps: "transform" });
      return;
    }

    cards.forEach(function (card, i) {
      var rot = parseFloat(card.getAttribute("data-rot") || "0") || 0;
      gsap.set(card, {
        y: "110vh",
        rotation: rot,
        scale: 1,
        zIndex: i + 1,
        force3D: true,
      });
    });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    cards.forEach(function (card, i) {
      var at = i * 1.1;
      tl.to(
        card,
        {
          y: 0,
          rotation: 0,
          duration: 1,
          ease: "power2.out",
        },
        at
      );
      if (i > 0) {
        tl.to(
          cards[i - 1],
          {
            scale: 0.94,
            y: -20,
            duration: 1,
            ease: "power2.out",
          },
          at
        );
      }
    });
  }

  /* ----------------------------------------------------------
     About — photos + life slider
     ---------------------------------------------------------- */
  function initAbout() {
    document.querySelectorAll(".about-photo").forEach(function (photo) {
      gsap.fromTo(
        photo,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: photo,
            start: "top 80%",
            once: true,
          },
        }
      );
    });

    document.querySelectorAll(".about-part--start .about-part__body").forEach(function (text) {
      gsap.from(text, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: text,
          start: "top 85%",
          once: true,
        },
      });
    });

    var lifePart = document.querySelector(".about-part--life");
    var stage = document.querySelector(".about-life__stage");
    var track = document.querySelector(".about-life__track");
    if (!lifePart || !stage || !track) return;
    if (window.innerWidth < 810) return;

    var getTravel = function () {
      return Math.max(0, track.scrollWidth - stage.clientWidth);
    };

    gsap.to(track, {
      x: function () {
        return -getTravel();
      },
      ease: "none",
      scrollTrigger: {
        trigger: lifePart,
        start: "top top",
        end: function () {
          return "+=" + Math.max(getTravel(), 200);
        },
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  /* ----------------------------------------------------------
     CTA scatter + heading
     ---------------------------------------------------------- */
  function initCta() {
    var section = document.querySelector(".cta");
    if (!section) return;

    var heading = section.querySelector(".cta__heading");
    if (heading) {
      var text = heading.textContent.trim();
      heading.setAttribute("aria-label", text);
      heading.textContent = "";
      text.split(/\s+/).forEach(function (word) {
        var mask = document.createElement("span");
        mask.className = "cta__word-mask";
        mask.setAttribute("aria-hidden", "true");
        var span = document.createElement("span");
        span.className = "cta__word";
        span.textContent = word;
        mask.appendChild(span);
        heading.appendChild(mask);
        heading.appendChild(document.createTextNode(" "));
      });

      gsap.from(heading.querySelectorAll(".cta__word"), {
        yPercent: 110,
        duration: 0.85,
        stagger: 0.04,
        ease: "expo.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 85%",
          once: true,
        },
      });
    }

    section.querySelectorAll(".cta__shot").forEach(function (shot) {
      if (window.getComputedStyle(shot).display === "none") return;
      var speed = parseFloat(shot.getAttribute("data-speed") || "1") || 1;
      gsap.fromTo(
        shot,
        { y: 80 * speed },
        {
          y: -80 * speed,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
  }

  /* ----------------------------------------------------------
     Generic data-reveal
     ---------------------------------------------------------- */
  function initReveals() {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
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
     Footer reveal
     ---------------------------------------------------------- */
  function initFooter() {
    var footer = document.querySelector(".site-footer");
    if (!footer) return;

    var inner = footer.querySelector(".site-footer__inner");
    var logoWords = footer.querySelectorAll(".site-footer__logo-word");

    if (inner) {
      gsap.from(inner, {
        y: 100,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footer,
          start: "top 90%",
          once: true,
        },
      });
    }

    if (logoWords.length) {
      gsap.from(logoWords, {
        yPercent: 110,
        duration: 0.9,
        stagger: 0.06,
        ease: "expo.out",
        scrollTrigger: {
          trigger: footer,
          start: "top 85%",
          once: true,
        },
      });
    }
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
  function refreshTriggers() {
    ScrollTrigger.refresh();
  }

  function refreshAfterImages() {
    var imgs = document.querySelectorAll(
      ".whatido img, .work-row img, .hero__bg-img, .results img, .about img, .cta img"
    );
    var pending = 0;

    function done() {
      pending -= 1;
      if (pending <= 0) refreshTriggers();
    }

    imgs.forEach(function (img) {
      if (img.complete) return;
      pending += 1;
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });

    if (pending === 0) refreshTriggers();
  }

  function start() {
    initMarquee();
    initHeadings();
    initWhatIDo();
    initWork();
    initFillStatements();
    initResults();
    initAbout();
    initCta();
    initReveals();
    initFooter();
    initCursor();
    initMagnetic();
    initHero();
    refreshTriggers();
    refreshAfterImages();

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
