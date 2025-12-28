import express, { Request, Response } from 'express';
import { validateConfig } from './config';
import { InventorySyncService } from './sync-service';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sync handler function
const handleSync = async (req: Request, res: Response) => {
  try {
    // Validate configuration
    validateConfig();

    // Get options from request body (POST) or query params (GET)
    const { type = 'full', useCache = true } = req.method === 'POST' ? req.body : req.query;

    console.log(`[${new Date().toISOString()}] Sync triggered via ${req.method} - type: ${type}, useCache: ${useCache}`);

    // Create sync service
    const syncService = new InventorySyncService(useCache === 'true' || useCache === true);

    let result;
    switch (type) {
      case 'full':
        console.log('=== Running Full Sync ===\n');
        result = await syncService.fullSync();
        break;

      case 'incremental':
        console.log('=== Running Incremental Sync ===\n');
        result = await syncService.incrementalSync();
        break;

      case 'stats':
        console.log('=== Getting Database Statistics ===\n');
        await syncService.getStats();
        res.json({ 
          success: true, 
          message: 'Stats retrieved (check server logs)',
          timestamp: new Date().toISOString()
        });
        return;

      default:
        res.status(400).json({ 
          error: 'Invalid sync type. Use "full", "incremental", or "stats"' 
        });
        return;
    }

    console.log('\n=== Sync Complete ===');
    console.log(`Products synced: ${result.products_synced}`);
    console.log(`Products deleted: ${result.products_deleted}`);
    if (result.errors.length > 0) {
      console.log(`Errors: ${result.errors.length}`);
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }

    // Send response
    res.json({
      success: true,
      type,
      result: {
        products_synced: result.products_synced,
        products_deleted: result.products_deleted,
        errors: result.errors,
        started_at: result.started_at,
        completed_at: result.completed_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      error: 'Sync failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};

// GET and POST endpoints to trigger sync
app.get('/sync', handleSync);
app.post('/sync', handleSync);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Loyverse Sync API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Sync endpoint: POST http://localhost:${PORT}/sync`);
  console.log(`\nExample curl command:`);
  console.log(`  curl -X POST http://localhost:${PORT}/sync -H "Content-Type: application/json" -d '{"type":"full","useCache":true}'`);
});
