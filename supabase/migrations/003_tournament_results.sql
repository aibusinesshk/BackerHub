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
