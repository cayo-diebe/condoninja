import { NextResponse } from "next/server";
import { normalizeAddressQuery, normalizeViaCepResponse } from "@/lib/address";
import { jsonError, requireApiUser } from "@/lib/http";

export const runtime = "nodejs";

const viaCepOrigin = "https://viacep.com.br/ws";

function validState(value: string) {
  return /^[A-Z]{2}$/.test(value);
}

export async function GET(request: Request) {
  const user = await requireApiUser();
  if (!user) return jsonError("Faça login para continuar.", 401);

  const params = new URL(request.url).searchParams;
  const query = normalizeAddressQuery((params.get("q") ?? "").slice(0, 100));
  const cep = (params.get("cep") ?? "").replace(/\D/g, "").slice(0, 8);
  const city = (params.get("city") ?? "").trim().slice(0, 100);
  const state = (params.get("state") ?? "").trim().toUpperCase();

  let lookupUrl: string;
  let contextRequired = false;

  if (cep.length === 8) {
    lookupUrl = `${viaCepOrigin}/${cep}/json/`;
  } else if (query.length >= 3 && city.length >= 3 && validState(state)) {
    lookupUrl = `${viaCepOrigin}/${encodeURIComponent(state)}/${encodeURIComponent(city)}/${encodeURIComponent(query)}/json/`;
  } else {
    contextRequired = query.length >= 3 && (!city || !validState(state));
    return NextResponse.json({ results: [], contextRequired }, { headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const response = await fetch(lookupUrl, {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "KondoNinja/0.1 address lookup" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return NextResponse.json({ results: [], unavailable: true }, { headers: { "Cache-Control": "private, no-store" } });
    const payload: unknown = await response.json();
    return NextResponse.json({ results: normalizeViaCepResponse(payload) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.warn("address_lookup_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ results: [], unavailable: true }, { headers: { "Cache-Control": "private, no-store" } });
  }
}
