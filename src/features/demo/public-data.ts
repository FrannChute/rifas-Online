const demoSlug = "gran-rifa-solidaria-u17-de-bolivar";

const prizeNames = [
  "1 noche de estadia en Complejo San Pio Icho Cruz",
  "Pase por 1 mes en Cinesis Medicl Gym",
  "2 cortes masculinos en Sotelo Barber Shop + 2 cajas de alfajores",
  "1 corte masculino en Sotelo Barber Shop + 1 caja de alfajores",
  "1 corte masculino en Sotelo Barber Shop + 1 caja de alfajores",
  "Mantel de mesa de tusor + agarraderas de horno",
  "1 botella de Casalta + 1 champagne",
  "1 botella de Casalta + 1 champagne",
  "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
  "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
  "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
  "Rodillera de basquet Nike",
  "Merienda para 2 personas Aqui Bar La Terminal, VCP",
  "Voucher de descuento - Urquiza VCP",
  "Productos de limpieza: Distribuidora CRISBET",
  "Hornitos + esencia aromatizante",
  "MANTEL KOA.DECOHOME",
  "1 bolsa de papa + 2 maples de huevos + 1 aceite de oliva",
  "1 bolsa de papa + 2 maples de huevos + 1 aceite de oliva",
  "Kit crema antiage. Farmacia Sassarolli",
  "1 aceite de oliva + 1 docena de alfajores",
  "Caja de golosinas y chocolates",
];

const demoPrizes = prizeNames.map((name, index) => {
  const position = index + 1;

  return {
    id: `demo-prize-${position}`,
    position,
    name,
    description: "Premio referencial de la rifa solidaria.",
    imageUrl: `/prizes/bolivar-${String(position).padStart(2, "0")}.svg`,
  };
});

const demoTickets = Array.from({ length: 120 }, (_, index) => {
  const number = 501 + index;
  const status = index < 4 ? "PAID" : index < 7 ? "RESERVED" : "AVAILABLE";

  return {
    id: `demo-ticket-${number}`,
    number,
    label: String(number),
    status,
    reservedUntil: null,
  };
});

export const demoRaffle = {
  id: "demo-raffle-bolivar-u17",
  slug: demoSlug,
  name: "Gran Rifa Solidaria U17 de Bolivar",
  description:
    "Colabora con Francisco y disfruta de 22 premios. Esta vista de demostracion funciona sin base de datos para que puedas revisar la pagina.",
  imageUrl: "/brand/bolivar-u17-rifa.png",
  status: "OPEN",
  price: "3000.00",
  currency: "ARS",
  startNumber: 501,
  endNumber: 620,
  startsAt: new Date("2026-08-01T12:00:00-03:00"),
  closesAt: new Date("2026-09-14T15:00:00-03:00"),
  drawScheduledAt: new Date("2026-09-14T16:00:00-03:00"),
  paymentMethods: [
    {
      id: "demo-transfer",
      type: "BANK_TRANSFER",
      displayName: "Transferencia bancaria",
      instructions: "Transferi el total y envia el comprobante para revision.",
    },
    {
      id: "demo-cash",
      type: "CASH",
      displayName: "Efectivo",
      instructions: "Paga personalmente. No necesitas subir comprobante.",
    },
  ],
  prizes: demoPrizes,
  tickets: demoTickets,
  ticketStats: {
    AVAILABLE: 113,
    RESERVED: 3,
    PAID: 4,
  },
  _count: {
    tickets: demoTickets.length,
    prizes: demoPrizes.length,
  },
};

export const demoPlatformSettings = {
  platformName: "Rifas Online",
};

export function isDemoRaffleSlug(slug: string) {
  return slug === demoSlug;
}

export function listDemoRaffles() {
  return [demoRaffle];
}
