import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/http";
import { getDashboardData } from "@/lib/repository";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);
  return NextResponse.json({ dashboard: (await getDashboardData(user.id)) });
}
