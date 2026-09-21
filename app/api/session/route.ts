import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/http";
import { getOnboarding } from "@/lib/repository";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user, onboarding: (await getOnboarding(user.id)) });
}
