import { describe, expect, it } from "vitest";
import { localizeControlValidity, nativeValidationMessage } from "../lib/form-validation.ts";
import { FormRequestError, formErrorMessage } from "../lib/form-errors.ts";

function validity(flags: Partial<ValidityState> = {}): ValidityState {
  return {
    badInput: false, customError: false, patternMismatch: false, rangeOverflow: false,
    rangeUnderflow: false, stepMismatch: false, tooLong: false, tooShort: false,
    typeMismatch: false, valueMissing: false, valid: !Object.values(flags).some(Boolean),
    ...flags,
  };
}

describe("Brazilian Portuguese form messages", () => {
  it.each([
    [{ valueMissing: true }, {}, "Preencha este campo."],
    [{ valueMissing: true }, { tagName: "SELECT" }, "Selecione uma opção."],
    [{ valueMissing: true }, { type: "file" }, "Selecione um arquivo."],
    [{ valueMissing: true }, { type: "checkbox" }, "Marque esta opção para continuar."],
    [{ valueMissing: true }, { type: "radio" }, "Selecione uma opção."],
    [{ typeMismatch: true }, { type: "email" }, "Informe um e-mail válido."],
    [{ typeMismatch: true }, { type: "url" }, "Informe um endereço de site válido."],
    [{ tooShort: true }, { minLength: 8 }, "Use pelo menos 8 caracteres."],
    [{ tooLong: true }, { maxLength: 160 }, "Use no máximo 160 caracteres."],
    [{ patternMismatch: true }, { title: "Informe 8 dígitos ou deixe o CEP vazio." }, "Informe 8 dígitos ou deixe o CEP vazio."],
    [{ patternMismatch: true }, {}, "Preencha este campo no formato solicitado."],
    [{ rangeUnderflow: true }, { min: "1" }, "Informe um valor maior ou igual a 1."],
    [{ rangeOverflow: true }, { max: "10000" }, "Informe um valor menor ou igual a 10000."],
    [{ stepMismatch: true }, {}, "Informe um valor compatível com o intervalo permitido."],
    [{ badInput: true }, {}, "Informe um valor válido para este campo."],
    [{ customError: true }, {}, "Revise o valor informado neste campo."],
    [{}, {}, ""],
  ])("translates validity %j with attributes %j", (flags, attributes, expected) => {
    expect(nativeValidationMessage({ tagName: "INPUT", ...attributes, validity: validity(flags) })).toBe(expected);
  });

  it("clears a stale error when a value is corrected, including programmatic updates", () => {
    let message = "";
    let empty = true;
    const control = {
      tagName: "INPUT", willValidate: true,
      get validity() { return validity({ valueMissing: empty, customError: Boolean(message) }); },
      setCustomValidity(value: string) { message = value; },
    } as HTMLInputElement;
    localizeControlValidity(control);
    expect(message).toBe("Preencha este campo.");
    empty = false;
    localizeControlValidity(control);
    expect(message).toBe("");
  });

  it("preserves intended Portuguese errors but never exposes browser or JSON exceptions", () => {
    const fallback = "Não foi possível salvar. Tente novamente.";
    expect(formErrorMessage(new FormRequestError("E-mail ou senha inválidos."), fallback)).toBe("E-mail ou senha inválidos.");
    for (const error of [new TypeError("Failed to fetch"), new SyntaxError("Unexpected token <"), new Error("Internal Server Error"), new FormRequestError(""), null]) {
      expect(formErrorMessage(error, fallback)).toBe(fallback);
    }
  });
});
