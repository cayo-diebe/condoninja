import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { getCategoryProgressForUser, getCondominiumIdForUser } from "@/lib/repository";
import { UploadValidationError } from "@/lib/file-storage";
import { maxUploadBatchBytes } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  return NextResponse.json({ categories: (await getCategoryProgressForUser(user.id)) });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);

  let formData: FormData;
  const condominiumId = (await getCondominiumIdForUser(user.id));
  if (!condominiumId) return jsonError("Cadastre o condomínio antes de enviar documentos.", 409);
  try {
    if (!request.body) return jsonError("Selecione pelo menos um arquivo.");
    const limit = maxUploadBatchBytes + 64 * 1024;
    if (Number(request.headers.get("content-length") || 0) > limit) return jsonError("Envie os arquivos em lotes menores.", 413);
    let received = 0;
    const limited = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, controller) {
      received += chunk.byteLength;
      if (received > limit) { controller.error(new UploadValidationError("Envie os arquivos em lotes menores.")); return; }
      controller.enqueue(chunk);
    } }));
    formData = await new Response(limited, { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
  } catch {
    return jsonError("Não foi possível ler o upload.", 400);
  }

  const categorySlug = String(formData.get("categorySlug") ?? "");
  const category = (await (await import("@/lib/repository")).getCategory(categorySlug));
  if (!category) return jsonError("Categoria documental inválida.");
  if (category.archived) return jsonError("Esta categoria foi mantida apenas no histórico. Escolha uma das categorias atuais para enviar documentos.", 409);

  const entries = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (entries.length === 0) return jsonError("Selecione pelo menos um arquivo.");
  if (entries.length > 10) return jsonError("Envie no máximo 10 arquivos por vez.");

  const totalBytes = entries.reduce((total, file) => total + file.size, 0);
  if (totalBytes > maxUploadBatchBytes) {
    return jsonError(`O lote excede o limite de ${Math.round(maxUploadBatchBytes / 1024 / 1024)} MB.`);
  }

  const results: Array<Record<string, unknown>> = [];
  for (const file of entries) {
    try {
      const { removeStoredFile, sha256, storageKeyFor, validateFileContent, validateFileMetadata, writeStoredFile } =
        await import("@/lib/file-storage");
      const extension = validateFileMetadata(file.name, file.size);
      const buffer = Buffer.from(await file.arrayBuffer());
      validateFileContent(extension, buffer);
      const digest = sha256(buffer);
      const { findDuplicateDocument, insertDocument } = await import("@/lib/repository");
      const duplicate = (await findDuplicateDocument(user.id, categorySlug, digest, condominiumId));
      if (duplicate) {
        results.push({
          name: file.name,
          status: "duplicate",
          message: `Esse arquivo já foi enviado em “${duplicate.categoryLabel}”.`,
          document: duplicate,
        });
        continue;
      }

      const documentId = randomUUID();
      const storageKey = storageKeyFor(condominiumId, documentId, extension);
      await writeStoredFile(storageKey, buffer);
      try {
        const document = (await insertDocument({
          id: documentId,
          userId: user.id,
          condominiumId,
          categorySlug,
          originalName: file.name.replace(/[\\/\u0000-\u001f]+/g, "_").slice(0, 180),
          storageKey,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          sha256: digest,
        }));
        results.push({ name: file.name, status: "stored", document });
      } catch (error) {
        await removeStoredFile(storageKey);
        if (error instanceof Error && error.message.includes("UNIQUE")) {
          results.push({ name: file.name, status: "duplicate", message: "Esse arquivo já foi enviado." });
        } else {
          throw error;
        }
      }
    } catch (error) {
      const message = error instanceof UploadValidationError ? error.message : "Não foi possível salvar o arquivo. Tente novamente.";
      results.push({ name: file.name, status: "failed", message });
    }
  }

  return NextResponse.json({ results, categories: (await getCategoryProgressForUser(user.id)) });
}
