-- ============================================================
-- Enable Realtime for all CNP CRM tables
-- Run once in Supabase SQL Editor
-- ============================================================

-- Add tables to the supabase_realtime publication
-- (Safe to re-run; ignores tables already added)

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers',
    'products',
    'orders',
    'call_logs',
    'shipping_profiles',
    'history_logs',
    'grade_settings',
    'profiles'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      RAISE NOTICE 'Added % to realtime', t;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE '% already in realtime publication', t;
    END;
  END LOOP;
END $$;

-- Verify
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
