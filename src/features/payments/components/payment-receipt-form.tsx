"use client";

import { useActionState } from "react";
import { CreditCard, FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentReceiptActionState = {
  error: string | null;
};

const initialState: PaymentReceiptActionState = {
  error: null,
};

type ReceiptPaymentMethod = "BANK_TRANSFER" | "MERCADO_PAGO";

type PaymentReceiptFormProps = {
  action: (
    previousState: PaymentReceiptActionState,
    formData: FormData,
  ) => Promise<PaymentReceiptActionState>;
  methods: Array<{
    type: ReceiptPaymentMethod | string;
    displayName: string;
    instructions: string | null;
  }>;
};

export function PaymentReceiptForm({ action, methods }: PaymentReceiptFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const receiptMethods = methods.filter(
    (
      method,
    ): method is PaymentReceiptFormProps["methods"][number] & {
      type: ReceiptPaymentMethod;
    } => method.type === "BANK_TRANSFER" || method.type === "MERCADO_PAGO",
  );

  return (
    <form action={formAction} className="club-card rounded-lg border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileUp aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Subir comprobante</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Metodo de pago</Label>
          {receiptMethods.length > 0 ? (
            <div className="grid gap-2">
              {receiptMethods.map((method, index) => (
                <label
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-blue-100 bg-white px-3 py-2 text-sm shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary/70 hover:shadow-md"
                  key={method.type}
                >
                  <input
                    className="mt-1"
                    defaultChecked={index === 0}
                    name="method"
                    type="radio"
                    value={method.type}
                  />
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      <CreditCard aria-hidden="true" className="size-4 text-primary" />
                      {method.displayName}
                    </span>
                    {method.instructions ? (
                      <span className="mt-1 block text-muted-foreground">
                        {method.instructions}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Esta rifa no tiene metodos de pago con comprobante activos.
            </p>
          )}
        </div>
        <div className="rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-500 text-white">
              <FileUp aria-hidden="true" className="size-5" />
            </span>
            <div>
              <Label className="text-base font-bold text-orange-950" htmlFor="receipt">
                Foto del comprobante
              </Label>
              <p className="mt-1 text-sm leading-5 text-orange-900">
                Si pagas por transferencia, subi una captura o foto clara del comprobante para que
                pueda aprobarlo.
              </p>
            </div>
          </div>
          <Input
            accept="image/*"
            className="h-14 cursor-pointer border-orange-300 bg-white text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-orange-500"
            id="receipt"
            name="receipt"
            required
            type="file"
          />
        </div>
        {state.error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button
          className="shiny-action w-full"
          disabled={isPending || receiptMethods.length === 0}
          type="submit"
        >
          {isPending ? "Enviando..." : "Enviar a revision"}
        </Button>
      </div>
    </form>
  );
}
