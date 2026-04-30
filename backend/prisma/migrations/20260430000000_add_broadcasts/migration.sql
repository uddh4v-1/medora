-- CreateTable
CREATE TABLE "broadcasts" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "user_id" TEXT,
    "audience" VARCHAR(32) NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broadcasts_clinic_id_sent_at_idx" ON "broadcasts"("clinic_id", "sent_at");

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
