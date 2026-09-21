"use client";

import { useEffect, useRef } from "react";

/** Decorative only: the section keeps normal pointer, keyboard and form behavior. */
export function NinjaGridGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const section = layer?.parentElement;
    if (!layer || !section) return;

    const motion = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let lastTime = 0;
    let active = false;
    let clientX = 0;
    let clientY = 0;
    let x = 0;
    let y = 0;

    function hide() {
      active = false;
      layer!.removeAttribute("data-active");
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }

    function draw(time: number) {
      frame = 0;
      if (!active) return;

      const bounds = section!.getBoundingClientRect();
      const targetX = clientX - bounds.left;
      const targetY = clientY - bounds.top;
      if (targetX < 0 || targetY < 0 || targetX > bounds.width || targetY > bounds.height) {
        hide();
        return;
      }

      // Time-based easing feels the same on 60 Hz and high-refresh displays.
      const elapsed = lastTime ? Math.min(time - lastTime, 64) : 16;
      const ease = 1 - Math.exp(-elapsed / 90);
      lastTime = time;
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < 0.2;
      if (settled) {
        x = targetX;
        y = targetY;
      }
      layer!.style.setProperty("--ninja-x", `${x}px`);
      layer!.style.setProperty("--ninja-y", `${y}px`);
      if (!settled) frame = requestAnimationFrame(draw);
      else lastTime = 0;
    }

    function schedule() {
      if (active && !frame) frame = requestAnimationFrame(draw);
    }

    function move(event: PointerEvent) {
      if (!motion.matches || event.pointerType !== "mouse" || document.hidden) return;
      clientX = event.clientX;
      clientY = event.clientY;
      if (!active) {
        const bounds = section!.getBoundingClientRect();
        x = clientX - bounds.left;
        y = clientY - bounds.top;
        layer!.style.setProperty("--ninja-x", `${x}px`);
        layer!.style.setProperty("--ninja-y", `${y}px`);
        layer!.setAttribute("data-active", "true");
        active = true;
      }
      schedule();
    }

    section.addEventListener("pointerenter", move);
    section.addEventListener("pointermove", move, { passive: true });
    section.addEventListener("pointerleave", hide);
    section.addEventListener("pointercancel", hide);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    motion.addEventListener("change", hide);

    return () => {
      hide();
      section.removeEventListener("pointerenter", move);
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", hide);
      section.removeEventListener("pointercancel", hide);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
      motion.removeEventListener("change", hide);
    };
  }, []);

  return (
    <div ref={ref} className="ninja-grid-glow" aria-hidden="true">
      <div className="ninja-grid-glow-lines" />
      <div className="ninja-grid-glow-cursor">
        <div className="ninja-grid-glow-halo" />
        <div className="ninja-grid-glow-disc">
          <img src="/condo-brand-transparent.png" alt="" width={64} height={78} loading="lazy" decoding="async" draggable={false} />
        </div>
      </div>
    </div>
  );
}
