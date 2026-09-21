(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu]");
  const nav = document.querySelector("[data-nav]");

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("is-open", !open);
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }));

  const revealNodes = [...document.querySelectorAll(".reveal")];
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.12 });
    revealNodes.forEach((node) => revealObserver.observe(node));
  }

  const sectionLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach((link) => link.removeAttribute("aria-current"));
      const active = sectionLinks.find((link) => link.getAttribute("href") === `#${visible.target.id}`);
      active?.setAttribute("aria-current", "true");
    }, { rootMargin: "-20% 0px -65%", threshold: [0.01, 0.2, 0.5] });
    sections.forEach((section) => navObserver.observe(section));
  }

  const symbolSection = document.querySelector(".symbol-section");
  document.querySelector("[data-scan]")?.addEventListener("click", () => {
    symbolSection?.classList.remove("is-scanning");
    requestAnimationFrame(() => {
      symbolSection?.classList.add("is-scanning");
      window.setTimeout(() => symbolSection?.classList.remove("is-scanning"), 1500);
    });
  });

  const canvas = document.querySelector("[data-signal-canvas]");
  if (!canvas || reducedMotion) return;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  let width = 0;
  let height = 0;
  let points = [];
  let animationFrame = 0;
  const pointer = { x: -1000, y: -1000, active: false };

  const rebuild = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(22, Math.min(54, Math.round(width / 34)));
    points = Array.from({ length: count }, (_, index) => ({
      x: (index * 149.7) % width,
      y: (index * 83.3 + 47) % height,
      phase: index * 0.47,
      radius: index % 9 === 0 ? 2.2 : 1.3,
    }));
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    const t = time * 0.00018;
    const moved = points.map((point) => ({
      ...point,
      px: point.x + Math.sin(t + point.phase) * 18,
      py: point.y + Math.cos(t * 0.8 + point.phase) * 13,
    }));

    for (let i = 0; i < moved.length; i += 1) {
      for (let j = i + 1; j < moved.length; j += 1) {
        const a = moved[i];
        const b = moved[j];
        const distance = Math.hypot(a.px - b.px, a.py - b.py);
        if (distance > 155) continue;
        const alpha = (1 - distance / 155) * 0.12;
        context.strokeStyle = `rgba(90,200,255,${alpha})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(a.px, a.py);
        context.lineTo(b.px, b.py);
        context.stroke();
      }
    }

    moved.forEach((point) => {
      const proximity = pointer.active ? Math.max(0, 1 - Math.hypot(point.px - pointer.x, point.py - pointer.y) / 230) : 0;
      context.fillStyle = `rgba(90,200,255,${0.18 + proximity * 0.58})`;
      context.beginPath();
      context.arc(point.px, point.py, point.radius + proximity * 2.2, 0, Math.PI * 2);
      context.fill();
    });

    animationFrame = requestAnimationFrame(draw);
  };

  const updatePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  };

  canvas.addEventListener("pointermove", updatePointer, { passive: true });
  canvas.addEventListener("pointerleave", () => { pointer.active = false; }, { passive: true });
  window.addEventListener("resize", rebuild, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(animationFrame);
    else animationFrame = requestAnimationFrame(draw);
  });
  rebuild();
  animationFrame = requestAnimationFrame(draw);
})();
