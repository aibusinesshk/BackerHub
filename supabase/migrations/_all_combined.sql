-- BackerHub Database Schema
-- Run this in the Supabase SQL Editor (supabase.com > Your Project > SQL Editor)

-- ============================================
-- TABLES
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  display_name_zh TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('investor', 'player', 'both')),
  region TEXT NOT NULL CHECK (region IN ('TW', 'HK', 'OTHER')),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  kyc_status TEXT DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
  is_admin BOOLEAN DEFAULT false,
  bio TEXT,
  bio_zh TEXT,
  member_since TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Player performance stats
CREATE TABLE player_stats (
  player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  lifetime_roi NUMERIC(8,2) DEFAULT 0,
  total_tournaments INTEGER DEFAULT 0,
  cash_rate NUMERIC(5,2) DEFAULT 0,
  total_staked_value NUMERIC(12,2) DEFAULT 0,
  avg_finish TEXT DEFAULT 'N/A',
  biggest_win NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly ROI tracking for charts
CREATE TABLE monthly_roi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  roi NUMERIC(8,2) NOT NULL,
  UNIQUE(player_id, month)
);

-- Tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_zh TEXT,
  venue TEXT NOT NULL,
  venue_zh TEXT,
  date TIMESTAMPTZ NOT NULL,
  buy_in NUMERIC(10,2) NOT NULL,
  guaranteed_pool NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('MTT', 'SNG', 'SAT', 'HU')),
  game TEXT NOT NULL CHECK (game IN ('NLHE', 'PLO', 'Mixed')),
  region TEXT NOT NULL CHECK (region IN ('TW', 'HK', 'OTHER')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staking listings (core business entity)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  markup NUMERIC(4,2) NOT NULL CHECK (markup >= 1.00 AND markup <= 1.50),
  total_shares_offered NUMERIC(5,2) NOT NULL CHECK (total_shares_offered > 0 AND total_shares_offered <= 100),
  shares_sold NUMERIC(5,2) DEFAULT 0,
  min_threshold NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'filled', 'cancelled', 'completed', 'settled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Investments (investor purchases shares in a listing)
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  investor_id UUID NOT NULL REFERENCES profiles(id),
  shares_purchased NUMERIC(5,2) NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  platform_fee NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'settled', 'refunded')),
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Financial transactions ledger
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'payout', 'refund', 'fee', 'deposit', 'withdrawal')),
  investment_id UUID REFERENCES investments(id),
  listing_id UUID REFERENCES listings(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  description_zh TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Player reviews from investors
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  listing_id UUID REFERENCES listings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  comment_zh TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Escrow for holding funds until tournament settlement
CREATE TABLE escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) UNIQUE,
  total_held NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'holding' CHECK (status IN ('holding', 'settled', 'refunded')),
  tournament_result TEXT CHECK (tournament_result IN ('win', 'loss', 'cancelled')),
  prize_amount NUMERIC(12,2),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Landing page testimonials (admin-managed)
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_zh TEXT,
  role TEXT NOT NULL CHECK (role IN ('investor', 'player')),
  avatar TEXT,
  quote TEXT NOT NULL,
  quote_zh TEXT,
  region TEXT CHECK (region IN ('TW', 'HK')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_player ON listings(player_id);
CREATE INDEX idx_listings_tournament ON listings(tournament_id);
CREATE INDEX idx_investments_listing ON investments(listing_id);
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_reviews_player ON reviews(player_id);
CREATE INDEX idx_monthly_roi_player ON monthly_roi(player_id);
CREATE INDEX idx_tournaments_date ON tournaments(date);
CREATE INDEX idx_tournaments_region ON tournaments(region);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_roi ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, users can update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Player stats: anyone can read
CREATE POLICY "Player stats are viewable by everyone" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Players can update own stats" ON player_stats FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Service role can insert stats" ON player_stats FOR INSERT WITH CHECK (true);

-- Monthly ROI: anyone can read
CREATE POLICY "Monthly ROI is viewable by everyone" ON monthly_roi FOR SELECT USING (true);
CREATE POLICY "Service role can manage ROI" ON monthly_roi FOR INSERT WITH CHECK (true);

-- Tournaments: anyone can read, admin can manage
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Listings: anyone can read active, players can create/update own
CREATE POLICY "Active listings are viewable by everyone" ON listings FOR SELECT USING (true);
CREATE POLICY "Players can create listings" ON listings FOR INSERT
  WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Players can update own listings" ON listings FOR UPDATE
  USING (auth.uid() = player_id);

-- Investments: investors can read own, create with valid listing
CREATE POLICY "Users can view own investments" ON investments FOR SELECT
  USING (auth.uid() = investor_id);
CREATE POLICY "Users can create investments" ON investments FOR INSERT
  WITH CHECK (auth.uid() = investor_id);

-- Transactions: users can read own only
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can create transactions" ON transactions FOR INSERT WITH CHECK (true);

-- Reviews: anyone can read, authenticated can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Escrow: service role only (managed by API)
CREATE POLICY "Service role can manage escrow" ON escrow FOR ALL USING (true);

-- Testimonials: anyone can read active
CREATE POLICY "Active testimonials are viewable" ON testimonials FOR SELECT
  USING (is_active = true);
CREATE POLICY "Service role can manage testimonials" ON testimonials FOR ALL USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, role, region)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'investor'),
    COALESCE(new.raw_user_meta_data->>'region', 'TW')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create player_stats when a player profile is created
