import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { decodeReferralCookie, encodeReferralCookie, findReferralOwner, referralCookieName, referralLifetimeSeconds } from "@/lib/referrals";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const response = new NextResponse(null, { status: 303, headers: { Location: "/", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  try {
    if (await getCurrentUser()) return response;
    const cookieStore = await cookies();
    const previous = decodeReferralCookie(cookieStore.get(referralCookieName)?.value);
    if (previous && await findReferralOwner(previous.code)) return response;
    if (!(await findReferralOwner(code))) return response;
    response.cookies.set(referralCookieName, encodeReferralCookie(code), {
      httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: referralLifetimeSeconds,
    });
    return response;
  } catch {
    // Do not silently lose attribution during a temporary database failure.
    return new Response("Não foi possível abrir o convite agora. Atualize esta página para tentar novamente.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "5" },
    });
  }
}
