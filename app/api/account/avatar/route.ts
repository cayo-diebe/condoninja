import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { avatarMaxBytes, getAvatar, normalizeAvatar, saveAvatar, removeAvatar } from "@/lib/avatar";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  try {
    (await removeAvatar(user.id));
    return Response.json({ removed: true });
  } catch {
    return jsonError("Não foi possível remover a foto. Tente novamente.", 500);
  }
}

export async function GET() {
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  const avatar = (await getAvatar(user.id));
  if (!avatar) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(avatar.image), { headers: {
    "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem não permitida.", 403);
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  // Raw image body: enforce the limit while reading, including chunked requests.
  if (!request.body) return jsonError("Selecione uma foto.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > avatarMaxBytes) {
        await reader.cancel();
        return jsonError("Envie uma foto de até 2 MB.", 413);
      }
      chunks.push(value);
    }
    let image: Buffer;
    try { image = await normalizeAvatar(Buffer.concat(chunks)); }
    catch { return jsonError("Foto inválida. Envie JPG, PNG ou WebP de até 2 MB e 16 megapixels."); }
    const version = (await saveAvatar(user.id, image));
    return Response.json({ version });
  } catch {
    return jsonError("Não foi possível salvar a foto. Tente novamente.", 500);
  } finally { reader.releaseLock(); }
}
