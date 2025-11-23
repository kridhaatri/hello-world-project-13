import express, { Response } from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import path from 'path';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Get Azure Blob Storage client
function getBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Azure Storage connection string not configured');
  }
  return BlobServiceClient.fromConnectionString(connectionString);
}

// Upload avatar
router.post(
  '/avatar',
  authenticateToken,
  upload.single('avatar'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const blobServiceClient = getBlobServiceClient();
      const containerName = process.env.AZURE_STORAGE_CONTAINER_AVATARS || 'avatars';
      const containerClient = blobServiceClient.getContainerClient(containerName);

      // Ensure container exists
      await containerClient.createIfNotExists({
        access: 'blob', // Public read access
      });

      // Generate unique filename
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${req.userId}/${crypto.randomUUID()}${fileExt}`;
      
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      // Upload file
      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: {
          blobContentType: req.file.mimetype,
        },
      });

      // Get public URL
      const url = blockBlobClient.url;

      res.json({
        url,
        filename: fileName,
        size: req.file.size,
        contentType: req.file.mimetype,
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
);

// Delete avatar
router.delete(
  '/avatar/:filename',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { filename } = req.params;

      // Ensure user can only delete their own files
      if (!filename.startsWith(req.userId + '/')) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const blobServiceClient = getBlobServiceClient();
      const containerName = process.env.AZURE_STORAGE_CONTAINER_AVATARS || 'avatars';
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(filename);

      await blockBlobClient.deleteIfExists();

      res.json({ message: 'Avatar deleted successfully' });
    } catch (error) {
      console.error('Avatar delete error:', error);
      res.status(500).json({ error: 'Failed to delete avatar' });
    }
  }
);

// Upload general file (for future use)
router.post(
  '/file',
  authenticateToken,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const blobServiceClient = getBlobServiceClient();
      const containerName = 'files'; // Different container for general files
      const containerClient = blobServiceClient.getContainerClient(containerName);

      await containerClient.createIfNotExists({
        access: 'container', // Private access
      });

      // Generate unique filename
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${req.userId}/${Date.now()}-${crypto.randomUUID()}${fileExt}`;
      
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      // Upload file
      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: {
          blobContentType: req.file.mimetype,
        },
        metadata: {
          userId: req.userId!,
          originalName: req.file.originalname,
        },
      });

      const url = blockBlobClient.url;

      res.json({
        url,
        filename: fileName,
        size: req.file.size,
        contentType: req.file.mimetype,
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

export default router;
