"use client";

import { useActionState } from "react";
import { Banknote } from "lucide-react";

import { Button } from "@/components/ui/button";

type CashPaymentActionState = {
  error: string | null;
};

const initialState: CashPaymentActionState = {
  error: null,
};

type CashPaymentFormProps = {
  action: (
    previousState: CashPaymentActionState,
    formData: FormData,
  ) => Promise<CashPaymentActionState>;
};

export function CashPaymentForm({ action }: CashPaymentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="club-card rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Banknote aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Pagar en efectivo</h2>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Usa esta opcion si vas a pagar personalmente. No hace falta subir comprobante: tus numeros
        quedaran comprados y registrados como pago en efectivo.
      </p>
      {state.error ? (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button className="mt-4 w-full" disabled={isPending} type="submit">
        {isPending ? "Confirmando..." : "Confirmar pago en efectivo"}
      </Button>
    </form>
  );
}
