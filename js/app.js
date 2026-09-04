/* ═══════════════════════════════════════════════════
   THE URBAN SOLUTIONS — Scroll-Driven Animation Engine
   Lenis + GSAP + ScrollTrigger
   ═══════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── Configuration ──
  const isMobile = window.innerWidth <= 768;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── DOM References ──
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");

  // ═══════════════════════════════════════════════════
  // 1. LENIS SMOOTH SCROLL
  // ═══════════════════════════════════════════════════
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ═══════════════════════════════════════════════════
  // 2. HERO IMAGE PRELOADER
  // ═══════════════════════════════════════════════════
  function preloadHeroImages() {
    const imgs = Array.from(document.querySelectorAll(".hero-slide-img"));
    if (!imgs.length) return Promise.resolve();

    let loaded = 0;
    const total = imgs.length;
    const updateProgress = () => {
      loaded++;
      const pct = Math.round((loaded / total) * 100);
      loaderBar.style.width = pct + "%";
      loaderPercent.textContent = pct + "%";
    };

    return Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              updateProgress();
              resolve();
              return;
            }
            img.addEventListener("load", () => { updateProgress(); resolve(); }, { once: true });
            img.addEventListener("error", () => { updateProgress(); resolve(); }, { once: true });
          })
      )
    );
  }

  // ═══════════════════════════════════════════════════
  // 3. HERO PROJECT SLIDER (Scroll-Pinned)
  // ═══════════════════════════════════════════════════
  function initHeroSlider() {
    const heroSlider = document.getElementById("hero-slider");
    const mediaEls = Array.from(document.querySelectorAll(".hero-slide-media"));
    const contentEls = Array.from(document.querySelectorAll(".hero-slide-content"));
    const dots = Array.from(document.querySelectorAll(".hero-dot"));
    const prevBtn = document.getElementById("hero-prev");
    const nextBtn = document.getElementById("hero-next");
    if (!heroSlider || !mediaEls.length) return;

    const slideCount = mediaEls.length;
    let currentIndex = 0;

    // Text swaps discretely (class toggle, CSS handles the quick fade) so
    // two headings are never visible at once. Background images crossfade
    // continuously in the full experience — see onUpdate below.
    function setActiveUI(index) {
      currentIndex = index;
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
      });
      contentEls.forEach((el, i) => el.classList.toggle("is-active", i === index));
    }

    // ── Reduced motion: no pin, no scrub — instant/faded slide swap ──
    if (prefersReducedMotion) {
      document.documentElement.classList.add("reduced-motion");

      function goTo(index) {
        const clamped = Math.max(0, Math.min(index, slideCount - 1));
        mediaEls.forEach((el, i) => el.classList.toggle("is-active", i === clamped));
        setActiveUI(clamped);
      }
      dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));
      prevBtn.addEventListener("click", () => goTo(currentIndex - 1));
      nextBtn.addEventListener("click", () => goTo(currentIndex + 1));
      return;
    }

    // ── Full experience: pin the hero and scrub between slides ──
    const vhPerSlide = isMobile ? 0.75 : 1;

    const st = ScrollTrigger.create({
      trigger: heroSlider,
      start: "top top",
      end: () => "+=" + window.innerHeight * (slideCount - 1) * vhPerSlide,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const raw = self.progress * (slideCount - 1);
        const lower = Math.floor(raw);
        const upper = Math.min(lower + 1, slideCount - 1);
        const frac = raw - lower;

        mediaEls.forEach((el, i) => {
          let opacity = 0;
          if (i === lower) opacity = 1 - frac;
          else if (i === upper && upper !== lower) opacity = frac;
          el.style.opacity = opacity;
        });

        const activeIndex = Math.round(raw);
        if (activeIndex !== currentIndex) setActiveUI(activeIndex);
      },
    });

    function goTo(index) {
      const clamped = Math.max(0, Math.min(index, slideCount - 1));
      const target = st.start + (clamped / (slideCount - 1)) * (st.end - st.start);
      lenis.scrollTo(target, { duration: 1.1 });
    }

    dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));
    prevBtn.addEventListener("click", () => goTo(currentIndex - 1));
    nextBtn.addEventListener("click", () => goTo(currentIndex + 1));
  }

  // ═══════════════════════════════════════════════════
  // 4. COUNTER ANIMATIONS
  // ═══════════════════════════════════════════════════
  function initCounters() {
    const counters = document.querySelectorAll(".stat-number");
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.value);
          const decimals = parseInt(el.dataset.decimals || "0");
          const obj = { val: 0 };

          gsap.to(obj, {
            val: target,
            duration: 2,
            ease: "power1.out",
            onUpdate: () => {
              el.textContent = decimals === 0
                ? Math.round(obj.val)
                : obj.val.toFixed(decimals);
            },
          });

          observer.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  // ═══════════════════════════════════════════════════
  // 5. BELOW-HERO REVEAL ANIMATIONS
  // ═══════════════════════════════════════════════════
  function initBelowScrollAnimations() {
    // Reveal headings and subheadings
    const revealElements = document.querySelectorAll(
      ".section-label-static, .page-heading, .page-subheading"
    );
    revealElements.forEach((el) => {
      el.classList.add("reveal-up");
    });

    // Cards get staggered reveal
    const cards = document.querySelectorAll(".stat, .team-card, .story-card");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger children if parent container
            if (entry.target.classList.contains("reveal-up")) {
              entry.target.classList.add("revealed");
            } else {
              // Add delay for staggered card reveal
              const parent = entry.target.parentElement;
              const siblings = Array.from(parent.children);
              const index = siblings.indexOf(entry.target);
              entry.target.style.transitionDelay = `${index * 0.12}s`;
              entry.target.classList.add("revealed");
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
    cards.forEach((el) => observer.observe(el));
  }

  // ═══════════════════════════════════════════════════
  // 6. MOBILE MENU
  // ═══════════════════════════════════════════════════
  function initMobileMenu() {
    const btn = document.getElementById("mobile-menu-btn");
    const megaMenu = document.getElementById("mega-menu");
    if (!btn || !megaMenu) return;

    let isOpen = false;

    function openMenu() {
      isOpen = true;
      btn.classList.add("is-open");
      megaMenu.style.display = "flex";
      // Force reflow for transition
      megaMenu.offsetHeight;
      megaMenu.classList.add("is-open");
      document.body.style.overflow = "hidden";
      lenis.stop();
    }

    function closeMenu() {
      isOpen = false;
      btn.classList.remove("is-open");
      megaMenu.classList.remove("is-open");
      document.body.style.overflow = "";
      lenis.start();
      // Wait for transition then hide
      setTimeout(() => {
        if (!isOpen) megaMenu.style.display = "none";
      }, 400);
    }

    btn.addEventListener("click", () => {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on link click and smooth scroll
    megaMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (e) => {
        closeMenu();
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            setTimeout(() => {
              lenis.scrollTo(target, { offset: 0, duration: 1.2 });
            }, 450);
          }
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════
  async function init() {
    // Disable scroll during load
    lenis.stop();

    await preloadHeroImages();

    // Hide loader
    loader.classList.add("hidden");

    // Re-enable scroll
    lenis.start();

    // Initialize all scroll-driven systems
    initHeroSlider();
    initCounters();
    initBelowScrollAnimations();
    initMobileMenu();
  }

  // Start
  init();
})();
