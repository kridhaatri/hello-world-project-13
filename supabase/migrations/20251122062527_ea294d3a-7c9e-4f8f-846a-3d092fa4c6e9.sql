-- Fix infinite recursion in user_roles RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Recreate it using the has_role function which bypasses RLS
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL
USING (public.has_role('admin'::app_role, auth.uid()));