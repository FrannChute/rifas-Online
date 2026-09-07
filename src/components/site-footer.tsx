import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-blue-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Rifas Online Bolivar U17. Sitio creado por Francisco Nieto.</p>
        <nav className="flex flex-wrap gap-4">
          <Link className="font-medium text-primary hover:underline" href="/about">
            Acerca de
          </Link>
          <Link className="font-medium text-primary hover:underline" href="/privacy">
            Politica de privacidad
          </Link>
          <Link className="font-medium text-primary hover:underline" href="/share">
            Compartir
          </Link>
        </nav>
      </div>
    </footer>
  );
}
