import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { SupabaseProduct, ProductWithInventory } from './types';
import { CacheService } from './cache-service';

export class SupabaseService {
  private client: SupabaseClient;
  private cache: CacheService;
  private useCache: boolean;

  constructor(useCache: boolean = true) {
    this.client = createClient(config.supabase.url, config.supabase.key);
    this.cache = new CacheService();
    this.useCache = useCache;
  }

  /**
   * Upsert products to Supabase
   */
  async upsertProducts(productsData: ProductWithInventory[]): Promise<number> {
    const products: SupabaseProduct[] = productsData.map(({ variant, item, inventory, categoryName }) => {
      // Build product name with variant options if they exist
      let productName = item.item_name;
      const options: string[] = [];
      
      if (variant.option1_value) options.push(variant.option1_value);
      if (variant.option2_value) options.push(variant.option2_value);
      if (variant.option3_value) options.push(variant.option3_value);
      
      if (options.length > 0) {
        productName += ` (${options.join(', ')})`;
      }

      // Calculate total quantity across all stores
      const totalQty = inventory?.in_stock || 0;

      return {
        sku: variant.sku || variant.variant_id,
        name: productName,
        category: categoryName || null,
        desc: item.description || null,
        price: variant.default_price,
        qty: Math.floor(totalQty),
        image: null, // Loyverse API doesn't provide image URLs in basic endpoints
      };
    });

    // Filter out products without SKU
    const validProducts = products.filter(p => p.sku);

    // Batch upsert in chunks of 100
    const chunkSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < validProducts.length; i += chunkSize) {
      const chunk = validProducts.slice(i, i + chunkSize);
      const { error } = await this.client
        .from('products')
        .upsert(chunk, { onConflict: 'sku' });

      if (error) {
        console.error('Error upserting products:', error);
        throw error;
      }

      totalUpserted += chunk.length;
    }

    return totalUpserted;
  }

  /**
   * Get the last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<string | null> {
    const { data, error } = await this.client
      .from('sync_logs')
      .select('completed_at')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.completed_at;
  }

  /**
   * Log sync operation
   */
  async logSync(
    syncType: string,
    productsSynced: number,
    errors: string[],
    startedAt: Date,
    status: 'success' | 'partial' | 'failed'
  ): Promise<void> {
    const { error } = await this.client.from('sync_logs').insert({
      sync_type: syncType,
      products_synced: productsSynced,
      errors,
      started_at: startedAt.toISOString(),
      completed_at: new Date().toISOString(),
      status,
    });

    if (error) {
      console.error('Error logging sync:', error);
    }
  }
  /**
   * Get all product SKUs from Supabase
   */
  async getAllProductSkus(): Promise<string[]> {
    const cacheKey = 'supabase_product_skus';
    
    // Check cache first
    if (this.useCache && this.cache.has(cacheKey)) {
      console.log('Using cached product SKUs');
      const cached = this.cache.get<string[]>(cacheKey);
      if (cached) return cached;
    }

    const allSkus: string[] = [];
    const pageSize = 1000;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.client
        .from('products')
        .select('sku')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('Error fetching product SKUs:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allSkus.push(...data.map(p => p.sku));
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log(`Fetched ${allSkus.length} total SKUs from Supabase`);
    
    // Cache the results
    this.cache.set(cacheKey, allSkus);

    return allSkus;
  }

  /**
   * Delete products by SKU
   */
  async deleteProductsBySkus(skus: string[]): Promise<number> {
    if (skus.length === 0) return 0;

    console.log(`Deleting ${skus.length} SKUs:`, skus.slice(0, 5), '...');

    // Delete in chunks of 100
    const chunkSize = 100;
    let totalDeleted = 0;

    for (let i = 0; i < skus.length; i += chunkSize) {
      const chunk = skus.slice(i, i + chunkSize);
      const { data, error, count } = await this.client
        .from('products')
        .delete()
        .in('sku', chunk)
        .select();

      if (error) {
        console.error('Error deleting products:', error);
        throw error;
      }

      const deletedCount = data?.length || 0;
      totalDeleted += deletedCount;
      console.log(`Deleted ${deletedCount} products from chunk ${i / chunkSize + 1}`);
    }

    return totalDeleted;
  }

  /**
   * Get total counts from database
   */
  async getProductCount(): Promise<number> {
    const result = await this.client
      .from('products')
      .select('*', { count: 'exact', head: true });

    return result.count || 0;
  }
}
