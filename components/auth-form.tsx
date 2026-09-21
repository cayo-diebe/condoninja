"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuthTransition } from "./auth-transition";
import { useRouter } from "next/navigation";
import { LocalizedForm } from "./localized-form";
import { FormRequestError, formErrorMessage } from "@/lib/form-errors";

const pendingLoginEmailKey = "kondo-ninja:pending-login-email";

export function AuthForm({ mode, existingAccount = false, initialEmail = "" }: { mode: "login" | "register"; existingAccount?: boolean; initialEmail?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";
  const cardRef = useRef<HTMLElement>(null);
  const previousCard = useAuthTransition();

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !previousCard) return;
    const height = card.getBoundingClientRect().height;
    const previous = previousCard.get();
    let animation: Animation | undefined;
    let borderPulse: Animation | undefined;
    if (previous && previous.mode !== mode && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation = card.animate([
        { height: `${previous.height}px`, overflow: "clip" },
        { height: `${height}px`, overflow: "clip" },
      ], { duration: 600, easing: "cubic-bezier(.4, 0, .2, 1)" });
      borderPulse = card.animate([
        { borderColor: "#23385f", offset: 0 },
        { borderColor: "#427b9f", offset: .45 },
        { borderColor: "#23385f", offset: 1 },
      ], { duration: 1000, easing: "ease-in-out" });
    }
    return () => {
      animation?.cancel();
      borderPulse?.cancel();
    };
  }, [mode, previousCard]);

  useEffect(() => {
    if (isRegister || !existingAccount) return;
    const pendingEmail = window.sessionStorage.getItem(pendingLoginEmailKey);
    if (pendingEmail) {
      // The email is transferred between routes in this tab; synchronizing it requires a client effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(pendingEmail);
    }
  }, [existingAccount, isRegister]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(isRegister ? { name } : {}), email, password }),
      });
      const payload = await response.json();
      if (isRegister && response.status === 409) {
        window.sessionStorage.setItem(pendingLoginEmailKey, email.trim().toLowerCase());
        router.replace("/login?existing=1");
        return;
      }
      if (!response.ok) throw new FormRequestError(payload.error ?? "Não foi possível concluir.");
      if (!isRegister) window.sessionStorage.removeItem(pendingLoginEmailKey);
      router.push("/app");
      router.refresh();
    } catch (submitError) {
      setError(formErrorMessage(submitError, "Não foi possível concluir. Verifique sua conexão e tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section ref={cardRef} className="auth-card" aria-labelledby={isRegister ? "auth-title" : undefined} aria-label={isRegister ? undefined : "Login"}>
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-name">Condo Ninja</span>
        </Link>
        {isRegister && <>
          <h1 id="auth-title">Crie sua conta</h1>
          <p>Vamos organizar o primeiro passo do Raio-X do seu condomínio.</p>
        </>}
        {!isRegister && existingAccount && email && <p className="auth-notice" role="status">Este e-mail já tem uma conta. Digite sua senha para entrar.</p>}
        <LocalizedForm className="form-stack" onSubmit={submit}>
          {isRegister && (
            <div className="field">
              <label htmlFor="name">Nome</label>
              <input className="input" id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input className="input" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input className="input" id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} autoFocus={!isRegister && existingAccount} required minLength={isRegister ? 8 : undefined} />
            {isRegister && <span className="field-hint">Use pelo menos 8 caracteres.</span>}
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Aguarde…" : isRegister ? "Criar conta" : "Entrar"}</button>
        </LocalizedForm>
        <p className="auth-switch">
          {isRegister ? "Já tem uma conta? " : "Ainda não tem uma conta? "}
          <Link href={isRegister ? "/login" : "/cadastro"} onNavigate={() => {
            const card = cardRef.current;
            if (card) previousCard?.set({ mode, height: card.getBoundingClientRect().height });
          }}>{isRegister ? "Entrar" : "Criar conta"}</Link>
        </p>
      </section>
    </main>
  );
}
