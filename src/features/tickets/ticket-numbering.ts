import type { TicketStatus } from "@/generated/prisma/client";

export type TicketRangeInput = {
  raffleId: string;
  startNumber: number;
  endNumber: number;
  numberPadding: number;
};

export type TicketCreateRow = {
  raffleId: string;
  number: number;
  label: string;
  status: TicketStatus;
};

export function calculateTicketCount(startNumber: number, endNumber: number) {
  if (!Number.isInteger(startNumber) || !Number.isInteger(endNumber)) {
    throw new Error("Ticket range values must be integers.");
  }

  if (startNumber < 0) {
    throw new Error("startNumber must be zero or greater.");
  }

  if (endNumber < startNumber) {
    throw new Error("endNumber must be greater than or equal to startNumber.");
  }

  return endNumber - startNumber + 1;
}

export function formatTicketLabel(number: number, numberPadding: number) {
  if (!Number.isInteger(numberPadding) || numberPadding < 0) {
    throw new Error("numberPadding must be zero or greater.");
  }

  return number.toString().padStart(numberPadding, "0");
}

export function buildTicketRows(input: TicketRangeInput): TicketCreateRow[] {
  const total = calculateTicketCount(input.startNumber, input.endNumber);

  return Array.from({ length: total }, (_, index) => {
    const number = input.startNumber + index;

    return {
      raffleId: input.raffleId,
      number,
      label: formatTicketLabel(number, input.numberPadding),
      status: "AVAILABLE",
    };
  });
}

export function chunkRows<T>(rows: T[], size: number) {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("Chunk size must be a positive integer.");
  }

  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}
