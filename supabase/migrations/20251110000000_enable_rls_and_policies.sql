-- ============================================================================
-- Migration: Enable RLS and Create Auth Policies
-- Date: 2025-11-10
-- Description:
--   - Enables Row Level Security on all tables
--   - Creates policies for authenticated users to access only their own data
--   - Follows the auth-spec.md and TODO.md requirements
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on all tables
-- ============================================================================

-- Enable RLS on flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Enable RLS on generations
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on generation_error_logs
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Remove test comments (if they exist)
COMMENT ON TABLE flashcards IS NULL;
COMMENT ON TABLE generations IS NULL;
COMMENT ON TABLE generation_error_logs IS NULL;

-- ============================================================================
-- STEP 2: Drop existing policies (if any)
-- ============================================================================

-- Drop flashcards policies if they exist
DROP POLICY IF EXISTS "Users can view their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can update their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can delete their own flashcards" ON flashcards;

-- Drop generations policies if they exist
DROP POLICY IF EXISTS "Users can view their own generations" ON generations;
DROP POLICY IF EXISTS "Users can insert their own generations" ON generations;
DROP POLICY IF EXISTS "Users can update their own generations" ON generations;
DROP POLICY IF EXISTS "Users can delete their own generations" ON generations;

-- Drop generation_error_logs policies if they exist
DROP POLICY IF EXISTS "Users can view their own error logs" ON generation_error_logs;
DROP POLICY IF EXISTS "Users can insert their own error logs" ON generation_error_logs;

-- ============================================================================
-- STEP 3: Create Flashcards Policies
-- ============================================================================

-- Users can view only their own flashcards
CREATE POLICY "Users can view their own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own flashcards
CREATE POLICY "Users can insert their own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own flashcards
CREATE POLICY "Users can update their own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own flashcards
CREATE POLICY "Users can delete their own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: Create Generations Policies
-- ============================================================================

-- Users can view only their own generations
CREATE POLICY "Users can view their own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own generations
CREATE POLICY "Users can insert their own generations"
ON generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own generations
CREATE POLICY "Users can update their own generations"
ON generations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own generations (if needed)
CREATE POLICY "Users can delete their own generations"
ON generations FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: Create Generation Error Logs Policies
-- ============================================================================

-- Users can view only their own error logs
CREATE POLICY "Users can view their own error logs"
ON generation_error_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own error logs
CREATE POLICY "Users can insert their own error logs"
ON generation_error_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Note: Usually no UPDATE/DELETE policies for logs (append-only)

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ============================================================================

-- To verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- To verify policies exist:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public';

-- ============================================================================
-- NOTES
-- ============================================================================

-- After running this migration:
-- 1. All API endpoints must use auth.uid() or getAuthenticatedUserId()
-- 2. TEST_USER_ID (00000000-0000-0000-0000-000000000000) will no longer work
-- 3. Users can only access their own data
-- 4. Anonymous access is NOT allowed
-- 5. Test by logging in and trying to access data

-- To test with a specific user:
-- SELECT auth.uid(); -- Should return your user ID when logged in
-- SELECT * FROM flashcards; -- Should only return your flashcards
