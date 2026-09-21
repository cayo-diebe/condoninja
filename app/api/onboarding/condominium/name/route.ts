import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { saveCondominiumName } from "@/lib/repository";
import { condominiumSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const parsed = condominiumSchema.pick({ name: true, addressNumber: true }).partial({ addressNumber: true }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Informe um nome de condomínio válido.");
  if (!(await saveCondominiumName(user.id, parsed.data.name, parsed.data.addressNumber))) return jsonError("Preencha o endereço antes de selecionar o condomínio.", 409);
  return NextResponse.json({ saved: true });
}
