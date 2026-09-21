import { z } from "zod";

// Schema-specific messages below take precedence. Cover every remaining Zod
// message in Brazilian Portuguese, including missing values and size limits.
z.config({ localeError: issue => {
  switch (issue.code) {
    case "invalid_type":
      return issue.input === undefined || issue.input === null ? "Preencha este campo." : "Informe um valor válido para este campo.";
    case "too_small":
      return issue.origin === "string" ? `Use pelo menos ${issue.minimum} caracteres.` : `Informe um valor maior ou igual a ${issue.minimum}.`;
    case "too_big":
      return issue.origin === "string" ? `Use no máximo ${issue.maximum} caracteres.` : `Informe um valor menor ou igual a ${issue.maximum}.`;
    case "invalid_format":
      return issue.format === "email" ? "Informe um e-mail válido." : "Preencha este campo no formato solicitado.";
    case "invalid_value":
      return "Selecione uma opção válida.";
    default:
      return "Revise o valor informado neste campo.";
  }
} });

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  email: z.string().trim().email("Informe um e-mail válido.").max(160),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(128, "A senha precisa ter no máximo 128 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(160),
  password: z.string().min(1, "Informe sua senha."),
});

export const condominiumSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do condomínio.").max(160),
  address: z.string().trim().min(4, "Informe o endereço do condomínio.").max(200),
  addressNumber: z.string().trim().min(1, "Informe o número do endereço.").max(20),
  cep: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 0 || value.length === 8, "Informe um CEP com 8 dígitos ou deixe o campo vazio."),
  city: z.string().trim().min(2, "Informe a cidade.").max(100),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Selecione o estado."),
  relationship: z.string().trim().min(2, "Informe sua relação com o condomínio.").max(80),
  unitIdentifier: z.string().trim().min(1, "Informe o complemento ou a unidade/apartamento.").max(40),
  cnpj: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 0 || value.length === 14, "Informe um CNPJ válido.")
    .optional()
    .or(z.literal("")),
  propertyType: z.enum(["residencial", "comercial", "misto"]).optional().or(z.literal("")),
  unitCount: z
    .union([z.number().int().min(1).max(10000), z.string()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return null;
      const numeric = Number(value);
      return Number.isInteger(numeric) && numeric > 0 && numeric <= 10000 ? numeric : null;
    }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export const addressSchema = condominiumSchema.pick({ address: true, addressNumber: true, cep: true, city: true, state: true, unitIdentifier: true }).extend({ name: z.string().trim().max(160).optional() });
export type LoginInput = z.infer<typeof loginSchema>;
export type CondominiumInput = z.infer<typeof condominiumSchema>;

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
