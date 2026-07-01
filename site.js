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
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };

    const closeNav = () => {
      mobileNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.documentElement.style.overflow = "";
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

  // ── Interactive Device Mockup Sliders ──────────────────────────────────────
  const initDeviceMockups = () => {
    const containers = document.querySelectorAll(".device-slider-container");
    if (containers.length === 0) return;

    window.portfolioSliders = [];

    containers.forEach((container) => {
      const track = container.querySelector(".mockup-slides-track");
      const slides = container.querySelectorAll(".mockup-slide");
      const dotsContainer = container.querySelector(".mockup-dots");
      const prevBtn = container.querySelector(".prev-slide");
      const nextBtn = container.querySelector(".next-slide");
      const caption = container.querySelector(".mockup-caption");
      const mockup = container.querySelector(".iphone-mockup, .macbook-mockup");

      if (!track || slides.length === 0) return;

      let currentIndex = 0;
      let autoplayTimer = null;
      let isInteracting = false;
      let resumeTimeout = null;

      // Populate dots dynamically if empty
      if (dotsContainer && dotsContainer.children.length === 0) {
        slides.forEach((_, i) => {
          const dot = document.createElement("span");
          dot.className = `mockup-dot${i === 0 ? " active" : ""}`;
          dot.setAttribute("data-index", i);
          dot.setAttribute("role", "button");
          dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
          dotsContainer.appendChild(dot);
        });
      }
      const dots = dotsContainer ? dotsContainer.querySelectorAll(".mockup-dot") : [];

      const updateCaption = (index) => {
        if (!caption) return;
        const text = slides[index].getAttribute("data-caption") || slides[index].querySelector("img")?.getAttribute("alt") || "";
        
        caption.classList.add("slide-changing");
        setTimeout(() => {
          caption.textContent = text;
          caption.classList.remove("slide-changing");
        }, 150);
      };

      const goToSlide = (index) => {
        let targetIndex = index;
        if (index < 0) targetIndex = slides.length - 1;
        if (index >= slides.length) targetIndex = 0;

        currentIndex = targetIndex;
        track.style.setProperty("--active-index", currentIndex);

        // Update dots
        dots.forEach((dot, i) => {
          dot.classList.toggle("active", i === currentIndex);
        });

        updateCaption(currentIndex);
      };

      const nextSlide = () => goToSlide(currentIndex + 1);
      const prevSlide = () => goToSlide(currentIndex - 1);

      // Event listeners for arrows
      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          prevSlide();
          triggerUserInteraction();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          nextSlide();
          triggerUserInteraction();
        });
      }

      // Event listeners for dots
      dots.forEach((dot) => {
        dot.addEventListener("click", (e) => {
          e.stopPropagation();
          const idx = parseInt(dot.getAttribute("data-index"), 10);
          goToSlide(idx);
          triggerUserInteraction();
        });
      });

      // Swipe Gestures for Mobile
      if (mockup) {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        mockup.addEventListener("touchstart", (e) => {
          startX = e.touches[0].clientX;
          isSwiping = true;
          triggerUserInteraction();
        }, { passive: true });

        mockup.addEventListener("touchmove", (e) => {
          if (!isSwiping) return;
          currentX = e.touches[0].clientX;
        }, { passive: true });

        mockup.addEventListener("touchend", () => {
          if (!isSwiping) return;
          isSwiping = false;
          const diffX = startX - currentX;
          if (Math.abs(diffX) > 45 && currentX !== 0) {
            if (diffX > 0) {
              nextSlide();
            } else {
              prevSlide();
            }
          }
          startX = 0;
          currentX = 0;
        });
      }

      // Autoplay loop
      const startAutoplay = () => {
        if (autoplayTimer) clearInterval(autoplayTimer);
        if (reduceMotion) return;
        autoplayTimer = setInterval(() => {
          if (!isInteracting) nextSlide();
        }, 4500);
      };

      const stopAutoplay = () => {
        if (autoplayTimer) clearInterval(autoplayTimer);
      };

      const triggerUserInteraction = () => {
        isInteracting = true;
        stopAutoplay();
        clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(() => {
          isInteracting = false;
          startAutoplay();
        }, 8000);
      };

      // Pause on hover
      if (mockup) {
        mockup.addEventListener("mouseenter", stopAutoplay);
        mockup.addEventListener("mouseleave", () => {
          if (!isInteracting) startAutoplay();
        });
      }

      // Intersection Observer for autoplay viewport visibility
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(container);

      // Save slider state
      window.portfolioSliders.push({
        container,
        goToSlide,
        nextSlide,
        prevSlide,
        getCurrentIndex: () => currentIndex,
        getSlidesCount: () => slides.length,
        slidesElements: slides
      });

      // Initial caption set
      if (caption) {
        const initialText = slides[0].getAttribute("data-caption") || slides[0].querySelector("img")?.getAttribute("alt") || "";
        caption.textContent = initialText;
      }
    });
  };

  initDeviceMockups();

  // ── Lightbox Fullscreen Modal ──────────────────────────────────────────────
  const imagesToModal = document.querySelectorAll(".mockup-slide img");
  if (imagesToModal.length > 0) {
    const modal = document.createElement("div");
    modal.className = "lightbox-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Image viewer");

    modal.innerHTML = `
      <button class="lightbox-close" aria-label="Close viewer">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Previous image">&larr;</button>
      <div class="lightbox-content">
        <img class="lightbox-img" src="" alt="" />
        <p class="lightbox-caption"></p>
      </div>
      <button class="lightbox-nav lightbox-next" aria-label="Next image">&rarr;</button>
    `;

    document.body.appendChild(modal);

    const modalImg = modal.querySelector(".lightbox-img");
    const modalCaption = modal.querySelector(".lightbox-caption");
    const closeBtn = modal.querySelector(".lightbox-close");
    const prevBtn = modal.querySelector(".lightbox-prev");
    const nextBtn = modal.querySelector(".lightbox-next");

    let currentIndex = 0;
    const allImages = [...imagesToModal];

    const updateModalContent = (index) => {
      const imgEl = allImages[index];
      modalImg.src = imgEl.src;
      
      const slide = imgEl.closest(".mockup-slide");
      const captionText = slide ? slide.getAttribute("data-caption") : (imgEl.getAttribute("alt") || "");
      
      modalCaption.textContent = captionText;
      currentIndex = index;

      // Sync page mockup slides
      if (window.portfolioSliders) {
        window.portfolioSliders.forEach((slider) => {
          const slidesArr = [...slider.slidesElements];
          const slideIdx = slidesArr.indexOf(slide);
          if (slideIdx !== -1) {
            slider.goToSlide(slideIdx);
          }
        });
      }
    };

    const openModal = (index) => {
      updateModalContent(index);
      modal.classList.add("is-active");
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
      modal.classList.remove("is-active");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };

    const showPrev = (e) => {
      e.stopPropagation();
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = allImages.length - 1;
      updateModalContent(prevIndex);
    };

    const showNext = (e) => {
      e.stopPropagation();
      let nextIndex = currentIndex + 1;
      if (nextIndex >= allImages.length) nextIndex = 0;
      updateModalContent(nextIndex);
    };

    // Attach trigger clicks to screenshot views
    allImages.forEach((img, idx) => {
      const clickableArea = img.closest(".iphone-screen, .macbook-screen");
      if (clickableArea) {
        clickableArea.addEventListener("click", () => {
          if (window.portfolioSliders) {
            window.portfolioSliders.forEach((slider) => {
              if (slider.container.contains(img)) {
                const activeLocalIdx = slider.getCurrentIndex();
                const activeSlideImg = slider.slidesElements[activeLocalIdx].querySelector("img");
                const globalIdx = allImages.indexOf(activeSlideImg);
                openModal(globalIdx !== -1 ? globalIdx : idx);
              }
            });
          } else {
            openModal(idx);
          }
        });
      } else {
        img.closest(".mockup-slide")?.addEventListener("click", () => {
          openModal(idx);
        });
      }
    });

    closeBtn.addEventListener("click", closeModal);
    prevBtn.addEventListener("click", showPrev);
    nextBtn.addEventListener("click", showNext);
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("lightbox-content")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-active")) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev(e);
      if (e.key === "ArrowRight") showNext(e);
    });
  }
})();

