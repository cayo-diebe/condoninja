"use client";

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { IconLock, IconSearch } from "@/components/launch/ui/icons";

export function DiscoveryCard({ title, text, index }: { title: string; text: string; index: number }) {
  const contentId = useId();
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const pointRef = useRef({ x: 0, y: 0 });
  const pointerTypeRef = useRef("mouse");
  const revealed = hovered || expanded;

  const hideLens = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    setHovered(false);
  }, []);

  useEffect(() => {
    // Never leave a spotlight at stale coordinates after scrolling or switching tabs.
    window.addEventListener("scroll", hideLens, { passive: true, capture: true });
    window.addEventListener("resize", hideLens);
    window.addEventListener("blur", hideLens);
    document.addEventListener("visibilitychange", hideLens);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("scroll", hideLens, true);
      window.removeEventListener("resize", hideLens);
      window.removeEventListener("blur", hideLens);
      document.removeEventListener("visibilitychange", hideLens);
    };
  }, [hideLens]);

  function moveLens(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") return;
    pointRef.current = { x: event.clientX, y: event.clientY };
    setExpanded(false);
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const card = cardRef.current;
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      const x = pointRef.current.x - bounds.left;
      const y = pointRef.current.y - bounds.top;
      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
        hideLens();
        return;
      }
      card.style.setProperty("--discovery-x", `${x}px`);
      card.style.setProperty("--discovery-y", `${y}px`);
      setHovered(true);
    });
  }

  return (
    <div ref={cardRef} className="discovery-card" data-lens={hovered && !expanded} data-expanded={expanded}>
      <button
        type="button"
        className="discovery-card-trigger"
        aria-label={`Revelar descoberta ${index + 1}`}
        aria-expanded={revealed}
        aria-controls={contentId}
        onPointerEnter={moveLens}
        onPointerMove={moveLens}
        onPointerLeave={hideLens}
        onPointerCancel={hideLens}
        onPointerDown={(event) => { pointerTypeRef.current = event.pointerType; }}
        onClick={(event) => {
          // Only touch/pen and keyboard open the whole card for comfortable reading.
          // A mouse click must not bypass the circular reveal.
          if (event.detail === 0 || pointerTypeRef.current !== "mouse") {
            hideLens();
            setExpanded((value) => !value);
          }
        }}
        onBlur={() => { hideLens(); setExpanded(false); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            hideLens();
            setExpanded(false);
          }
        }}
      >
        <span className="discovery-card-cover" aria-hidden="true">
          <span className="discovery-card-lock"><IconLock size={26} /></span>
        </span>
      </button>

      <div id={contentId} className="discovery-card-content flex h-full flex-col p-6" aria-hidden={!revealed}>
        <span className="text-signal-500"><IconSearch size={20} /></span>
        <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">{text}</p>
      </div>
      <span className="discovery-card-lens" aria-hidden="true" />
    </div>
  );
}
