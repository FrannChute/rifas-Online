import { Database, TerminalSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type DatabaseSetupNoticeProps = {
  title?: string;
  description?: string;
};

export function DatabaseSetupNotice({
  title = "Base de datos pendiente",
  description = "La aplicacion esta conectada a Prisma, pero PostgreSQL no esta disponible o las migraciones aun no fueron aplicadas.",
}: DatabaseSetupNoticeProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800">
          <Database aria-hidden="true" className="size-5" />
        </span>
        <div className="space-y-3">
          <div className="space-y-1">
            <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
              PostgreSQL
            </Badge>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-amber-900">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1">
              <TerminalSquare aria-hidden="true" className="size-3.5" />
              db:up
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1">
              <TerminalSquare aria-hidden="true" className="size-3.5" />
              prisma:migrate
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1">
              <TerminalSquare aria-hidden="true" className="size-3.5" />
              db:seed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
