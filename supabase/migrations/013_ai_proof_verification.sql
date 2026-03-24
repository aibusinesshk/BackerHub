-- AI Proof Verification
-- Stores AI analysis results for buy-in proof and prize proof screenshots

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-documents', 'proof-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Players can upload their own proof documents
CREATE POLICY "Users can upload own proof docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proof-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own proof docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'proof-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- AI PROOF VERIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ai_proof_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What type of proof this is
  proof_type TEXT NOT NULL CHECK (proof_type IN ('buyin', 'prize')),

  -- Overall AI assessment
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 0-100 confidence
  recommendation TEXT NOT NULL DEFAULT 'manual_review'
    CHECK (recommendation IN ('auto_approve', 'manual_review', 'auto_reject')),
  summary TEXT,

  -- Extracted data from the screenshot
  extracted_tournament_name TEXT,
  extracted_buy_in NUMERIC(12,2),
  extracted_prize_amount NUMERIC(12,2),
  extracted_finish_position INTEGER,
  extracted_total_entries INTEGER,
  extracted_date TEXT,
  extracted_player_name TEXT,

  -- Consistency check: does extracted data match the listing?
  data_consistency_score NUMERIC(5,2),  -- 0-100

  -- Document analysis
  image_analysis JSONB DEFAULT '{}',  -- quality, authenticity scores
  flags JSONB DEFAULT '[]',           -- warning flags

  -- Processing metadata
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  model_used TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_proof_score CHECK (overall_score >= 0 AND overall_score <= 100)
);

CREATE INDEX idx_ai_proof_listing ON ai_proof_verifications(listing_id);
CREATE INDEX idx_ai_proof_user ON ai_proof_verifications(user_id);
CREATE INDEX idx_ai_proof_status ON ai_proof_verifications(status);
CREATE INDEX idx_ai_proof_type ON ai_proof_verifications(proof_type);

ALTER TABLE ai_proof_verifications ENABLE ROW LEVEL SECURITY;

-- Players can view their own proof verifications
CREATE POLICY "Players can view own proof verifications" ON ai_proof_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role manages proof verifications" ON ai_proof_verifications
  FOR ALL USING (true);

-- ============================================
-- ADD PROOF IMAGE REFERENCES TO EXISTING TABLES
-- ============================================

-- Add proof image paths to tournament_results (stored in proof-documents bucket)
ALTER TABLE tournament_results ADD COLUMN IF NOT EXISTS proof_image_paths TEXT[] DEFAULT '{}';
ALTER TABLE tournament_results ADD COLUMN IF NOT EXISTS ai_proof_verification_id UUID REFERENCES ai_proof_verifications(id);

-- Add registration proof image paths to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS registration_proof_image_paths TEXT[] DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS ai_registration_proof_id UUID REFERENCES ai_proof_verifications(id);
