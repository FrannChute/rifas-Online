import { describe, expect, it } from "vitest";

import { buildTicketRows, calculateTicketCount, formatTicketLabel } from "./ticket-numbering";

describe("ticket numbering", () => {
  it("calculates the amount from the numeric range", () => {
    expect(calculateTicketCount(1, 1500)).toBe(1500);
    expect(calculateTicketCount(100, 150)).toBe(51);
  });

  it("formats labels with optional padding", () => {
    expect(formatTicketLabel(1, 0)).toBe("1");
    expect(formatTicketLabel(1, 4)).toBe("0001");
    expect(formatTicketLabel(10000, 5)).toBe("10000");
  });

  it("rejects invalid ranges", () => {
    expect(() => calculateTicketCount(10, 1)).toThrow("endNumber must be greater");
  });

  it("builds rows without imposing a business cap", () => {
    const rows = buildTicketRows({
      raffleId: "raffle_1",
      startNumber: 9998,
      endNumber: 10002,
      numberPadding: 5,
    });

    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ number: 9998, label: "09998" });
    expect(rows[4]).toMatchObject({ number: 10002, label: "10002" });
  });
});
