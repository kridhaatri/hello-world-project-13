// Mock Express Server for Testing API Client
// Run with: node test-server/mock-server.js

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'test-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database
const users = new Map();
const profiles = new Map();
const userRoles = new Map();

// Helper to generate JWT
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  });
};

// ==================== Auth Routes ====================

app.post('/api/auth/signup', (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (users.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const userId = `user_${Date.now()}`;
  const user = {
    id: userId,
    email,
    displayName: displayName || email.split('@')[0],
    createdAt: new Date().toISOString(),
  };

  users.set(email, { ...user, password });
  profiles.set(userId, {
    id: userId,
    email,
    displayName: user.displayName,
    avatarUrl: null,
    bio: null,
  });

  // Assign default 'user' role
  userRoles.set(userId, [{ role: 'user', createdAt: new Date().toISOString() }]);

  const token = generateToken(userId, email);

  console.log(`✓ User signed up: ${email}`);
  res.json({ user, token });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user.id, email);
  const { password: _, ...userWithoutPassword } = user;

  console.log(`✓ User signed in: ${email}`);
  res.json({ user: userWithoutPassword, token });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = Array.from(users.values()).find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// ==================== Profile Routes ====================

app.get('/api/profiles/me', authenticateToken, (req, res) => {
  const profile = profiles.get(req.userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json(profile);
});

app.put('/api/profiles/me', authenticateToken, (req, res) => {
  const profile = profiles.get(req.userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const { displayName, bio, avatarUrl } = req.body;
  const updatedProfile = {
    ...profile,
    ...(displayName && { displayName }),
    ...(bio !== undefined && { bio }),
    ...(avatarUrl !== undefined && { avatarUrl }),
  };

  profiles.set(req.userId, updatedProfile);
  console.log(`✓ Profile updated for: ${req.userEmail}`);
  res.json(updatedProfile);
});

app.get('/api/profiles/me/roles', authenticateToken, (req, res) => {
  const roles = userRoles.get(req.userId) || [];
  res.json(roles);
});

// ==================== Theme Routes ====================

let themeConfig = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  fontFamily: 'Inter',
};

app.get('/api/theme', (req, res) => {
  res.json(themeConfig);
});

app.put('/api/theme', authenticateToken, (req, res) => {
  const { config } = req.body;
  themeConfig = { ...themeConfig, ...config };
  console.log('✓ Theme config updated');
  res.json({ message: 'Theme updated successfully' });
});

// ==================== Upload Routes (Mock) ====================

app.post('/api/upload/avatar', authenticateToken, (req, res) => {
  // Mock file upload
  const mockUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.userId}`;
  console.log(`✓ Avatar uploaded for: ${req.userEmail}`);
  res.json({
    url: mockUrl,
    filename: 'avatar.jpg',
    size: 12345,
    contentType: 'image/jpeg',
  });
});

app.delete('/api/upload/avatar/:filename', authenticateToken, (req, res) => {
  console.log(`✓ Avatar deleted: ${req.params.filename}`);
  res.json({ message: 'Avatar deleted successfully' });
});

app.post('/api/upload/file', authenticateToken, (req, res) => {
  // Mock file upload
  const mockUrl = `https://example.com/files/${Date.now()}.pdf`;
  console.log(`✓ File uploaded for: ${req.userEmail}`);
  res.json({
    url: mockUrl,
    filename: 'document.pdf',
    size: 54321,
    contentType: 'application/pdf',
  });
});

// ==================== Admin Routes (for testing roles) ====================

app.post('/api/admin/make-admin', authenticateToken, (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const roles = userRoles.get(userId) || [];
  if (!roles.find(r => r.role === 'admin')) {
    roles.push({ role: 'admin', createdAt: new Date().toISOString() });
    userRoles.set(userId, roles);
  }

  console.log(`✓ Admin role granted to user: ${userId}`);
  res.json({ message: 'Admin role granted' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`📋 Base URL: http://localhost:${PORT}/api`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST   /api/auth/signup`);
  console.log(`  POST   /api/auth/signin`);
  console.log(`  GET    /api/auth/me`);
  console.log(`  GET    /api/profiles/me`);
  console.log(`  PUT    /api/profiles/me`);
  console.log(`  GET    /api/profiles/me/roles`);
  console.log(`  GET    /api/theme`);
  console.log(`  PUT    /api/theme`);
  console.log(`  POST   /api/upload/avatar`);
  console.log(`  POST   /api/upload/file`);
  console.log(`  GET    /api/health`);
  console.log(`\n💡 Test credentials:`);
  console.log(`  Email: test@example.com`);
  console.log(`  Password: password123\n`);
});
