export interface LoyverseCategory {
  id: string;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LoyverseItem {
  id: string;
  item_name: string;
  reference_id?: string;
  description?: string;
  category_id?: string;
  track_stock: boolean;
  sold_by_weight: boolean;
  is_composite: boolean;
  use_production: boolean;
  components?: any[];
  primary_supplier_id?: string;
  tax_ids?: string[];
  modifiers_ids?: string[];
  form?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LoyverseVariant {
  variant_id: string;
  item_id: string;
  sku?: string;
  reference_variant_id?: string;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  barcode?: string;
  cost?: number;
  purchase_cost?: number;
  default_pricing_type: string;
  default_price: number;
  stores?: LoyverseStoreVariant[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LoyverseStoreVariant {
  store_id: string;
  pricing_type: string;
  price: number;
  available_for_sale: boolean;
  optimal_stock?: number;
  low_stock?: number;
}

export interface LoyverseInventory {
  variant_id: string;
  store_id: string;
  in_stock: number;
  cost?: number;
}

export interface LoyverseApiResponse<T> {
  cursor?: string;
  items?: T[];
  variants?: T[];
  inventory_levels?: T[];
  categories?: T[];
}

export interface SupabaseProduct {
  sku: string;
  name: string | null;
  category: string | null;
  desc: string | null;
  price: number | null;
  qty: number | null;
  image: string | null;
}

export interface SyncResult {
  completed_at: any;
  started_at: any;
  products_synced: number;
  products_deleted: number;
  errors: string[];
}

export interface ProductWithInventory {
  variant: LoyverseVariant;
  item: LoyverseItem;
  inventory: LoyverseInventory;
  categoryName?: string;
}
