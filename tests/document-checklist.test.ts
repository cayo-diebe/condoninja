import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DocumentChecklist } from "../components/document-checklist";
import { categorySeeds, retiredCategorySeeds } from "../lib/document-categories";
import type { CategoryProgress } from "../lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

function category(seed: (typeof categorySeeds)[number], archived = false): CategoryProgress {
  return { ...seed, required: Boolean(seed.required), archived, allowedExtensions: ["pdf"], satisfied: archived,
    documents: archived ? [{ id: "old-file", originalName: "antigo.pdf" } as CategoryProgress["documents"][number]] : [] };
}

describe("document checklist", () => {
  it("offers the seven current requests and explains the minimum vs period coverage", () => {
    const html = renderToStaticMarkup(createElement(DocumentChecklist, { initialCategories: categorySeeds.map(c => category(c)) }));
    expect(html.match(/type="file"/g)).toHaveLength(7);
    expect(html).toContain("não confirma a cobertura de todo o período");
    expect(html).toContain("AGO");
    expect(html).toContain("AGE");
    expect(html).toContain("Não é necessário incluir nomes ou telefones");
  });

  it("keeps historical files visible without requesting new uploads", () => {
    const html = renderToStaticMarkup(createElement(DocumentChecklist, { initialCategories: [category(retiredCategorySeeds[0], true)], collapsibleGroups: true }));
    expect(html).toContain("Arquivos anteriores");
    expect(html).toContain("Arquivo anterior");
    expect(html).toContain("antigo.pdf");
    expect(html).not.toContain('type="file"');
    expect(html).not.toContain("selecione do dispositivo");
    expect(html).not.toContain("Recomendado");
    expect(html).toContain('aria-expanded="false"');
  });
});
