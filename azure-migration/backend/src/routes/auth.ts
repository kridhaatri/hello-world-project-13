import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { getPool } from '../config/database';
import { generateToken } from '../middleware/auth';

const router = express.Router();

// Sign up endpoint
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('displayName').optional().trim().isLength({ max: 255 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, displayName } = req.body;

    try {
      const pool = await getPool();
      
      // Check if user exists
      const existingUser = await pool
        .request()
        .input('email', email)
        .query('SELECT id FROM profiles WHERE email = @email');

      if (existingUser.recordset.length > 0) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate new user ID
      const userId = require('crypto').randomUUID();

      // Insert user
      await pool
        .request()
        .input('id', userId)
        .input('email', email)
        .input('displayName', displayName || null)
        .input('hashedPassword', hashedPassword)
        .query(`
          INSERT INTO profiles (id, email, display_name, created_at)
          VALUES (@id, @email, @displayName, SYSDATETIMEOFFSET());
          
          -- Also create password record (you'll need a passwords table)
          INSERT INTO user_passwords (user_id, password_hash)
          VALUES (@id, @hashedPassword);
          
          -- Assign default user role
          INSERT INTO user_roles (user_id, role)
          VALUES (@id, 'user');
        `);

      // Generate token
      const token = generateToken(userId, email);

      res.status(201).json({
        user: { id: userId, email, displayName },
        token,
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Sign in endpoint
router.post(
  '/signin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      const pool = await getPool();
      
      // Get user and password
      const result = await pool
        .request()
        .input('email', email)
        .query(`
          SELECT 
            p.id, 
            p.email, 
            p.display_name,
            up.password_hash
          FROM profiles p
          INNER JOIN user_passwords up ON p.id = up.user_id
          WHERE p.email = @email
        `);

      if (result.recordset.length === 0) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const user = result.recordset[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate token
      const token = generateToken(user.id, user.email);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
        },
        token,
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token required' });
    return;
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', decoded.userId)
      .query(`
        SELECT id, email, display_name, avatar_url, bio, created_at
        FROM profiles
        WHERE id = @userId
      `);

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: result.recordset[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
