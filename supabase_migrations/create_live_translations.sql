-- ═══════════════════════════════════════════════════════════
-- Live Translations Table for ClassTwin Lingua
-- ═══════════════════════════════════════════════════════════
-- This table stores real-time translations of teacher speech.
-- The backend inserts rows here when the teacher speaks,
-- and the Flutter student app listens via Supabase Realtime.

CREATE TABLE IF NOT EXISTS live_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  source_lang TEXT NOT NULL DEFAULT 'en',
  translations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast session lookups + ordering
CREATE INDEX idx_live_translations_session_created
  ON live_translations (session_id, created_at DESC);

-- Enable Realtime on this table so Flutter clients can listen
ALTER PUBLICATION supabase_realtime ADD TABLE live_translations;

-- RLS: Allow authenticated users to read translations for their session
ALTER TABLE live_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read translations for their session"
  ON live_translations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_students ss
      WHERE ss.session_id = live_translations.session_id
    )
  );

-- Allow the backend (service_role) to insert translations
CREATE POLICY "Backend can insert translations"
  ON live_translations
  FOR INSERT
  WITH CHECK (true);

-- Cleanup: auto-delete translations older than 24 hours (optional cron job)
-- You can set up a pg_cron job or Supabase Edge Function for this.
-- For now, translations persist until the session is deleted (CASCADE).
