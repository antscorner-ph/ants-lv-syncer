-- Create products table (if not exists)
CREATE TABLE IF NOT EXISTS public.products (
  sku TEXT NOT NULL,
  name TEXT NULL,
  category TEXT NULL,
  "desc" TEXT NULL,
  price DOUBLE PRECISION NULL,
  qty BIGINT NULL,
  image TEXT NULL,
  CONSTRAINT products_pkey PRIMARY KEY (sku),
  CONSTRAINT products_sku_key UNIQUE (sku)
) TABLESPACE pg_default;


-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_loyverse_id ON items(loyverse_id);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at);
CREATE INDEX IF NOT EXISTS idx_variants_loyverse_variant_id ON variants(loyverse_variant_id);
CREATE INDEX IF NOT EXISTS idx_variants_loyverse_item_id ON variants(loyverse_item_id);
CREATE INDEX IF NOT EXISTS idx_variants_updated_at ON variants(updated_at);
CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at);
CREATE INDEX IF NOT EXISTS products_name_idx ON public.products USING btree (name) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products USING btree (category) TABLESPACE pg_default;

-- Create sync log table
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id BIGSERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL,
  products_synced INTEGER DEFAULT 0,
  errors TEXT[],
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
);
