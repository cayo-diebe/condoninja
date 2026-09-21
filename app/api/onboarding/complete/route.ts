import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { completeOnboarding, getCategoryProgressForUser } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const progress = (await getCategoryProgressForUser(user.id));
  const missing = progress.filter((category) => category.required && !category.satisfied).map((category) => category.label);
  if (missing.length > 0) {
    return NextResponse.json({ error: "Ainda faltam documentos obrigatórios.", missing }, { status: 422 });
  }
  return NextResponse.json({ onboarding: (await completeOnboarding(user.id)) });
}
