# Rifas Online

Plataforma web profesional para administrar y vender rifas online.

## Estado

Aplicacion funcional inicial:

- Next.js App Router con React y TypeScript strict.
- Tailwind CSS 4 y shadcn/ui configurado.
- ESLint, Prettier, Vitest, Testing Library y Playwright.
- Prisma 7 preparado para PostgreSQL.
- Docker Compose con PostgreSQL local.
- Validacion de entorno con Zod.
- Logging base con Pino.
- Estructura modular por dominios.
- Rifa publica, grilla de tickets, reservas, checkout por comprobante, panel administrativo, premios, pagos, ventas manuales y sorteos base.

## Requisitos

- Node.js 20 o superior.
- pnpm 11 o superior.
- Docker Desktop o Docker Engine con Docker Compose.

## Inicio local

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Completar en `.env`:

```text
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
AUTH_SECRET=...
SEED_ADMIN_EMAIL=...
SEED_ADMIN_PASSWORD=...
POSTGRES_DB=...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
```

3. Levantar PostgreSQL:

```bash
pnpm db:up
```

4. Instalar dependencias:

```bash
pnpm install
```

5. Aplicar migraciones y cargar datos iniciales:

```bash
pnpm prisma:deploy
pnpm db:seed
```

6. Ejecutar la app:

```bash
pnpm dev
```

La aplicacion queda disponible en `http://localhost:3000`.

## Produccion

Para publicar la app se deben configurar variables reales en el hosting:

```text
DATABASE_URL
DIRECT_URL
AUTH_SECRET
APP_URL
NEXT_PUBLIC_APP_URL
```

No subir archivos `.env`, bases locales ni comprobantes privados al repositorio.

## Scripts

- `pnpm dev`: inicia Next.js en modo desarrollo.
- `pnpm build`: genera Prisma Client y compila la aplicacion.
- `pnpm start`: inicia la build de produccion.
- `pnpm lint`: ejecuta ESLint.
- `pnpm typecheck`: ejecuta TypeScript sin emitir archivos.
- `pnpm format`: valida formato con Prettier.
- `pnpm test`: ejecuta Vitest.
- `pnpm test:e2e`: ejecuta Playwright.
- `pnpm verify`: ejecuta typecheck, lint, tests unitarios y build.
- `pnpm prisma:generate`: genera Prisma Client.
- `pnpm prisma:migrate`: prepara migraciones de desarrollo.
- `pnpm prisma:studio`: abre Prisma Studio.
- `pnpm db:up`: levanta PostgreSQL local.
- `pnpm db:down`: detiene PostgreSQL local.

## Estructura

```text
src/
  app/              Rutas App Router, API routes y layouts.
  components/       Componentes reutilizables y shadcn/ui.
  config/           Validacion y acceso a variables de entorno.
  features/         Modulos por dominio de negocio.
  generated/        Prisma Client generado localmente.
  lib/              Infraestructura compartida.
tests/
  e2e/              Pruebas Playwright.
prisma/
  schema.prisma     Configuracion base de Prisma.
```

## Base de datos

Prisma 7 usa `prisma.config.ts` para leer la URL de conexion desde `DATABASE_URL`.
El `schema.prisma` declara PostgreSQL y el output del cliente.
