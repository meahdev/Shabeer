(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("js-enabled");

  const revealSelectors = [
    ".hero-copy",
    ".hero-visual",
    ".tool-belt",
    ".section-heading",
    ".section-teaser",
    ".method-grid",
    ".ai-feature",
    ".ai-grid",
    ".project-row",
    ".tracker-showcase",
    ".growth-card",
    ".aso-grid",
    ".writing-feature",
    ".writing-grid",
    ".contact-section > *",
    ".case-context",
    ".case-detail-grid",
    ".challenge-grid",
    ".issue-grid",
    ".desktop-gallery",
    ".case-card",
    ".flow-grid",
    ".architecture-flow",
    ".case-page .hero > *"
  ];

  const revealItems = [...document.querySelectorAll(revealSelectors.join(","))]
    .filter((item, index, list) => list.indexOf(item) === index)
    .filter(
      (item, _, list) =>
        !list.some((other) => other !== item && other.contains(item))
    );

  revealItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 22}ms`);
  });

  const toolBelt = document.querySelector(".tool-belt");
  if (toolBelt) {
    const items = [...toolBelt.children];

    if (!toolBelt.querySelector(".tool-track")) {
      const track = document.createElement("div");
      track.className = "tool-track";

      items.forEach((item) => track.appendChild(item));
      items.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.querySelectorAll("img").forEach((image) => {
          image.loading = "lazy";
          image.fetchPriority = "low";
        });
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });

      toolBelt.appendChild(track);
    }

    const toolTrack = toolBelt.querySelector(".tool-track");
    if (toolTrack && !reduceMotion) {
      const marqueeObserver = new IntersectionObserver(
        ([entry]) => {
          toolTrack.style.animationPlayState = entry.isIntersecting
            ? "running"
            : "paused";
        },
        { threshold: 0 }
      );
      marqueeObserver.observe(toolBelt);
    }
  }

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const show = (item) => {
      item.style.willChange = "transform, opacity";
      item.classList.add("is-visible");
      item.addEventListener(
        "transitionend",
        () => {
          item.style.willChange = "auto";
        },
        { once: true }
      );
    };

    const revealInViewport = () => {
      revealItems.forEach((item) => {
        if (item.classList.contains("is-visible")) return;

        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
          show(item);
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -2% 0px", threshold: 0.01 }
    );

    revealItems.forEach((item) => observer.observe(item));
    revealInViewport();
    requestAnimationFrame(revealInViewport);
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
    history.pushState(null, "", id);
  });

  // ── Mobile nav hamburger ──────────────────────────────────────────────────
  const navToggle = document.getElementById("nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  if (navToggle && mobileNav) {
    const openNav = () => {
      mobileNav.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };

    const closeNav = () => {
      mobileNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };

    navToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.contains("is-open");
      isOpen ? closeNav() : openNav();
    });

    // Close when a nav link is tapped
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (
        mobileNav.classList.contains("is-open") &&
        !mobileNav.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeNav();
      }
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileNav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });
  }
  // ─────────────────────────────────────────────────────────────────────────
})();
