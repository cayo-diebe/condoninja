/**
 * Configuração central do site.
 * Altere aqui nome, domínio e textos de SEO — nunca dentro dos componentes.
 */
export const site = {
  name: "Condo Ninja",
  tagline: "Você sabe para onde vai o dinheiro do seu condomínio?",
  description:
    "Organize os documentos do seu condomínio, acompanhe o que falta e prepare o caminho para um Raio-X baseado em evidências.",
  locale: "pt_BR",
  /** Contato público. Deixe vazio até o canal oficial existir. */
  contactEmail: "",
} as const;

/** Âncoras da navegação. IDs precisam bater com os `id` das seções. */
export const nav = [
  { href: "#problema", label: "O problema" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#tecnologia", label: "Tecnologia" },
  { href: "#principios", label: "Princípios" },
] as const;
