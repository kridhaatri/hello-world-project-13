# Mock API Server for Testing

This is a mock Express server that simulates your backend API for local testing.

## Setup

1. Install dependencies:
```bash
cd test-server
npm install
```

2. Start the mock server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Testing the Authentication Flow

### 1. Sign Up a New User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'
```

Expected response:
```json
{
  "user": {
    "id": "user_1234567890",
    "email": "test@example.com",
    "displayName": "Test User",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Sign In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Get Current User (Authenticated)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Get User Profile
```bash
curl -X GET http://localhost:3000/api/profiles/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Update Profile
```bash
curl -X PUT http://localhost:3000/api/profiles/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Updated Name","bio":"My new bio"}'
```

### 6. Get User Roles
```bash
curl -X GET http://localhost:3000/api/profiles/me/roles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Get Theme Config
```bash
curl -X GET http://localhost:3000/api/theme
```

### 8. Update Theme Config (Admin only)
```bash
curl -X PUT http://localhost:3000/api/theme \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"config":{"primaryColor":"#ff0000","fontFamily":"Arial"}}'
```

## Testing with Frontend

1. Make sure the mock server is running:
```bash
cd test-server
npm start
```

2. Update your frontend `.env` file:
```env
VITE_API_URL=http://localhost:3000/api
```

3. Start your frontend:
```bash
npm run dev
```

4. Test the authentication flow:
   - Go to `/auth` page
   - Try signing up with: `test@example.com` / `password123`
   - Try signing in
   - Navigate to protected routes to verify authentication
   - Check network tab to see API calls with retry logic

## Features

- ✅ Full authentication flow (signup, signin, get user)
- ✅ Profile management (get, update)
- ✅ Role management
- ✅ Theme configuration
- ✅ Mock file uploads
- ✅ JWT token authentication
- ✅ In-memory database (resets on restart)
- ✅ CORS enabled for frontend testing

## Testing Error Scenarios

### Network Failure Simulation
Stop the server to test retry logic:
```bash
# Frontend will automatically retry failed requests
```

### Invalid Token
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid_token"
```

### Missing Authentication
```bash
curl -X GET http://localhost:3000/api/auth/me
```

## Notes

- All data is stored in memory and will be lost when the server restarts
- JWT secret is hardcoded for testing purposes
- No actual file storage - uploads return mock URLs
- Default test credentials: `test@example.com` / `password123`
