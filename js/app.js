/* ═══════════════════════════════════════════════════
   THE URBAN SOLUTIONS — Scroll-Driven Animation Engine
   Lenis + GSAP + ScrollTrigger + Canvas Frame Rendering
   ═══════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── Configuration ──
  const FRAME_COUNT = 229;
  const isMobile = window.innerWidth <= 768;
  const FRAME_SPEED = isMobile ? 2.5 : 2.0;
  const IMAGE_SCALE = 0.85;
  const FRAME_PATH = (i) => `frames/frame_${String(i).padStart(4, "0")}.webp`;

  // ── DOM References ──
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");
  const heroSection = document.getElementById("hero-standalone");
  const canvasWrap = document.getElementById("canvas-wrap");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const scrollContainer = document.getElementById("scroll-container");
  const darkOverlay = document.getElementById("dark-overlay");

  // ── State ──
  const frames = [];
  let currentFrame = 0;
  let bgColor = "#0d0d0d";
  let allFramesLoaded = false;

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
  // 2. CANVAS SETUP
  // ═══════════════════════════════════════════════════
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpr, dpr);
    if (frames[currentFrame]) drawFrame(currentFrame);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // ── Background Color Sampling ──
  function sampleBgColor(img) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(img, 0, 0);

    // Sample corner pixels
    const samples = [
      tempCtx.getImageData(2, 2, 1, 1).data,
      tempCtx.getImageData(img.naturalWidth - 3, 2, 1, 1).data,
      tempCtx.getImageData(2, img.naturalHeight - 3, 1, 1).data,
      tempCtx.getImageData(img.naturalWidth - 3, img.naturalHeight - 3, 1, 1).data,
    ];
    const avg = samples.reduce(
      (acc, s) => [acc[0] + s[0], acc[1] + s[1], acc[2] + s[2]],
      [0, 0, 0]
    );
    return `rgb(${Math.round(avg[0] / 4)},${Math.round(avg[1] / 4)},${Math.round(avg[2] / 4)})`;
  }

  // ── Draw Frame (Padded Cover) ──
  function drawFrame(index) {
    const img = frames[index];
    if (!img) return;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ═══════════════════════════════════════════════════
  // 3. FRAME PRELOADER (Two-Phase)
  // ═══════════════════════════════════════════════════
  function loadFrame(index) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        frames[index] = img;
        // Sample bg every 20 frames
        if (index % 20 === 0) {
          try { bgColor = sampleBgColor(img); } catch (e) { /* cross-origin safety */ }
        }
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Frame ${index} failed`));
      img.src = FRAME_PATH(index);
    });
  }

  async function preloadFrames() {
    let loaded = 0;
    const updateProgress = () => {
      const pct = Math.round((loaded / FRAME_COUNT) * 100);
      loaderBar.style.width = pct + "%";
      loaderPercent.textContent = pct + "%";
    };

    // Phase 1: Load first 10 frames quickly
    const phase1 = [];
    for (let i = 1; i <= Math.min(10, FRAME_COUNT); i++) {
      phase1.push(
        loadFrame(i).then(() => {
          loaded++;
          updateProgress();
        })
      );
    }
    await Promise.all(phase1);
    drawFrame(1); // Show first frame immediately

    // Phase 2: Load remaining frames in batches of 15
    const batchSize = 15;
    for (let start = 11; start <= FRAME_COUNT; start += batchSize) {
      const batch = [];
      for (let i = start; i < start + batchSize && i <= FRAME_COUNT; i++) {
        batch.push(
          loadFrame(i).then(() => {
            loaded++;
            updateProgress();
          })
        );
      }
      await Promise.all(batch);
    }

    allFramesLoaded = true;
  }

  // ═══════════════════════════════════════════════════
  // 4. HERO ENTRANCE ANIMATION
  // ═══════════════════════════════════════════════════
  function animateHero() {
    const tl = gsap.timeline();
    tl.to(heroSection.querySelector(".section-label"), {
      opacity: 1, y: 0, duration: 0.6, ease: "power3.out"
    })
    .to(heroSection.querySelectorAll(".word"), {
      opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: "power3.out"
    }, "-=0.3")
    .to(heroSection.querySelector(".hero-tagline"), {
      opacity: 1, y: 0, duration: 0.7, ease: "power3.out"
    }, "-=0.4");
  }

  // ═══════════════════════════════════════════════════
  // 5. CIRCLE-WIPE HERO → CANVAS TRANSITION
  // ═══════════════════════════════════════════════════
  function initHeroTransition() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        
        // Hero fades out slower to merge with the first section content
        // Desktop: Gone by p=0.12 (approx 12% scroll progress)
        // Mobile: Gone by p=0.08
        const fadeMultiplier = isMobile ? 12 : 8;
        heroSection.style.opacity = Math.max(0, 1 - p * fadeMultiplier);

        // Canvas reveals via expanding circle
        // On mobile: starts immediately with no offset
        const wipeOffset = isMobile ? 0 : 0.003;
        const wipeDuration = isMobile ? 0.025 : 0.04;
        const wipeProgress = Math.min(1, Math.max(0, (p - wipeOffset) / wipeDuration));
        const radius = wipeProgress * 75;
        canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
      },
    });
  }

  // ═══════════════════════════════════════════════════
  // 6. FRAME-TO-SCROLL BINDING
  // ═══════════════════════════════════════════════════
  function initFrameScroll() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(
          Math.floor(accelerated * (FRAME_COUNT - 1)) + 1,
          FRAME_COUNT
        );
        if (index !== currentFrame) {
          currentFrame = index;
          requestAnimationFrame(() => drawFrame(currentFrame));
        }
      },
    });
  }

  // ═══════════════════════════════════════════════════
  // 7. SECTION ANIMATION SYSTEM
  // ═══════════════════════════════════════════════════
  function setupSectionAnimation(section) {
    const type = section.dataset.animation;
    const persist = section.dataset.persist === "true";
    const enter = parseFloat(section.dataset.enter) / 100;
    const leave = parseFloat(section.dataset.leave) / 100;
    const children = section.querySelectorAll(
      ".section-label, .section-heading, .section-body, .section-note, .cta-button, .stat"
    );

    const tl = gsap.timeline({ paused: true });

    switch (type) {
      case "fade-up":
        tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" });
        break;
      case "slide-left":
        tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
        break;
      case "slide-right":
        tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
        break;
      case "scale-up":
        tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: "power2.out" });
        break;
      case "rotate-in":
        tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" });
        break;
      case "stagger-up":
        tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" });
        break;
      case "clip-reveal":
        tl.from(children, { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.15, duration: 1.2, ease: "power4.inOut" });
        break;
    }

    let isPlayed = false;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: false,
      onUpdate: (self) => {
        const p = self.progress;
        const fadeMargin = 0.02;

        if (p >= enter && p <= leave) {
          section.classList.add("is-visible");
          if (!isPlayed) {
            tl.play();
            isPlayed = true;
          }
        } else if (persist && p > leave) {
          // Keep visible
          section.classList.add("is-visible");
        } else {
          section.classList.remove("is-visible");
          if (isPlayed && !persist) {
            tl.reverse();
            isPlayed = false;
          }
        }
      },
    });
  }

  function initSections() {
    document.querySelectorAll(".scroll-section").forEach((section) => {
      // On mobile, shift all enter/leave values earlier so animations
      // start as soon as the user begins scrolling
      if (isMobile) {
        const origEnter = parseFloat(section.dataset.enter);
        const origLeave = parseFloat(section.dataset.leave);
        // Scale down by ~40% so sections appear much sooner
        section.dataset.enter = String(Math.max(0, origEnter * 0.4));
        section.dataset.leave = String(origLeave * 0.55);
      }
      setupSectionAnimation(section);
    });
  }

  // ═══════════════════════════════════════════════════
  // 8. COUNTER ANIMATIONS
  // ═══════════════════════════════════════════════════
  function initCounters() {
    document.querySelectorAll(".stat-number").forEach((el) => {
      const target = parseFloat(el.dataset.value);
      const decimals = parseInt(el.dataset.decimals || "0");
      const obj = { val: 0 };

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const statsSection = el.closest(".scroll-section");
          if (statsSection && statsSection.classList.contains("is-visible")) {
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
          }
        },
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // 9. HORIZONTAL MARQUEE
  // ═══════════════════════════════════════════════════
  function initMarquees() {
    document.querySelectorAll(".marquee-wrap").forEach((el) => {
      const speed = parseFloat(el.dataset.scrollSpeed) || -25;
      let enter = parseFloat(el.dataset.enter) / 100;
      let leave = parseFloat(el.dataset.leave) / 100;
      const fadeRange = 0.04;

      // Shift marquee timing earlier on mobile
      if (isMobile) {
        enter = enter * 0.4;
        leave = leave * 0.55;
      }

      gsap.to(el.querySelector(".marquee-text"), {
        xPercent: speed,
        ease: "none",
        scrollTrigger: {
          trigger: scrollContainer,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      // Fade marquee in/out
      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          let opacity = 0;
          if (p >= enter - fadeRange && p <= enter) {
            opacity = (p - (enter - fadeRange)) / fadeRange;
          } else if (p > enter && p < leave) {
            opacity = 1;
          } else if (p >= leave && p <= leave + fadeRange) {
            opacity = 1 - (p - leave) / fadeRange;
          }
          el.style.opacity = opacity;
        },
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // 10. DARK OVERLAY
  // ═══════════════════════════════════════════════════
  function initDarkOverlay() {
    const enter = isMobile ? 0.17 : 0.42;
    const leave = isMobile ? 0.34 : 0.62;
    const fadeRange = 0.04;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;
        if (p >= enter - fadeRange && p <= enter) {
          opacity = ((p - (enter - fadeRange)) / fadeRange) * 0.9;
        } else if (p > enter && p < leave) {
          opacity = 0.9;
        } else if (p >= leave && p <= leave + fadeRange) {
          opacity = 0.9 * (1 - (p - leave) / fadeRange);
        }
        darkOverlay.style.opacity = opacity;
      },
    });
  }

  // ═══════════════════════════════════════════════════
  // 11. BELOW-SCROLL REVEAL ANIMATIONS
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
    const cards = document.querySelectorAll(".team-card, .story-card");

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
  // 12. MOBILE MENU
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

    await preloadFrames();

    // Hide loader
    loader.classList.add("hidden");

    // Re-enable scroll
    lenis.start();

    // Animate hero entrance
    animateHero();

    // Initialize all scroll-driven systems
    initHeroTransition();
    initFrameScroll();
    initSections();
    initCounters();
    initMarquees();
    initDarkOverlay();
    initBelowScrollAnimations();
    initMobileMenu();
  }

  // Start
  init();
})();
