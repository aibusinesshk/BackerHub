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
