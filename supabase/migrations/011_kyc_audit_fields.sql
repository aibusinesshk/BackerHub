-- Add KYC audit fields: approval timestamp, rejection reason, reviewer tracking
-- These enable compliance requirements (5-year record retention) and user-facing rejection reasons

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS kyc_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by UUID REFERENCES auth.users(id);

-- Create audit log for KYC decisions
CREATE TABLE IF NOT EXISTS kyc_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  reviewed_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_kyc_audit_user ON kyc_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_created ON kyc_audit_log(created_at DESC);

-- RLS for audit log: only admins via service role
ALTER TABLE kyc_audit_log ENABLE ROW LEVEL SECURITY;
