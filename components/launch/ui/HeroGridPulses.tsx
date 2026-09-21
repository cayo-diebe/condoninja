"use client";

import { useEffect, useRef } from "react";

const gridSize = 48;

/** Small, decorative light trails aligned to the hero's existing 48px grid. */
export function HeroGridPulses() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    if (!layer || !layer.animate) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const slots = Array.from(layer.querySelectorAll<HTMLElement>(".hero-grid-pulse"));
    const animations = new Map<HTMLElement, Animation>();
    let timer: number | undefined;
    let visible = false;
    let running = false;
    let previousLane = "";

    function stop() {
      running = false;
      window.clearTimeout(timer);
      timer = undefined;
      for (const animation of animations.values()) animation.cancel();
      animations.clear();
    }

    function pulse() {
      if (!running) return;
      const width = layer!.clientWidth;
      const height = layer!.clientHeight;
      // Keep the smaller layout quiet, and never accumulate animated elements.
      const limit = width < 640 ? 1 : 2;
      const slot = slots.find(item => !animations.has(item));
      if (slot && animations.size < limit && width > gridSize && height > gridSize) {
        const vertical = Math.random() < 0.5;
        const axis = vertical ? "vertical" : "horizontal";
        const laneCount = Math.floor(((vertical ? width : height) - 1) / gridSize);
        let lane = 1 + Math.floor(Math.random() * laneCount);
        if (`${axis}:${lane}` === previousLane && laneCount > 1) lane = lane % laneCount + 1;
        previousLane = `${axis}:${lane}`;

        const distance = vertical ? height : width;
        const trailLength = Math.min(240, Math.max(120, distance * 0.24));
        const trail = slot.firstElementChild as HTMLElement;
        slot.dataset.axis = axis;
        slot.style.left = vertical ? `${lane * gridSize}px` : "0";
        slot.style.top = vertical ? "0" : `${lane * gridSize}px`;
        slot.style.setProperty("--pulse-length", `${trailLength}px`);

        const transform = (position: number) => vertical
          ? `translate3d(0, ${position}px, 0)`
          : `translate3d(${position}px, 0, 0)`;
        const animation = trail.animate([
          { transform: transform(-trailLength), opacity: 0, offset: 0 },
          { opacity: 0.85, offset: 0.08 },
          { opacity: 0.85, offset: 0.92 },
          { transform: transform(distance), opacity: 0, offset: 1 },
        ], { duration: 3800 + Math.random() * 1800, easing: "linear" });
        animations.set(slot, animation);
        animation.onfinish = () => {
          animations.delete(slot);
          animation.cancel();
        };
      }
      timer = window.setTimeout(pulse, 1800 + Math.random() * 1800);
    }

    function sync() {
      const shouldRun = visible && !document.hidden && !motion.matches;
      if (!shouldRun) stop();
      else if (!running) {
        running = true;
        timer = window.setTimeout(pulse, 450);
      }
    }

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const resize = new ResizeObserver(() => {
      // Recalculate lanes and full travel distance after rotation or a layout change.
      stop();
      sync();
    });
    visibility.observe(layer);
    resize.observe(layer);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      stop();
      visibility.disconnect();
      resize.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={ref} className="hero-grid-pulses" aria-hidden="true">
      <span className="hero-grid-pulse"><span className="hero-grid-pulse-trail" /></span>
      <span className="hero-grid-pulse"><span className="hero-grid-pulse-trail" /></span>
    </div>
  );
}
