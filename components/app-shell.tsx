"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UserRecord } from "@/lib/types";
import { UserAvatar } from "./user-avatar";
import { prepareNinjaSound, playNinjaSound, stopNinjaSound } from "@/lib/ninja-sound";

const enabledLinks = [
  { href: "/app", label: "Visão geral", icon: "⌂" },
  { href: "/app/documents", label: "Documentos", icon: "▤" },
  { href: "/app/condominio", label: "Condomínio", icon: "⌂" },
];

const futureLinks = ["Raio-X", "Financeiro", "Contratos / Fornecedores", "Governança", "Benchmarks", "Recomendações", "Histórico / Relatórios"];
const brandHoverDelayMs = 2000;

export function AppShell({ user, onboardingPending, condominiumName, children }: { user: UserRecord; onboardingPending: boolean; condominiumName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [localPreview, setLocalPreview] = useState(false);
  useEffect(() => {
    setLocalPreview(process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname));
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [brandRevealed, setBrandRevealed] = useState(false);
  const brandHoverTimer = useRef<number | null>(null);
  const cancelBrandReveal = useCallback(() => {
    if (brandHoverTimer.current !== null) window.clearTimeout(brandHoverTimer.current);
    brandHoverTimer.current = null;
  }, []);
  const revealBrand = (target: HTMLElement, keyboard = false) => {
    cancelBrandReveal();
    if (brandRevealed || window.matchMedia("(max-width: 720px)").matches) return;
    brandHoverTimer.current = window.setTimeout(() => {
      brandHoverTimer.current = null;
      if (document.hidden || window.matchMedia("(max-width: 720px)").matches) return;
      if (target.isConnected && target.matches(keyboard ? ":focus-visible" : ":hover")) setBrandRevealed(true);
    }, brandHoverDelayMs);
  };
  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    window.addEventListener("blur", cancelBrandReveal);
    document.addEventListener("visibilitychange", cancelBrandReveal);
    media.addEventListener("change", cancelBrandReveal);
    return () => {
      cancelBrandReveal();
      window.removeEventListener("blur", cancelBrandReveal);
      document.removeEventListener("visibilitychange", cancelBrandReveal);
      media.removeEventListener("change", cancelBrandReveal);
    };
  }, [pathname, cancelBrandReveal]);
  const katanaAudio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio("/audio/05-katana.mp3");
    audio.preload = "auto";
    audio.volume = .45;
    katanaAudio.current = audio;
    return () => {
      audio.pause();
      katanaAudio.current = null;
    };
  }, []);
  useEffect(() => {
    if (!brandRevealed) return;
    // Match the text's CSS delay; reduced motion reveals it immediately.
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 2360;
    const timer = window.setTimeout(() => {
      if (window.matchMedia("(max-width: 720px)").matches) return;
      // Hover alone may not grant audio permission. Never queue a late replay.
      void katanaAudio.current?.play().catch(() => {});
    }, delay);
    return () => window.clearTimeout(timer);
  }, [brandRevealed]);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    const celebrate = () => setCelebrating(true);
    window.addEventListener("kondo:onboarding-complete", celebrate);
    window.addEventListener("kondo:prepare-sound", prepareNinjaSound);
    return () => {
      window.removeEventListener("kondo:onboarding-complete", celebrate);
      window.removeEventListener("kondo:prepare-sound", prepareNinjaSound);
    };
  }, []);
  const showCelebration = celebrating && pathname === "/app" && !user.avatarVersion && !user.ninjaRed;
  useEffect(() => {
    const timer = showCelebration ? window.setTimeout(playNinjaSound, 2500) : undefined;
    return () => {
      window.clearTimeout(timer);
      stopNinjaSound();
    };
  }, [showCelebration]);
  const sidebar = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const resize = () => { if (!media.matches) setMenuOpen(false); };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const triggerElement = trigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter((element) => element.getClientRects().length > 0);
    const focusFirst = () => {
      // Do not steal focus if the user already chose a control during the animation.
      if (!sidebar.current?.contains(document.activeElement)) focusable()[0]?.focus();
    };
    const focusFrame = requestAnimationFrame(focusFirst);
    const panel = sidebar.current;
    const afterOpening = (event: TransitionEvent) => {
      if (event.target === panel && event.propertyName === "transform") focusFirst();
    };
    panel?.addEventListener("transitionend", afterOpening);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); }
      if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(focusFrame);
      panel?.removeEventListener("transitionend", afterOpening);
      document.removeEventListener("keydown", keydown);
      triggerElement?.focus();
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <button ref={trigger} className="mobile-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="app-sidebar" onClick={() => setMenuOpen(true)} inert={menuOpen}><span aria-hidden="true">☰</span> Menu</button>
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <aside id="app-sidebar" ref={sidebar} className={`app-sidebar${menuOpen ? " is-open" : ""}`} role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen || undefined} aria-label={menuOpen ? "Menu de navegação" : undefined} onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMenuOpen(false); }}>
        <button className="mobile-menu-close" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}>×</button>
        <div className="sidebar-brand">
          <Link className={`brand${brandRevealed ? " is-revealed" : ""}`} href="/app"
            onFocus={event => { if (event.currentTarget.matches(":focus-visible")) revealBrand(event.currentTarget, true); }}
            onBlur={cancelBrandReveal}>
            <span className="brand-mark" aria-hidden="true"
              onPointerEnter={event => { if (event.pointerType === "mouse") revealBrand(event.currentTarget); }}
              onPointerLeave={cancelBrandReveal} onPointerCancel={cancelBrandReveal}>C</span>
            <span className="brand-name">Condo Ninja</span>
          </Link>
        </div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {enabledLinks.filter((link) => !onboardingPending || link.href === "/app").map((link) => {
            const active = link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);
            return <Link className="nav-link" aria-current={active ? "page" : undefined} href={link.href} key={link.href}><span aria-hidden="true">{link.icon}</span>{link.label}{link.href === "/app" && onboardingPending && <span className="nav-badge nav-badge-pending" title="Conclua as boas-vindas para liberar a visão geral"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="7" width="10" height="7" rx="2" /><path d="M5 7V5a3 3 0 0 1 6 0v2" /></svg>Pendente</span>}</Link>;
          })}
          {futureLinks.map((label) => <span className="nav-disabled" aria-disabled="true" key={label}><span aria-hidden="true">◇</span>{label}</span>)}
          <Link className="nav-link" href="/app/convide" aria-current={pathname === "/app/convide" ? "page" : undefined}><span aria-hidden="true">↗</span>Convide seus vizinhos</Link>
        </nav>
        <div className="sidebar-spacer" />
        <Link className="user-chip" href="/app/conta" aria-label={`Conta de ${user.name}`} aria-current={pathname === "/app/conta" ? "page" : undefined}>
          <span className={`sidebar-avatar${showCelebration ? " ninja-awakening" : ""}`}>
            <UserAvatar user={{ ...user, requiredDocumentsComplete: !onboardingPending }} />
            {showCelebration && <span className="ninja-white-overlay"><UserAvatar user={{ ...user, requiredDocumentsComplete: false }} /></span>}
          </span>
          <div className="user-identity">
          <strong>{user.name}</strong>
          <span title={condominiumName}>{condominiumName}</span>
          </div>
        </Link>
      </aside>
      <div className="app-content" inert={menuOpen}>
        <main className="app-main">{children}</main>
        {showCelebration && <span className="mobile-ninja-celebration" aria-hidden="true"><span className="sidebar-avatar ninja-awakening"><UserAvatar user={{ ...user, requiredDocumentsComplete: true }} /><span className="ninja-white-overlay"><UserAvatar user={{ ...user, requiredDocumentsComplete: false }} /></span></span></span>}
        {pathname === "/app" && <button type="button" className="ninja-test-toggle" aria-pressed={celebrating} onClick={() => { if (!celebrating) prepareNinjaSound(); setCelebrating(value => !value); }} title="Ativar/desativar teste da transição do ninja">{celebrating ? "Desativar efeito" : "Testar ninja"}</button>}
        {localPreview && <button type="button" className="ninja-test-toggle ninja-red-test-toggle" onClick={() => {
          setCelebrating(false);
          window.dispatchEvent(new CustomEvent("condo:test-red-ninja", { detail: user }));
        }} title="Simular o ninja vermelho sem alterar o banco">Começar Ninja vermelho</button>}
      </div>
    </div>
  );
}
