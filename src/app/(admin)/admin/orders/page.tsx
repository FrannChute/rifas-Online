import Link from "next/link";
import { Banknote } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAdminOrders } from "@/features/orders/service";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadOrdersData() {
  try {
    const orders = await listAdminOrders();

    return { ok: true as const, orders };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminOrdersPage() {
  const data = await loadOrdersData();

  if (!data.ok) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Badge variant="outline">Ventas</Badge>
        <h2 className="text-2xl font-semibold">Ordenes</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Ordenes creadas por reservas publicas, pagos y ventas seed.
        </p>
      </div>
      <Button asChild className="w-fit">
        <Link href="/admin/orders/manual">
          <Banknote aria-hidden="true" />
          Nueva venta manual
        </Link>
      </Button>

      {data.orders.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Rifa</th>
                <th className="px-4 py-3 font-medium">Participante</th>
                <th className="px-4 py-3 font-medium">Numeros</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Creada</th>
                <th className="px-4 py-3 font-medium">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-semibold">{order.publicCode}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{order.raffle.name}</td>
                  <td className="px-4 py-3">
                    {order.participant.firstName} {order.participant.lastName}
                  </td>
                  <td className="px-4 py-3">{order.items.map((item) => item.label).join(", ")}</td>
                  <td className="px-4 py-3">
                    {formatMoney(String(order.totalAmount), order.currency)}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/checkout/${order.id}`}>Checkout</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          description="Cuando se reserven numeros o se cargue el seed, las ordenes apareceran aca."
          title="No hay ordenes"
        />
      )}
    </section>
  );
}
