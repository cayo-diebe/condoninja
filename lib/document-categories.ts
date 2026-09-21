export const categorySeeds = [
  {
    slug: "condominium_convention",
    label: "Convenção do condomínio",
    description: "Documento que define regras, direitos e responsabilidades do condomínio.",
    whyRequired: "Ajuda a interpretar regras internas e validar decisões futuras.",
    groupName: "Governança",
    required: 1,
    minimumCount: 1,
    sortOrder: 10,
  },
  {
    slug: "internal_regulations",
    label: "Regulamento interno",
    description: "Regulamento ou regimento interno vigente, com as regras de convivência e uso das áreas comuns.",
    whyRequired: "Ajuda a conhecer seus direitos e deveres no dia a dia do condomínio.",
    groupName: "Governança",
    required: 0,
    minimumCount: 1,
    sortOrder: 20,
  },
  {
    slug: "assembly_minutes",
    label: "Atas de assembleias (últimos 24 meses)",
    description: "Reúna as atas dos últimos 24 meses, com data, temas discutidos e indicação de assembleia ordinária (AGO) ou extraordinária (AGE). Podem estar em arquivos separados ou reunidas em um único arquivo.",
    whyRequired: "Ajuda a acompanhar as decisões sobre despesas, obras e gestão, para participar com mais informação.",
    groupName: "Governança",
    required: 0,
    minimumCount: 1,
    sortOrder: 30,
  },
  {
    slug: "current_board",
    label: "Composição da gestão atual",
    description: "Ata de eleição ou documento que identifique o síndico, o subsíndico e os conselhos, quando houver, e seus mandatos. Se essas informações já estiverem nas atas enviadas, não é necessário reenviar o mesmo arquivo.",
    whyRequired: "Ajuda a saber quem representa o condomínio e a quem dirigir dúvidas e solicitações.",
    groupName: "Governança",
    required: 0,
    minimumCount: 1,
    sortOrder: 40,
  },
  {
    slug: "financial_statements",
    label: "Demonstrativos ou balancetes (últimos 24 meses)",
    description: "Reúna os demonstrativos de resultados ou balancetes dos últimos 24 meses. Comece com pelo menos um arquivo e complemente o período quando puder. Um arquivo consolidado pode reunir vários meses.",
    whyRequired: "É a base para entender os gastos ao longo do tempo e buscar oportunidades de economia.",
    groupName: "Financeiro",
    required: 1,
    minimumCount: 1,
    sortOrder: 50,
  },
  {
    slug: "condo_bill",
    label: "Boleto da taxa condominial (qualquer mês)",
    description: "Um boleto de pagamento da taxa condominial, de qualquer mês. Evite incluir dados pessoais que não sejam necessários para entender a cobrança.",
    whyRequired: "Ajuda a entender o que compõe a sua taxa e relacionar a cobrança aos gastos do condomínio.",
    groupName: "Financeiro",
    required: 1,
    minimumCount: 1,
    sortOrder: 60,
  },
  {
    slug: "unit_map",
    label: "Mapa das unidades",
    description: "Relação ou planta das unidades, com blocos, numeração e frações ideais, se disponíveis. Não é necessário incluir nomes ou telefones de moradores. Se essas informações já estiverem na convenção enviada, não é preciso reenviar o mesmo arquivo.",
    whyRequired: "Ajuda a compreender a composição do condomínio e os critérios de divisão das despesas.",
    groupName: "Cadastro do condomínio",
    required: 0,
    minimumCount: 1,
    sortOrder: 70,
  },
];

// Preserve stable IDs and foreign keys for files sent before this catalogue.
// Retired categories appear only when the condominium already has files in them.
export const retiredCategorySeeds = [
  { slug: "budget", label: "Orçamento ou previsão orçamentária", sortOrder: 110 },
  { slug: "bank_statements", label: "Extratos bancários", sortOrder: 120 },
  { slug: "contracts_suppliers", label: "Contratos e fornecedores", sortOrder: 130 },
  { slug: "supporting_documents", label: "Documentos adicionais", sortOrder: 140 },
].map(category => ({
  ...category,
  description: "Arquivo enviado antes da atualização da lista de documentos.",
  whyRequired: "Mantido no histórico do condomínio; não é mais solicitado nesta etapa.",
  groupName: "Arquivos anteriores",
  required: 0,
  minimumCount: 1,
}));

export const allCategorySeeds = [...categorySeeds, ...retiredCategorySeeds];
export const isRetiredDocumentCategory = (slug: string) => retiredCategorySeeds.some(category => category.slug === slug);

// Shared by SQLite and D1: refresh existing catalogues, not just new databases.
// UPSERT preserves identity and never replaces/deletes uploaded documents.
export const categoryUpsertSql = `INSERT INTO document_categories
  (slug, label, description, why_required, group_name, required, minimum_count, sort_order, allowed_extensions)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    label = excluded.label, description = excluded.description, why_required = excluded.why_required,
    group_name = excluded.group_name, required = excluded.required, minimum_count = excluded.minimum_count,
    sort_order = excluded.sort_order, allowed_extensions = excluded.allowed_extensions`;

export function categorySeedValues(category: (typeof categorySeeds)[number], extensions: string[]) {
  return [category.slug, category.label, category.description, category.whyRequired, category.groupName,
    category.required, category.minimumCount, category.sortOrder, JSON.stringify(extensions)];
}
