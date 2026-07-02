-- 2FA por email para staff + trial configurable por colegio.
-- Todo aditivo con default backfilleado: el Worker viejo sigue andando entre migrar y deployar.

-- Flag del plugin twoFactor de better-auth. Se fuerza en true para director/super_admin.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: todo super_admin existente queda con 2FA obligatorio desde este deploy.
-- (Los directores demo del seed quedan fuera a propósito: sus emails no reciben correo
-- y quedarían lockeados; los directores nuevos nacen con 2FA desde createSchoolWithDirector.)
UPDATE "users" SET "twoFactorEnabled" = true WHERE "role" = 'super_admin';

-- Tabla del plugin twoFactor (secret TOTP + backup codes). El flujo OTP-por-email no la usa,
-- pero el plugin la declara en su schema; existe para que enable/backup-codes no explote.
CREATE TABLE IF NOT EXISTS "two_factors" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "two_factors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "two_factors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "two_factors_userId_idx" ON "two_factors"("userId");

-- Fin de trial explícito y editable por el super_admin. Backfill: las TRIALING vigentes
-- venían usando currentPeriodEnd como fin de prueba.
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
UPDATE "subscriptions" SET "trialEndsAt" = "currentPeriodEnd" WHERE "trialEndsAt" IS NULL AND "status" = 'TRIALING';
