import * as fs from 'fs';
import * as path from 'path';

export class CacheService {
  private cacheDir: string;

  constructor(cacheDir: string = '.cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Get cache file path
   */
  private getCacheFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string, maxAgeMinutes?: number): boolean {
    const filePath = this.getCacheFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }

    if (maxAgeMinutes) {
      const stats = fs.statSync(filePath);
      const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60;
      if (ageMinutes > maxAgeMinutes) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const filePath = this.getCacheFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T): void {
    const filePath = this.getCacheFilePath(key);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error writing cache for ${key}:`, error);
    }
  }

  /**
   * Clear specific cache
   */
  clear(key: string): void {
    const filePath = this.getCacheFilePath(key);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    if (fs.existsSync(this.cacheDir)) {
      const files = fs.readdirSync(this.cacheDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      });
    }
  }

  /**
   * Get cache age in minutes
   */
  getAge(key: string): number | null {
    const filePath = this.getCacheFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    return (Date.now() - stats.mtimeMs) / 1000 / 60;
  }
}
