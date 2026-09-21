"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";

type CardSnapshot = { mode: string; height: number } | null;
const AuthTransitionContext = createContext<{ get: () => CardSnapshot; set: (value: CardSnapshot) => void } | null>(null);

// The auth layout survives navigation; only geometry is retained, never form data.
export function AuthTransition({ children }: { children: ReactNode }) {
  const previous = useRef<CardSnapshot>(null);
  const memory = useMemo(() => ({ get: () => previous.current, set: (value: CardSnapshot) => { previous.current = value; } }), []);
  return <AuthTransitionContext.Provider value={memory}>{children}</AuthTransitionContext.Provider>;
}

export function useAuthTransition() {
  return useContext(AuthTransitionContext);
}
