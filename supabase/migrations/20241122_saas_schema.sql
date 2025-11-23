-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('basic', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update profiles table (add columns if they don't exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS plano subscription_plan DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';

-- Update faculdades table
ALTER TABLE faculdades
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculdades ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super Admin full access profiles" ON public.profiles;
CREATE POLICY "Super Admin full access profiles" ON public.profiles
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Faculdades
DROP POLICY IF EXISTS "Admin manage own faculdades" ON faculdades;
CREATE POLICY "Admin manage own faculdades" ON faculdades
FOR ALL USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Super Admin full access faculdades" ON faculdades;
CREATE POLICY "Super Admin full access faculdades" ON faculdades
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Function to handle new user creation (optional, if you want to auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, plano)
  VALUES (new.id, new.email, 'admin', 'basic');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user (uncomment if needed)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
