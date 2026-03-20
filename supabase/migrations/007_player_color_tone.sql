-- Add color_tone column to profiles for player card visual customization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS color_tone text DEFAULT NULL;
