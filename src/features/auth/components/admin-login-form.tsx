"use client";

import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginActionState = {
  error: string | null;
};

const initialState: LoginActionState = {
  error: null,
};

type AdminLoginFormProps = {
  action: (previousState: LoginActionState, formData: FormData) => Promise<LoginActionState>;
  next?: string | undefined;
};

export function AdminLoginForm({ action, next }: AdminLoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="next" type="hidden" value={next ?? "/admin"} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo administrador</Label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            autoComplete="email"
            className="pl-9"
            id="email"
            name="email"
            placeholder="admin@example.com"
            required
            type="email"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contrasena</Label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            autoComplete="current-password"
            className="pl-9"
            id="password"
            name="password"
            required
            type="password"
          />
        </div>
      </div>
      {state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Ingresando..." : "Entrar al panel"}
      </Button>
    </form>
  );
}
