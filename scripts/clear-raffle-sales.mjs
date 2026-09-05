import "dotenv/config";

import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
const raffleSlug = process.argv[2] ?? "gran-rifa-solidaria-u17-de-bolivar";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const client = new pg.Client({ connectionString: databaseUrl });

await client.connect();

try {
  await client.query("BEGIN");

  const raffleResult = await client.query('SELECT id, name FROM "Raffle" WHERE slug = $1', [
    raffleSlug,
  ]);
  const raffle = raffleResult.rows[0];

  if (!raffle) {
    throw new Error(`No raffle found with slug ${raffleSlug}.`);
  }

  await client.query(
    `
      UPDATE "Ticket"
      SET
        status = 'AVAILABLE',
        "reservedUntil" = NULL,
        "participantId" = NULL,
        "currentOrderId" = NULL,
        "currentPaymentId" = NULL,
        "cancellationReason" = NULL
      WHERE "raffleId" = $1
    `,
    [raffle.id],
  );

  await client.query('DELETE FROM "Winner" WHERE "raffleId" = $1', [raffle.id]);
  await client.query('DELETE FROM "DrawEligibleTicket" WHERE "raffleId" = $1', [raffle.id]);
  await client.query('DELETE FROM "Draw" WHERE "raffleId" = $1', [raffle.id]);
  await client.query('DELETE FROM "TicketHistory" WHERE "raffleId" = $1', [raffle.id]);
  await client.query('DELETE FROM "AuditLog" WHERE "raffleId" = $1', [raffle.id]);
  await client.query(
    'DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "raffleId" = $1)',
    [raffle.id],
  );
  await client.query('DELETE FROM "Payment" WHERE "raffleId" = $1', [raffle.id]);
  await client.query('DELETE FROM "Order" WHERE "raffleId" = $1', [raffle.id]);
  await client.query(
    `
      DELETE FROM "Participant"
      WHERE "userId" IS NULL
        AND id NOT IN (SELECT DISTINCT "participantId" FROM "Order" WHERE "participantId" IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT "participantId" FROM "Payment" WHERE "participantId" IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT "participantId" FROM "Ticket" WHERE "participantId" IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT "participantId" FROM "Winner" WHERE "participantId" IS NOT NULL)
    `,
  );

  await client.query("COMMIT");
  console.log(`Raffle sales cleared: ${raffle.name}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
