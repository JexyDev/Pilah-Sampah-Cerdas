-- CreateTable
CREATE TABLE IF NOT EXISTS "user_hidden_history_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "hidden_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_hidden_history_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_hidden_history_items_user_id_item_type_item_id_key" ON "user_hidden_history_items"("user_id", "item_type", "item_id");
CREATE INDEX IF NOT EXISTS "user_hidden_history_items_user_id_item_type_idx" ON "user_hidden_history_items"("user_id", "item_type");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_hidden_history_items_user_id_fkey'
    ) THEN
        ALTER TABLE "user_hidden_history_items" ADD CONSTRAINT "user_hidden_history_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
