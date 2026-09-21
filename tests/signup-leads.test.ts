import { describe, expect, it } from "vitest";
import { closeDbForTests, getDb } from "../lib/db.ts";
import { allowSignupLeadAttempt, saveSignupLead } from "../lib/signup-leads.ts";

describe("homepage email capture", () => {
  it("persists and deduplicates an email without creating an account", async () => {
    expect((await saveSignupLead("  Residente@Example.com  "))).toBe("residente@example.com");
    (await saveSignupLead("RESIDENTE@example.com"));
    closeDbForTests();
    const rows = (await getDb().prepare("SELECT * FROM signup_leads WHERE email = ?").all("residente@example.com"));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "residente@example.com", source: "homepage_raio_x" });
    expect((await getDb().prepare("SELECT id FROM users WHERE email = ?").get("residente@example.com"))).toBeUndefined();
  });

  it("rejects invalid email addresses before persistence", async () => {
    for (const value of ["", "not-an-email", null, "a".repeat(161) + "@example.com"]) {
      await expect(saveSignupLead(value)).rejects.toThrow();
    }
  });

  it("limits repeated attempts and permits a retry after the window", () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(allowSignupLeadAttempt("test-client", 1000)).toBe(true);
    }
    expect(allowSignupLeadAttempt("test-client", 1000)).toBe(false);
    expect(allowSignupLeadAttempt("other-client", 1000)).toBe(true);
    expect(allowSignupLeadAttempt("test-client", 601000)).toBe(true);
  });
});
