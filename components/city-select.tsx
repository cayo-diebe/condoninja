"use client";

import { useEffect, useState } from "react";
import { capitals } from "@/lib/cities";

export function CitySelect({ state, value, onChange }: { state: string; value: string; onChange: (value: string) => void }) {
  const [result, setResult] = useState<{ state: string; cities: string[]; failed: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!state) return;
    const controller = new AbortController();
    fetch(`/api/address/cities?state=${encodeURIComponent(state)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("cities_unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setResult({ state, cities: data.cities ?? [], failed: Boolean(data.unavailable) });
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ state, cities: [], failed: true }); });
    return () => controller.abort();
  }, [state, attempt]);
  const current = result?.state === state ? result : null;
  const loading = Boolean(state && !current);
  const capital = capitals[state];
  const alphabeticalCities = [...(current?.cities ?? [])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return <div className="field">
    <label htmlFor="condo-city">Cidade *</label>
    {current?.failed ? <>
      <input className="input" id="condo-city" autoComplete="address-level2" value={value} onChange={event => onChange(event.target.value)} required />
      <span className="address-help" role="status">Não foi possível carregar as cidades. Digite a cidade ou <button type="button" onClick={() => { setResult(null); setAttempt(n => n + 1); }}>tente novamente</button>.</span>
    </> : <>
      <select className="select" id="condo-city" autoComplete="address-level2" value={value} disabled={!state || loading} onChange={event => onChange(event.target.value)} required>
        <option value="">{!state ? "Selecione o estado" : loading ? "Carregando cidades…" : "Selecione a cidade"}</option>
        {value && !current?.cities.includes(value) && <option value={value}>{value}</option>}
        {current?.cities.includes(capital) && <option value={capital} style={{ fontWeight: 700 }}>{capital} (capital)</option>}
        {alphabeticalCities.map(city => <option key={city} value={city}>{city}</option>)}
      </select>
      {loading && <span className="address-help" role="status">Carregando cidades…</span>}
    </>}
  </div>;
}
