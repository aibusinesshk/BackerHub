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
