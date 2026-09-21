"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { CitySelect } from "@/components/city-select";
import { CondominiumNameInput } from "@/components/condominium-name-input";
import type { AddressSuggestion } from "@/lib/address";
import type { OnboardingRecord } from "@/lib/types";
import { formatCep, formatCnpj } from "@/lib/validation";
import { LocalizedForm } from "@/components/localized-form";
import { FormRequestError, formErrorMessage } from "@/lib/form-errors";

const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

type FormState = {
  name: string;
  address: string;
  addressNumber: string;
  cep: string;
  city: string;
  state: string;
  relationship: string;
  unitIdentifier: string;
  cnpj: string;
  propertyType: string;
  unitCount: string;
};

export function CondoForm({ initial, onSaved, onBack, onNameSaving, mode = "all" }: { initial: OnboardingRecord; onSaved: (next: OnboardingRecord) => void; onBack?: () => void; onNameSaving?: (saving: boolean) => void; mode?: "all" | "address" | "condominium" }) {
  const router = useRouter();
  const condo = { ...initial.condominium, ...initial.addressDraft };
  const [form, setForm] = useState<FormState>({
    name: condo?.name ?? "",
    address: condo?.address ?? "",
    addressNumber: condo?.addressNumber ?? "",
    cep: condo?.cep ? formatCep(condo.cep) : "",
    city: condo?.city ?? "",
    state: condo?.state ?? "",
    relationship: initial.relationship ?? "",
    unitIdentifier: initial.addressDraft?.unitIdentifier ?? initial.unitIdentifier ?? "",
    cnpj: condo?.cnpj ? formatCnpj(condo.cnpj) : "",
    propertyType: condo?.propertyType ?? "",
    unitCount: condo?.unitCount ? String(condo.unitCount) : "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [cepEdited, setCepEdited] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  const addressEditRevision = useRef(0);
  const showAddress = form.cep.replace(/\D/g, "").length === 8 || Boolean(form.state && form.city.trim());

  useEffect(() => {
    const digits = form.cep.replace(/\D/g, "");
    if (!cepEdited || digits.length !== 8) return;

    const revision = addressEditRevision.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/address/search?cep=${digits}`, { signal: controller.signal });
        const payload = (await response.json()) as { results?: AddressSuggestion[] };
        if (!response.ok) throw new Error("cep_lookup_failed");
        if (revision !== addressEditRevision.current) return;
        const suggestion = payload.results?.[0];
        if (!suggestion) {
          setCepMessage("CEP não encontrado. Você pode preencher o endereço manualmente.");
          return;
        }
        setForm((current) => ({
          ...current,
          address: suggestion.street,
          addressNumber: suggestion.buildingNumber ?? current.addressNumber,
          name: suggestion.buildingName || current.name,
          cep: formatCep(suggestion.cep),
          city: suggestion.city,
          state: suggestion.state,
        }));
        setCepEdited(false);
        setCepMessage("Endereço preenchido. Confira os dados e informe número e complemento.");
      } catch (lookupError) {
        if (lookupError instanceof DOMException && lookupError.name === "AbortError") return;
        if (revision !== addressEditRevision.current) return;
        setCepMessage("Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.");
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cepEdited, form.cep, initial.condominium?.name]);

  function change<Field extends keyof FormState>(field: Field, value: FormState[Field]) {
    if (field === "address" || field === "city" || field === "state") {
      addressEditRevision.current += 1;
      setCepEdited(false);
    }
    setForm((current) => ({ ...current, [field]: value, ...(field === "state" && value !== current.state ? { city: "" } : {}) }));
  }

  function selectAddress(suggestion: AddressSuggestion) {
    setForm((current) => ({
      ...current,
      address: suggestion.street,
      addressNumber: suggestion.buildingNumber ?? current.addressNumber,
      name: suggestion.buildingName || current.name,
      cep: formatCep(suggestion.cep),
      city: suggestion.city,
      state: suggestion.state,
    }));
    setCepEdited(false);
    setCepMessage(suggestion.buildingName ? mode === "address" ? "Endereço selecionado. Confira o número e o complemento; o nome do edifício será sugerido na próxima etapa." : "Endereço e nome do edifício preenchidos. Confira o número e o complemento." : "Endereço selecionado. Confirme o número e o complemento.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(mode === "address" ? "/api/onboarding/address" : "/api/onboarding/condominium", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new FormRequestError(payload.error ?? "Revise os dados do condomínio.");
      onSaved(payload.onboarding);
      router.refresh();
    } catch (submitError) {
      setError(formErrorMessage(submitError, "Não foi possível salvar os dados. Verifique sua conexão e tente novamente."));
    } finally {
      setSaving(false);
    }
  }

  async function selectName(name: string, addressNumber?: string) {
    setForm(current => ({ ...current, name, ...(addressNumber ? { addressNumber } : {}) }));
    setError("");
    setSavingName(true);
    onNameSaving?.(true);
    try {
      const response = await fetch("/api/onboarding/condominium/name", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, addressNumber }), keepalive: true,
      });
      if (!response.ok) throw new Error("name_save_failed");
      router.refresh();
    } catch {
      setError("Não foi possível salvar a seleção automaticamente. Use o botão de salvar antes de sair desta etapa.");
    } finally {
      setSavingName(false);
      onNameSaving?.(false);
    }
  }

  return (
    <LocalizedForm className="form-stack" onSubmit={submit}>
      {mode !== "condominium" && <div className="field">
        <label htmlFor="condo-cep">CEP (se souber)</label>
        <input autoComplete="postal-code" className="input" id="condo-cep" inputMode="numeric" maxLength={9} pattern="[0-9]{5}-?[0-9]{3}" title="Informe 8 dígitos ou deixe o CEP vazio." value={form.cep} onChange={(event) => { const value = formatCep(event.target.value); change("cep", value); setCepEdited(value.replace(/\D/g, "").length === 8); setCepMessage(""); }} placeholder="00000-000" />
        <span className="address-help" aria-live="polite">{cepMessage || "Digite o CEP para preencher endereço, cidade e estado. Se não souber, deixe em branco e preencha os campos abaixo."}</span>
      </div>}
      {mode !== "address" && <div className="form-stack">
        <div className="field"><label htmlFor="condo-name">Nome do condomínio *</label><CondominiumNameInput value={form.name} address={form.address} city={form.city} state={form.state} onChange={name => change("name", name)} onSelect={(name, number) => void selectName(name, number)} disabled={savingName || saving} /></div>
        <div className="field"><label htmlFor="condo-relationship">Sua relação *</label><select className="select" id="condo-relationship" value={form.relationship} onChange={(event) => change("relationship", event.target.value)} required><option value="">Selecione</option><option value="proprietario">Proprietário(a)</option><option value="morador">Morador(a)</option><option value="sindico">Síndico(a)</option><option value="conselheiro">Conselheiro(a)</option><option value="outro">Outra</option></select></div>
      </div>}
      {mode !== "condominium" && <><div className="two-col">
        <div className="field"><label htmlFor="condo-state">Estado *</label><select autoComplete="address-level1" className="select" id="condo-state" value={form.state} onChange={(event) => change("state", event.target.value)} required><option value="">Selecione</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></div>
        <CitySelect state={form.state} value={form.city} onChange={value => change("city", value)} />
      </div>
      {showAddress && <div className="field">
        <label htmlFor="condo-address">Endereço *</label>
        <AddressAutocomplete city={form.city} onChange={(value) => change("address", value)} onSelect={selectAddress} state={form.state} value={form.address} />
      </div>}
      <div className="two-col">
        <div className="field"><label htmlFor="condo-address-number">Número *</label><input className="input" id="condo-address-number" value={form.addressNumber} onChange={(event) => change("addressNumber", event.target.value)} placeholder="Ex.: 359 ou S/N" required /></div>
        <div className="field"><label htmlFor="condo-unit">Complemento / unidade / apartamento *</label><input autoComplete="address-line2" className="input" id="condo-unit" value={form.unitIdentifier} onChange={(event) => change("unitIdentifier", event.target.value)} placeholder="Ex.: Bloco B, ap. 42" required /></div>
      </div>
      </>}
      {mode !== "address" && <details>
        <summary className="muted" style={{ fontSize: 14 }}>Adicionar dados complementares (opcional)</summary>
        <div className="form-stack" style={{ marginTop: 16 }}>
          <div className="two-col"><div className="field"><label htmlFor="condo-cnpj">CNPJ do condomínio</label><input className="input" id="condo-cnpj" inputMode="numeric" value={form.cnpj} onChange={(event) => change("cnpj", formatCnpj(event.target.value))} /></div><div className="field"><label htmlFor="condo-units">Número de unidades</label><input className="input" id="condo-units" inputMode="numeric" value={form.unitCount} onChange={(event) => change("unitCount", event.target.value.replace(/\D/g, "").slice(0, 5))} /></div></div>
          <div className="field"><label htmlFor="condo-type">Tipo</label><select className="select" id="condo-type" value={form.propertyType} onChange={(event) => change("propertyType", event.target.value)}><option value="">Selecione</option><option value="residencial">Residencial</option><option value="comercial">Comercial</option><option value="misto">Misto</option></select></div>
        </div>
      </details>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className={`card-actions${onBack ? "" : " card-actions-end"}`}>
        {onBack && <button className="button button-secondary" type="button" onClick={onBack} disabled={saving || savingName}>Voltar</button>}
        <button className="button button-primary" type="submit" disabled={saving || savingName}>{saving ? "Salvando…" : mode === "all" ? "Salvar alterações" : "Salvar e continuar"}</button>
      </div>
    </LocalizedForm>
  );
}
