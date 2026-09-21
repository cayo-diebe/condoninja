import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { selectCondominiumJourney } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const body = await request.json().catch(() => null);
  if (!body || (body.action !== "create" && body.action !== "select") || (body.action === "select" && typeof body.id !== "string")) return jsonError("Seleção inválida.");
  try {
    const onboarding = (await selectCondominiumJourney(user.id, body.action === "select" ? body.id : undefined));
    return NextResponse.json({ destination: onboarding.status === "complete" ? "/app" : "/app/onboarding" });
  } catch (error) {
    if (error instanceof Error && error.message === "JOURNEY_NOT_FOUND") return jsonError("Condomínio não encontrado.", 404);
    return jsonError("Não foi possível selecionar o condomínio. Tente novamente.", 500);
  }
}
