"use client";

import { useEffect, useState } from "react";
import type { AddressSuggestion } from "@/lib/address";

type AddressAutocompleteProps = {
  value: string;
  city: string;
  state: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
};

export function AddressAutocomplete({ value, city, state, onChange, onSelect }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (!edited) return;

    const query = value.trim();
    if (query.length < 3 || city.trim().length < 3 || !/^[A-Z]{2}$/.test(state)) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");
      try {
        const params = new URLSearchParams({ q: query, city: city.trim(), state });
        const response = await fetch(`/api/address/search?${params.toString()}`, { signal: controller.signal });
        const payload = (await response.json()) as { results?: AddressSuggestion[]; unavailable?: boolean };
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error("address_search_failed");
        const nextSuggestions = payload.results ?? [];
        setSuggestions(nextSuggestions);
        setActiveIndex(0);
        setOpen(nextSuggestions.length > 0);
        setMessage(payload.unavailable ? "Não foi possível buscar sugestões agora. Você pode preencher manualmente." : nextSuggestions.length ? "Selecione o endereço e o trecho correspondente ao número do condomínio para preencher o CEP." : "Nenhum endereço encontrado. Confira cidade e estado e tente outro nome de rua, ou preencha manualmente.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
        setOpen(false);
        setMessage("Não foi possível buscar sugestões agora. Você pode preencher manualmente.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [city, edited, state, value]);

  function choose(suggestion: AddressSuggestion) {
    setEdited(false);
    setSuggestions([]);
    setOpen(false);
    setMessage("");
    onSelect(suggestion);
  }

  const contextRequired = edited && value.trim().length >= 3 && (city.trim().length < 3 || !/^[A-Z]{2}$/.test(state));
  const isSuggestionOpen = open && suggestions.length > 0 && !contextRequired;

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isSuggestionOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(suggestions[activeIndex] ?? suggestions[0]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="autocomplete-field">
      <input
        aria-activedescendant={isSuggestionOpen && suggestions[activeIndex] ? `address-option-${suggestions[activeIndex].id}` : undefined}
        aria-autocomplete="list"
        aria-controls="condo-address-suggestions"
        aria-expanded={isSuggestionOpen}
        autoComplete="street-address"
        className="input"
        id="condo-address"
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setEdited(true);
          setSuggestions([]);
          setOpen(false);
          setLoading(false);
          setMessage("");
          if (event.target.value.trim().length < 3) {
            setSuggestions([]);
            setOpen(false);
            setMessage("");
          }
          onChange(event.target.value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Rua ou avenida"
        role="combobox"
        value={value}
      />
      <div className="address-help" aria-live="polite">
        {loading
          ? "Buscando endereços…"
          : contextRequired
            ? "Informe cidade e estado para receber sugestões — ou comece pelo CEP."
            : message || "Digite ao menos 3 caracteres do endereço para buscar sugestões. Você também pode preencher manualmente."}
      </div>
      {isSuggestionOpen && (
        <div className="address-suggestions" id="condo-address-suggestions" role="listbox" aria-label="Sugestões de endereço">
          {suggestions.map((suggestion, index) => (
            <button
              aria-selected={index === activeIndex}
              className={`address-option ${index === activeIndex ? "active" : ""}`}
              id={`address-option-${suggestion.id}`}
              key={suggestion.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(suggestion)}
              role="option"
              type="button"
            >
              <strong>{suggestion.street}</strong>
              {suggestion.detail && <span>{suggestion.detail}</span>}
              <span>{[suggestion.neighborhood, suggestion.city, suggestion.state].filter(Boolean).join(" · ")} · CEP {suggestion.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
