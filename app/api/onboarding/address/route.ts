import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { saveAddressDraft } from "@/lib/repository";
import { addressSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Revise o endereço.");
  return NextResponse.json({ onboarding: (await saveAddressDraft(user.id, parsed.data)) });
}
