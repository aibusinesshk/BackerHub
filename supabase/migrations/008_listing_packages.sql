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
