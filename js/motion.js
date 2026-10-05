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
  var isMobile = window.matchMedia("(max-width: 809px)").matches;
  var hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  var missingAssets = [];

  function noteMissing(preferred, used) {
    var msg = preferred + (used ? " → " + used : " (missing)");
    if (missingAssets.indexOf(msg) === -1) missingAssets.push(msg);
  }

  function wireImageFallback(img) {
    if (!img || !img.getAttribute("data-fallback")) return;
    var preferred = img.getAttribute("src");
    var fallback = img.getAttribute("data-fallback");
    var onError = function () {
      img.removeEventListener("error", onError);
      noteMissing(preferred, fallback);
      img.classList.add("is-fallback");
      img.setAttribute("data-fallback-applied", "1");
      if (img.closest(".whatido__fly")) {
        img.closest(".whatido__fly").classList.add("is-fallback");
      }
      img.src = fallback;
    };
    img.addEventListener("error", onError);
    if (img.complete && img.naturalWidth === 0) onError();
  }

  function probeImage(url) {
    return new Promise(function (resolve) {
      if (!url) {
        resolve(false);
        return;
      }
      var img = new Image();
      img.onload = function () {
        resolve(true);
      };
      img.onerror = function () {
        resolve(false);
      };
      img.src = url;
    });
  }

  function probeVideo(url) {
    return new Promise(function (resolve) {
      if (!url) {
        resolve(false);
        return;
      }
      var video = document.createElement("video");
      var settled = false;
      var finish = function (ok) {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      video.preload = "metadata";
      video.onloadedmetadata = function () {
        finish(true);
      };
      video.onerror = function () {
        finish(false);
      };
      setTimeout(function () {
        finish(false);
      }, 2500);
      video.src = url;
    });
  }

  function resolveWorkMedia() {
    var jobs = [];
    document.querySelectorAll(".work-row__main").forEach(function (main) {
      var img = main.querySelector(".work-row__img");
      if (!img) return;
      var videoUrl = img.getAttribute("data-video");
      var poster = img.getAttribute("data-poster") || img.getAttribute("src");
      var fallback = img.getAttribute("data-fallback");

      jobs.push(
        probeVideo(videoUrl).then(function (okVideo) {
          if (okVideo) {
            var video = document.createElement("video");
            video.className = "work-row__video";
            video.src = videoUrl;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.autoplay = true;
            video.setAttribute("playsinline", "");
            video.setAttribute("muted", "");
            video.poster = poster;
            img.replaceWith(video);
            video.play().catch(function () {});
            return;
          }
          noteMissing(videoUrl);
          return probeImage(poster).then(function (okPoster) {
            if (!okPoster && fallback) {
              noteMissing(poster, fallback);
              img.src = fallback;
              img.removeAttribute("data-fallback");
            } else if (!okPoster) {
              noteMissing(poster);
            } else {
              wireImageFallback(img);
            }
          });
        })
      );
    });

    document.querySelectorAll(".work-row__detail-img").forEach(function (img) {
      wireImageFallback(img);
    });

    return Promise.all(jobs);
  }

  function wireHomepageFallbacks() {
    document
      .querySelectorAll(
        ".whatido__fly img[data-fallback], .whatido__grid-card img[data-fallback], .about-photo img[data-fallback]"
      )
      .forEach(wireImageFallback);
    return resolveWorkMedia();
  }

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

    /* Letter split with overflow masks — spaces keep .28em width via NBSP */
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
        if (ch === " ") {
          mask.className += " hero__letter-mask--space";
          mask.textContent = "\u00A0";
        } else {
          var letter = document.createElement("span");
          letter.className = "hero__letter";
          letter.style.display = "inline-block";
          letter.textContent = ch;
          mask.appendChild(letter);
        }
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
    gsap.set([topBar, bottom, navPill].filter(Boolean), { opacity: 0 });

    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    var letterDur = 1.1;
    var letterStagger = 0.05;

    if (bgImg) {
      tl.to(bgImg, { scale: 1, duration: 3.2, ease: "expo.out" }, 0);
    }

    if (row1Letters.length) {
      tl.to(row1Letters, { yPercent: 0, duration: letterDur, stagger: letterStagger }, 0.3);
    }
    if (ampLetters.length) {
      tl.to(ampLetters, { yPercent: 0, duration: letterDur, stagger: letterStagger }, 0.9);
    }
    if (row2Letters.length) {
      tl.to(row2Letters, { yPercent: 0, duration: letterDur, stagger: letterStagger }, 1.1);
    }
    if (row3Letters.length) {
      tl.to(row3Letters, { yPercent: 0, duration: letterDur, stagger: letterStagger }, 1.6);
    }
    if (arrow) {
      tl.to(arrow, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, 2.2);
    }

    tl.to(chips, { y: 0, opacity: 1, duration: 1, ease: "back.out(1.6)", stagger: 0.08 }, 2.6);
    tl.to([heading, mobileStats].filter(Boolean), { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.4)" }, 2.9);
    tl.to([topBar, bottom, navPill].filter(Boolean), { opacity: 1, duration: 0.8, ease: "power2.out" }, 3.1);

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

      var gridCards = section.querySelectorAll(".whatido__grid-card");
      if (gridCards.length) {
        gsap.from(gridCards, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section.querySelector(".whatido__grid") || section,
            start: "top 85%",
            once: true,
          },
        });
      }
      return;
    }

    var flies = gsap.utils.toArray(".whatido__fly");
    /* fill 30% + 6 staggered full-pass cards (~55% handoff) */
    var cardDur = 1;
    var cardGap = cardDur * 0.55;
    var flySpan = cardDur + (flies.length - 1) * cardGap;
    var totalDur = flySpan / 0.7;
    var fillDur = totalDur * 0.3;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: "+=800%",
        pin: true,
        scrub: 2,
        anticipatePin: 1,
      },
    });

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

    flies.forEach(function (fly, i) {
      var col = fly.getAttribute("data-col") || "";
      var centered = col === "center" || col === "center-alt";
      var startAt = fillDur + i * cardGap;
      var setVars = { y: "110vh", rotation: 0, force3D: true, autoAlpha: 1 };
      if (centered) setVars.xPercent = -50;
      gsap.set(fly, setVars);

      tl.to(
        fly,
        {
          y: "-110vh",
          duration: cardDur,
          ease: "none",
        },
        startAt
      );
    });

    ScrollTrigger.refresh();
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

    var rows = gsap.utils.toArray(".work-row");
    var desktopStack = window.innerWidth >= 810 && !prefersReducedMotion;

    rows.forEach(function (row, index) {
      var media = row.querySelector(".work-row__media");
      var main = row.querySelector(".work-row__main");
      var img = row.querySelector(".work-row__img, .work-row__video");
      var detail = row.querySelector(".work-row__detail");
      var detailImg = row.querySelector(".work-row__detail-img");
      var cta = row.querySelector(".work-row__cta");
      var panel = row.querySelector(".work-row__panel");
      var dim = row.querySelector(".work-row__dim");
      var infoBits = row.querySelectorAll(
        ".work-row__num, .work-row__title, .work-row__tags, .work-row__next"
      );

      if (!desktopStack) {
        if (main) gsap.set(main, { clipPath: "inset(100% 0 0 0)" });
        if (img) gsap.set(img, { scale: 1.2, transformOrigin: "center center" });
        if (detail) gsap.set(detail, { y: 120 });
        if (infoBits.length) gsap.set(infoBits, { y: 40, opacity: 0 });

        var reveal = gsap.timeline({
          scrollTrigger: {
            trigger: row,
            start: "top 75%",
            once: true,
          },
        });

        if (main) {
          reveal.to(
            main,
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.out" },
            0
          );
        }
        if (img) {
          reveal.to(img, { scale: 1, duration: 1.2, ease: "expo.out" }, 0);
        }
        if (detail) {
          reveal.to(detail, { y: 0, duration: 0.9, ease: "expo.out" }, 0.25);
        }
        if (infoBits.length) {
          reveal.to(
            infoBits,
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: "power2.out",
            },
            0.55
          );
        }
      } else if (index < rows.length - 1 && panel) {
        var next = rows[index + 1];
        gsap.fromTo(
          panel,
          { scale: 1 },
          {
            scale: 0.92,
            ease: "none",
            scrollTrigger: {
              trigger: next,
              start: "top bottom",
              end: "top top",
              scrub: 1,
            },
          }
        );
        if (dim) {
          gsap.fromTo(
            dim,
            { opacity: 0 },
            {
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: next,
                start: "top bottom",
                end: "top top",
                scrub: 1,
              },
            }
          );
        }
      }

      if (!prefersReducedMotion && img && img.tagName !== "VIDEO") {
        var drift = gsap.fromTo(
          img,
          { scale: 1.06, xPercent: -3 },
          {
            scale: 1.06,
            xPercent: 3,
            duration: 12,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            paused: true,
          }
        );
        ScrollTrigger.create({
          trigger: row,
          start: "top bottom",
          end: "bottom top",
          onEnter: function () {
            drift.play();
          },
          onEnterBack: function () {
            drift.play();
          },
          onLeave: function () {
            drift.pause();
          },
          onLeaveBack: function () {
            drift.pause();
          },
        });

        if (media && hasFinePointer && !isMobile) {
          media.addEventListener("mouseenter", function () {
            drift.pause();
            gsap.to(img, {
              scale: 1.03,
              duration: 0.6,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
          media.addEventListener("mouseleave", function () {
            gsap.to(img, {
              scale: 1.06,
              duration: 0.6,
              ease: "power2.out",
              overwrite: "auto",
              onComplete: function () {
                drift.play();
              },
            });
          });
        }
      }

      if (
        !prefersReducedMotion &&
        detail &&
        detailImg &&
        detailImg.getAttribute("data-scroll-fallback") === "1"
      ) {
        var setupMobileScroll = function () {
          if (detailImg.getAttribute("data-fallback-applied") !== "1") return;
          detailImg.setAttribute("data-scrolling", "1");
          var cardH = detail.clientHeight;
          var imgH = detailImg.offsetHeight;
          if (!imgH && detailImg.naturalHeight && detailImg.naturalWidth) {
            imgH =
              (detailImg.clientWidth / detailImg.naturalWidth) *
              detailImg.naturalHeight;
          }
          var dist = Math.max(0, imgH - cardH);
          if (dist <= 0) return;

          gsap.set(detailImg, { y: 0 });
          var scrollAnim = gsap.to(detailImg, {
            y: -dist,
            duration: 14,
            ease: "none",
            yoyo: true,
            repeat: -1,
            paused: true,
          });

          ScrollTrigger.create({
            trigger: row,
            start: "top bottom",
            end: "bottom top",
            onEnter: function () {
              scrollAnim.play();
            },
            onEnterBack: function () {
              scrollAnim.play();
            },
            onLeave: function () {
              scrollAnim.pause();
            },
            onLeaveBack: function () {
              scrollAnim.pause();
            },
          });
        };

        detailImg.addEventListener("load", function () {
          if (detailImg.getAttribute("data-fallback-applied") === "1") {
            setupMobileScroll();
          }
        });
        setTimeout(setupMobileScroll, 400);
      }

      if (cta && media) {
        if (hasFinePointer && !isMobile) {
          gsap.set(cta, {
            xPercent: -50,
            yPercent: -50,
            x: 0,
            y: 0,
            scale: 0.6,
            opacity: 0,
          });
          var xTo = gsap.quickTo(cta, "x", { duration: 0.4, ease: "power3" });
          var yTo = gsap.quickTo(cta, "y", { duration: 0.4, ease: "power3" });

          media.addEventListener("mouseenter", function () {
            gsap.to(cta, {
              scale: 1,
              opacity: 1,
              duration: 0.35,
              ease: "power3.out",
            });
          });
          media.addEventListener("mousemove", function (e) {
            var r = media.getBoundingClientRect();
            xTo(e.clientX - r.left);
            yTo(e.clientY - r.top);
          });
          media.addEventListener("mouseleave", function () {
            gsap.to(cta, {
              scale: 0.6,
              opacity: 0,
              duration: 0.3,
              ease: "power3.in",
            });
          });
        } else {
          gsap.set(cta, { clearProps: "transform", opacity: 1, scale: 1 });
        }
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
      '<span class="cursor-dot__inner" aria-hidden="true"></span>';
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);

    var pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var mouse = { x: pos.x, y: pos.y };

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

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
      gsap.from(cards, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: stage,
          start: "top 80%",
          once: true,
        },
      });
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
    var media = document.querySelectorAll(
      ".whatido img, .work-row img, .work-row video, .hero__bg-img, .results img, .about img, .cta img, .case-study img, .work-index img"
    );
    var pending = 0;

    function done() {
      pending -= 1;
      if (pending <= 0) refreshTriggers();
    }

    media.forEach(function (el) {
      if (el.tagName === "VIDEO") {
        if (el.readyState >= 2) return;
        pending += 1;
        el.addEventListener("loadeddata", done, { once: true });
        el.addEventListener("error", done, { once: true });
        return;
      }
      if (el.complete) return;
      pending += 1;
      el.addEventListener("load", done, { once: true });
      el.addEventListener("error", done, { once: true });
    });

    if (pending === 0) refreshTriggers();
  }

  function start() {
    wireHomepageFallbacks().then(function () {
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

      if (missingAssets.length) {
        console.info("[assets] fallbacks used:\n" + missingAssets.join("\n"));
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refreshTriggers).catch(function () {});
      }
      window.addEventListener("load", refreshTriggers, { once: true });
    });
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
