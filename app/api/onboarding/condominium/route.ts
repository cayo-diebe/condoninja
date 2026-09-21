import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { getOnboarding, saveCondominium } from "@/lib/repository";
import { condominiumSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const body = await request.json().catch(() => null);
  const parsed = condominiumSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Revise os dados do condomínio.");
  return NextResponse.json({ onboarding: (await saveCondominium(user.id, parsed.data)) });
}

export async function GET() {
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  return NextResponse.json({ onboarding: (await getOnboarding(user.id)) });
}
