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
  const navLinks  = document.querySelectorAll(".nav-link");

  const SCROLL_THRESHOLD = 24;
  const DESKTOP_BREAKPOINT = 768;

  /* ----------------------------------------------------------
     Mobile navigation toggle
     ---------------------------------------------------------- */
  function openMenu() {
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation menu");
    navMenu.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
    navMenu.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  }

  navToggle.addEventListener("click", toggleMenu);

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
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }

  window.addEventListener("scroll", updateHeaderScroll, { passive: true });
  updateHeaderScroll();

  /* ----------------------------------------------------------
     Active nav link highlighting
     ---------------------------------------------------------- */
  function setActiveLink() {
    const scrollPos = window.scrollY + header.offsetHeight + 48;
    let currentId = "home";

    navLinks.forEach(function (link) {
      const targetId = link.getAttribute("href").slice(1);
      const section = document.getElementById(targetId);

      if (section && section.offsetTop <= scrollPos) {
        currentId = targetId;
      }
    });

    navLinks.forEach(function (link) {
      const isActive = link.getAttribute("href") === "#" + currentId;
      link.classList.toggle("nav-link--active", isActive);
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

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      /* Move focus for accessibility when target exists */
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    });
  });

  /* ----------------------------------------------------------
     MODULE 2 — Scroll reveal & stat counter animations
     Module 3 — .reveal-stagger shares the same observer above
     ---------------------------------------------------------- */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
  );

  document.querySelectorAll(".reveal, .reveal-stagger").forEach(function (el) {
    if (prefersReducedMotion.matches) {
      el.classList.add("is-visible");
    } else {
      revealObserver.observe(el);
    }
  });

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
        const target = parseFloat(counter.getAttribute("data-count"), 10);
        const decimals = parseInt(counter.getAttribute("data-decimals") || "0", 10);

        if (Number.isNaN(target)) return;

        animateCounter(counter, target, 1800, decimals);
        counterObserver.unobserve(counter);
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll(".stat-card__number[data-count]").forEach(function (counter) {
    const decimals = parseInt(counter.getAttribute("data-decimals") || "0", 10);

    if (prefersReducedMotion.matches) {
      const target = parseFloat(counter.getAttribute("data-count"), 10);
      counter.textContent = formatCounterValue(target, decimals);
    } else {
      counterObserver.observe(counter);
    }
  });

  /* ----------------------------------------------------------
     MODULE 4 — Project thumbnail fallback on missing images
     ---------------------------------------------------------- */
  document.querySelectorAll(".project-card__img").forEach(function (img) {
    function hideBrokenImage() {
      img.classList.add("is-hidden");
    }

    if (img.complete && img.naturalWidth === 0) {
      hideBrokenImage();
    } else {
      img.addEventListener("error", hideBrokenImage);
    }
  });

  /* ----------------------------------------------------------
     MODULE 5 — Contact form validation
     ---------------------------------------------------------- */
  const contactForm  = document.getElementById("contact-form");
  const formStatus   = document.getElementById("form-status");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (contactForm) {
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
      field.input.setAttribute("aria-invalid", message ? "true" : "false");
      field.error.textContent = message;
    }

    function clearFormStatus() {
      formStatus.hidden = true;
      formStatus.textContent = "";
      formStatus.classList.remove("is-error");
    }

    Object.keys(fields).forEach(function (key) {
      fields[key].input.addEventListener("input", function () {
        setFieldError(fields[key], "");
        clearFormStatus();
      });
    });

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      clearFormStatus();

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

      if (!isValid) {
        formStatus.hidden = false;
        formStatus.classList.add("is-error");
        formStatus.textContent = "Please fix the errors below and try again.";
        firstInvalid.focus();
        return;
      }

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

      formStatus.hidden = false;
      formStatus.classList.remove("is-error");
      formStatus.textContent =
        "Thanks for reaching out! Your message has been received — I'll get back to you soon.";
    });
  }

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
