import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { deleteDocumentForUser, getDocumentByIdForUser } from "@/lib/repository";
import { removeStoredFile } from "@/lib/file-storage";

export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const { id } = await context.params;
  try {
    const document = (await deleteDocumentForUser(user.id, id));
    if (!document) return jsonError("Documento não encontrado.", 404);
    await removeStoredFile(document.storageKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "REQUIRED_DOCUMENT") {
      return jsonError("Envie um documento substituto antes de remover este item obrigatório.", 409);
    }
    console.error("document_delete_failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Não foi possível remover o documento.", 500);
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const { id } = await context.params;
  const document = (await getDocumentByIdForUser(user.id, id));
  if (!document) return jsonError("Documento não encontrado.", 404);
  return NextResponse.json({ document });
}
