# Database Migration Guide

## Overview
This guide explains how to migrate your Lovable Cloud database to an external database like Azure SQL Server or PostgreSQL.

## Current Architecture
- **Frontend**: React + Vite + TypeScript
- **Backend**: Lovable Cloud (Supabase Edge Functions + PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## Migration Options

### Option 1: PostgreSQL (Recommended - Easiest Migration)
Azure Database for PostgreSQL is the easiest migration path since your current schema is already PostgreSQL.

#### Steps:
1. **Create Azure PostgreSQL Instance**
   ```bash
   az postgres flexible-server create \
     --name your-server-name \
     --resource-group your-resource-group \
     --location eastus \
     --admin-user adminuser \
     --admin-password YourPassword123! \
     --sku-name Standard_B2s \
     --version 14
   ```

2. **Import Schema**
   ```bash
   psql -h your-server-name.postgres.database.azure.com \
     -U adminuser \
     -d postgres \
     -f database-export/schema.sql
   ```

3. **Export and Import Data**
   ```bash
   # Export from Lovable Cloud (you'll need direct DB access)
   pg_dump -h your-lovable-db.supabase.co -U postgres -d postgres --data-only > data.sql
   
   # Import to Azure
   psql -h your-server-name.postgres.database.azure.com \
     -U adminuser \
     -d postgres \
     -f data.sql
   ```

### Option 2: Azure SQL Server (Requires Schema Conversion)
Migrating to Azure SQL Server requires converting PostgreSQL syntax to T-SQL.

#### Key Differences to Address:
1. **Data Types**:
   - `UUID` → `UNIQUEIDENTIFIER`
   - `TIMESTAMPTZ` → `DATETIMEOFFSET`
   - `TEXT` → `NVARCHAR(MAX)`

2. **Functions**:
   - `gen_random_uuid()` → `NEWID()`
   - `NOW()` → `GETUTCDATE()`

3. **Enums**: SQL Server doesn't have native ENUM types
   ```sql
   -- Create a lookup table instead
   CREATE TABLE app_roles (
     role_name NVARCHAR(50) PRIMARY KEY
   );
   INSERT INTO app_roles VALUES ('admin'), ('user');
   ```

4. **RLS**: Use SQL Server's Row-Level Security feature
   ```sql
   CREATE SECURITY POLICY UserRolePolicy
   ADD FILTER PREDICATE dbo.fn_securitypredicate(user_id)
   ON dbo.user_roles;
   ```

## Required Code Changes

### 1. Update Database Client

**Install Azure SQL client:**
```bash
npm install mssql
# OR for PostgreSQL
npm install pg
```

**Create new client (for Azure SQL):**
```typescript
// src/lib/database.ts
import sql from 'mssql';

const config = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

export const pool = new sql.ConnectionPool(config);
```

### 2. Replace Supabase Client Calls

**Before (Supabase):**
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

**After (Azure SQL with API):**
```typescript
// Call your custom backend API
const response = await fetch('/api/profiles/' + userId);
const data = await response.json();
```

### 3. Create Backend API Layer

You'll need to create a separate backend since Lovable only handles frontend:

**Example with Express.js:**
```javascript
// server.js
const express = require('express');
const sql = require('mssql');

const app = express();

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT * FROM profiles WHERE id = ${req.params.id}
    `;
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
```

### 4. Replace Authentication

**Options:**
- Azure AD B2C
- Auth0
- Custom JWT implementation

**Example with JWT:**
```typescript
import jwt from 'jsonwebtoken';

// Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### 5. Replace File Storage

**Use Azure Blob Storage:**
```typescript
import { BlobServiceClient } from '@azure/storage-blob';

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

// Upload file
const containerClient = blobServiceClient.getContainerClient('avatars');
const blockBlobClient = containerClient.getBlockBlobClient(fileName);
await blockBlobClient.uploadData(fileBuffer);
```

## Migration Checklist

- [ ] Export current database schema
- [ ] Set up Azure database instance
- [ ] Convert schema if using Azure SQL Server
- [ ] Create backend API (Express/Fastify/Azure Functions)
- [ ] Migrate authentication system
- [ ] Set up file storage (Azure Blob Storage)
- [ ] Update all frontend API calls
- [ ] Migrate data from current database
- [ ] Test all functionality
- [ ] Update environment variables
- [ ] Deploy backend and frontend separately

## Important Considerations

1. **Lovable Limitations**: 
   - Lovable cannot run Node.js/Express backends
   - You'll need external hosting for your backend (Azure App Service, Azure Functions, etc.)

2. **Cost**: Running separate backend + database will have ongoing costs

3. **Complexity**: 3-tier architecture with external database requires more maintenance

4. **Development**: You'll need to develop backend separately from Lovable

## Recommended Approach

If you want to keep using Lovable for development:
1. Keep Lovable Cloud for development/staging
2. Export to external database only for production
3. Use a migration tool to sync data periodically

## Need Help?

For external database setups, you'll need to:
1. Set up backend hosting (Azure App Service, AWS Lambda, etc.)
2. Configure database connections
3. Implement API endpoints
4. Update frontend to call your APIs instead of Supabase

This migration moves beyond Lovable's capabilities and requires traditional full-stack development.
