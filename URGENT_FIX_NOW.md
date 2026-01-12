# 🚨 URGENT: Fix RLS Recursion Error

## Current Status
Your server IS running, but the database has RLS policy recursion errors preventing data from loading.

## Error You're Seeing
```
Error fetching opportunities: {
  code: '42P17',
  message: 'infinite recursion detected in policy for relation "profiles"'
}
```

## Quick Fix (5 Minutes)

### Step 1: Go to Supabase SQL Editor
1. Open: https://supabase.com/dashboard
2. Select your project: **gellobit-rss-nextjs**
3. Click **SQL Editor** in left menu

### Step 2: Run the New Fix Script

Copy and paste **ALL** of this file into SQL Editor:
```
apps/web/migrations/004_nuclear_fix_rls.sql
```

Click **Run** (or press Ctrl+Enter)

**What this does:**
- Temporarily disables RLS
- Drops ALL existing policies (no matter what their names are)
- Creates super simple policies that DON'T cause recursion
- Re-enables RLS
- Shows you your user list

### Step 3: Check Your Admin Profile

At the end of the script output, you'll see a table with your users.

**Look for:**
- Your email
- A column called `current_role`

**If `current_role` is empty or says `null`:**

Run this query (replace `<your-user-id>` with your actual ID from the table):

```sql
INSERT INTO profiles (id, role, created_at, updated_at)
VALUES ('<your-user-id>', 'admin', NOW(), NOW())
ON CONFLICT (id)
DO UPDATE SET role = 'admin', updated_at = NOW();
```

**OR** use the quick fix to make the first user admin:

```sql
WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO profiles (id, role, created_at, updated_at)
SELECT id, 'admin', NOW(), NOW() FROM first_user
ON CONFLICT (id)
DO UPDATE SET role = 'admin', updated_at = NOW();
```

### Step 4: Refresh Your Browser

1. The server is already running (no need to restart)
2. Go to: http://localhost:3000
3. Should load WITHOUT errors in console
4. Go to: http://localhost:3000/admin
5. Should show Admin Dashboard (no "Access Denied")

## What Changed

**Old policies (caused recursion):**
- Checked admin role by querying profiles table inside other table policies
- This caused infinite loops

**New policies (no recursion):**
- Service role (API routes) has full access
- Public can read published opportunities
- Authenticated users can read profiles (simple `USING (true)`)
- NO nested queries that cause recursion

## Verify It Worked

**In your browser console (F12):**
- NO more "infinite recursion" errors
- NO more "Access Denied" when you're logged in as admin

**Pages should load:**
- ✅ http://localhost:3000 (homepage with opportunities)
- ✅ http://localhost:3000/admin (admin dashboard)
- ✅ http://localhost:3000/auth (login/signup)

## If Still Having Issues

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Check Supabase logs** in dashboard
3. **Verify the script ran successfully** - should say "COMMIT" at the end
4. **Check if policies were created**:
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

## Next Steps After Fix

Once everything loads correctly:

1. ✅ Test login/logout
2. ✅ Access admin dashboard
3. ✅ Create a test opportunity manually
4. ✅ Add an AI provider (OpenAI, Claude, DeepSeek, or Gemini)
5. ✅ Add an RSS feed
6. ✅ Test the cron endpoint manually

---

**Current Time**: Execute this NOW to fix your site
**Expected Duration**: 5 minutes
**Risk Level**: LOW (script is reversible, we're just rebuilding policies)
