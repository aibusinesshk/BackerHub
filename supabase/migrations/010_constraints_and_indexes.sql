-- 010: Add missing constraints, indexes, and audit columns
-- Addresses data consistency, performance, and audit trail gaps

-- ============================================
-- CONSTRAINTS — prevent overselling
-- ============================================

-- Ensure shares_sold never exceeds total_shares_offered
ALTER TABLE listings
  ADD CONSTRAINT chk_shares_sold_limit
  CHECK (shares_sold <= total_shares_offered);

-- Ensure action_sold never exceeds total_action_offered
ALTER TABLE listing_packages
  ADD CONSTRAINT chk_action_sold_limit
  CHECK (action_sold <= total_action_offered);

-- Ensure festival_start <= festival_end
ALTER TABLE listing_packages
  ADD CONSTRAINT chk_festival_dates
  CHECK (festival_start <= festival_end);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Player dashboard: listings by player + status
CREATE INDEX IF NOT EXISTS idx_listings_player_status
  ON listings(player_id, status);

-- Investor dashboard: investments by investor + status
CREATE INDEX IF NOT EXISTS idx_investments_investor_status
  ON investments(investor_id, status);

-- Settlement queries: escrow by status
CREATE INDEX IF NOT EXISTS idx_escrow_status
  ON escrow(status);

-- Paginated transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON transactions(user_id, created_at DESC);

-- Package settlement: entries by package + result
CREATE INDEX IF NOT EXISTS idx_package_entries_package_result
  ON package_entries(package_id, result);

-- Tournament results admin dashboard
CREATE INDEX IF NOT EXISTS idx_tournament_results_status_player
  ON tournament_results(status, player_id);

-- ============================================
-- AUDIT TRAIL — track who changed sensitive records
-- ============================================

-- Add audit columns to profiles for KYC/wallet changes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ;

-- Add audit columns to escrow for settlement tracking
ALTER TABLE escrow
  ADD COLUMN IF NOT EXISTS settled_by UUID REFERENCES profiles(id);

-- ============================================
-- AUDIT LOG TABLE — record sensitive operations
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),          -- who performed the action
  target_user_id UUID REFERENCES profiles(id),    -- who was affected
  action TEXT NOT NULL,                            -- e.g. 'kyc_approve', 'wallet_adjust', 'escrow_settle'
  entity_type TEXT NOT NULL,                       -- e.g. 'profile', 'escrow', 'transaction'
  entity_id UUID,                                  -- the affected row's ID
  details JSONB,                                   -- additional context
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_target ON audit_log(target_user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- RLS: only admins and service role can access audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_select" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "audit_log_service_all" ON audit_log
  FOR ALL USING (auth.role() = 'service_role');
