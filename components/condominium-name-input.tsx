"use client";

import { useEffect, useState } from "react";
import type { AddressSuggestion } from "@/lib/address";

export function CondominiumNameInput({ value, address, city, state, onChange, onSelect, disabled }: {
  value: string; address: string; city: string; state: string; onChange: (name: string) => void; onSelect?: (name: string, addressNumber?: string) => void; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!focused || address.trim().length < 3 || !city || !state) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setMessage("Buscando edifícios no endereço informado…");
      try {
        // Search the saved street, never the name typed in this field or a single CEP.
        const params = new URLSearchParams({ q: address.trim(), city, state });
        const response = await fetch(`/api/address/search?${params}`, { signal: controller.signal });
        const payload = await response.json() as { results?: AddressSuggestion[]; unavailable?: boolean };
        if (controller.signal.aborted) return;
        if (!response.ok || payload.unavailable) throw new Error("lookup_unavailable");
        const suggestions = (payload.results ?? []).filter(result => Boolean(result.buildingName));
        setResults(suggestions);
        setActive(0);
        setOpen(suggestions.length > 0);
        setMessage(suggestions.length ? "Selecione um edifício ou digite o nome manualmente." : "Nenhum nome de edifício encontrado para esse endereço. Digite o nome manualmente.");
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setOpen(false);
          setMessage("Não foi possível buscar sugestões. Você pode digitar o nome manualmente.");
        }
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [focused, address, city, state]);

  function choose(result: AddressSuggestion) {
    if (result.buildingName) {
      if (onSelect) onSelect(result.buildingName, result.buildingNumber || undefined);
      else onChange(result.buildingName);
    }
    setOpen(false);
    setMessage(result.buildingNumber ? "Nome e número selecionados." : "Nome selecionado. O número informado foi mantido.");
  }

  const expanded = focused && open && results.length > 0;
  return <div className="autocomplete-field">
    <input id="condo-name" className="input" autoComplete="organization" required maxLength={160} disabled={disabled}
      role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls="condo-name-suggestions"
      aria-activedescendant={expanded ? `condo-name-option-${active}` : undefined}
      value={value} onChange={event => { onChange(event.target.value); setOpen(results.length > 0); }}
      onFocus={() => { setFocused(true); setOpen(results.length > 0); }} onBlur={() => setFocused(false)}
      onKeyDown={event => {
        if (!expanded) return;
        if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
        if (event.key === "ArrowDown") { event.preventDefault(); setActive(index => (index + 1) % results.length); }
        if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => (index - 1 + results.length) % results.length); }
        if (event.key === "Enter") { event.preventDefault(); choose(results[active]); }
      }} />
    {message && <div className="address-help" role="status">{message}</div>}
    {expanded && <div className="address-suggestions" id="condo-name-suggestions" role="listbox" aria-label="Sugestões de condomínio">
      {results.map((result, index) => <button key={result.id} id={`condo-name-option-${index}`} type="button" role="option"
        aria-selected={active === index} className={`address-option ${active === index ? "active" : ""}`}
        onMouseDown={event => event.preventDefault()} onClick={() => choose(result)}>
        <strong>{result.buildingName}</strong>
        <span>{result.street} · {result.detail} · CEP {result.cep}</span>
      </button>)}
    </div>}
  </div>;
}
