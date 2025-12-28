# Loyverse to Supabase Inventory Sync

A TypeScript application that synchronizes inventory data from Loyverse POS to a Supabase database.

## Features

- **Full Sync**: Complete synchronization of all items, variants, and inventory levels
- **Incremental Sync**: Sync only updated data since the last successful sync
- **Error Handling**: Comprehensive error logging and tracking
- **Batch Processing**: Efficient batch upserts for large datasets
- **Statistics**: View current database statistics

## Prerequisites

- Node.js 18 or higher
- A Loyverse account with API access
- A Supabase account and project

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Loyverse API Credentials
LOYVERSE_API_TOKEN=your_loyverse_api_token_here

# Supabase Credentials
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Sync Configuration
SYNC_INTERVAL_MINUTES=60
LOG_LEVEL=info
```

#### Getting Loyverse API Token

1. Log in to your Loyverse account
2. Go to Settings → API Tokens
3. Create a new token with read access to inventory
4. Copy the token to your `.env` file

#### Getting Supabase Credentials

1. Log in to your Supabase project
2. Go to Settings → API
3. Copy the Project URL (SUPABASE_URL)
4. Copy the anon/public key (SUPABASE_KEY)

### 3. Set Up Supabase Database

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of schema.sql and run it in Supabase SQL Editor
```

Or use the Supabase CLI:

```bash
supabase db push < schema.sql
```

## Usage

### Run Full Sync

Synchronizes all items, variants, and inventory from Loyverse:

```bash
npm run sync
# or
npm run dev full
```

### Run Incremental Sync

Synchronizes only updated data since the last successful sync:

```bash
npm run dev incremental
```

### View Statistics

Display current database statistics:

```bash
npm run dev stats
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
loyverse-supabase-sync/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration management
│   ├── types.ts              # TypeScript type definitions
│   ├── loyverse-client.ts    # Loyverse API client
│   ├── supabase-service.ts   # Supabase service
│   └── sync-service.ts       # Main sync logic
├── schema.sql                # Supabase database schema
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Example environment variables
└── README.md                 # This file
```

## Database Schema

### Tables

- **items**: Stores Loyverse items (products)
- **variants**: Stores product variants
- **inventory**: Stores inventory levels per store
- **sync_logs**: Tracks sync operations and errors

### Relationships

- Variants are linked to items via `loyverse_item_id`
- Inventory is linked to variants via `variant_id`

## API Reference

### Loyverse API

The application uses the following Loyverse API endpoints:

- `GET /v1.0/items` - Fetch items
- `GET /v1.0/variants` - Fetch variants
- `GET /v1.0/inventory` - Fetch inventory levels

### Supabase Tables

All data is stored in Supabase with proper relationships and indexes for optimal query performance.

## Error Handling

- All errors are logged to the `sync_logs` table
- Failed syncs are tracked with error messages
- The application continues processing even if individual batches fail

## Performance Considerations

- Batch size: 100 records per upsert
- Pagination: 250 records per API request
- Indexes on frequently queried columns
- Incremental sync reduces API load

## Troubleshooting

### Configuration Errors

If you see "Configuration errors", ensure all required environment variables are set in `.env`.

### API Rate Limits

Loyverse has API rate limits. The application handles pagination but may need adjustments for very large inventories.

### Database Connection Issues

Ensure your Supabase credentials are correct and your database has the schema properly set up.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
# ants-lv-syncer
