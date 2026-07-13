-- Gracia por colegio + reloj de mora para el corte duro del panel por impago.
-- Aditivo con default backfilleado: el Worker viejo sigue andando entre migrar y deployar.

-- Días de gracia tras impago/trial vencido antes de bloquear el panel del director.
-- Las filas existentes quedan con 7 días (default del negocio, editable por el owner).
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "gracePeriodDays" INTEGER NOT NULL DEFAULT 7;

-- Momento en que la suscripción entró en mora. null = al día. El corte se evalúa contra
-- pastDueSince + gracePeriodDays. Backfill: las que ya están PAST_DUE arrancan la gracia
-- desde ahora (no se bloquean retroactivamente sin margen).
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "pastDueSince" TIMESTAMP(3);
UPDATE "subscriptions" SET "pastDueSince" = NOW() WHERE "status" = 'PAST_DUE' AND "pastDueSince" IS NULL;
