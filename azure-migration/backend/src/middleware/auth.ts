import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    const payload = decoded as JWTPayload;
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  });
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email } as JWTPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Optional: Middleware to check if user is admin
export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const { getPool } = require('../config/database');
    const pool = await getPool();
    
    const result = await pool
      .request()
      .input('userId', req.userId)
      .query(`
        SELECT dbo.has_role(@userId, 'admin') as is_admin
      `);

    if (!result.recordset[0]?.is_admin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
}
