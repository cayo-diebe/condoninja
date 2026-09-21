import { describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/documents/route";

vi.mock("@/lib/http", () => ({
  assertSameOrigin: () => true,
  requireApiUser: async () => ({ id: "resident" }),
  jsonError: (error: string, status = 400) => Response.json({ error }, { status }),
}));
vi.mock("@/lib/repository", () => ({
  getCondominiumIdForUser: async () => "condominium",
  getCategory: async () => ({ slug: "bank_statements", archived: true }),
  getCategoryProgressForUser: vi.fn(),
}));

describe("retired document uploads", () => {
  it("rejects an old client uploading into a retired category in pt-BR", async () => {
    const body = new FormData();
    body.append("categorySlug", "bank_statements");
    body.append("files", new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), "extrato.pdf");
    const response = await POST(new Request("http://localhost/api/documents", { method: "POST", body }));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("mantida apenas no histórico");
  });
});
