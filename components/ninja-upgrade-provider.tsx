"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { UserRecord } from "@/lib/types";

type Upgrade = { userId: string; red: boolean; active: boolean; custom: boolean };
const UpgradeContext = createContext<Upgrade | null>(null);
export const useNinjaUpgrade = () => useContext(UpgradeContext);

// The root layout keeps this mounted across both public and restricted pages.
export function NinjaUpgradeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [upgrade, setUpgrade] = useState<Upgrade | null>(null);
  const [preview, setPreview] = useState<Upgrade | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) return;
    const test = (event: Event) => {
      const user = (event as CustomEvent<UserRecord>).detail;
      setPreview(value => value ? null : { userId: user.id, red: true, active: true, custom: !!user.avatarVersion });
    };
    window.addEventListener("condo:test-red-ninja", test);
    return () => window.removeEventListener("condo:test-red-ninja", test);
  }, []);
  const visibleUpgrade = preview ?? upgrade;
  const claiming = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (document.hidden || claiming.current) return;
      try {
        const response = await fetch("/api/account/ninja-upgrade", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const { user } = await response.json() as { user: UserRecord | null };
        if (cancelled) return;
        if (!user) { setUpgrade(null); return; }
        if (!user.ninjaUpgradePending) {
          setUpgrade(previous => previous?.userId === user.id && previous.active ? previous : { userId: user.id, red: !!user.ninjaRed, active: false, custom: !!user.avatarVersion });
          return;
        }
        // Do not consume the flag if the visual cannot be loaded or the tab is hidden.
        await Promise.all(["/default-avatar-ninja-red.png", "/default-avatar-ninja.png"].map(async src => {
          const image = new Image(); image.src = src; await image.decode();
        }));
        if (cancelled || document.hidden || claiming.current) return;
        claiming.current = true;
        try {
          const claim = await fetch("/api/account/ninja-upgrade", { method: "POST" });
          if (!claim.ok) return;
          const { present } = await claim.json();
          // Finish even after client navigation: this provider survives route changes.
          setUpgrade({ userId: user.id, red: true, active: !!present, custom: !!user.avatarVersion });
        } finally { claiming.current = false; }
      } catch { /* Keep the upgrade pending on recoverable network/image failures. */ }
    };
    void check();
    document.addEventListener("visibilitychange", check);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", check); };
  }, [pathname]);

  useEffect(() => {
    if (!visibleUpgrade?.active) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sound = new Audio("/audio/11-reflexao.mp3");
    sound.volume = .45;
    sound.preload = "auto";
    // Attempt only at reveal time. Autoplay denial must never queue a later sound.
    const audioTimer = window.setTimeout(() => {
      if (!document.hidden && !reduced) void sound.play().catch(() => {});
    }, 2500);
    const finish = window.setTimeout(() => {
      if (preview) setPreview(null);
      else setUpgrade(value => value ? { ...value, active: false } : value);
    }, reduced ? 100 : 5700);
    return () => { clearTimeout(audioTimer); clearTimeout(finish); sound.pause(); };
  }, [visibleUpgrade?.active, preview]);

  const inApp = pathname === "/app" || pathname.startsWith("/app/");
  return <UpgradeContext.Provider value={visibleUpgrade}>
    {children}
    {visibleUpgrade?.active && <div className={`ninja-upgrade-toast${inApp && !visibleUpgrade.custom ? " ninja-upgrade-mobile-only" : ""}`} role="status">
      <span className="sidebar-avatar ninja-awakening ninja-awakening-red">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="user-avatar ninja-red-image" src="/default-avatar-ninja-red.png" alt="" width={36} height={36} />
        <span className="ninja-white-overlay"><img className="user-avatar" src="/default-avatar-ninja.png" alt="" width={36} height={36} /></span>
      </span>
      <span>Você conquistou o ninja vermelho!</span>
    </div>}
  </UpgradeContext.Provider>;
}
