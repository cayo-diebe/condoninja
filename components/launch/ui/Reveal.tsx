"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

/**
 * Revela o conteúdo quando entra na viewport (uma vez).
 * Sem JS o conteúdo fica visível; com `prefers-reduced-motion` não anima.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  /** atraso em ms, útil para escalonar cards */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    el.classList.add("is-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    io.observe(el);
    return () => { io.disconnect(); el.classList.remove("is-ready"); };
  }, []);

  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement> & React.Ref<HTMLLIElement>}
      className={`reveal ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
