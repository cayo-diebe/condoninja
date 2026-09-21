import { NextResponse } from "next/server";
import { capitals, sortCities } from "@/lib/cities";
import { requireApiUser, jsonError } from "@/lib/http";

export async function GET(request: Request) {
  if (!await requireApiUser()) return jsonError("Faça login para continuar.", 401);
  const state = new URL(request.url).searchParams.get("state") ?? "";
  if (!Object.hasOwn(capitals, state)) return jsonError("Selecione um estado válido.", 400);
  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("municipalities_unavailable");
    const records: unknown = await response.json();
    if (!Array.isArray(records) || !records.length || records.some(record => typeof record?.nome !== "string")) throw new Error("invalid_municipalities");
    return NextResponse.json({ cities: sortCities(records.map(record => record.nome), state) });
  } catch {
    return NextResponse.json({ cities: [], unavailable: true });
  }
}
