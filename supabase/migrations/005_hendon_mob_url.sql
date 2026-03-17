-- Add dedicated hendon_mob_url column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hendon_mob_url TEXT;

-- Create index for non-null hendon_mob_url lookups
CREATE INDEX IF NOT EXISTS idx_profiles_hendon_mob ON profiles(hendon_mob_url) WHERE hendon_mob_url IS NOT NULL;

-- Backfill: extract Hendon Mob URLs from bio field where they exist
UPDATE profiles
SET hendon_mob_url = substring(bio FROM '(https?://(?:www\.)?thehendonmob\.com/player/[^\s]+)')
WHERE bio LIKE '%thehendonmob.com%' AND hendon_mob_url IS NULL;
