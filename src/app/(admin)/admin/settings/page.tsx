import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  clearBolivarSalesAction,
  repairBolivarPrizeImagesAction,
} from "@/features/maintenance/actions";
import { updatePlatformSettingsAction } from "@/features/settings/actions";
import { getSettingsForAdmin } from "@/features/settings/service";
import { isDatabaseUnavailableError } from "@/lib/errors";

export const dynamic = "force-dynamic";

async function loadSettingsData() {
  try {
    const settings = await getSettingsForAdmin();

    return { ok: true as const, settings };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminSettingsPage() {
  const data = await loadSettingsData();

  if (!data.ok) {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  const { settings } = data;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Badge variant="outline">Configuracion</Badge>
        <h2 className="text-2xl font-semibold">Ajustes de plataforma</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Estos valores se guardan en PostgreSQL y alimentan la experiencia publica.
        </p>
      </div>

      <form action={updatePlatformSettingsAction} className="space-y-6">
        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="platformName">Nombre plataforma</Label>
            <Input
              defaultValue={settings.platformName}
              id="platformName"
              name="platformName"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultReservationDurationMinutes">Reserva por defecto</Label>
            <Input
              defaultValue={settings.defaultReservationDurationMinutes}
              id="defaultReservationDurationMinutes"
              min="1"
              name="defaultReservationDurationMinutes"
              required
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Color principal</Label>
            <Input
              defaultValue={settings.primaryColor}
              id="primaryColor"
              name="primaryColor"
              required
              type="color"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Color acento</Label>
            <Input
              defaultValue={settings.accentColor}
              id="accentColor"
              name="accentColor"
              required
              type="color"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Email</Label>
            <Input
              defaultValue={settings.supportEmail ?? ""}
              id="supportEmail"
              name="supportEmail"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportWhatsapp">WhatsApp</Label>
            <Input
              defaultValue={settings.supportWhatsapp ?? ""}
              id="supportWhatsapp"
              name="supportWhatsapp"
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankAlias">Alias</Label>
            <Input defaultValue={settings.bankAlias ?? ""} id="bankAlias" name="bankAlias" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">Banco</Label>
            <Input defaultValue={settings.bankName ?? ""} id="bankName" name="bankName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankCbu">CBU</Label>
            <Input defaultValue={settings.bankCbu ?? ""} id="bankCbu" name="bankCbu" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankCvu">CVU</Label>
            <Input defaultValue={settings.bankCvu ?? ""} id="bankCvu" name="bankCvu" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bankAccountHolder">Titular</Label>
            <Input
              defaultValue={settings.bankAccountHolder ?? ""}
              id="bankAccountHolder"
              name="bankAccountHolder"
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="terms">Terminos</Label>
            <Textarea defaultValue={settings.terms ?? ""} id="terms" name="terms" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="privacyPolicy">Privacidad</Label>
            <Textarea
              defaultValue={settings.privacyPolicy ?? ""}
              id="privacyPolicy"
              name="privacyPolicy"
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit">Guardar ajustes</Button>
        </div>
      </form>

      <section className="rounded-lg border border-orange-200 bg-orange-50 p-5 shadow-sm">
        <Badge className="border-orange-300 bg-white text-orange-800" variant="outline">
          Mantenimiento
        </Badge>
        <h3 className="mt-2 text-lg font-semibold">Rifa Bolivar</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Usa estas acciones solo cuando quieras preparar la rifa para venta real.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={repairBolivarPrizeImagesAction}>
            <Button type="submit" variant="outline">
              Reparar imagenes de premios
            </Button>
          </form>
          <form action={clearBolivarSalesAction}>
            <Button type="submit" variant="destructive">
              Dejar rifa en cero
            </Button>
          </form>
        </div>
      </section>
    </section>
  );
}
