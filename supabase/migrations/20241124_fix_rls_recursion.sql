-- Migration: Fix Infinite Recursion in RLS Policies
-- Description: Fix circular dependency in is_super_admin() and user_owns_faculdade() functions

-- Recreate is_super_admin() function with SECURITY DEFINER to bypass RLS
-- Using CREATE OR REPLACE to avoid dropping dependencies
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Query profiles table without triggering RLS
  -- SECURITY DEFINER allows this function to bypass RLS
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If profiles table doesn't exist or any error, return false
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also recreate user_owns_faculdade with better error handling
CREATE OR REPLACE FUNCTION user_owns_faculdade(faculdade_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM faculdades 
    WHERE id = faculdade_uuid 
    AND admin_id = auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Disable RLS on profiles to prevent recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
