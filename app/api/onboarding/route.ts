import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { advanceOnboarding, getOnboarding } from "@/lib/repository";
import type { OnboardingStep } from "@/lib/types";

export const runtime = "nodejs";
const validSteps = new Set<OnboardingStep>(["welcome", "address", "condominium", "documents", "review"]);

export async function GET() {
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  return NextResponse.json({ onboarding: (await getOnboarding(user.id)) });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const body = (await request.json().catch(() => null)) as { step?: string } | null;
  if (!body?.step || !validSteps.has(body.step as OnboardingStep)) return jsonError("Etapa inválida.");
  try {
    (await advanceOnboarding(user.id, body.step as OnboardingStep));
    return NextResponse.json({ onboarding: (await getOnboarding(user.id)) });
  } catch (error) {
    if (error instanceof Error && error.message === "ONBOARDING_STEP_LOCKED") {
      return jsonError("Essa etapa ainda não foi desbloqueada.", 409);
    }
    console.error("onboarding_step_failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Não foi possível salvar seu progresso.", 500);
  }
}
