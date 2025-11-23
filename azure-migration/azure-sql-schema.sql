-- ========================================
-- AZURE SQL SERVER SCHEMA CONVERSION
-- Converted from PostgreSQL to T-SQL
-- ========================================

-- ========================================
-- 1. ENUMS (Converted to Lookup Tables)
-- ========================================

-- Azure SQL doesn't support ENUMs, use lookup tables instead
CREATE TABLE app_roles (
    role_name NVARCHAR(50) PRIMARY KEY,
    description NVARCHAR(255) NULL
);

INSERT INTO app_roles (role_name, description) VALUES 
    ('admin', 'Administrator with full access'),
    ('user', 'Standard user with basic access');

-- ========================================
-- 2. MAIN TABLES
-- ========================================

-- Profiles table
CREATE TABLE profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    email NVARCHAR(255) NULL,
    display_name NVARCHAR(255) NULL,
    avatar_url NVARCHAR(2048) NULL,
    bio NVARCHAR(MAX) NULL,
    
    -- Add index for email lookups
    INDEX IX_profiles_email NONCLUSTERED (email)
);

-- Theme configuration table
CREATE TABLE theme_config (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    config_key NVARCHAR(100) NOT NULL UNIQUE,
    config_value NVARCHAR(MAX) NOT NULL,
    
    -- Add index for config_key lookups
    INDEX IX_theme_config_key NONCLUSTERED (config_key)
);

-- User roles table
CREATE TABLE user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'user',
    
    -- Foreign key to profiles
    CONSTRAINT FK_user_roles_profiles FOREIGN KEY (user_id) 
        REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Foreign key to app_roles lookup
    CONSTRAINT FK_user_roles_app_roles FOREIGN KEY (role) 
        REFERENCES app_roles(role_name),
    
    -- Ensure user can only have each role once
    CONSTRAINT UQ_user_roles_user_role UNIQUE (user_id, role),
    
    -- Add index for user_id lookups
    INDEX IX_user_roles_user_id NONCLUSTERED (user_id)
);

-- ========================================
-- 3. FUNCTIONS
-- ========================================

-- Function to check if a user has a specific role
CREATE OR ALTER FUNCTION dbo.has_role (
    @user_id UNIQUEIDENTIFIER,
    @role NVARCHAR(50)
)
RETURNS BIT
AS
BEGIN
    DECLARE @has_role BIT = 0;
    
    IF EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = @user_id AND role = @role
    )
        SET @has_role = 1;
    
    RETURN @has_role;
END;
GO

-- ========================================
-- 4. TRIGGERS
-- ========================================

-- Trigger to update updated_at timestamp on theme_config
CREATE OR ALTER TRIGGER trg_theme_config_update
ON theme_config
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE theme_config
    SET updated_at = SYSDATETIMEOFFSET()
    FROM theme_config tc
    INNER JOIN inserted i ON tc.id = i.id;
END;
GO

-- ========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on Azure SQL Server
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create security predicate function for profiles
CREATE OR ALTER FUNCTION dbo.fn_profiles_security_predicate(@user_id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN (
    SELECT 1 AS result
    WHERE @user_id = CAST(SESSION_CONTEXT(N'user_id') AS UNIQUEIDENTIFIER)
);
GO

-- Create security policy for profiles (users can only see their own)
CREATE SECURITY POLICY profiles_security_policy
    ADD FILTER PREDICATE dbo.fn_profiles_security_predicate(id)
    ON dbo.profiles,
    ADD BLOCK PREDICATE dbo.fn_profiles_security_predicate(id)
    ON dbo.profiles AFTER UPDATE;
GO

-- Create security predicate function for user_roles
CREATE OR ALTER FUNCTION dbo.fn_user_roles_security_predicate(@user_id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN (
    SELECT 1 AS result
    WHERE @user_id = CAST(SESSION_CONTEXT(N'user_id') AS UNIQUEIDENTIFIER)
        OR dbo.has_role(CAST(SESSION_CONTEXT(N'user_id') AS UNIQUEIDENTIFIER), 'admin') = 1
);
GO

-- Create security policy for user_roles
CREATE SECURITY POLICY user_roles_security_policy
    ADD FILTER PREDICATE dbo.fn_user_roles_security_predicate(user_id)
    ON dbo.user_roles;
GO

-- Theme config is public for read, admin only for write
CREATE OR ALTER FUNCTION dbo.fn_theme_config_write_predicate(@id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN (
    SELECT 1 AS result
    WHERE dbo.has_role(CAST(SESSION_CONTEXT(N'user_id') AS UNIQUEIDENTIFIER), 'admin') = 1
);
GO

CREATE SECURITY POLICY theme_config_security_policy
    ADD BLOCK PREDICATE dbo.fn_theme_config_write_predicate(id)
    ON dbo.theme_config AFTER INSERT,
    ADD BLOCK PREDICATE dbo.fn_theme_config_write_predicate(id)
    ON dbo.theme_config AFTER UPDATE;
GO

-- ========================================
-- 6. SAMPLE DATA
-- ========================================

-- Insert sample admin user (you'll need to create this after setting up auth)
-- DECLARE @admin_id UNIQUEIDENTIFIER = NEWID();
-- INSERT INTO profiles (id, email, display_name) 
-- VALUES (@admin_id, 'admin@example.com', 'System Admin');
-- INSERT INTO user_roles (user_id, role) 
-- VALUES (@admin_id, 'admin');

-- ========================================
-- NOTES
-- ========================================

-- 1. SESSION_CONTEXT: Use EXEC sp_set_session_context N'user_id', @user_id; 
--    to set the current user's ID for RLS to work
-- 2. Connection String Format:
--    Server=tcp:your-server.database.windows.net,1433;
--    Database=your-database;
--    User ID=your-username;
--    Password=your-password;
--    Encrypt=true;
--    TrustServerCertificate=false;
-- 3. Remember to configure firewall rules in Azure Portal
