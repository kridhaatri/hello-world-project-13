-- ========================================
-- COMPLETE DATABASE SCHEMA EXPORT
-- Generated from Lovable Cloud (Supabase)
-- ========================================

-- ========================================
-- 1. ENUMS
-- ========================================

CREATE TYPE app_role AS ENUM ('admin', 'user');

-- ========================================
-- 2. TABLES
-- ========================================

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT
);

-- Theme configuration table
CREATE TABLE theme_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    config_key TEXT NOT NULL,
    config_value TEXT NOT NULL
);

-- User roles table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    role app_role NOT NULL DEFAULT 'user'
);

-- ========================================
-- 3. FOREIGN KEY CONSTRAINTS
-- ========================================

-- Note: In Supabase, profiles.id references auth.users(id)
-- For external databases, you'll need to create your own users table
-- ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES profiles(id);

-- ========================================
-- 4. INDEXES
-- ========================================

CREATE UNIQUE INDEX IF NOT EXISTS theme_config_config_key_key ON theme_config(config_key);

-- ========================================
-- 5. FUNCTIONS
-- ========================================

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- ========================================
-- 6. TRIGGERS
-- ========================================

-- Note: This trigger is for Supabase auth.users table
-- For external databases, you'll need to adapt this to your auth system
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Note: auth.uid() is Supabase-specific. Replace with your auth system's user ID function
-- CREATE POLICY "Users can view their own profile" ON profiles
--   FOR SELECT USING (auth.uid() = id);
--
-- CREATE POLICY "Users can update their own profile" ON profiles
--   FOR UPDATE USING (auth.uid() = id);

-- Theme config policies
-- CREATE POLICY "Anyone can view theme config" ON theme_config
--   FOR SELECT USING (true);
--
-- CREATE POLICY "Admins can modify theme config" ON theme_config
--   FOR ALL USING (has_role('admin'::app_role, auth.uid()));

-- User roles policies
-- CREATE POLICY "Users can view their own roles" ON user_roles
--   FOR SELECT USING (auth.uid() = user_id);
--
-- CREATE POLICY "Admins can manage all roles" ON user_roles
--   FOR ALL USING (has_role('admin'::app_role, auth.uid()));

-- ========================================
-- 8. STORAGE BUCKETS
-- ========================================

-- Note: Supabase Storage is specific to Supabase
-- For external databases, you'll need to implement your own file storage solution
-- Bucket name: 'avatars' (public)

-- ========================================
-- NOTES FOR MIGRATION
-- ========================================

-- 1. Authentication: Replace auth.uid() with your database's authentication system
-- 2. Storage: Implement file storage using Azure Blob Storage or similar
-- 3. Realtime: If using realtime features, implement WebSocket or similar solution
-- 4. Edge Functions: Convert to Azure Functions or your preferred serverless platform
-- 5. RLS Policies: Uncomment and adapt the policies based on your auth system
