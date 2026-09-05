import { describe, expect, it } from "vitest";

import { assertRaffleTransition, getAllowedRaffleTransitions } from "./status";

describe("raffle status transitions", () => {
  it("allows publishing or opening a draft raffle", () => {
    expect(getAllowedRaffleTransitions("DRAFT")).toEqual(["PUBLISHED", "OPEN", "ARCHIVED"]);
  });

  it("rejects invalid direct transitions", () => {
    expect(() => assertRaffleTransition("DRAWN", "OPEN")).toThrow("Transicion de rifa invalida");
  });
});
