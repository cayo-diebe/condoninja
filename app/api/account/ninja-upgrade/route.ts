import { assertSameOrigin, jsonError, requireApiUser } from "@/lib/http";
import { claimNinjaUpgrade } from "@/lib/ninja-upgrade";

export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await requireApiUser();
    return Response.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return jsonError("Não foi possível verificar seu nível ninja.", 503); }
}
export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem não permitida.", 403);
  try {
    const user = await requireApiUser();
    if (!user) return jsonError("Faça login para continuar.", 401);
    const present = await claimNinjaUpgrade(user.id);
    return Response.json({ present }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return jsonError("Não foi possível apresentar seu novo nível. Tente novamente.", 503); }
}
