import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { assertSameOrigin, jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Origem da requisição não permitida.", 403);
  await clearSession();
  return NextResponse.json({ ok: true });
}
