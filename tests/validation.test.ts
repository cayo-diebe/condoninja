import { describe, expect, it } from "vitest";
import { addressSchema, condominiumSchema, loginSchema, registrationSchema } from "../lib/validation.ts";

describe("input validation", () => {
  it("localizes missing fields, type errors and previously implicit length errors", () => {
    const cases = [
      [registrationSchema.shape.name, undefined, "Preencha este campo."],
      [registrationSchema.shape.name, 42, "Informe um valor válido para este campo."],
      [registrationSchema.shape.name, "A".repeat(121), "Use no máximo 120 caracteres."],
      [registrationSchema.shape.email, `${"a".repeat(155)}@example.com`, "Use no máximo 160 caracteres."],
      [loginSchema.shape.email, null, "Preencha este campo."],
      [condominiumSchema.shape.name, "A".repeat(161), "Use no máximo 160 caracteres."],
      [addressSchema.shape.address, "A".repeat(201), "Use no máximo 200 caracteres."],
      [addressSchema.shape.addressNumber, "1".repeat(21), "Use no máximo 20 caracteres."],
      [addressSchema.shape.city, "A".repeat(101), "Use no máximo 100 caracteres."],
      [addressSchema.shape.unitIdentifier, "A".repeat(41), "Use no máximo 40 caracteres."],
      [condominiumSchema.shape.relationship, "A".repeat(81), "Use no máximo 80 caracteres."],
      [condominiumSchema.shape.propertyType, "invalid", "Revise o valor informado neste campo."],
    ] as const;
    for (const [schema, input, message] of cases) {
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe(message);
    }
  });

  it("accepts a valid registration and normalizes the name", () => {
    const result = registrationSchema.safeParse({
      name: "  Ana Souza  ",
      email: "ana@example.com",
      password: "uma-senha-segura",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Ana Souza");
  });

  it("rejects invalid credentials before they reach persistence", () => {
    expect(registrationSchema.safeParse({ name: "A", email: "not-an-email", password: "123" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "" }).success).toBe(false);
  });

  it("normalizes a Brazilian CEP and rejects incomplete condominium data", () => {
    const result = condominiumSchema.safeParse({
      name: "Condomínio Jardim",
      address: "Rua das Flores",
      addressNumber: "10",
      cep: "01311-000",
      city: "São Paulo",
      state: "sp",
      relationship: "proprietario",
      unitIdentifier: "42",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cep).toBe("01311000");
      expect(result.data.state).toBe("SP");
    }

    const manualAddress = condominiumSchema.safeParse({
      name: "Condomínio Jardim",
      address: "Rua das Flores",
      addressNumber: "10",
      cep: "",
      city: "São Paulo",
      state: "SP",
      relationship: "morador",
      unitIdentifier: "Bloco B, ap. 42",
    });
    expect(manualAddress.success).toBe(true);
    expect(condominiumSchema.safeParse({ name: "X", address: "", addressNumber: "", cep: "000", city: "", state: "", relationship: "", unitIdentifier: "" }).success).toBe(false);
    expect(condominiumSchema.safeParse({ ...manualAddress.data, addressNumber: "" }).success).toBe(false);
    expect(condominiumSchema.safeParse({ ...manualAddress.data, unitIdentifier: "" }).success).toBe(false);
  });
});
