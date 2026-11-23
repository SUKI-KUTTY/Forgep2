-- ============================================================================
-- KAVERI SILKS — SUPABASE POSTGRESQL SCHEMA, RLS POLICIES & STORAGE SETUP
-- Run this entire script inside the Supabase SQL Editor.
-- Replace 'admin@kaverisilks.in' with your NEXT_PUBLIC_ADMIN_EMAIL / VITE_ADMIN_EMAIL.
-- ============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE 1: products
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('Bridal Silks', 'Designer Kurtis', 'Aari Blouses', 'Lehengas')
  ),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  sizes TEXT[] NOT NULL DEFAULT ARRAY['Free Size'],
  image_url TEXT NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read access for storefront visitors
CREATE POLICY "Public can view boutique products"
  ON public.products
  FOR SELECT
  USING (true);

-- Admin-only insert, update, delete (checks JWT email claim)
CREATE POLICY "Admin can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kaverisilks.in');

CREATE POLICY "Admin can update products"
  ON public.products
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'admin@kaverisilks.in')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kaverisilks.in');

CREATE POLICY "Admin can delete products"
  ON public.products
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'admin@kaverisilks.in');


-- ============================================================================
-- TABLE 2: profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  saved_address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  pincode TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Customers can read & update their own profile; Admin can view all profiles
CREATE POLICY "Users can view own profile or admin views all"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'email') = 'admin@kaverisilks.in'
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ============================================================================
-- TABLE 3: orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'COD')),
  upi_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Confirmed', 'Shipped', 'Delivered')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders; Admin can view all orders
CREATE POLICY "Customers view own orders or admin views all"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'email') = 'admin@kaverisilks.in'
  );

-- Customers can place orders only for their own user_id
CREATE POLICY "Authenticated customers can insert own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can update order status
CREATE POLICY "Admin can update order status"
  ON public.orders
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'admin@kaverisilks.in')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kaverisilks.in');


-- ============================================================================
-- STORAGE BUCKET: product-images
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() ->> 'email') = 'admin@kaverisilks.in'
  );

CREATE POLICY "Admin can delete product images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() ->> 'email') = 'admin@kaverisilks.in'
  );


-- ============================================================================
-- TABLE 4: reviews (Verified Buyer Product Reviews)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone browsing the storefront can read verified customer reviews
CREATE POLICY "Public can view product reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Authenticated users can insert a review ONLY if they have ordered this product
CREATE POLICY "Verified buyers can insert reviews for ordered products"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.user_id = auth.uid()
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(o.items) AS item
          WHERE item->>'product_id' = reviews.product_id::text
        )
    )
  );

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
-- TABLE 5: watchlist (Customer Saved Items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON public.watchlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist"
  ON public.watchlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlist"
  ON public.watchlist
  FOR DELETE
  USING (auth.uid() = user_id);

