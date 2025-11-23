import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE || '',
  user: process.env.AZURE_SQL_USER || '',
  password: process.env.AZURE_SQL_PASSWORD || '',
  options: {
    encrypt: true, // Use encryption for Azure
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Create connection pool
let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('Connected to Azure SQL Database');
  }
  return pool;
}

// Helper function to set user context for RLS
export async function setUserContext(
  request: sql.Request,
  userId: string
): Promise<void> {
  await request.query(
    `EXEC sp_set_session_context N'user_id', N'${userId}', @read_only = 1;`
  );
}

// Close pool on application shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
}

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});