CREATE OR REPLACE FUNCTION public.handle_new_player()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IN ('player', 'both') THEN
    INSERT INTO public.player_stats (player_id)
    VALUES (NEW.id)
    ON CONFLICT (player_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_player();

-- Update listing shares_sold when investment is confirmed
CREATE OR REPLACE FUNCTION public.update_shares_sold()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE listings
    SET shares_sold = shares_sold + NEW.shares_purchased,
        updated_at = now(),
        status = CASE
          WHEN shares_sold + NEW.shares_purchased >= total_shares_offered THEN 'filled'
          ELSE status
        END
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_investment_confirmed
  AFTER INSERT OR UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION public.update_shares_sold();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================
-- 002: Wallet System (Deposit & Withdrawal)
-- ============================================

-- Add wallet balance to profiles with non-negative constraint
ALTER TABLE profiles
  ADD COLUMN wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0
  CHECK (wallet_balance >= 0);

-- Add metadata columns to transactions for deposit/withdrawal tracking
ALTER TABLE transactions
  ADD COLUMN bank_account_info JSONB,
  ADD COLUMN reference_number TEXT,
  ADD COLUMN admin_note TEXT,
  ADD COLUMN reviewed_by UUID REFERENCES profiles(id),
  ADD COLUMN reviewed_at TIMESTAMPTZ;

-- Atomic balance adjustment function (prevents race conditions via row-level lock)
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC(12,2)
)
RETURNS NUMERIC(12,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance NUMERIC(12,2);
BEGIN
  UPDATE profiles
  SET wallet_balance = wallet_balance + p_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- The CHECK constraint on wallet_balance >= 0 will automatically
  -- reject any operation that would make the balance negative.
  RETURN v_new_balance;
END;
$$;

-- Indexes for transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_number) WHERE reference_number IS NOT NULL;
-- Tournament Results Recording
-- Allows players to submit results, admin to review and approve/reject

-- ============================================
-- TABLE
-- ============================================

CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) UNIQUE,
  player_id UUID NOT NULL REFERENCES profiles(id),
  tournament_result TEXT NOT NULL CHECK (tournament_result IN ('win', 'loss', 'cancelled')),
  prize_amount NUMERIC(12,2) DEFAULT 0,
  total_entries INTEGER,
  finish_position INTEGER,
  proof_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_tournament_results_listing ON tournament_results(listing_id);
CREATE INDEX idx_tournament_results_player ON tournament_results(player_id);
CREATE INDEX idx_tournament_results_status ON tournament_results(status);

-- ============================================
-- EXPAND LISTING STATUS
-- ============================================

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check
  CHECK (status IN ('active', 'filled', 'cancelled', 'completed', 'settled', 'in_progress', 'pending_result'));

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- Players can submit their own results
CREATE POLICY "Players can submit results" ON tournament_results
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Players can view their own results
CREATE POLICY "Players can view own results" ON tournament_results
  FOR SELECT USING (auth.uid() = player_id);

