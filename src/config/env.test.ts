import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env";

const validEnv = {
  NODE_ENV: "test",
  APP_NAME: "Rifas Online",
  APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://user:password@localhost:5432/rifas_dev?schema=public",
  DIRECT_URL: "postgresql://user:password@localhost:5432/rifas_dev?schema=public",
  AUTH_SECRET: "12345678901234567890123456789012",
  LOG_LEVEL: "info",
};

describe("environment validation", () => {
  it("accepts the development environment contract", () => {
    const env = parseServerEnv(validEnv);

    expect(env.DATABASE_URL).toContain("postgresql://");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("rejects unsafe auth secrets", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        AUTH_SECRET: "short",
      }),
    ).toThrow();
  });
});
