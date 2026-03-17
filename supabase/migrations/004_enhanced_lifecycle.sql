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
