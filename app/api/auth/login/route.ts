import { NextResponse } from "next/server";
import { establishSession, verifyPassword } from "@/lib/auth";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { getOnboarding, getUserByEmail } from "@/lib/repository";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Envie os dados em JSON válido.");
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Revise os dados informados.");

  const record = (await getUserByEmail(parsed.data.email));
  if (!record || !verifyPassword(parsed.data.password, record.password_hash)) {
    return jsonError("E-mail ou senha inválidos.", 401);
  }

  await establishSession(record.id);
  return NextResponse.json({
    user: { id: record.id, name: record.name, email: record.email },
    onboarding: (await getOnboarding(record.id)),
  });
}
