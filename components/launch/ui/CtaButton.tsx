"use client";
import Link from "next/link";
import { Button } from "./Button";

export function CtaButton({ location, size = "md", variant = "primary", className, children, onNavigate }: {
  location: string; size?: "sm" | "md" | "lg"; variant?: "primary" | "secondary" | "ghost";
  className?: string; children?: React.ReactNode; onNavigate?: () => void;
}) {
  return <Button as={Link} href="/cadastro" data-cta-location={location} size={size} variant={variant} className={className} onNavigate={onNavigate}>
    {children ?? "Quero meu Raio-X gratuito"}
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
  </Button>;
}
