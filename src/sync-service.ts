import { LoyverseClient } from './loyverse-client';
import { SupabaseService } from './supabase-service';
import { SyncResult, ProductWithInventory } from './types';

export class InventorySyncService {
  private loyverseClient: LoyverseClient;
  private supabaseService: SupabaseService;

  constructor(useCache: boolean = true) {
    this.loyverseClient = new LoyverseClient(useCache);
    this.supabaseService = new SupabaseService(useCache);
  }

  /**
   * Perform a full sync of all inventory data
   */
  async fullSync(): Promise<SyncResult> {
    const startedAt = new Date();
    const errors: string[] = [];
    let productsSynced = 0;
    let productsDeleted = 0;

    console.log('Starting full sync...');

    try {
      // Step 1: Fetch all categories
      console.log('Fetching categories from Loyverse...');
      const categories = await this.loyverseClient.getAllCategories();
      console.log(`Found ${categories.length} categories`);

      // Create a map of category_id -> category name for quick lookup
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

      // Step 2: Fetch all items
      console.log('Fetching items from Loyverse...');
      const items = await this.loyverseClient.getAllItems();
      console.log(`Found ${items.length} items`);

      // Create a map of item_id -> item for quick lookup
      const itemsMap = new Map(items.map(item => [item.id, item]));

      // Step 3: Fetch all variants
      console.log('Fetching variants from Loyverse...');
      const variants = await this.loyverseClient.getAllVariants();
      console.log(`Found ${variants.length} variants`);

      // Step 4: Fetch all inventory levels
      console.log('Fetching inventory levels from Loyverse...');
      const inventoryLevels = await this.loyverseClient.getAllInventoryLevels();
      console.log(`Found ${inventoryLevels.length} inventory records`);

      // Create a map of variant_id -> inventory for quick lookup
      const inventoryMap = new Map<string, number>();
      inventoryLevels.forEach(inv => {
        const currentQty = inventoryMap.get(inv.variant_id) || 0;
        inventoryMap.set(inv.variant_id, currentQty + inv.in_stock);
      });

      // Step 5: Combine data for products
      console.log('Processing product data...');
      const productsData: ProductWithInventory[] = variants
        .map(variant => {
          const item = itemsMap.get(variant.item_id);
          if (!item) {
            console.warn(`Item not found for variant ${variant.variant_id}`);
            return null;
          }

          const totalQty = inventoryMap.get(variant.variant_id) || 0;
          const inventory = inventoryLevels.find(inv => inv.variant_id === variant.variant_id);

          return {
            variant,
            item,
            inventory: inventory ? { ...inventory, in_stock: totalQty } : { variant_id: variant.variant_id, store_id: '', in_stock: totalQty },
            categoryName: item.category_id ? categoryMap.get(item.category_id) : undefined,
          };
        })
        .filter((p) => p !== null) as ProductWithInventory[];

      console.log(`Prepared ${productsData.length} products for sync`);

      // Step 6: Sync to Supabase
      if (productsData.length > 0) {
        console.log('Syncing products to Supabase...');
        productsSynced = await this.supabaseService.upsertProducts(productsData);
        console.log(`Synced ${productsSynced} products`);
      }

      // Step 7: Remove products that no longer exist in Loyverse
      console.log('Checking for products to remove...');
      const existingSkus = await this.supabaseService.getAllProductSkus();
      console.log(`Found ${existingSkus.length} existing products in Supabase`);
      
      const loyverseSkus = new Set(
        productsData
          .map(p => p.variant.sku || p.variant.variant_id)
          .filter(sku => sku)
      );
      console.log(`Found ${loyverseSkus.size} products in Loyverse`);

      const skusToDelete = existingSkus.filter(sku => !loyverseSkus.has(sku));
      
      if (skusToDelete.length > 0) {
        console.log(`Removing ${skusToDelete.length} products no longer in Loyverse...`);
        console.log('Sample SKUs to delete:', skusToDelete.slice(0, 5));
        productsDeleted = await this.supabaseService.deleteProductsBySkus(skusToDelete);
        console.log(`Removed ${productsDeleted} products`);
      } else {
        console.log('No products to remove');
      }

      // Log the sync
      await this.supabaseService.logSync(
        'full',
        productsSynced,
        errors,
        startedAt,
        'success'
      );

      console.log('Full sync completed successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      console.error('Error during full sync:', errorMessage);

      // Log the failed sync
      await this.supabaseService.logSync(
        'full',
        productsSynced,
        errors,
        startedAt,
        'failed'
      );
    }

    const completedAt = new Date();
    return {
      products_synced: productsSynced,
      products_deleted: productsDeleted,
      errors,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
    };
  }

  /**
   * Perform an incremental sync (only updated items since last sync)
   */
  async incrementalSync(): Promise<SyncResult> {
    const startedAt = new Date();
    const errors: string[] = [];
    let productsSynced = 0;
    let productsDeleted = 0;

    console.log('Starting incremental sync...');

    try {
      // Get the last sync timestamp
      const lastSync = await this.supabaseService.getLastSyncTimestamp();

      if (!lastSync) {
        console.log('No previous sync found, performing full sync...');
        return await this.fullSync();
      }

      console.log(`Last sync was at: ${lastSync}`);

      // Step 1: Fetch all categories (categories don't have updated_at)
      console.log('Fetching categories from Loyverse...');
      const categories = await this.loyverseClient.getAllCategories();
      console.log(`Found ${categories.length} categories`);

      // Create a map of category_id -> category name for quick lookup
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

      // Step 2: Fetch updated items
      console.log('Fetching updated items from Loyverse...');
      const items = await this.loyverseClient.getItemsUpdatedAfter(lastSync);
      console.log(`Found ${items.length} updated items`);

      // Create a map of item_id -> item for quick lookup
      const itemsMap = new Map(items.map(item => [item.id, item]));

      // Step 3: Fetch updated variants
      console.log('Fetching updated variants from Loyverse...');
      const variants = await this.loyverseClient.getVariantsUpdatedAfter(lastSync);
      console.log(`Found ${variants.length} updated variants`);

      // Get item IDs from variants if we don't have them yet
      const itemIdsNeeded = new Set<string>();
      variants.forEach(variant => {
        if (!itemsMap.has(variant.item_id)) {
          itemIdsNeeded.add(variant.item_id);
        }
      });

      // Fetch any missing items (for variants that were updated but items weren't)
      if (itemIdsNeeded.size > 0) {
        console.log(`Fetching ${itemIdsNeeded.size} additional items...`);
        const allItems = await this.loyverseClient.getAllItems();
        allItems.forEach(item => {
          if (itemIdsNeeded.has(item.id)) {
            itemsMap.set(item.id, item);
          }
        });
      }

      // Step 4: Fetch all inventory levels (inventory doesn't have updated_at)
      console.log('Fetching inventory levels from Loyverse...');
      const inventoryLevels = await this.loyverseClient.getAllInventoryLevels();
      console.log(`Found ${inventoryLevels.length} inventory records`);

      // Create a map of variant_id -> total quantity
      const inventoryMap = new Map<string, number>();
      inventoryLevels.forEach(inv => {
        const currentQty = inventoryMap.get(inv.variant_id) || 0;
        inventoryMap.set(inv.variant_id, currentQty + inv.in_stock);
      });

      // Step 5: Combine data for products
      console.log('Processing product data...');
      const productsData: ProductWithInventory[] = variants
        .map(variant => {
          const item = itemsMap.get(variant.item_id);
          if (!item) {
            console.warn(`Item not found for variant ${variant.variant_id}`);
            return null;
          }

          const totalQty = inventoryMap.get(variant.variant_id) || 0;
          const inventory = inventoryLevels.find(inv => inv.variant_id === variant.variant_id);

          return {
            variant,
            item,
            inventory: inventory ? { ...inventory, in_stock: totalQty } : { variant_id: variant.variant_id, store_id: '', in_stock: totalQty },
            categoryName: item.category_id ? categoryMap.get(item.category_id) : undefined,
          };
        })
        .filter((p) => p !== null) as ProductWithInventory[];

      console.log(`Prepared ${productsData.length} products for sync`);

      // Step 6: Sync to Supabase
      if (productsData.length > 0) {
        console.log('Syncing products to Supabase...');
        productsSynced = await this.supabaseService.upsertProducts(productsData);
        console.log(`Synced ${productsSynced} products`);
      }

      // Log the sync
      await this.supabaseService.logSync(
        'incremental',
        productsSynced,
        errors,
        startedAt,
        'success'
      );

      console.log('Incremental sync completed successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      console.error('Error during incremental sync:', errorMessage);

      // Log the failed sync
      await this.supabaseService.logSync(
        'incremental',
        productsSynced,
        errors,
        startedAt,
        'failed'
      );
    }

    const completedAt = new Date();
    return {
      products_deleted: productsDeleted,
      products_synced: productsSynced,
      errors,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
    };
  }

  /**
   * Get current database statistics
   */
  async getStats(): Promise<void> {
    const count = await this.supabaseService.getProductCount();
    console.log('Database Statistics:');
    console.log(`  Products: ${count}`);
  }
}
