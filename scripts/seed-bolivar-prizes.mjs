import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed Bolivar prizes.");
}

const raffleSlug = "gran-rifa-solidaria-u17-de-bolivar";

function prizeImage(position) {
  return `/prizes/bolivar-${position.toString().padStart(2, "0")}.svg`;
}

const prizes = [
  {
    position: 1,
    name: "1 noche de estadia en Complejo San Pio",
    description: "Escapada de descanso en Icho Cruz, ideal para disfrutar en temporada baja.",
    imageUrl: prizeImage(1),
  },
  {
    position: 2,
    name: "Pase por 1 mes en Cinesis Medicl Gym",
    description: "Un mes de entrenamiento para moverse, sumar energia y mantenerse activo.",
    imageUrl: prizeImage(2),
  },
  {
    position: 3,
    name: "2 cortes masculinos en Sotelo Barber Shop + 2 cajas de alfajores",
    description: "Dos cortes de barberia y dos cajas dulces para compartir despues.",
    imageUrl: prizeImage(3),
  },
  {
    position: 4,
    name: "1 corte masculino en Sotelo Barber Shop + 1 caja de alfajores",
    description: "Un combo de barberia con una caja de alfajores para darse un gusto.",
    imageUrl: prizeImage(4),
  },
  {
    position: 5,
    name: "1 corte masculino en Sotelo Barber Shop + 1 caja de alfajores",
    description: "Corte masculino y alfajores, una combinacion simple y rendidora.",
    imageUrl: prizeImage(5),
  },
  {
    position: 6,
    name: "Mantel de mesa de tusor + agarraderas de horno",
    description: "Set practico para vestir la mesa y sumar utilidad en la cocina.",
    imageUrl: prizeImage(6),
  },
  {
    position: 7,
    name: "1 botella de Casalta + 1 champagne",
    description: "Bebidas para brindar y acompanar una celebracion especial.",
    imageUrl: prizeImage(7),
  },
  {
    position: 8,
    name: "1 botella de Casalta + 1 champagne",
    description: "Otro premio de brindis para compartir en familia o con amigos.",
    imageUrl: prizeImage(8),
  },
  {
    position: 9,
    name: "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
    description: "Un turno de padel para jugar y una caja dulce para el cierre.",
    imageUrl: prizeImage(9),
  },
  {
    position: 10,
    name: "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
    description: "Padel con amigos y alfajores como premio extra.",
    imageUrl: prizeImage(10),
  },
  {
    position: 11,
    name: "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
    description: "Un nuevo turno de padel para seguir sumando juego.",
    imageUrl: prizeImage(11),
  },
  {
    position: 12,
    name: "Rodillera de basquet Nike",
    description: "Proteccion deportiva para entrenar y jugar al basquet con mas seguridad.",
    imageUrl: prizeImage(12),
  },
  {
    position: 13,
    name: "Merienda para 2 personas en Aqui Bar La Terminal",
    description: "Merienda para dos, pensada para compartir una salida tranquila.",
    imageUrl: prizeImage(13),
  },
  {
    position: 14,
    name: "Voucher de descuento Urquiza VCP",
    description: "Beneficio de descuento para usar en una compra local.",
    imageUrl: prizeImage(14),
  },
  {
    position: 15,
    name: "Productos de limpieza Distribuidora CRISBET",
    description: "Combo de limpieza con Skip, Vivere y producto para ceramica o piso.",
    imageUrl: prizeImage(15),
  },
  {
    position: 16,
    name: "Hornitos + esencia aromatizante",
    description: "Detalle aromatico para perfumar espacios y sumar calidez al hogar.",
    imageUrl: prizeImage(16),
  },
  {
    position: 17,
    name: "MANTEL KOA.DECOHOME",
    description: "Mantel decorativo para renovar la mesa con un toque prolijo.",
    imageUrl: prizeImage(17),
  },
  {
    position: 18,
    name: "1 bolsa de papa + 2 maples de huevos + 1 aceite de oliva",
    description: "Canasta basica con papas, huevos y aceite de oliva.",
    imageUrl: prizeImage(18),
  },
  {
    position: 19,
    name: "1 bolsa de papa + 2 maples de huevos + 1 aceite de oliva",
    description: "Otro combo de alimentos utiles para la cocina diaria.",
    imageUrl: prizeImage(19),
  },
  {
    position: 20,
    name: "Kit crema antiage Farmacia Sassarolli",
    description: "Kit de cuidado personal orientado a rutina facial antiage.",
    imageUrl: prizeImage(20),
  },
  {
    position: 21,
    name: "1 aceite de oliva + 1 docena de alfajores",
    description: "Combo dulce con aceite de oliva y una docena de alfajores.",
    imageUrl: prizeImage(21),
  },
  {
    position: 22,
    name: "Caja de golosinas y chocolates",
    description: "Caja dulce con golosinas y chocolates para disfrutar o compartir.",
    imageUrl: prizeImage(22),
  },
];

const client = new pg.Client({ connectionString, ssl: false });

await client.connect();

