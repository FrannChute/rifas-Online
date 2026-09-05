import { describe, expect, it } from "vitest";

import { parseRaffleForm } from "./schemas";

function buildForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    name: "Rifa solidaria",
    description: "Una rifa real con descripcion suficiente.",
    price: "2500",
    currency: "ars",
    startNumber: "1",
    endNumber: "1500",
    numberPadding: "4",
    reservationDurationMinutes: "10",
    allowGuestPurchase: "on",
    paymentBankTransfer: "on",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("raffleFormSchema", () => {
  it("normalizes valid raffle form input", () => {
    const input = parseRaffleForm(buildForm());

    expect(input.currency).toBe("ARS");
    expect(input.startNumber).toBe(1);
    expect(input.endNumber).toBe(1500);
    expect(input.numberPadding).toBe(4);
    expect(input.allowGuestPurchase).toBe(true);
    expect(input.paymentBankTransfer).toBe(true);
  });

  it("rejects invalid number ranges", () => {
    expect(() => parseRaffleForm(buildForm({ startNumber: "1500", endNumber: "1" }))).toThrow();
  });

  it("requires at least one payment method", () => {
    const formData = buildForm();
    formData.delete("paymentBankTransfer");

    expect(() => parseRaffleForm(formData)).toThrow();
  });
});
