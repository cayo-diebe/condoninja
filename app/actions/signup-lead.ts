"use server";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { allowSignupLeadAttempt, saveSignupLead, signupEmailCookie, signupEmailSchema } from "@/lib/signup-leads";

export async function captureSignupEmail(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  // Public signup intake: no account, session, or marketing subscription is created.
  const parsed = signupEmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Informe um e-mail válido para continuar." };
  if (formData.get("website")) return { ok: false, error: "Não foi possível continuar. Tente novamente." };

  try {
    const requestHeaders = await headers();
    const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
      || requestHeaders.get("x-real-ip") || "unknown";
    const key = createHash("sha256").update(address.slice(0, 128)).digest("hex");
    if (!allowSignupLeadAttempt(key)) {
      return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
    }

    const email = (await saveSignupLead(parsed.data));
    const cookieStore = await cookies();
    // Short-lived prefill only; never treated as authentication or email verification.
    cookieStore.set(signupEmailCookie, email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    return { ok: true };
  } catch {
    // Do not log the submitted address or database values.
    console.error("signup_lead_capture_failed");
    return { ok: false, error: "Não foi possível salvar seu e-mail agora. Tente novamente." };
  }
}
