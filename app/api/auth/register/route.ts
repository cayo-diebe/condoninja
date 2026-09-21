import { NextResponse } from "next/server";
import { establishSession, hashPassword } from "@/lib/auth";
import { jsonError, assertSameOrigin } from "@/lib/http";
import { createUser, getOnboarding, getUserByEmail } from "@/lib/repository";
import { registrationSchema } from "@/lib/validation";
import { cookies } from "next/headers";
import { decodeReferralCookie, referralCookieName } from "@/lib/referrals";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Envie os dados em JSON válido.");
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Revise os dados informados.");
  if ((await getUserByEmail(parsed.data.email))) return jsonError("Não foi possível criar a conta com esses dados.", 409);

  try {
    const cookieStore = await cookies();
    const referral = decodeReferralCookie(cookieStore.get(referralCookieName)?.value);
    const user = (await createUser(parsed.data, hashPassword(parsed.data.password), referral));
    await establishSession(user.id);
    return NextResponse.json({ user, onboarding: (await getOnboarding(user.id)) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return jsonError("Não foi possível criar a conta com esses dados.", 409);
    }
    console.error("registration_failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Não foi possível criar sua conta agora.", 500);
  }
}
