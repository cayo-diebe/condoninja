import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth.ts";

describe("password authentication", () => {
  it("verifies the original password without storing it in clear text", () => {
    const encoded = hashPassword("uma-senha-segura");

    expect(encoded).toMatch(/^scrypt\$/);
    expect(encoded).not.toContain("uma-senha-segura");
    expect(verifyPassword("uma-senha-segura", encoded)).toBe(true);
    expect(verifyPassword("senha-errada", encoded)).toBe(false);
  });
});
