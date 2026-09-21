import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DocumentGroup } from "../components/document-group";
import type { CategoryProgress } from "../lib/types";

function category(satisfied: boolean, required = true): CategoryProgress {
  return {
    slug: required ? "convention" : "minutes", label: "Documento", groupName: "Governança",
    description: "", whyRequired: "", required, minimumCount: 1, sortOrder: 1, allowedExtensions: ["pdf"],
    satisfied, documents: satisfied ? [{ id: "document", originalName: "documento.pdf" } as CategoryProgress["documents"][number]] : [],
  };
}

function render(categories: CategoryProgress[], collapsible = true) {
  return renderToStaticMarkup(createElement(DocumentGroup, {
    name: "Governança", categories, collapsible, children: createElement("button", {}, "Selecionar arquivo"),
  }));
}

describe("document group accordion defaults", () => {
  it("collapses only groups with every item satisfied, keeping progress visible", () => {
    const html = render([category(true), category(true, false)]);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-hidden="true" inert=""');
    expect(html).toContain("2 de 2 com arquivos");
    expect(html).toContain("document-group-progress is-complete");
    expect(html).toContain('aria-controls="');
  });

  it("keeps groups open when a recommended item is missing", () => {
    const html = render([category(true), category(false, false)]);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-hidden="false"');
    expect(html).not.toContain('inert=""');
    expect(html).toContain("1 de 2 com arquivos");
  });

  it("keeps missing required items and wholly empty groups open", () => {
    expect(render([category(false), category(true, false)])).toContain('aria-expanded="true"');
    expect(render([category(false)])).toContain('aria-expanded="true"');
    expect(render([])).toContain('aria-expanded="true"');
  });

  it("preserves the onboarding's existing non-collapsible groups", () => {
    const html = render([category(true)], false);
    expect(html).not.toContain("aria-expanded");
    expect(html).not.toContain("aria-hidden");
    expect(html).toContain("category-list");
  });
});
