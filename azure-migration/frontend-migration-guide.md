# Frontend Migration Guide
## Replacing Supabase Client Calls with REST API

This guide shows you how to replace all Supabase client calls in your frontend with REST API calls to your Express.js backend.

## ⚠️ CRITICAL: Cannot Be Implemented in Lovable

**This migration requires external hosting because:**
- Lovable cannot run Node.js/Express.js backends
- You must deploy the Express backend separately (Azure App Service, Vercel, Railway, etc.)
- The frontend code changes shown below can only work after your backend is deployed

## Step-by-Step Migration

### 1. Create API Client Service

Create a new file to handle all API calls:

```typescript
// src/lib/api-client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
  error: string;
  errors?: Array<{ msg: string; param: string }>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async signUp(email: string, password: string, displayName?: string) {
    return this.request<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Profile endpoints
  async getProfile() {
    return this.request<any>('/profiles/me');
  }

  async updateProfile(data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  }) {
    return this.request<any>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserRoles() {
    return this.request<Array<{ role: string }>>('/profiles/me/roles');
  }

  // Theme endpoints
  async getThemeConfig() {
    return this.request<Record<string, string>>('/theme');
  }

  async updateThemeConfig(config: Record<string, string>) {
    return this.request<{ message: string }>('/theme', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }
}

export const apiClient = new ApiClient();
```

### 2. Update AuthContext

Replace Supabase auth with your API:

```typescript
// src/contexts/AuthContext.tsx - UPDATED VERSION
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const { user } = await apiClient.getCurrentUser();
          setUser(user);

          // Check admin status
          const roles = await apiClient.getUserRoles();
          setIsAdmin(roles.some(r => r.role === 'admin'));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiClient.setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user, token } = await apiClient.signIn(email, password);
      apiClient.setToken(token);
      setUser(user);

      // Check admin status
      const roles = await apiClient.getUserRoles();
      setIsAdmin(roles.some(r => r.role === 'admin'));

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.',
      });
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      const { user, token } = await apiClient.signUp(
        email,
        password,
        displayName
      );
      apiClient.setToken(token);
      setUser(user);
      setIsAdmin(false);

      toast({
        title: 'Account created!',
        description: 'Welcome to the app.',
      });
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    apiClient.setToken(null);
    setUser(null);
    setIsAdmin(false);
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 3. Update Profile Page

Replace Supabase calls with API client:

```typescript
// src/pages/Profile.tsx - Key changes
import { apiClient } from '@/lib/api-client';

// In handleSubmit function:
const handleSubmit = async (values: ProfileFormData) => {
  try {
    setIsSubmitting(true);

    let avatarUrl = profile?.avatar_url;

    // File upload - you'll need to implement file upload endpoint
    if (avatarFile) {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });
      
      const { url } = await uploadResponse.json();
      avatarUrl = url;
    }

    // Update profile
    await apiClient.updateProfile({
      displayName: values.displayName,
      bio: values.bio,
      avatarUrl,
    });

    toast({
      title: "Success",
      description: "Profile updated successfully!",
    });
    
    // Refresh profile data
    fetchProfile();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### 4. Environment Variables

Update your `.env` file (create one if needed):

```env
# Add to your project root
VITE_API_URL=http://localhost:3000/api
```

For production:
```env
VITE_API_URL=https://your-backend.azurewebsites.net/api
```

### 5. Remove Supabase Dependencies

After migration is complete:

```bash
npm uninstall @supabase/supabase-js @tanstack/react-query
```

Remove or comment out:
- `src/integrations/supabase/*` (all files)
- Supabase imports throughout the codebase

## Files That Need Updates

1. ✅ `src/lib/api-client.ts` - NEW FILE (create this)
2. ✅ `src/contexts/AuthContext.tsx` - REPLACE auth logic
3. ✅ `src/pages/Profile.tsx` - REPLACE Supabase calls
4. ✅ `src/pages/Auth.tsx` - UPDATE to use new auth context
5. ✅ `.env` - ADD API_URL configuration

## Testing Checklist

- [ ] Authentication (sign up, sign in, sign out)
- [ ] Profile viewing
- [ ] Profile updating
- [ ] Avatar upload
- [ ] Admin role checking
- [ ] Protected routes
- [ ] Error handling
- [ ] Token expiration handling

## Deployment Steps

### Backend (Express API):
1. Deploy to Azure App Service, Vercel, or Railway
2. Set environment variables
3. Run migrations on Azure SQL
4. Test endpoints

### Frontend (This Lovable App):
1. Update `VITE_API_URL` to production backend URL
2. Test all functionality
3. Deploy via Lovable's publish button

## Important Notes

- **Cannot run backend in Lovable** - must deploy separately
- Keep authentication tokens secure
- Implement proper error handling
- Add loading states for all API calls
- Consider implementing refresh token logic
- Add request/response interceptors for common errors
