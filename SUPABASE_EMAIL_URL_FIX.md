# Supabase Email URL Configuration Fix

## Problem
Your Supabase is generating email verification URLs that point to your API (`https://api.arzansite.com`) instead of your frontend (`https://arzansite.com`).

## Solution

### 1. ✅ **Already Fixed: Updated `supabase/config.toml`**

I've already updated your `supabase/config.toml` file with the correct configuration:

```toml
[auth]
enabled = true
port = 54327
site_url = "https://arzansite.com"
additional_redirect_urls = [
  "https://arzansite.com",
  "http://localhost:5173",
  "http://localhost:3000"
]

# Email URL Configuration - This is the key fix!
[auth.email.template]
confirm_signup = "https://arzansite.com/auth/verify-email"
invite = "https://arzansite.com/auth/verify-email"
recovery = "https://arzansite.com/auth/verify-email"
email_change = "https://arzansite.com/auth/verify-email"
magic_link = "https://arzansite.com/auth/verify-email"
```

### 2. **Create Environment Variables File**

Create a file called `.env` in your `supabase/` directory with these contents:

```bash
# Supabase Email URL Configuration
# These environment variables tell Supabase to use your frontend URLs for email verification

# Production URLs (for when users access from arzansite.com)
MAILER_URLPATHS_CONFIRMATION=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_INVITE=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_RECOVERY=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_EMAIL_CHANGE=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_MAGIC_LINK=https://arzansite.com/auth/verify-email

# Development URLs (for when testing from localhost)
# Uncomment these for local development testing
# MAILER_URLPATHS_CONFIRMATION=http://localhost:5173/auth/verify-email
# MAILER_URLPATHS_INVITE=http://localhost:5173/auth/verify-email
# MAILER_URLPATHS_RECOVERY=http://localhost:5173/auth/verify-email
# MAILER_URLPATHS_EMAIL_CHANGE=http://localhost:5173/auth/verify-email
# MAILER_URLPATHS_MAGIC_LINK=http://localhost:5173/auth/verify-email

# Site URL Configuration
SITE_URL=https://arzansite.com
ADDITIONAL_REDIRECT_URLS=https://arzansite.com,http://localhost:5173,http://localhost:3000
```

### 3. **Deploy the Changes**

After making these changes, you need to deploy them to your Dokploy Supabase instance:

```bash
# If using Supabase CLI
supabase db push

# Or restart your Supabase services in Dokploy dashboard
```

### 4. **Alternative: Dokploy Dashboard Configuration**

If you're using Dokploy, you can also set these environment variables directly in the Dokploy dashboard:

1. Go to your Dokploy dashboard
2. Find your Supabase service
3. Go to Environment Variables
4. Add these variables:

```
MAILER_URLPATHS_CONFIRMATION=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_INVITE=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_RECOVERY=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_EMAIL_CHANGE=https://arzansite.com/auth/verify-email
MAILER_URLPATHS_MAGIC_LINK=https://arzansite.com/auth/verify-email
SITE_URL=https://arzansite.com
```

### 5. **Test the Configuration**

After deploying the changes:

1. **Test signup flow**: Register a new user
2. **Check email URL**: The confirmation email should now contain:
   ```
   https://arzansite.com/auth/verify-email?token=...&type=signup&redirect_to=https://arzansite.com
   ```
   Instead of:
   ```
   https://api.arzansite.com/auth/verify-email?token=...&type=signup&redirect_to=https://api.arzansite.com
   ```

3. **Test magic link**: Send a magic link and verify the URL

## Key Points

### Why This Happens
- Supabase uses the `site_url` and `MAILER_URLPATHS_*` variables to generate email verification URLs
- By default, it uses the API URL if these aren't explicitly configured
- You need to explicitly tell Supabase to use your frontend URLs

### The Fix
- **`site_url`**: Sets the base URL for your application
- **`[auth.email.template]`**: Configures specific email template URLs
- **`MAILER_URLPATHS_*`**: Environment variables that override the default email URLs

### Development vs Production
- For production: Use `https://arzansite.com`
- For development: Use `http://localhost:5173`
- You can switch between them by updating the environment variables

## Verification Checklist

- [ ] Updated `supabase/config.toml` with correct `site_url`
- [ ] Added `[auth.email.template]` section
- [ ] Created `.env` file with `MAILER_URLPATHS_*` variables
- [ ] Deployed changes to Dokploy
- [ ] Tested signup flow
- [ ] Verified email URLs point to frontend
- [ ] Tested magic link flow

After completing these steps, your email verification should work correctly with URLs pointing to your frontend application!
