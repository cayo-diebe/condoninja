"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { Button } from "./Button";

const targetId = "comecar";
const cardId = "raio-x-gratuito";

export function SignupAnchorButton({ location, size = "md", className, children, onNavigate }: {
  location: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
  onNavigate?: () => void;
}) {
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), []);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    // Preserve normal anchor behavior for new-tab/window gestures and without JS.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(targetId);
    const card = document.getElementById(cardId);
    if (!target || !card) return;
    event.preventDefault();
    cancel.current();
    onNavigate?.();

    let frame = 0;
    let pulse: Animation | undefined;
    const stopWatching = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("keydown", interrupt);
    };
    const interrupt = () => { stopWatching(); pulse?.cancel(); };
    cancel.current = interrupt;

    // Let the mobile menu close and release its body scroll lock first.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (window.location.hash !== `#${targetId}`) {
          window.history.pushState(null, "", `#${targetId}`);
        }
        // Start above the form so the introduction remains visible on stacked layouts.
        target.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
        window.addEventListener("wheel", interrupt, { passive: true });
        window.addEventListener("touchstart", interrupt, { passive: true });
        window.addEventListener("keydown", interrupt);

        const startedAt = performance.now();
        const reveal = card.closest(".reveal");
        let previousTop = target.getBoundingClientRect().top;
        let settledFrames = 0;

        function afterArrival(now: number) {
          if (!target?.isConnected || !card?.isConnected) { stopWatching(); return; }
          const rect = target.getBoundingClientRect();
          settledFrames = Math.abs(rect.top - previousTop) < 0.5 ? settledFrames + 1 : 0;
          previousTop = rect.top;
          const cardRect = card.getBoundingClientRect();
          const cardVisible = cardRect.top < window.innerHeight && cardRect.bottom > 64;
          const isRevealed = !reveal || Number(getComputedStyle(reveal).opacity) >= 0.99;
          const settled = now - startedAt >= 180 && settledFrames >= 5 && (!cardVisible || isRevealed);
          if (!settled && now - startedAt < 3000) {
            frame = requestAnimationFrame(afterArrival);
            return;
          }
          stopWatching();
          if (rect.top >= window.innerHeight || rect.bottom <= 64) return;
          // Keep keyboard navigation at the section without scrolling down to the form.
          target.focus({ preventScroll: true });
          if (reducedMotion || !cardVisible || !isRevealed) return;
          for (const animation of card.getAnimations()) {
            if (animation.id === "signup-border-pulse") animation.cancel();
          }
          pulse = card.animate([
            { borderColor: "#23385f", offset: 0 },
            { borderColor: "#427b9f", offset: 0.45 },
            { borderColor: "#23385f", offset: 1 },
          ], { id: "signup-border-pulse", duration: 1000, easing: "ease-in-out" });
        }
        frame = requestAnimationFrame(afterArrival);
      });
    });
  }

  return <Button as="a" href={`#${targetId}`} onClick={navigate} data-cta-location={location}
    size={size} className={className}>
    {children ?? "Quero meu Raio-X gratuito"}
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
  </Button>;
}
