import { describe, expect, it } from "vitest";
import { hashPassword } from "../lib/auth.ts";
import { advanceOnboarding, createUser, deleteDocumentForUser, getCategoryProgressForUser, getDashboardData, getDocumentByIdForUser, getOnboarding, insertDocument, saveCondominium } from "../lib/repository.ts";
import { newId } from "../lib/db.ts";
import { saveAddressDraft, saveCondominiumName, listCondominiumJourneys, selectCondominiumJourney, completeOnboarding, listDocumentsForUser } from "../lib/repository.ts";

const condominium = {
  name: "Condomínio Jardim",
  address: "Rua das Flores",
  addressNumber: "10",
  cep: "01311000",
  city: "São Paulo",
  state: "SP",
  relationship: "proprietario",
  unitIdentifier: "42",
  cnpj: "",
  propertyType: "residencial" as const,
  unitCount: 80,
};

describe("onboarding persistence and authorization", () => {
  it("keeps independent condominium journeys, documents and ownership when switching", async () => {
    const user = (await createUser({ name: "Multi", email: "multi@example.com", password: "unused-password" }, "hash"));
    const other = (await createUser({ name: "Other", email: "othermulti@example.com", password: "unused-password" }, "hash"));
    (await saveCondominium(user.id, condominium));
    const original = (await listCondominiumJourneys(user.id))[0].id;
    (await insertDocument({ id: newId(), userId: user.id, categorySlug: "condominium_convention", originalName: "original.pdf", storageKey: "multi-original.pdf", mimeType: "application/pdf", sizeBytes: 32, sha256: "b".repeat(64) }));
    (await completeOnboarding(user.id));
    (await selectCondominiumJourney(user.id));
    expect((await getOnboarding(user.id))).toMatchObject({ step: "welcome", status: "in_progress", condominium: null });
    expect((await listDocumentsForUser(user.id))).toHaveLength(0);
    (await saveAddressDraft(user.id, { ...condominium, name: "Segundo prédio", addressNumber: "99" }));
    const second = (await listCondominiumJourneys(user.id)).find(j => j.selected)!.id;
    await expect(selectCondominiumJourney(other.id, original)).rejects.toThrow("JOURNEY_NOT_FOUND");
    (await selectCondominiumJourney(user.id, original));
    expect((await getOnboarding(user.id))).toMatchObject({ status: "complete", condominium: { name: condominium.name, addressNumber: "10" } });
    expect((await listDocumentsForUser(user.id))).toHaveLength(1);
    (await selectCondominiumJourney(user.id, second));
    expect((await getOnboarding(user.id))).toMatchObject({ step: "condominium", addressDraft: { name: "Segundo prédio", addressNumber: "99" } });
    (await saveCondominium(user.id, { ...condominium, name: "Segundo prédio", addressNumber: "99" }));
    expect((await listDocumentsForUser(user.id))).toHaveLength(0);
    (await selectCondominiumJourney(user.id, original));
    expect((await getOnboarding(user.id)).condominium?.name).toBe(condominium.name);
    expect((await listCondominiumJourneys(user.id))).toHaveLength(2);
  });
  it("does not fabricate a condominium before the user saves one", async () => {
    const user = (await createUser(
      { name: "Novo Usuário", email: "novo@example.com", password: "unused-password" },
      hashPassword("unused-password"),
    ));

    expect((await getOnboarding(user.id)).condominium).toBeNull();
  });

  it("resumes condominium progress and protects documents between users", async () => {
    const userA = (await createUser({ name: "Ana Souza", email: "ana@example.com", password: "unused-password" }, hashPassword("unused-password")));
    const userB = (await createUser({ name: "Bruno Lima", email: "bruno@example.com", password: "unused-password" }, hashPassword("unused-password")));

    expect((await getOnboarding(userA.id)).step).toBe("welcome");
    await expect(advanceOnboarding(userA.id, "documents")).rejects.toThrow("ONBOARDING_STEP_LOCKED");
    expect((await getOnboarding(userA.id)).step).toBe("welcome");
    (await advanceOnboarding(userA.id, "address"));
    expect((await getOnboarding(userA.id)).step).toBe("address");
    await expect(advanceOnboarding(userA.id, "condominium")).rejects.toThrow("ONBOARDING_STEP_LOCKED");
    (await saveAddressDraft(userA.id, condominium));
    expect((await getOnboarding(userA.id)).step).toBe("condominium");
    expect((await getOnboarding(userA.id)).addressDraft?.address).toBe("Rua das Flores");
    expect((await getOnboarding(userA.id)).condominium).toBeNull();
    expect((await getOnboarding(userB.id)).addressDraft).toBeNull();
    expect((await saveCondominiumName(userA.id, "Edifício escolhido"))).toBe(true);
    expect((await getOnboarding(userA.id)).addressDraft).toMatchObject({ name: "Edifício escolhido", address: "Rua das Flores", addressNumber: "10" });
    expect((await saveCondominiumName(userA.id, "Outro edifício", "960"))).toBe(true);
    expect((await saveCondominiumName(userA.id, "Sem número"))).toBe(true);
    expect((await getOnboarding(userA.id)).addressDraft).toMatchObject({ name: "Sem número", address: "Rua das Flores", addressNumber: "960" });
    expect((await getOnboarding(userA.id)).step).toBe("condominium");
    expect((await saveCondominiumName(userB.id, "Sem endereço"))).toBe(false);
    await expect(advanceOnboarding(userA.id, "documents")).rejects.toThrow("ONBOARDING_STEP_LOCKED");
    (await advanceOnboarding(userA.id, "welcome"));
    expect((await getOnboarding(userA.id)).step).toBe("welcome");
    const afterCondo = (await saveCondominium(userA.id, condominium));
    expect(afterCondo.step).toBe("documents");
    expect(afterCondo.condominium?.name).toBe("Condomínio Jardim");
    expect(afterCondo.condominium?.addressNumber).toBe("10");
    expect((await saveCondominiumName(userA.id, "Nome atualizado"))).toBe(true);
    expect((await getOnboarding(userA.id)).condominium).toMatchObject({ name: "Nome atualizado", addressNumber: "10" });
    expect((await saveCondominiumName(userA.id, "Outro edifício", "960"))).toBe(true);
    expect((await saveCondominiumName(userA.id, "Sem número"))).toBe(true);
    expect((await getOnboarding(userA.id)).condominium).toMatchObject({ name: "Sem número", addressNumber: "960" });
    expect((await getOnboarding(userA.id)).step).toBe("documents");
    expect((await getOnboarding(userB.id)).condominium).toBeNull();

    const documentId = newId();
    const document = (await insertDocument({
      id: documentId,
      userId: userA.id,
      categorySlug: "condominium_convention",
      originalName: "convencao.pdf",
      storageKey: `condo/${documentId}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 32,
      sha256: "a".repeat(64),
    }));

    expect(document?.id).toBe(documentId);
    expect((await getDocumentByIdForUser(userA.id, documentId))?.originalName).toBe("convencao.pdf");
    expect((await getDocumentByIdForUser(userB.id, documentId))).toBeNull();
    expect((await deleteDocumentForUser(userB.id, documentId))).toBeNull();
  });

  it("counts the three minimum document categories and blocks incomplete completion state", async () => {
    const user = (await createUser({ name: "Carla Dias", email: "carla@example.com", password: "unused-password" }, hashPassword("unused-password")));
    (await saveCondominium(user.id, { ...condominium, name: "Condomínio Sol" }));

    const initial = (await getDashboardData(user.id));
    expect(initial.requiredTotal).toBe(3);
    expect(initial.requiredSatisfied).toBe(0);
    expect(initial.readyForAnalysis).toBe(false);

    for (const [categorySlug, index] of [["condominium_convention", 1], ["financial_statements", 2], ["condo_bill", 3]] as const) {
      const id = newId();
      (await insertDocument({
        id,
        userId: user.id,
        categorySlug,
        originalName: `${index}.pdf`,
        storageKey: `condo-sol/${id}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 32,
        sha256: String(index).repeat(64),
      }));
    }

    const complete = (await getDashboardData(user.id));
    expect(complete.requiredSatisfied).toBe(3);
    expect(complete.readyForAnalysis).toBe(true);
    expect((await getCategoryProgressForUser(user.id)).filter((category) => category.required && category.satisfied)).toHaveLength(3);
  });
});
