import { describe, expect, it } from "vitest";
import { readStoredFile, removeStoredFile, sha256, storageKeyFor, validateFileContent, validateFileMetadata, writeStoredFile } from "../lib/file-storage.ts";

describe("private document storage", () => {
  it("validates file type and content before storing", () => {
    const pdf = Buffer.from("%PDF-1.7\nsynthetic test document");

    expect(validateFileMetadata("balancete.pdf", pdf.length)).toBe("pdf");
    expect(() => validateFileContent("pdf", pdf)).not.toThrow();
    expect(() => validateFileMetadata("script.exe", pdf.length)).toThrow(/Formato não suportado/);
    expect(() => validateFileContent("pdf", Buffer.from("not a pdf"))).toThrow(/conteúdo/);
    expect(() => validateFileMetadata("empty.pdf", 0)).toThrow(/vazio/);
  });

  it("round-trips a file under the private condominium key", async () => {
    const content = Buffer.from("%PDF-1.7\nprivate synthetic document");
    const key = storageKeyFor("condo-a", "document-a", "pdf");

    await writeStoredFile(key, content);
    await expect(readStoredFile(key)).resolves.toEqual(content);
    expect(sha256(content)).toHaveLength(64);
    await removeStoredFile(key);
    await expect(readStoredFile(key)).rejects.toThrow();
  });

  it("rejects path traversal keys", async () => {
    await expect(readStoredFile("../outside.txt")).rejects.toThrow(/Invalid storage key/);
  });
});
