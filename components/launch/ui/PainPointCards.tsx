"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function PainPointCards({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list || !list.animate || typeof IntersectionObserver === "undefined") return;

    const cards = Array.from(list.querySelectorAll<HTMLElement>(".pain-point-card"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ready = new Map<HTMLElement, number>();
    const played = new Set<HTMLElement>();
    const animations = new Set<Animation>();
    let timer: number | undefined;

    function stop() {
      window.clearTimeout(timer);
      timer = undefined;
      for (const animation of animations) animation.cancel();
      animations.clear();
    }

    function next() {
      timer = undefined;
      if (document.hidden || motion.matches) return;
      // DOM order preserves 01 → 05 at every grid breakpoint.
      const card = cards.find(item => ready.has(item) && !played.has(item));
      if (!card) return;
      const remaining = ready.get(card)! - performance.now();
      if (remaining > 0) {
        timer = window.setTimeout(next, remaining);
        return;
      }

      const border = getComputedStyle(card).borderTopColor;
      const animation = card.animate([
        { borderColor: border, offset: 0 },
        { borderColor: "rgb(90 200 255 / 0.65)", offset: 0.45 },
        { borderColor: border, offset: 1 },
      ], { duration: 1000, easing: "ease-in-out" });
      played.add(card);
      ready.delete(card);
      animations.add(animation);
      animation.onfinish = () => {
        animations.delete(animation);
        animation.cancel();
      };
      timer = window.setTimeout(next, 200);
    }

    function sync() {
      if (document.hidden || motion.matches) stop();
      else if (timer === undefined && ready.size) timer = window.setTimeout(next, 0);
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const card = entry.target as HTMLElement;
        if (entry.isIntersecting && !played.has(card)) {
          // Let the existing staggered entrance finish before highlighting the border.
          ready.set(card, performance.now() + 1050);
        } else ready.delete(card);
      }
      sync();
    }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
    cards.forEach(card => observer.observe(card));
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      stop();
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return <ul ref={ref} className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">{children}</ul>;
}