try {
  await client.query("BEGIN");

  const raffleResult = await client.query(
    'SELECT id, name FROM "Raffle" WHERE slug = $1 ORDER BY "createdAt" DESC LIMIT 1',
    [raffleSlug],
  );

  const raffle = raffleResult.rows[0];

  if (!raffle) {
    throw new Error(`No se encontro la rifa ${raffleSlug}`);
  }

  const now = new Date();
  const closesAt = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  await client.query(
    `UPDATE "Raffle"
     SET "imageUrl" = $1,
         status = 'OPEN',
         "startNumber" = 501,
         "endNumber" = 600,
         "numberPadding" = GREATEST("numberPadding", 4),
         price = 3000.00,
         "startsAt" = COALESCE("startsAt", $2),
         "closesAt" = COALESCE("closesAt", $3),
         "updatedAt" = $2
     WHERE id = $4`,
    ["/brand/bolivar-u17-rifa.png", now, closesAt, raffle.id],
  );

  const ticketValues = Array.from({ length: 100 }, (_, index) => {
    const number = index + 501;
    const label = number.toString().padStart(4, "0");

    return `('${crypto.randomUUID()}', '${raffle.id}', ${number}, '${label}', 'AVAILABLE', '${now.toISOString()}', '${now.toISOString()}')`;
  }).join(",\n");

  await client.query(
    `INSERT INTO "Ticket" (id, "raffleId", number, label, status, "createdAt", "updatedAt")
     VALUES ${ticketValues}
     ON CONFLICT ("raffleId", number) DO UPDATE SET
       label = EXCLUDED.label,
       "updatedAt" = EXCLUDED."updatedAt"`,
  );

  await client.query(
    `DELETE FROM "Ticket"
     WHERE "raffleId" = $1
       AND (number < 501 OR number > 600)
       AND "currentOrderId" IS NULL
       AND "currentPaymentId" IS NULL`,
    [raffle.id],
  );

  const paymentMethods = [
    {
      id: crypto.randomUUID(),
      type: "BANK_TRANSFER",
      displayName: "Transferencia bancaria",
      instructions:
        "Transferi el total, sube una foto del comprobante y te confirmaremos la compra.",
      sortOrder: 1,
      bankName: "Banco de prueba",
      accountHolder: "FRANCISCO NIETO GONZALEZ",
      alias: "frann.chute",
      cbu: null,
      cvu: "0000003100014211899935",
    },
    {
      id: crypto.randomUUID(),
      type: "MERCADO_PAGO",
      displayName: "Mercado Pago",
      instructions:
        "Paga por Mercado Pago, sube una foto del comprobante y te confirmaremos la compra.",
      sortOrder: 2,
      bankName: null,
      accountHolder: "FRANCISCO NIETO GONZALEZ",
      alias: "frann.chute",
      cbu: null,
      cvu: "0000003100014211899935",
    },
    {
      id: crypto.randomUUID(),
      type: "CASH",
      displayName: "Efectivo",
      instructions: "Metodo reservado para ventas manuales desde el panel.",
      sortOrder: 3,
      bankName: null,
      accountHolder: "Club Sportivo Bolivar",
      alias: null,
      cbu: null,
      cvu: null,
    },
  ];

  for (const method of paymentMethods) {
    await client.query(
      `INSERT INTO "RafflePaymentMethod" (
        id, "raffleId", type, "displayName", instructions, active, "sortOrder",
        "bankName", "accountHolder", alias, cbu, cvu, "deletedAt", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3::"PaymentMethodType", $4, $5, true, $6,
        $7, $8, $9, $10, $11, NULL, $12, $12
      )
      ON CONFLICT ("raffleId", type) DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        instructions = EXCLUDED.instructions,
        active = true,
        "sortOrder" = EXCLUDED."sortOrder",
        "bankName" = EXCLUDED."bankName",
        "accountHolder" = EXCLUDED."accountHolder",
        alias = EXCLUDED.alias,
        cbu = EXCLUDED.cbu,
        cvu = EXCLUDED.cvu,
        "deletedAt" = NULL,
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        method.id,
        raffle.id,
        method.type,
        method.displayName,
        method.instructions,
        method.sortOrder,
        method.bankName,
        method.accountHolder,
        method.alias,
        method.cbu,
        method.cvu,
        now,
      ],
    );
  }

  await client.query(
    `INSERT INTO "PlatformSettings" (
      id, "platformName", "primaryColor", "accentColor", "defaultReservationDurationMinutes", "createdAt", "updatedAt"
    ) VALUES (
      'default', 'Club Sportivo Bolivar', '#0b3fa8', '#f97316', 10, $1, $1
    )
    ON CONFLICT (id) DO UPDATE SET
      "platformName" = EXCLUDED."platformName",
      "primaryColor" = EXCLUDED."primaryColor",
      "accentColor" = EXCLUDED."accentColor",
      "updatedAt" = EXCLUDED."updatedAt"`,
    [now],
  );

  for (const prize of prizes) {
    await client.query(
      `INSERT INTO "Prize" (
        id, "raffleId", name, description, "imageUrl", "monetaryValue", position, active, "deletedAt", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, NULL, $6, true, NULL, $7, $7
      )
      ON CONFLICT ("raffleId", position) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        "imageUrl" = EXCLUDED."imageUrl",
        "monetaryValue" = NULL,
        active = true,
        "deletedAt" = NULL,
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        crypto.randomUUID(),
        raffle.id,
        prize.name,
        prize.description,
        prize.imageUrl,
        prize.position,
        now,
      ],
    );
  }

  await client.query(
    `UPDATE "Prize"
     SET active = false,
         "deletedAt" = $1,
         "updatedAt" = $1
     WHERE "raffleId" = $2
       AND position > $3`,
    [now, raffle.id, prizes.length],
  );

  await client.query(
    `INSERT INTO "AuditLog" (
      id, "raffleId", action, "entityType", "entityId", metadata, "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      crypto.randomUUID(),
      raffle.id,
      "prizes.seeded_from_poster",
      "Raffle",
      raffle.id,
      JSON.stringify({ prizeCount: prizes.length, source: "bolivar-u17-poster" }),
      now,
    ],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        raffle: raffle.name,
        slug: raffleSlug,
        prizes: prizes.length,
        tickets: 100,
        imageUrl: "/brand/bolivar-u17-rifa.png",
        status: "OPEN",
        paymentMethods: paymentMethods.map((method) => method.type),
      },
      null,
      2,
    ),
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
