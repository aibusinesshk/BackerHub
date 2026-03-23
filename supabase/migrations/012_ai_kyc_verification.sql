-- AI KYC Verification Results
-- Stores the output of AI-powered document analysis for KYC submissions

CREATE TABLE IF NOT EXISTS ai_kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Overall assessment
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 0-100 confidence score
  recommendation TEXT NOT NULL DEFAULT 'manual_review',  -- 'auto_approve', 'manual_review', 'auto_reject'
  summary TEXT,  -- Brief AI summary of findings

  -- Document analysis results (JSONB for flexibility)
  id_front_analysis JSONB DEFAULT '{}',
  id_back_analysis JSONB DEFAULT '{}',
  selfie_analysis JSONB DEFAULT '{}',
  address_proof_analysis JSONB DEFAULT '{}',

  -- Extracted data
  extracted_name TEXT,
  extracted_id_number TEXT,
  extracted_dob TEXT,
  extracted_address TEXT,
  extracted_doc_type TEXT,  -- passport, national_id, drivers_license, etc.
  extracted_doc_expiry TEXT,

  -- Face matching
  face_match_score NUMERIC(5,2),  -- 0-100 confidence of selfie matching ID photo

  -- Flags / issues
  flags JSONB DEFAULT '[]',  -- Array of warning flags found

  -- Processing metadata
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  model_used TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_recommendation CHECK (recommendation IN ('auto_approve', 'manual_review', 'auto_reject')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT valid_score CHECK (overall_score >= 0 AND overall_score <= 100)
);

-- Indexes
CREATE INDEX idx_ai_kyc_user ON ai_kyc_verifications(user_id);
CREATE INDEX idx_ai_kyc_status ON ai_kyc_verifications(status);
CREATE INDEX idx_ai_kyc_created ON ai_kyc_verifications(created_at DESC);

-- RLS: admin-only via service role
ALTER TABLE ai_kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Add AI verification reference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_kyc_verification_id UUID REFERENCES ai_kyc_verifications(id);
