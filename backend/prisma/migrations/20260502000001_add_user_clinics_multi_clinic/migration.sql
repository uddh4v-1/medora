-- Add multi_clinic feature flag
ALTER TABLE "clinic_feature_flags" ADD COLUMN "multi_clinic" BOOLEAN NOT NULL DEFAULT false;

-- Create user_clinics join table
CREATE TABLE "user_clinics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'owner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_clinics_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "user_clinics" ADD CONSTRAINT "user_clinics_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_clinics" ADD CONSTRAINT "user_clinics_clinic_id_fkey"
    FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "user_clinics_user_id_clinic_id_key" ON "user_clinics"("user_id", "clinic_id");
CREATE INDEX "user_clinics_user_id_idx" ON "user_clinics"("user_id");

-- Backfill existing users into the join table
INSERT INTO "user_clinics" ("id", "user_id", "clinic_id", "role", "created_at")
SELECT
    gen_random_uuid()::text,
    u."id",
    u."clinic_id",
    'owner',
    u."created_at"
FROM "users" u
WHERE u."clinic_id" IS NOT NULL
ON CONFLICT DO NOTHING;