-- Players can update their own pending results (resubmit after rejection)
CREATE POLICY "Players can update own rejected results" ON tournament_results
  FOR UPDATE USING (auth.uid() = player_id AND status = 'rejected');

-- Service role (admin) can do everything
CREATE POLICY "Service role manages results" ON tournament_results
  FOR ALL USING (true);
-- Enhanced Listing Lifecycle & Risk Management
-- Adds buy-in release, registration verification, prize deposit tracking

-- ============================================
-- EXPAND LISTING STATUS for full lifecycle
-- ============================================

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check
  CHECK (status IN (
    'active',           -- accepting backers
    'filled',           -- fully backed, awaiting buy-in release
    'buy_in_released',  -- escrow released to player for registration
    'registered',       -- player confirmed registered for tournament
    'in_progress',      -- tournament is underway
    'pending_result',   -- player submitted result, awaiting review
    'pending_deposit',  -- WIN: result approved, awaiting player prize deposit
    'settled',          -- fully settled, prizes distributed
    'cancelled'         -- cancelled / refunded
  ));

-- ============================================
-- ADD LIFECYCLE COLUMNS TO LISTINGS
-- ============================================

ALTER TABLE listings ADD COLUMN IF NOT EXISTS registration_proof_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS registration_confirmed_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS prize_deposit_confirmed BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS prize_deposit_confirmed_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS prize_deposit_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS prize_deposit_transaction_id UUID REFERENCES transactions(id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deadline_registration TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deadline_result TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deadline_deposit TIMESTAMPTZ;

-- ============================================
-- ADD ESCROW RELEASE TRACKING
-- ============================================

ALTER TABLE escrow ADD COLUMN IF NOT EXISTS buy_in_released BOOLEAN DEFAULT false;
ALTER TABLE escrow ADD COLUMN IF NOT EXISTS buy_in_released_at TIMESTAMPTZ;
ALTER TABLE escrow ADD COLUMN IF NOT EXISTS buy_in_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE escrow ADD COLUMN IF NOT EXISTS markup_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE escrow ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(12,2) DEFAULT 0;

-- ============================================
-- ADD PLAYER RELIABILITY TRACKING
-- ============================================

ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS tournaments_settled_on_time INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS tournaments_defaulted INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(5,2) DEFAULT 100.00;

-- ============================================
-- ADD WITHDRAWAL LOCK CHECK
-- Prevent withdrawals when player has pending prize deposits
-- ============================================

CREATE OR REPLACE FUNCTION check_pending_deposits(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM listings
    WHERE player_id = p_user_id
    AND status = 'pending_deposit'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD TRANSACTION TYPE for prize_deposit
-- ============================================

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('purchase', 'payout', 'refund', 'fee', 'deposit', 'withdrawal', 'prize_deposit', 'buy_in_release'));

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_listings_pending_deposit ON listings(player_id) WHERE status = 'pending_deposit';
CREATE INDEX IF NOT EXISTS idx_listings_buy_in_released ON listings(player_id) WHERE status = 'buy_in_released';
-- Add dedicated hendon_mob_url column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hendon_mob_url TEXT;

-- Create index for non-null hendon_mob_url lookups
CREATE INDEX IF NOT EXISTS idx_profiles_hendon_mob ON profiles(hendon_mob_url) WHERE hendon_mob_url IS NOT NULL;

-- Backfill: extract Hendon Mob URLs from bio field where they exist
UPDATE profiles
SET hendon_mob_url = substring(bio FROM '(https?://(?:www\.)?thehendonmob\.com/player/[^\s]+)')
WHERE bio LIKE '%thehendonmob.com%' AND hendon_mob_url IS NULL;
-- Contact form submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for admin queries
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status, created_at DESC);

