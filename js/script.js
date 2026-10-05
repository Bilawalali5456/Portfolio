/**
 * Module 1 — Navigation & Hero interactions
 * Vanilla JS, no dependencies
 */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     DOM references
     ---------------------------------------------------------- */
  const header    = document.getElementById("site-header");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu   = document.getElementById("nav-menu");
  const navLinks  = document.querySelectorAll(".hero__nav-link, .nav-menu .nav-link");

  const SCROLL_THRESHOLD = 24;
  const DESKTOP_BREAKPOINT = 810;

  /* ----------------------------------------------------------
     Mobile navigation toggle
     ---------------------------------------------------------- */
  function openMenu() {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation menu");
    navMenu.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
    navMenu.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", toggleMenu);
  }

  /* Close menu when a nav link is clicked */
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth < DESKTOP_BREAKPOINT) {
        closeMenu();
      }
    });
  });

  /* Close menu on Escape key */
  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      navToggle &&
      navToggle.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      navToggle.focus();
    }
  });

  /* Close menu when resizing to desktop */
  window.addEventListener("resize", function () {
    if (window.innerWidth >= DESKTOP_BREAKPOINT) {
      closeMenu();
    }
  });

  /* ----------------------------------------------------------
     Header scroll effect
     ---------------------------------------------------------- */
  function updateHeaderScroll() {
    if (!header) return;

    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }

  if (header) {
    window.addEventListener("scroll", updateHeaderScroll, { passive: true });
    updateHeaderScroll();
  }

  /* ----------------------------------------------------------
     Hero live clock — Asia/Karachi
     ---------------------------------------------------------- */
  const heroClock = document.getElementById("hero-clock");

  function updateHeroClock() {
    if (!heroClock) return;

    const now = new Date();
    const time = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(now);

    heroClock.textContent = "Lahore, PK — " + time;
    heroClock.setAttribute("datetime", now.toISOString());
  }

  updateHeroClock();
  setInterval(updateHeroClock, 30000);

  /* ----------------------------------------------------------
     Active nav link highlighting
     ---------------------------------------------------------- */
  function getNavSectionId(href) {
    if (!href || href === "#") return "";
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return "";
    return href.slice(hashIndex + 1);
  }

  function setActiveLink() {
    const offset = header && window.innerWidth < DESKTOP_BREAKPOINT
      ? header.offsetHeight + 48
      : 120;
    const scrollPos = window.scrollY + offset;
    let currentId = "home";

    navLinks.forEach(function (link) {
      const targetId = getNavSectionId(link.getAttribute("href"));
      if (!targetId) return;

      const section = document.getElementById(targetId);

      if (section && section.offsetTop <= scrollPos) {
        currentId = targetId;
      }
    });

    navLinks.forEach(function (link) {
      const targetId = getNavSectionId(link.getAttribute("href"));
      const isActive = targetId === currentId;
      link.classList.toggle("nav-link--active", isActive);
      link.classList.toggle("is-active", isActive);
    });
  }

  window.addEventListener("scroll", setActiveLink, { passive: true });
  setActiveLink();

  /* ----------------------------------------------------------
     Smooth scroll for in-page anchor links
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      const targetId = this.getAttribute("href");

      if (targetId === "#" || !targetId) return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (
        !prefersReducedMotion &&
        window.__lenis &&
        typeof window.__lenis.scrollTo === "function"
      ) {
        window.__lenis.scrollTo(target, { offset: 0 });
      } else {
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      }

      /* Move focus for accessibility when target exists */
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    });
  });

  /* ----------------------------------------------------------
     MODULE 2 — Stat counter animations
     ---------------------------------------------------------- */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function formatCounterValue(value, decimals) {
    if (decimals > 0) {
      return value.toFixed(decimals);
    }
    return String(Math.round(value));
  }

  function animateCounter(element, target, duration, decimals) {
    if (prefersReducedMotion.matches) {
      element.textContent = formatCounterValue(target, decimals);
      return;
    }

    const startTime = performance.now();

    function tick(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      element.textContent = formatCounterValue(current, decimals);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = formatCounterValue(target, decimals);
      }
    }

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        const counter = entry.target;
        const target = parseFloat(counter.dataset.target, 10);
        const decimals = parseInt(counter.dataset.decimals || "0", 10);

        if (Number.isNaN(target)) return;

        counter.textContent = formatCounterValue(0, decimals);
        animateCounter(counter, target, 1800, decimals);
        counterObserver.unobserve(counter);
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll(".stat-card__number").forEach(function (counter) {
    const raw = counter.textContent.trim();
    const target = parseFloat(raw, 10);

    if (Number.isNaN(target)) return;

    const decimals = raw.includes(".") ? (raw.split(".")[1] || "").length : 0;
    counter.dataset.target = String(target);
    counter.dataset.decimals = String(decimals);

    if (prefersReducedMotion.matches) {
      return;
    }

    counterObserver.observe(counter);
  });

  /* ----------------------------------------------------------
     MODULE 4 — Missing / detail / optional images
     ---------------------------------------------------------- */
  document
    .querySelectorAll(
      ".whatido__fly img, .whatido__grid-card img, .work-row__img, .work-index__img, .case-study__img, .results-card__thumb, .cta__shot"
    )
    .forEach(function (img) {
      function removeBrokenImage() {
        img.remove();
      }

      if (img.complete && img.naturalWidth === 0) {
        removeBrokenImage();
      } else {
        img.addEventListener("error", removeBrokenImage);
      }
    });

  document.querySelectorAll(".work-row__detail-img, .about-photo img").forEach(function (img) {
    function useFallback() {
      var fallback = img.getAttribute("data-fallback");
      if (fallback && img.getAttribute("src") !== fallback) {
        img.setAttribute("src", fallback);
        img.style.objectPosition = "top";
        return;
      }
      img.remove();
    }

    if (img.complete && img.naturalWidth === 0) {
      useFallback();
    } else {
      img.addEventListener("error", useFallback);
    }
  });

  document.querySelectorAll("img[data-optional]").forEach(function (img) {
    function skipMissing() {
      var shot = img.closest(".about-life__shot");
      if (shot) shot.classList.add("is-missing");
      img.remove();
    }

    if (img.complete && img.naturalWidth === 0) {
      skipMissing();
    } else {
      img.addEventListener("error", skipMissing);
    }
  });

  /* ----------------------------------------------------------
     MODULE 5 — Contact quiz modal + form validation
     ---------------------------------------------------------- */
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const copyEmailBtn = document.getElementById("copy-email");
  const copyEmailStatus = document.getElementById("copy-email-status");
  const quizDialog = document.getElementById("project-quiz");
  const openQuizBtn = document.getElementById("open-quiz");
  const closeQuizBtn = document.getElementById("close-quiz");

  function copyText(value, statusEl, btn) {
    function onCopied() {
      if (btn) {
        const prev = btn.textContent;
        btn.textContent = "Copied!";
        window.setTimeout(function () {
          btn.textContent = prev;
        }, 1800);
      }
      if (statusEl) {
        statusEl.textContent = "Copied!";
        window.setTimeout(function () {
          statusEl.textContent = "";
        }, 1800);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(onCopied).catch(function () {
        if (statusEl) statusEl.textContent = "Could not copy.";
      });
      return;
    }

    const temp = document.createElement("input");
    temp.value = value;
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy");
      onCopied();
    } catch (err) {
      if (statusEl) statusEl.textContent = "Could not copy.";
    }
    document.body.removeChild(temp);
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", function () {
      copyText(
        copyEmailBtn.getAttribute("data-email") || "",
        copyEmailStatus,
        copyEmailBtn
      );
    });
  }

  document.querySelectorAll(".site-footer__copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(
        btn.getAttribute("data-copy") || "",
        document.getElementById("footer-copy-status"),
        btn
      );
    });
  });

  if (quizDialog && openQuizBtn) {
    openQuizBtn.addEventListener("click", function () {
      if (typeof quizDialog.showModal === "function") {
        quizDialog.showModal();
      } else {
        quizDialog.setAttribute("open", "");
      }
    });
  }

  if (quizDialog && closeQuizBtn) {
    closeQuizBtn.addEventListener("click", function () {
      if (typeof quizDialog.close === "function") {
        quizDialog.close();
      } else {
        quizDialog.removeAttribute("open");
      }
    });
  }

  if (quizDialog) {
    quizDialog.addEventListener("click", function (event) {
      if (event.target === quizDialog) {
        if (typeof quizDialog.close === "function") quizDialog.close();
      }
    });
  }

  if (contactForm) {
    const steps = [
      document.getElementById("quiz-step-1"),
      document.getElementById("quiz-step-2"),
      document.getElementById("quiz-step-3"),
    ];
    const stepLabel = document.getElementById("quiz-step-label");
    const progressFill = document.getElementById("quiz-progress-fill");
    const backBtn = document.getElementById("quiz-back");
    const nextBtn = document.getElementById("quiz-next");
    const submitBtn = document.getElementById("quiz-submit");
    const needsError = document.getElementById("needs-error");
    const budgetError = document.getElementById("budget-error");
    const subjectInput = document.getElementById("contact-subject");
    let currentStep = 1;

    const fields = {
      name: {
        input: document.getElementById("contact-name"),
        error: document.getElementById("contact-name-error"),
        validate: function (value) {
          if (!value.trim()) return "Please enter your name.";
          return "";
        },
      },
      email: {
        input: document.getElementById("contact-email"),
        error: document.getElementById("contact-email-error"),
        validate: function (value) {
          if (!value.trim()) return "Please enter your email address.";
          if (!emailPattern.test(value.trim())) return "Please enter a valid email address.";
          return "";
        },
      },
      message: {
        input: document.getElementById("contact-message"),
        error: document.getElementById("contact-message-error"),
        validate: function (value) {
          if (!value.trim()) return "Please enter a message.";
          return "";
        },
      },
    };

    function setFieldError(field, message) {
      if (!field || !field.input) return;
      field.input.setAttribute("aria-invalid", message ? "true" : "false");
      if (field.error) field.error.textContent = message;
    }

    function clearFormStatus() {
      if (!formStatus) return;
      formStatus.hidden = true;
      formStatus.textContent = "";
      formStatus.classList.remove("is-error");
    }

    function getSelectedNeeds() {
      return Array.prototype.map.call(
        contactForm.querySelectorAll('input[name="needs"]:checked'),
        function (input) {
          return input.value;
        }
      );
    }

    function getSelectedBudget() {
      const checked = contactForm.querySelector('input[name="budget"]:checked');
      return checked ? checked.value : "";
    }

    function updateSubject() {
      if (!subjectInput) return;
      const needs = getSelectedNeeds().join(", ");
      const budget = getSelectedBudget();
      const parts = [];
      if (needs) parts.push(needs);
      if (budget) parts.push("Budget: " + budget);
      subjectInput.value = parts.join(" — ");
    }

    function showStep(step, options) {
      const opts = options || {};
      currentStep = step;

      steps.forEach(function (el, index) {
        if (!el) return;
        const active = index + 1 === step;
        el.classList.toggle("is-active", active);
        el.hidden = !active;
      });

      if (stepLabel) stepLabel.textContent = String(step);
      if (progressFill) progressFill.style.transform = "scaleX(" + step / 3 + ")";

      if (backBtn) backBtn.hidden = step === 1;
      if (nextBtn) nextBtn.hidden = step === 3;
      if (submitBtn) submitBtn.hidden = step !== 3;

      if (opts.focus !== false) {
        const activeStep = steps[step - 1];
        if (activeStep) {
          const focusTarget = activeStep.querySelector(
            "input:not([type='hidden']), textarea, button"
          );
          if (focusTarget) {
            window.setTimeout(function () {
              focusTarget.focus();
            }, 0);
          }
        }
      }
    }

    function validateStep(step) {
      clearFormStatus();

      if (step === 1) {
        const ok = getSelectedNeeds().length > 0;
        if (needsError) needsError.textContent = ok ? "" : "Please select at least one option.";
        return ok;
      }

      if (step === 2) {
        const ok = Boolean(getSelectedBudget());
        if (budgetError) budgetError.textContent = ok ? "" : "Please choose a budget range.";
        return ok;
      }

      if (step === 3) {
        let isValid = true;
        let firstInvalid = null;

        Object.keys(fields).forEach(function (key) {
          const field = fields[key];
          const message = field.validate(field.input.value);
          setFieldError(field, message);
          if (message) {
            isValid = false;
            if (!firstInvalid) firstInvalid = field.input;
          }
        });

        if (!isValid && firstInvalid) firstInvalid.focus();
        return isValid;
      }

      return true;
    }

    Object.keys(fields).forEach(function (key) {
      if (!fields[key].input) return;
      fields[key].input.addEventListener("input", function () {
        setFieldError(fields[key], "");
        clearFormStatus();
      });
    });

    contactForm.querySelectorAll('input[name="needs"]').forEach(function (input) {
      input.addEventListener("change", function () {
        if (needsError) needsError.textContent = "";
        updateSubject();
      });
    });

    contactForm.querySelectorAll('input[name="budget"]').forEach(function (input) {
      input.addEventListener("change", function () {
        if (budgetError) budgetError.textContent = "";
        updateSubject();
      });
    });

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (!validateStep(currentStep)) return;
        updateSubject();
        showStep(Math.min(3, currentStep + 1));
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        clearFormStatus();
        showStep(Math.max(1, currentStep - 1));
      });
    }

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      clearFormStatus();

      if (currentStep !== 3) {
        showStep(3);
        return;
      }

      const step1Ok = validateStep(1);
      const step2Ok = validateStep(2);
      const step3Ok = validateStep(3);

      if (!step1Ok || !step2Ok || !step3Ok) {
        if (!step1Ok) showStep(1);
        else if (!step2Ok) showStep(2);
        if (formStatus) {
          formStatus.hidden = false;
          formStatus.classList.add("is-error");
          formStatus.textContent = "Please fix the errors and try again.";
        }
        return;
      }

      updateSubject();

      /*
       * Backend hook: connect to Formspree or your API here.
       * Example (Formspree):
       *   contactForm.action = "https://formspree.io/f/YOUR_ID";
       *   contactForm.method = "POST";
       *   contactForm.submit(); // remove preventDefault above
       *
       * Or use fetch():
       *   fetch(contactForm.action, { method: "POST", body: new FormData(contactForm) })
       */

      contactForm.reset();
      Object.keys(fields).forEach(function (key) {
        setFieldError(fields[key], "");
      });
      if (needsError) needsError.textContent = "";
      if (budgetError) budgetError.textContent = "";
      contactForm.classList.add("is-success");

      if (formStatus) {
        formStatus.hidden = false;
        formStatus.classList.remove("is-error");
        formStatus.textContent =
          "Thanks for reaching out! Your message has been received — I'll get back to you soon.";
      }
    });

    showStep(1, { focus: false });
  }

  /* ----------------------------------------------------------
     Case study hover-scroll frames (desktop); native scroll on touch
     ---------------------------------------------------------- */
  (function initHoverScroll() {
    var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (coarse) return;

    document.querySelectorAll(".js-hover-scroll").forEach(function (viewport) {
      var img = viewport.querySelector(".js-hover-scroll__img");
      if (!img) return;

      function measure() {
        var overflow = Math.max(0, img.offsetHeight - viewport.clientHeight);
        var duration = Math.max(8, Math.min(20, overflow / 180));
        viewport.style.setProperty("--scroll-duration", duration + "s");
        img.style.setProperty("--scroll-y", "-" + overflow + "px");
        return overflow;
      }

      function enter() {
        var overflow = measure();
        if (overflow <= 0) return;
        viewport.classList.add("is-hovering");
        img.style.transition = "transform var(--scroll-duration, 12s) linear";
        img.style.transform = "translateY(var(--scroll-y))";
      }

      function leave() {
        viewport.classList.remove("is-hovering");
        img.style.transition = "transform 0.8s ease";
        img.style.transform = "translateY(0)";
      }

      if (img.complete) measure();
      else img.addEventListener("load", measure, { once: true });

      viewport.addEventListener("mouseenter", enter);
      viewport.addEventListener("mouseleave", leave);
      viewport.addEventListener("focus", enter);
      viewport.addEventListener("blur", leave);
    });
  })();

  /* ----------------------------------------------------------
     MODULE 5 — Back to top button
     ---------------------------------------------------------- */
  const backToTop = document.getElementById("back-to-top");
  const BACK_TO_TOP_THRESHOLD = 400;

  function updateBackToTop() {
    if (!backToTop) return;

    if (window.scrollY > BACK_TO_TOP_THRESHOLD) {
      backToTop.classList.add("is-visible");
    } else {
      backToTop.classList.remove("is-visible");
    }
  }

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();
})();
