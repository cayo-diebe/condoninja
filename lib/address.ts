export type AddressSuggestion = {
  id: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  label: string;
  detail?: string;
  buildingNumber?: string;
  buildingName?: string;
};

type ViaCepRecord = {
  cep?: unknown;
  logradouro?: unknown;
  bairro?: unknown;
  localidade?: unknown;
  uf?: unknown;
  erro?: unknown;
  complemento?: unknown;
  unidade?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function digits(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function normalizeViaCepRecord(record: ViaCepRecord): AddressSuggestion | null {
  if (record.erro === true) return null;

  const street = text(record.logradouro);
  const city = text(record.localidade);
  const state = text(record.uf).toUpperCase();
  const cep = digits(text(record.cep));
  if (!street || !city || !/^[A-Z]{2}$/.test(state) || cep.length !== 8) return null;

  const neighborhood = text(record.bairro);
  const safeStreet = street.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: `${cep}-${state}-${safeStreet}`,
    street,
    neighborhood,
    city,
    state,
    cep,
    label: `${street}${neighborhood ? ` · ${neighborhood}` : ""} · ${city}/${state}`,
    detail: [text(record.complemento), text(record.unidade)].filter(Boolean).join(" · "),
    buildingNumber: /^\d+[A-Za-z]?$/.test(text(record.complemento)) ? text(record.complemento) : undefined,
    buildingName: /^(edif[ií]cio|condom[ií]nio|residencial)\b/i.test(text(record.unidade)) ? text(record.unidade) : undefined,
  };
}

export function normalizeViaCepResponse(payload: unknown) {
  const records = Array.isArray(payload) ? payload : [payload];
  const results: AddressSuggestion[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    const normalized = normalizeViaCepRecord(record as ViaCepRecord);
    if (!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    results.push(normalized);
  }

  return results;
}

export function normalizeAddressQuery(value: string) {
  const prefixes: Record<string, string> = { av: "Avenida", r: "Rua", tv: "Travessa", al: "Alameda", rod: "Rodovia", est: "Estrada", pca: "Praça" };
  return value.trim().replace(/^(av|r|tv|al|rod|est|pca)\.?\s+/i, (_, prefix: string) => `${prefixes[prefix.toLowerCase()]} `);
}

export function splitLegacyAddress(value: string) {
  const match = value.match(/^(.*?),\s*(\d+[A-Za-z]?(?:[-/]\d+)?)\s*(?:[-–]\s*(.+))?$/);
  if (!match) return { street: value, number: "" };
  return {
    street: `${match[1].trim()}${match[3] ? ` - ${match[3].trim()}` : ""}`,
    number: match[2],
  };
}
