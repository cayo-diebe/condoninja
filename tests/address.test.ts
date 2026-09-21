import { describe, expect, it } from "vitest";
import { normalizeViaCepResponse, splitLegacyAddress } from "../lib/address.ts";

describe("address lookup normalization", () => {
  it("extracts explicit building data without confusing street ranges or businesses", () => {
    const base = { cep: "01310-919", logradouro: "Avenida Paulista", localidade: "São Paulo", uf: "SP" };
    expect(normalizeViaCepResponse({ ...base, complemento: "1728", unidade: "Edifício Ourinvest" })[0]).toMatchObject({ buildingNumber: "1728", buildingName: "Edifício Ourinvest" });
    for (const complemento of ["de 612 a 1510 - lado par", "até 409/410", "1374 12 Andar", ""]) {
      const result = normalizeViaCepResponse({ ...base, complemento, unidade: "Banco Exemplo" })[0];
      expect(result.buildingNumber).toBeUndefined();
      expect(result.buildingName).toBeUndefined();
    }
  });
  it("normalizes a ViaCEP record", () => {
    const [suggestion] = normalizeViaCepResponse({
      cep: "90010-221",
      logradouro: "Av. Sen. Salgado Filho",
      bairro: "Centro Histórico",
      localidade: "Porto Alegre",
      uf: "rs",
    });

    expect(suggestion).toMatchObject({
      cep: "90010221",
      city: "Porto Alegre",
      state: "RS",
      street: "Av. Sen. Salgado Filho",
    });
  });

  it("separates a legacy street number without losing the neighborhood", () => {
    expect(splitLegacyAddress("Av. Sen. Salgado Filho, 359 - Centro Histórico")).toEqual({
      street: "Av. Sen. Salgado Filho - Centro Histórico",
      number: "359",
    });
    expect(splitLegacyAddress("Rua sem número")).toEqual({ street: "Rua sem número", number: "" });
  });

  it("ignores invalid records and deduplicates repeated results", () => {
    const results = normalizeViaCepResponse([
      { erro: true },
      { cep: "01311-000", logradouro: "Rua Augusta", bairro: "Consolação", localidade: "São Paulo", uf: "SP" },
      { cep: "01311000", logradouro: "Rua Augusta", bairro: "Consolação", localidade: "São Paulo", uf: "SP" },
      { cep: "00000-000", logradouro: "", localidade: "São Paulo", uf: "SP" },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("01311000-SP-rua-augusta");
  });
});
