'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';

import { Logo } from './Logo';
import { SignupAnchorButton } from './ui/SignupAnchorButton';
import { nav } from '@/lib/launch/site';

export function Header() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // Fecha com Escape e trava o scroll enquanto o menu está aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/75 backdrop-blur-md supports-[backdrop-filter]:bg-ink-950/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="rounded-md"
          aria-label="Condo Ninja — início"
          onClick={close}
        >
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href.startsWith('/') ? item.href : `/${item.href}`}
                  className="rounded-full px-3.5 py-2 text-sm text-ink-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink-200 hover:bg-white/5 hover:text-white"
          >
            Entrar
          </Link>
          <SignupAnchorButton location="header" size="sm">
            Começar grátis
          </SignupAnchorButton>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-100 hover:bg-white/5 lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      <div
        id={menuId}
        hidden={!open}
        className="border-t border-white/5 bg-ink-950 lg:hidden"
      >
        <nav aria-label="Principal (mobile)" className="px-5 py-4">
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href.startsWith('/') ? item.href : `/${item.href}`}
                  onClick={close}
                  className="block rounded-lg px-3 py-3.5 text-base text-ink-200 hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-white/5 pt-4">
            <Link
              href="/login"
              onClick={close}
              className="mb-3 flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-4 font-semibold text-white"
            >
              Entrar
            </Link>
            <SignupAnchorButton
              location="header-mobile"
              className="w-full"
              onNavigate={close}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
