-- ============================================================
-- FinanceTracker — Safe Migration (run this in Supabase SQL Editor)
-- Safe to re-run: drops existing policies before recreating them
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: user_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  monthly_budget NUMERIC(12,2) DEFAULT 0,
  alert_threshold INTEGER DEFAULT 80,
  cash_balance NUMERIC(12,2) DEFAULT 0,
  upi_balance NUMERIC(12,2) DEFAULT 0,
  card_balance NUMERIC(12,2) DEFAULT 0,
  savings_goal_name TEXT,
  savings_target_amount NUMERIC(12,2) DEFAULT 0,
  savings_current_amount NUMERIC(12,2) DEFAULT 0,
  savings_target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add wallet columns if table already existed without them
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS cash_balance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS upi_balance  NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS card_balance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS alert_threshold INTEGER DEFAULT 80;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS savings_goal_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS savings_target_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS savings_current_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS savings_target_date DATE;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"   ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  default_type TEXT NOT NULL CHECK (default_type IN ('necessary', 'unnecessary')),
  color TEXT DEFAULT '#6B7280',
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Step 1: Safely remove duplicate categories
-- Strategy: keep the first-inserted row (survivor), discard the rest.
-- Duplicate budgets referencing extras are DELETED (they're redundant).
-- Transactions are remapped to the survivor.
DO $$
DECLARE
  survivor UUID;
  cat_name TEXT;
BEGIN
  FOR cat_name IN
    SELECT name FROM public.categories GROUP BY name HAVING COUNT(*) > 1
  LOOP
    -- Identify the survivor (earliest inserted)
    SELECT id INTO survivor
    FROM public.categories
    WHERE name = cat_name
    ORDER BY ctid
    LIMIT 1;

    -- Delete duplicate budget rows pointing to non-survivor category IDs
    -- (cannot remap — would violate unique constraint on user_id+category_id+month+year)
    DELETE FROM public.budgets
    WHERE category_id IN (
      SELECT id FROM public.categories
      WHERE name = cat_name AND id <> survivor
    );

    -- Remap transactions to the survivor (no unique constraint, safe to update)
    UPDATE public.transactions
    SET category_id = survivor
    WHERE category_id IN (
      SELECT id FROM public.categories
      WHERE name = cat_name AND id <> survivor
    );

    -- Now safely delete the extra category rows
    DELETE FROM public.categories
    WHERE name = cat_name AND id <> survivor;
  END LOOP;
END;
$$;

-- Step 2: Add unique constraint now that duplicates are gone
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);

INSERT INTO public.categories (name, icon, default_type, color, sort_order) VALUES
  ('Food',          '🍕', 'unnecessary', '#F97316', 1),
  ('Transport',     '🚗', 'necessary',   '#3B82F6', 2),
  ('Shopping',      '🛍️', 'unnecessary', '#A855F7', 3),
  ('Rent',          '🏠', 'necessary',   '#22C55E', 4),
  ('Health',        '💊', 'necessary',   '#EF4444', 5),
  ('Entertainment', '🎬', 'unnecessary', '#F59E0B', 6),
  ('Subscriptions', '📱', 'unnecessary', '#EC4899', 7),
  ('Other',         '📦', 'necessary',   '#6B7280', 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLE: transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('necessary', 'unnecessary')),
  note TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'card')) DEFAULT 'upi',
  merchant_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions"   ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"   ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category   ON public.transactions(category_id);

-- ============================================================
-- TABLE: budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  limit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category_id, month, year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own budgets"   ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;

CREATE POLICY "Users can view own budgets"   ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
