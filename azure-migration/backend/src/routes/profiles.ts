import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getPool, setUserContext } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get current user's profile
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Set user context for RLS
    await setUserContext(request, req.userId!);
    
    const result = await request
      .input('userId', req.userId)
      .query(`
        SELECT id, email, display_name, avatar_url, bio, created_at
        FROM profiles
        WHERE id = @userId
      `);

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user's profile
router.put(
  '/me',
  [
    body('displayName').optional().trim().isLength({ max: 255 }),
    body('bio').optional().trim().isLength({ max: 5000 }),
    body('avatarUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { displayName, bio, avatarUrl } = req.body;

    try {
      const pool = await getPool();
      const request = pool.request();
      
      // Set user context for RLS
      await setUserContext(request, req.userId!);
      
      const result = await request
        .input('userId', req.userId)
        .input('displayName', displayName || null)
        .input('bio', bio || null)
        .input('avatarUrl', avatarUrl || null)
        .query(`
          UPDATE profiles
          SET 
            display_name = ISNULL(@displayName, display_name),
            bio = ISNULL(@bio, bio),
            avatar_url = ISNULL(@avatarUrl, avatar_url)
          WHERE id = @userId;
          
          SELECT id, email, display_name, avatar_url, bio, created_at
          FROM profiles
          WHERE id = @userId;
        `);

      res.json(result.recordset[0]);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Get user's roles
router.get('/me/roles', async (req: AuthRequest, res: Response) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    await setUserContext(request, req.userId!);
    
    const result = await request
      .input('userId', req.userId)
      .query(`
        SELECT role, created_at
        FROM user_roles
        WHERE user_id = @userId
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

export default router;
