import { pbkdf2Sync } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyPassword } from "./password";

function createHash(password: string) {
  const salt = "test-salt";
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");

  return `pbkdf2_sha512$100000$${salt}$${hash}`;
}

describe("verifyPassword", () => {
  it("accepts the matching password", () => {
    expect(verifyPassword("TestPassword123!", createHash("TestPassword123!"))).toBe(true);
  });

  it("rejects invalid passwords", () => {
    expect(verifyPassword("wrong-password", createHash("TestPassword123!"))).toBe(false);
  });
});
