import dotenv from 'dotenv';

dotenv.config();

export const config = {
  loyverse: {
    apiToken: process.env.LOYVERSE_API_TOKEN || '',
    baseUrl: 'https://api.loyverse.com/v1.0',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || '',
  },
  sync: {
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '60', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.loyverse.apiToken) {
    errors.push('LOYVERSE_API_TOKEN is required');
  }

  if (!config.supabase.url) {
    errors.push('SUPABASE_URL is required');
  }

  if (!config.supabase.key) {
    errors.push('SUPABASE_KEY is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
