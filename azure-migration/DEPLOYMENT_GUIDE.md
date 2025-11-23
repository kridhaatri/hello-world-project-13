# Complete Deployment Guide
## Deploying Express Backend + Azure SQL + React Frontend

## Prerequisites

- Azure account with active subscription
- Node.js 18+ installed locally
- Git installed
- Azure CLI installed (`az` command)

## Part 1: Set Up Azure SQL Database

### 1. Create SQL Server and Database

```bash
# Login to Azure
az login

# Create resource group
az group create \\
  --name lovable-app-rg \\
  --location eastus

# Create SQL Server
az sql server create \\
  --name lovable-app-sql \\
  --resource-group lovable-app-rg \\
  --location eastus \\
  --admin-user sqladmin \\
  --admin-password 'YourStrongPassword123!'

# Create database
az sql db create \\
  --resource-group lovable-app-rg \\
  --server lovable-app-sql \\
  --name lovable-app-db \\
  --service-objective S0
```

### 2. Configure Firewall

```bash
# Allow Azure services
az sql server firewall-rule create \\
  --resource-group lovable-app-rg \\
  --server lovable-app-sql \\
  --name AllowAzureServices \\
  --start-ip-address 0.0.0.0 \\
  --end-ip-address 0.0.0.0

# Allow your IP (for local testing)
az sql server firewall-rule create \\
  --resource-group lovable-app-rg \\
  --server lovable-app-sql \\
  --name AllowMyIP \\
  --start-ip-address YOUR_IP \\
  --end-ip-address YOUR_IP
```

### 3. Run Schema Migration

```bash
# Install sqlcmd (if not already installed)
# Download from: https://learn.microsoft.com/en-us/sql/tools/sqlcmd-utility

# Connect and run schema
sqlcmd -S lovable-app-sql.database.windows.net \\
  -d lovable-app-db \\
  -U sqladmin \\
  -P 'YourStrongPassword123!' \\
  -i azure-sql-schema.sql
```

## Part 2: Deploy Express Backend to Azure App Service

### Option A: Deploy via Azure App Service (Recommended)

```bash
# Create App Service Plan
az appservice plan create \\
  --name lovable-app-plan \\
  --resource-group lovable-app-rg \\
  --sku B1 \\
  --is-linux

# Create Web App
az webapp create \\
  --resource-group lovable-app-rg \\
  --plan lovable-app-plan \\
  --name lovable-app-api \\
  --runtime "NODE:18-lts"

# Configure environment variables
az webapp config appsettings set \\
  --resource-group lovable-app-rg \\
  --name lovable-app-api \\
  --settings \\
    AZURE_SQL_SERVER="lovable-app-sql.database.windows.net" \\
    AZURE_SQL_DATABASE="lovable-app-db" \\
    AZURE_SQL_USER="sqladmin" \\
    AZURE_SQL_PASSWORD="YourStrongPassword123!" \\
    JWT_SECRET="your-super-secret-jwt-key-change-this" \\
    FRONTEND_URL="https://your-lovable-app.lovable.app" \\
    NODE_ENV="production"

# Deploy code (from backend directory)
cd azure-migration/backend
zip -r backend.zip .
az webapp deployment source config-zip \\
  --resource-group lovable-app-rg \\
  --name lovable-app-api \\
  --src backend.zip

# Your API is now available at:
# https://lovable-app-api.azurewebsites.net
```

### Option B: Deploy via GitHub Actions

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]
    paths:
      - 'azure-migration/backend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd azure-migration/backend
        npm ci
    
    - name: Build
      run: |
        cd azure-migration/backend
        npm run build
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: lovable-app-api
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: azure-migration/backend
```

## Part 3: Create Storage for File Uploads

```bash
# Create storage account
az storage account create \\
  --name lovableappstorage \\
  --resource-group lovable-app-rg \\
  --location eastus \\
  --sku Standard_LRS

# Get connection string
az storage account show-connection-string \\
  --name lovableappstorage \\
  --resource-group lovable-app-rg

# Create blob container
az storage container create \\
  --name avatars \\
  --account-name lovableappstorage \\
  --public-access blob

# Add connection string to App Service
az webapp config appsettings set \\
  --resource-group lovable-app-rg \\
  --name lovable-app-api \\
  --settings \\
    AZURE_STORAGE_CONNECTION_STRING="<connection-string-from-above>"
```

## Part 4: Update Frontend Configuration

### 1. Update Environment Variables in Lovable

Since Lovable doesn't have a traditional `.env` file, you'll need to:

1. Create a config file:

```typescript
// src/config/api.ts
export const API_CONFIG = {
  baseUrl: import.meta.env.PROD 
    ? 'https://lovable-app-api.azurewebsites.net/api'
    : 'http://localhost:3000/api',
};
```

2. Update API client to use this config:

```typescript
// src/lib/api-client.ts
import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.baseUrl;
// ... rest of the code
```

### 2. Test the Integration

1. Deploy your backend
2. Update `API_CONFIG.baseUrl` with your backend URL
3. Test authentication locally
4. Publish your Lovable app

## Part 5: Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Generate strong JWT secret
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable Azure SQL firewall rules
- [ ] Review RLS policies

### Monitoring
- [ ] Enable Application Insights
- [ ] Set up Azure Monitor alerts
- [ ] Configure log analytics
- [ ] Monitor SQL Database performance

```bash
# Enable Application Insights
az monitor app-insights component create \\
  --app lovable-app-insights \\
  --location eastus \\
  --resource-group lovable-app-rg

# Link to Web App
az webapp config appsettings set \\
  --resource-group lovable-app-rg \\
  --name lovable-app-api \\
  --settings \\
    APPINSIGHTS_INSTRUMENTATIONKEY="<instrumentation-key>"
```

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure database connection pooling
- [ ] Set up caching (Redis)
- [ ] Optimize SQL queries
- [ ] Enable compression

### Backup
- [ ] Configure automated SQL backups
- [ ] Test restore procedures
- [ ] Document backup schedule

```bash
# Configure automated backups
az sql db ltr-policy set \\
  --resource-group lovable-app-rg \\
  --server lovable-app-sql \\
  --database lovable-app-db \\
  --weekly-retention P4W \\
  --monthly-retention P12M
```

## Costs Estimation

| Service | Tier | Monthly Cost (USD) |
|---------|------|-------------------|
| Azure SQL Database | S0 (10 DTU) | ~$15 |
| App Service | B1 (Basic) | ~$13 |
| Storage Account | Standard LRS | ~$2 |
| **Total** | | **~$30/month** |

## Troubleshooting

### Backend won't start
```bash
# Check logs
az webapp log tail \\
  --resource-group lovable-app-rg \\
  --name lovable-app-api
```

### Database connection fails
```bash
# Test connection
sqlcmd -S lovable-app-sql.database.windows.net \\
  -d lovable-app-db \\
  -U sqladmin \\
  -P 'YourStrongPassword123!' \\
  -Q "SELECT 1"
```

### CORS errors
- Verify `FRONTEND_URL` in App Service settings
- Check CORS configuration in Express
- Ensure credentials are included in fetch requests

## Next Steps

1. Set up CI/CD pipeline
2. Configure custom domain
3. Enable SSL certificates
4. Set up staging environment
5. Implement monitoring dashboards

## Important Reminder

**This entire backend deployment must happen OUTSIDE of Lovable.** Lovable can only host your React frontend. The Express API must be deployed to Azure App Service, Vercel, Railway, or similar platforms.
