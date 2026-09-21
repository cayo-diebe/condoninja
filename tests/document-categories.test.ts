import { describe, expect, it } from "vitest";
import { allCategorySeeds, categorySeeds, retiredCategorySeeds } from "../lib/document-categories";
import { closeDbForTests, getDb, newId } from "../lib/db";
import { createUser, getCategory, getCategoryProgressForUser, getDashboardData, getDocumentByIdForUser, insertDocument, saveCondominium } from "../lib/repository";

async function resident() {
  const user = await createUser({ name: "Teste catálogo", email: `${newId()}@example.com`, password: "unused-password" }, "hash");
  await saveCondominium(user.id, {
    name: "Condomínio de teste", address: "Rua de teste", addressNumber: "10", cep: "01311000",
    city: "São Paulo", state: "SP", relationship: "proprietario", unitIdentifier: "42", cnpj: "",
    propertyType: "residencial", unitCount: 80,
  });
  return user;
}

async function document(userId: string, categorySlug: string) {
  const id = newId();
  return insertDocument({ id, userId, categorySlug, originalName: "documento.pdf", storageKey: `test/${id}.pdf`,
    mimeType: "application/pdf", sizeBytes: 32, sha256: id });
}

describe("document catalogue", () => {
  it("requests seven documents in three groups, with only three mandatory types", async () => {
    const progress = await getCategoryProgressForUser((await resident()).id);
    expect(progress.map(c => c.slug)).toEqual(categorySeeds.map(c => c.slug));
    expect([...new Set(progress.map(c => c.groupName))]).toEqual(["Governança", "Financeiro", "Cadastro do condomínio"]);
    expect(progress.filter(c => c.required).map(c => c.slug)).toEqual(["condominium_convention", "financial_statements", "condo_bill"]);
    expect(new Set(allCategorySeeds.map(c => c.slug)).size).toBe(allCategorySeeds.length);
    expect(progress.some(c => c.archived)).toBe(false);
  });

  it("requests 24-month coverage but accepts a consolidated file without claiming analysis", async () => {
    const user = await resident();
    for (const slug of ["assembly_minutes", "financial_statements"]) {
      expect((await getCategory(slug))?.label).toContain("24 meses");
      const saved = await document(user.id, slug);
      expect(saved?.status).toBe("awaiting_analysis");
      const category = (await getCategoryProgressForUser(user.id)).find(c => c.slug === slug);
      expect(category).toMatchObject({ minimumCount: 1, satisfied: true });
      expect(category?.documents).toHaveLength(1);
    }
    expect((await getDashboardData(user.id)).readyForAnalysis).toBe(false);
  });

  it("upgrades existing metadata, preserves old files, and hides empty retired categories", async () => {
    const user = await resident();
    const other = await resident();
    const historical = await document(user.id, "bank_statements");
    const current = await document(user.id, "financial_statements");
    // Simulate an existing database: an old label, an old group and no new types.
    const db = getDb();
    db.prepare("UPDATE document_categories SET label = 'Prestação de contas / balancetes' WHERE slug = 'financial_statements'").run();
    db.prepare("UPDATE document_categories SET group_name = 'Bancário' WHERE slug = 'bank_statements'").run();
    db.prepare("DELETE FROM document_categories WHERE slug IN ('internal_regulations', 'current_board', 'unit_map')").run();
    closeDbForTests();

    const progress = await getCategoryProgressForUser(user.id);
    expect(progress).toHaveLength(8);
    expect(progress.filter(c => c.archived).map(c => c.slug)).toEqual(["bank_statements"]);
    expect(progress.find(c => c.archived)).toMatchObject({ groupName: "Arquivos anteriores", required: false });
    expect(progress.find(c => c.slug === "financial_statements")?.label).toContain("24 meses");
    expect(await getDocumentByIdForUser(user.id, historical!.id)).toMatchObject({ id: historical!.id, storageKey: expect.any(String) });
    expect(await getDocumentByIdForUser(user.id, current!.id)).toMatchObject({ id: current!.id });
    expect(await getDocumentByIdForUser(other.id, historical!.id)).toBeNull();
    expect((await getCategoryProgressForUser(other.id)).some(c => c.archived)).toBe(false);
    const dashboard = await getDashboardData(user.id);
    expect(dashboard.documentCount).toBe(2);
    expect(dashboard.progress).toHaveLength(7);
    for (const category of retiredCategorySeeds) expect(await getCategory(category.slug)).toMatchObject({ archived: true });

    // A matching row count must not prevent later metadata updates.
    getDb().prepare("UPDATE document_categories SET label = 'Old label' WHERE slug = 'internal_regulations'").run();
    closeDbForTests();
    expect((await getCategory("internal_regulations"))?.label).toBe("Regulamento interno");
    expect((await getCategoryProgressForUser(user.id))).toHaveLength(8);
  });
});
