-- ============================================
-- Verify and Fix Admin User
-- ============================================

-- STEP 1: Check your authenticated user ID
-- Copy the ID from the result of this query
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- STEP 2: Check if profile exists for your user
-- Replace <your-user-id> with the ID from Step 1
-- SELECT * FROM profiles WHERE id = '<your-user-id>';

-- STEP 3: If profile doesn't exist OR role is not 'admin', run this:
-- Replace <your-user-id> with your actual user ID
-- INSERT INTO profiles (id, role, created_at, updated_at)
-- VALUES ('<your-user-id>', 'admin', NOW(), NOW())
-- ON CONFLICT (id)
-- DO UPDATE SET
--   role = 'admin',
--   updated_at = NOW();

-- STEP 4: Verify the update worked
-- SELECT id, role, created_at FROM profiles WHERE role = 'admin';


-- ============================================
-- Quick Fix: Make the FIRST user an admin
-- ============================================
-- This will automatically set the first registered user as admin
-- ONLY run this if you want the first user to be admin:

-- WITH first_user AS (
--   SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
-- )
-- INSERT INTO profiles (id, role, created_at, updated_at)
-- SELECT id, 'admin', NOW(), NOW() FROM first_user
-- ON CONFLICT (id)
-- DO UPDATE SET role = 'admin', updated_at = NOW();


-- ============================================
-- Verification Query - Run this at the end
-- ============================================
SELECT
  u.id,
  u.email,
  p.role,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
