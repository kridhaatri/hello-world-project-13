# Frontend Implementation Guide
## Complete Integration with Express Backend

This guide shows you exactly how to integrate the Express backend into your Lovable frontend.

## ⚠️ Prerequisites

Before implementing these changes:
1. ✅ Express backend deployed and running
2. ✅ Azure SQL database configured
3. ✅ Azure Blob Storage configured
4. ✅ Backend URL accessible

## Step 1: Add API Configuration

The `src/config/api.ts` file has been created for you. Update the production URL:

```typescript
// src/config/api.ts
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD 
      ? 'https://your-backend.azurewebsites.net/api'  // ← UPDATE THIS
      : 'http://localhost:3000/api'),
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};
```

## Step 2: Update Profile Page

Replace the Supabase upload logic with the new API client:

```typescript
// src/pages/Profile.tsx
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Avatar must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: ProfileFormData) => {
    try {
      setIsSubmitting(true);

      let avatarUrl = user?.avatarUrl;

      // Upload avatar if selected
      if (avatarFile) {
        const uploadResult = await apiClient.uploadAvatar(avatarFile);
        avatarUrl = uploadResult.url;
      }

      // Update profile
      await apiClient.updateProfile({
        displayName: values.displayName,
        bio: values.bio,
        avatarUrl,
      });

      // Refresh user data
      await refreshUser();

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      
      // Reset form
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1>Edit Profile</h1>
      
      {/* Avatar Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Profile Picture
        </label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarPreview || user?.avatarUrl} />
            <AvatarFallback>
              {user?.displayName?.[0] || user?.email?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            Choose Avatar
          </Button>
        </div>
      </div>

      {/* Rest of your form... */}
    </div>
  );
}
```

## Step 3: Update Auth Page

The Auth page should already work with the updated `AuthContext`. Verify it's using the context correctly:

```typescript
// src/pages/Auth.tsx
import { useAuth } from '@/contexts/AuthContext';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      // Redirect handled by ProtectedRoute
    } catch (error) {
      // Error toast shown by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of component
}
```

## Step 4: Remove Supabase Dependencies

Once everything is working with the API client:

### Option A: Comment out Supabase imports (safer)

```typescript
// Comment out in any file using Supabase
// import { supabase } from '@/integrations/supabase/client';
```

### Option B: Uninstall Supabase (complete migration)

```bash
# Only do this after testing everything!
npm uninstall @supabase/supabase-js
```

## Step 5: Update Environment Variables

Since Lovable doesn't use traditional `.env` files, the API URL is configured in `src/config/api.ts`.

For local development with your backend:
1. Run your backend on `http://localhost:3000`
2. The config will automatically use it in dev mode

For production:
1. Update the production URL in `src/config/api.ts`
2. Redeploy via Lovable

## Step 6: Test Checklist

Test all functionality before deploying:

### Authentication
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Sign out
- [ ] Token persistence (refresh page while logged in)
- [ ] Protected routes redirect to login when not authenticated

### Profile Management
- [ ] View profile
- [ ] Update display name
- [ ] Update bio
- [ ] Upload avatar (test with different image formats)
- [ ] Avatar displays correctly after upload
- [ ] Profile changes persist after page refresh

### Error Handling
- [ ] Network errors show appropriate messages
- [ ] Invalid credentials show error
- [ ] File upload errors handled
- [ ] Token expiration handled gracefully

### Security
- [ ] Cannot access protected routes without login
- [ ] API endpoints require valid token
- [ ] Cannot upload files > 5MB
- [ ] Only image files accepted for avatars

## Common Issues & Solutions

### Issue: CORS errors

**Solution**: Verify backend CORS configuration:
```typescript
// backend/src/server.ts
app.use(cors({
  origin: 'https://your-app.lovable.app', // Your Lovable URL
  credentials: true,
}));
```

### Issue: 401 Unauthorized errors

**Solution**: Check token is being sent:
```typescript
// src/lib/api-client.ts - already implemented
headers: {
  Authorization: `Bearer ${this.token}`,
}
```

### Issue: Avatar not displaying

**Solution**: Ensure Azure Blob Storage container is public:
```bash
az storage container set-permission \
  --name avatars \
  --account-name lovableappstorage \
  --public-access blob
```

### Issue: File upload fails

**Solution**: Check environment variables in Azure App Service:
```bash
az webapp config appsettings list \
  --resource-group lovable-app-rg \
  --name lovable-app-api \
  --query "[?name=='AZURE_STORAGE_CONNECTION_STRING']"
```

## Performance Optimization

### 1. Add Request Caching

```typescript
// src/lib/api-client.ts
private cache = new Map<string, { data: any; timestamp: number }>();

private async cachedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes
): Promise<T> {
  const cached = this.cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetcher();
  this.cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 2. Add Loading States

```typescript
// Example component with loading state
const [isLoading, setIsLoading] = useState(false);

const fetchData = async () => {
  setIsLoading(true);
  try {
    const data = await apiClient.getProfile();
    // handle data
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Implement Retry Logic

```typescript
// src/lib/api-client.ts - add retry wrapper
private async requestWithRetry<T>(
  fetcher: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetcher();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Next Steps

1. ✅ Implement all changes above
2. ✅ Test thoroughly in development
3. ✅ Deploy backend to Azure
4. ✅ Update production API URL
5. ✅ Deploy frontend via Lovable
6. ✅ Monitor for errors
7. ✅ Set up analytics/monitoring

## Support

If you encounter issues:
1. Check backend logs: `az webapp log tail --name lovable-app-api --resource-group lovable-app-rg`
2. Check browser console for frontend errors
3. Verify API endpoints with Postman/Insomnia
4. Review Azure Portal for service health
