/**
 * Scroll & hero motion — vanilla JS, no dependencies
 * Loaded with defer
 */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     Statement — split words for scroll lighting
     ---------------------------------------------------------- */
  var statementSection = document.querySelector(".statement");
  var statementText = document.querySelector(".statement__text");
  var statementWords = [];

  function splitStatementWords() {
    if (!statementText) return;

    var fullText = statementText.textContent.replace(/\s+/g, " ").trim();
    statementText.setAttribute("aria-label", fullText);
    statementText.textContent = "";

    var parts = fullText.split(/(\s+)/);
    var i;

    for (i = 0; i < parts.length; i++) {
      var part = parts[i];

      if (!part) continue;

      if (/^\s+$/.test(part)) {
        statementText.appendChild(document.createTextNode(part));
        continue;
      }

      var span = document.createElement("span");
      span.className = "statement__word";
      span.setAttribute("aria-hidden", "true");
      span.textContent = part;
      statementText.appendChild(span);
      statementWords.push(span);
    }
  }

  function lightAllStatementWords() {
    var i;
    for (i = 0; i < statementWords.length; i++) {
      statementWords[i].classList.add("is-lit");
    }
  }

  function updateStatementWords() {
    if (!statementSection || !statementWords.length) return;

    var rect = statementSection.getBoundingClientRect();
    var viewH = window.innerHeight || document.documentElement.clientHeight;
    var start = viewH * 0.85;
    var end = viewH * 0.25;
    var progress = (start - rect.top) / (start - end);

    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;

    var total = statementWords.length;
    var i;

    for (i = 0; i < total; i++) {
      if (progress > i / total) {
        statementWords[i].classList.add("is-lit");
      } else {
        statementWords[i].classList.remove("is-lit");
      }
    }
  }

  splitStatementWords();

  var revealElements = document.querySelectorAll("[data-reveal]");

  if (prefersReducedMotion) {
    revealElements.forEach(function (el) {
      el.classList.add("is-revealed");
    });
    lightAllStatementWords();
    return;
  }

  /* ----------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------- */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        var delay = el.getAttribute("data-reveal-delay");

        if (delay) {
          el.style.transitionDelay = delay + "s";
        }

        el.classList.add("is-revealed");
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ----------------------------------------------------------
     Shared scroll handler (hero + statement + project stack)
     ---------------------------------------------------------- */
  var heroContent = document.querySelector(".hero__content");
  var heroPortrait = document.querySelector(".hero__portrait");
  var projectStickies = document.querySelectorAll(".projects__sticky");
  var scrollTicking = false;
  var DESKTOP_MIN = 768;
  var SCROLL_RANGE = 700;

  function resetHeroMotion() {
    if (heroContent) {
      heroContent.style.transform = "";
      heroContent.style.opacity = "";
    }
    if (heroPortrait) {
      heroPortrait.style.transform = "";
    }
  }

  function resetProjectStack() {
    projectStickies.forEach(function (wrapper) {
      var card = wrapper.querySelector(".project-card");
      if (!card) return;
      card.style.transform = "";
      card.style.removeProperty("--stack-dim");
    });
  }

  function updateHeroMotion() {
    if (!heroContent || !heroPortrait) return;

    if (window.innerWidth < DESKTOP_MIN) {
      resetHeroMotion();
      return;
    }

    var progress = Math.min(Math.max(window.scrollY / SCROLL_RANGE, 0), 1);

    if (progress === 0) {
      resetHeroMotion();
      return;
    }

    var contentY = -120 * progress;
    var scale = 1 - 0.14 * progress;
    var opacity = 1 - 0.85 * progress;
    var portraitY = 140 * progress;

    heroContent.style.transform =
      "translate3d(0, " + contentY + "px, 0) scale(" + scale + ")";
    heroContent.style.opacity = String(opacity);
    heroPortrait.style.transform =
      "translate3d(0, " + portraitY + "px, 0)";
  }

  function updateProjectStack() {
    if (!projectStickies.length) return;

    if (window.innerWidth < DESKTOP_MIN) {
      resetProjectStack();
      return;
    }

    projectStickies.forEach(function (wrapper, index) {
      var card = wrapper.querySelector(".project-card");
      var next = projectStickies[index + 1];

      if (!card) return;

      if (!next) {
        card.style.transform = "scale(1)";
        card.style.setProperty("--stack-dim", "0");
        return;
      }

      var stickyTop = 110 + index * 24;
      var nextTop = next.getBoundingClientRect().top;
      var progress = (stickyTop + 120 - nextTop) / 180;

      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      var scale = 1 - 0.1 * progress;

      card.style.transform = "scale(" + scale + ")";
      card.style.setProperty("--stack-dim", String(0.5 * progress));
    });
  }

  function onScrollFrame() {
    updateHeroMotion();
    updateStatementWords();
    updateProjectStack();
    scrollTicking = false;
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(onScrollFrame);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScrollFrame();
})();
