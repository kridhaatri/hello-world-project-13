import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getPool, setUserContext } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get all theme configuration (public)
router.get('/', async (req, res: Response) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT config_key, config_value, updated_at
      FROM theme_config
      ORDER BY config_key
    `);

    // Convert to key-value object
    const config: Record<string, string> = {};
    result.recordset.forEach(row => {
      config[row.config_key] = row.config_value;
    });

    res.json(config);
  } catch (error) {
    console.error('Get theme config error:', error);
    res.status(500).json({ error: 'Failed to fetch theme configuration' });
  }
});

// Update theme configuration (admin only)
router.put(
  '/',
  authenticateToken,
  requireAdmin,
  [
    body('config').isObject(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { config } = req.body;

    try {
      const pool = await getPool();
      const request = pool.request();
      
      await setUserContext(request, req.userId!);

      // Update each config key
      for (const [key, value] of Object.entries(config)) {
        await pool
          .request()
          .input('key', key)
          .input('value', value as string)
          .query(`
            MERGE theme_config AS target
            USING (SELECT @key AS config_key) AS source
            ON target.config_key = source.config_key
            WHEN MATCHED THEN
              UPDATE SET config_value = @value, updated_at = SYSDATETIMEOFFSET()
            WHEN NOT MATCHED THEN
              INSERT (config_key, config_value)
              VALUES (@key, @value);
          `);
      }

      res.json({ message: 'Theme configuration updated successfully' });
    } catch (error) {
      console.error('Update theme config error:', error);
      res.status(500).json({ error: 'Failed to update theme configuration' });
    }
  }
);

export default router;
