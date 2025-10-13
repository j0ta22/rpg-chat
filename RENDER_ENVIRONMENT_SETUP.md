# Render Environment Variables Setup

## Problem
The WebSocket server was not saving gold rewards to the database because it was using the anonymous Supabase key instead of the service role key, which doesn't have permission to update the `users` table.

## Solution
The server now uses the `SUPABASE_SERVICE_ROLE_KEY` which has full database access.

## Required Environment Variables in Render

You need to configure these environment variables in your Render dashboard:

### For the WebSocket Server (rpg-chat-server)
1. Go to your Render dashboard
2. Navigate to your `rpg-chat-server` service
3. Go to Environment tab
4. Add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### How to get these values:
1. Go to your Supabase project dashboard
2. Go to Settings > API
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "service_role" key for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Alternative: Using Render's Environment Groups

If you prefer to use environment groups in Render:

1. Create an environment group called `supabase-config`
2. Add the variables there
3. Reference them in your `render.yaml` (already configured)

## Verification

After setting up the environment variables:

1. Redeploy your server
2. Check the server logs for: `✅ Supabase client initialized with service role key`
3. Test a combat to see if gold rewards are saved
4. Refresh the page to verify gold persists

## Security Note

The `SUPABASE_SERVICE_ROLE_KEY` has full database access. Never expose this key in client-side code or public repositories.
