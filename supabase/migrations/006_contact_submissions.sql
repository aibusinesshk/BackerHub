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
