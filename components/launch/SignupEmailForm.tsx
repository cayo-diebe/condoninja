"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { captureSignupEmail } from "@/app/actions/signup-lead";
import { Button } from "./ui/Button";
import { LocalizedForm } from "@/components/localized-form";
import { FormRequestError, formErrorMessage } from "@/lib/form-errors";

export function SignupEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const formData = new FormData(event.currentTarget);
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await captureSignupEmail(formData);
      if (!result.ok) throw new FormRequestError(result.error);
      router.push("/cadastro");
    } catch (cause) {
      setError(formErrorMessage(cause, "Não foi possível continuar. Verifique sua conexão e tente novamente."));
      submitting.current = false;
      setLoading(false);
    }
  }

  return <LocalizedForm className="marketing-email-form" onSubmit={submit} aria-busy={loading}>
    <div className="marketing-email-field">
      <label htmlFor="raio-x-email">E-mail</label>
      <input id="raio-x-email" name="email" type="email" inputMode="email" autoComplete="email"
        autoCapitalize="none" spellCheck={false} required maxLength={160}
        placeholder="voce@exemplo.com" value={email} readOnly={loading}
        onChange={event => { setEmail(event.target.value); setError(""); }}
        aria-describedby={error ? "raio-x-email-notice raio-x-email-error" : "raio-x-email-notice"} />
    </div>
    <div className="marketing-email-trap" aria-hidden="true">
      <label htmlFor="raio-x-website">Site</label>
      <input id="raio-x-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
    <span id="raio-x-email-notice" className="marketing-email-notice">Ao continuar, salvamos seu e-mail para iniciar seu cadastro.</span>
    {error && <div id="raio-x-email-error" className="marketing-email-error" role="alert">{error}</div>}
    <Button type="submit" size="lg" className="w-full" disabled={loading} data-cta-location="footer">
      {loading ? "Continuando…" : "Quero meu Raio-X gratuito"}
      {!loading && <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>}
    </Button>
  </LocalizedForm>;
}