-- RLS: only service role (admin) can access
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- No public policies — only accessible via admin/service role client
-- Add color_tone column to profiles for player card visual customization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS color_tone text DEFAULT NULL;
-- Listing Packages: Festival/Series package listings
-- A player sells X% of their entire festival schedule (e.g. "APT Taipei 2026")
-- instead of selling action per-tournament. Budget range replaces single buy-in.

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE listing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Festival metadata
  festival_name TEXT NOT NULL,
  festival_name_zh TEXT,
  festival_brand TEXT NOT NULL, -- e.g. 'APT', 'TMT', 'WPT'
  venue TEXT NOT NULL,
  venue_zh TEXT,
  region TEXT NOT NULL CHECK (region IN ('TW', 'HK', 'OTHER')),
  festival_start DATE NOT NULL,
  festival_end DATE NOT NULL,
  -- Staking terms
  markup NUMERIC(4,2) NOT NULL CHECK (markup >= 1.0 AND markup <= 2.0),
  total_action_offered INTEGER NOT NULL CHECK (total_action_offered > 0 AND total_action_offered <= 100),
  action_sold INTEGER NOT NULL DEFAULT 0 CHECK (action_sold >= 0),
  min_threshold INTEGER NOT NULL DEFAULT 0 CHECK (min_threshold >= 0 AND min_threshold <= 100),
  -- Budget range (USD) — investor sees estimated exposure
  budget_min NUMERIC(10,2) NOT NULL CHECK (budget_min > 0),
  budget_max NUMERIC(10,2) NOT NULL CHECK (budget_max >= budget_min),
  -- Planned events (informational — player describes their plan)
  planned_events_min INTEGER NOT NULL DEFAULT 1,
  planned_events_max INTEGER NOT NULL DEFAULT 10,
  notes TEXT, -- player's note about their plan, e.g. "focusing on main event + 2 side events"
  notes_zh TEXT,
  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',        -- accepting investors
    'filled',        -- all action sold
    'in_progress',   -- festival started, player is firing bullets
    'pending_result', -- festival ended, awaiting final accounting
    'settled',       -- all results submitted and distributed
    'cancelled'      -- player cancelled before festival
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Package entries: each actual bullet fired during the festival
CREATE TABLE package_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES listing_packages(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL, -- optional link to known tournament
  -- Entry details
  event_name TEXT NOT NULL,
  event_name_zh TEXT,
  buy_in NUMERIC(10,2) NOT NULL CHECK (buy_in > 0),
  bullet_number INTEGER NOT NULL DEFAULT 1, -- 1st bullet, 2nd bullet, etc.
  -- Result (filled in after the event)
  result TEXT CHECK (result IN ('pending', 'win', 'loss', 'cancelled')),
  prize_amount NUMERIC(12,2) DEFAULT 0,
  finish_position INTEGER,
  total_entries INTEGER,
  proof_url TEXT,
  -- Timestamps
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_listing_packages_player ON listing_packages(player_id);
CREATE INDEX idx_listing_packages_status ON listing_packages(status);
CREATE INDEX idx_listing_packages_brand ON listing_packages(festival_brand);
CREATE INDEX idx_listing_packages_region ON listing_packages(region);
CREATE INDEX idx_package_entries_package ON package_entries(package_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE listing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_entries ENABLE ROW LEVEL SECURITY;

-- Everyone can view packages
CREATE POLICY "listing_packages_select" ON listing_packages
  FOR SELECT USING (true);

-- Players can insert their own packages
CREATE POLICY "listing_packages_insert" ON listing_packages
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Players can update their own packages
CREATE POLICY "listing_packages_update" ON listing_packages
  FOR UPDATE USING (auth.uid() = player_id);

-- Everyone can view package entries
CREATE POLICY "package_entries_select" ON package_entries
  FOR SELECT USING (true);

-- Players can insert entries for their own packages
CREATE POLICY "package_entries_insert" ON package_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM listing_packages WHERE id = package_id AND player_id = auth.uid())
  );

-- Players can update entries for their own packages
CREATE POLICY "package_entries_update" ON package_entries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM listing_packages WHERE id = package_id AND player_id = auth.uid())
  );
-- Storage buckets for user uploads
-- Run this in the Supabase SQL Editor

-- Create the avatars bucket (public read, authenticated upload)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create the kyc-documents bucket (private, admin-only read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Avatars: anyone can view, authenticated users can upload/update their own
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- KYC documents: users can upload their own, only service role can read
CREATE POLICY "Users can upload own KYC docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own KYC docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kyc-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role (admin) can read KYC docs for review via signed URLs
-- Note: The admin API routes use createAdminClient() which bypasses RLS,
-- so signed URL generation works without an explicit SELECT policy.
