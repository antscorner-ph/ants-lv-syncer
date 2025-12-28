import axios, { AxiosInstance } from 'axios';
import { config } from './config';
import {
  LoyverseItem,
  LoyverseVariant,
  LoyverseInventory,
  LoyverseCategory,
  LoyverseApiResponse,
} from './types';
import { CacheService } from './cache-service';

export class LoyverseClient {
  private client: AxiosInstance;
  private cache: CacheService;
  private useCache: boolean;

  constructor(useCache: boolean = true) {
    this.client = axios.create({
      baseURL: config.loyverse.baseUrl,
      headers: {
        Authorization: `Bearer ${config.loyverse.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    this.cache = new CacheService();
    this.useCache = useCache;
  }

  /**
   * Fetch all items from Loyverse with pagination
   */
  async getAllItems(): Promise<LoyverseItem[]> {
    const cacheKey = 'loyverse_items';
    
    // Check cache first
    if (this.useCache && this.cache.has(cacheKey)) {
      console.log('Using cached items data');
      const cached = this.cache.get<LoyverseItem[]>(cacheKey);
      if (cached) return cached;
    }

    const items: LoyverseItem[] = [];
    let cursor: string | undefined;

    do {
      const params: any = { limit: 250 };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await this.client.get<LoyverseApiResponse<LoyverseItem>>(
        '/items',
        { params }
      );

      if (response.data.items) {
        items.push(...response.data.items);
      }

      cursor = response.data.cursor;
    } while (cursor);

    // Cache the results
    this.cache.set(cacheKey, items);

    return items;
  }

  /**
   * Fetch all variants from Loyverse with pagination
   */
  async getAllVariants(): Promise<LoyverseVariant[]> {
    const cacheKey = 'loyverse_variants';
    
    // Check cache first
    if (this.useCache && this.cache.has(cacheKey)) {
      console.log('Using cached variants data');
      const cached = this.cache.get<LoyverseVariant[]>(cacheKey);
      if (cached) return cached;
    }

    const variants: LoyverseVariant[] = [];
    let cursor: string | undefined;

    do {
      const params: any = { limit: 250 };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await this.client.get<
        LoyverseApiResponse<LoyverseVariant>
      >('/variants', { params });

      if (response.data.variants) {
        variants.push(...response.data.variants);
      }

      cursor = response.data.cursor;
    } while (cursor);

    // Cache the results
    this.cache.set(cacheKey, variants);

    return variants;
  }

  /**
   * Fetch inventory levels for all variants
   */
  async getAllInventoryLevels(): Promise<LoyverseInventory[]> {
    const cacheKey = 'loyverse_inventory';
    
    // Check cache first
    if (this.useCache && this.cache.has(cacheKey)) {
      console.log('Using cached inventory data');
      const cached = this.cache.get<LoyverseInventory[]>(cacheKey);
      if (cached) return cached;
    }

    const inventory: LoyverseInventory[] = [];
    let cursor: string | undefined;

    do {
      const params: any = { limit: 250 };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await this.client.get<
        LoyverseApiResponse<LoyverseInventory>
      >('/inventory', { params });

      if (response.data.inventory_levels) {
        inventory.push(...response.data.inventory_levels);
      }

      cursor = response.data.cursor;
    } while (cursor);

    // Cache the results
    this.cache.set(cacheKey, inventory);

    return inventory;
  }

  /**Fetch all categories from Loyverse with pagination
   */
  async getAllCategories(): Promise<LoyverseCategory[]> {
    const cacheKey = 'loyverse_categories';
    
    // Check cache first
    if (this.useCache && this.cache.has(cacheKey)) {
      console.log('Using cached categories data');
      const cached = this.cache.get<LoyverseCategory[]>(cacheKey);
      if (cached) return cached;
    }

    const categories: LoyverseCategory[] = [];
    let cursor: string | undefined;

    do {
      const params: any = { limit: 250 };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await this.client.get<
        LoyverseApiResponse<LoyverseCategory>
      >('/categories', { params });

      if (response.data.categories) {
        categories.push(...response.data.categories);
      }

      cursor = response.data.cursor;
    } while (cursor);

    // Cache the results
    this.cache.set(cacheKey, categories);

    return categories;
  }

  /**
   * 
   * Get items updated after a specific date
   */
  async getItemsUpdatedAfter(date: string): Promise<LoyverseItem[]> {
    const items: LoyverseItem[] = [];
    let cursor: string | undefined;

    do {
      const params: any = { 
        limit: 250,
        updated_at_min: date 
      };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await this.client.get<LoyverseApiResponse<LoyverseItem>>(
        '/items',
        { params }
      );

      if (response.data.items) {
        items.push(...response.data.items);
      }

      cursor = response.data.cursor;
    } while (cursor);

    return items;
  }

  /**
   * Get variants updated after a specific date
   */
  async getVariantsUpdatedAfter(date: string): Promise<LoyverseVariant[]> {
    const variants: LoyverseVariant[] = [];
    let cursor: string | undefined;

    do {
      const params: any = { 
        limit: 250,
        updated_at_min: date 
      };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await this.client.get<
        LoyverseApiResponse<LoyverseVariant>
      >('/variants', { params });

      if (response.data.variants) {
        variants.push(...response.data.variants);
      }

      cursor = response.data.cursor;
    } while (cursor);

    return variants;
  }
}
