# EZ4us — Reglas duras del proyecto

Sistema de coordinación de recogida vehicular en zonas escolares.
Padre (mobile) presiona "voy en camino", colegio ve el ETA en tiempo real,
geofence dispara "Llegué" automático al entrar al colegio.

## Stack

- Monorepo pnpm + turbo: `apps/mobile`, `apps/web`, `packages/db`
- Mobile: Expo SDK 54 + expo-router + NativeWind v4 + Nunito
- Web admin: Next 15 App Router + Tailwind + shadcn/ui
- DB: Prisma + **Prisma Postgres** + **Accelerate** (NO Neon)
- Auth.js: web=cookies de sesión, mobile=Bearer JWT (NO mezclar)
- Mapbox (NO Google Maps): `@rnmapbox/maps` en mobile, `mapbox-gl` en web
- Supabase Realtime para sincronización del dashboard
- Stripe para cobro recurrente de colegios
- n8n self-hosted (VPS Hetzner ~$5/mes) para WhatsApp, facturas, citas
- Turf.js en backend para cálculos geoespaciales (ETA, dead reckoning)
- Tracking background: `react-native-background-geolocation` (Transistor)

## Identidad del producto

- Mobile-first puro. Web SOLO panel admin.
- CERO landing pública. CERO versión web del producto para usuarios finales.
- "/" del web NO es navegable salvo login admin.
- Tres tipos de usuario:
  - **Padre** (mobile)
  - **Director** (web admin)
  - **Super-Admin EZ4us** (web admin)
- v2 no se toca ahora: "Niños con celular".

## Estética

- Duolingosa: Nunito redonda grande, botones con elevación, esquinas muy
  redondeadas, micro-animaciones de feedback en cada tap.
- Sin emojis decorativos en UI productiva.
- Sin banderas, sin código país en inputs de teléfono.

## Base de datos: Prisma Postgres + Accelerate

Tres URLs en `packages/db/.env`. Cuál usar:

- **`DATABASE_URL`** (Accelerate, `prisma+postgres://accelerate.prisma-data.net/...`)
  - Es la que carga el `PrismaClient` en runtime (apps/web, workers).
  - El cliente se extiende con `withAccelerate()` desde `@prisma/extension-accelerate`.
  - Edge-friendly, cache de queries opcional con `cacheStrategy`.
- **`DIRECT_URL`** (directa a `db.prisma.io:5432`, sin pooling)
  - `schema.prisma` la usa como `directUrl`.
  - La usan: migraciones (`prisma migrate dev/deploy`), `prisma db push`,
    `prisma db pull`, seeds, scripts SQL directos, `prisma studio`.
  - Prisma Migrate **no funciona a través de Accelerate**, por eso esta URL es obligatoria.
- **`POOLED_URL`** (pooled sin Accelerate, `pooled.db.prisma.io:5432`)
  - Reserva. Solo si en algún momento queremos saltarnos Accelerate
    y conectar con pooling tradicional (p.ej. una Lambda no-edge).
  - Hoy NO se usa.

Nunca commitear el `.env`. Cambios de credenciales solo con permiso explícito.

## Reglas que ya pagamos caras (no negociables)

- Mobile SIEMPRE pega a `www.[dominio]`, nunca al apex.
  Razón: el redirect 308 dropea el header `Authorization` cross-host.
- `EXPO_PUBLIC_*` es build-time → cambio de URL = rebuild EAS, no OTA.
- Sin namespace re-exports (`export * as foo`) en código que toca RSC.
- `expo-updates` atado a la versión exacta del SDK (SDK 54 → `~29.0.17`).
- Nunca importar `Prisma` ni tipos del schema en componentes cliente.
- `await` en TODO side-effect async. Nada de fire-and-forget.
- Migración Prisma corrida ANTES de deployar el cambio de schema.
- Contadores en hot path: campo denormalizado, no `count()` de la tabla.

## Reglas específicas de EZ4us

- **Multi-tenant por `schoolId` en TODAS las queries, sin excepción.**
  Query sin filtro de `schoolId` que devuelva data de otro colegio = bug
  de seguridad crítico.
- Permisos de ubicación: "When In Use" en iOS, NUNCA "Always".
- Android Foreground Service obligatorio mientras hay tracking activo.
- Llamadas a Mapbox Directions SIEMPRE desde backend con cache + throttling.
  Recalcular solo si el padre se desvía >100m o cada 3 min.
- ETA y dead reckoning viven 100% en backend. El cliente solo manda
  lat/lng/heading/speed crudos cada 5s.
- `react-native-background-geolocation`: STARTER license $399 USD NO se
  compra hasta /goal 4.

## Deploy

- Web admin: push a `main` → Vercel deploya solo.
- Mobile: EAS Build + OTA con `expo-updates` para parches JS-only.
- Commits en español, cortos, imperativos, sin `Co-Authored-By`.
- Nunca tocar env vars de Vercel sin permiso explícito.

## NO hacer sin pedirlo

- Landing pública, marketing, SEO, sitemaps.
- Librerías "por las dudas" (analytics, i18n, state managers que no
  sean React Context o Zustand).
- Comentarios explicando QUÉ hace el código.
- README, docs, ni archivos .md más allá de `CLAUDE.md`.
- Soporte a "Niños con celular" (v2).
