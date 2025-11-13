# 🚨 QUICK FIX - Login Issue on Vercel

## The Problem

Your Vercel deployment shows **"Invalid credentials"** because the production database was **never seeded** with the admin user.

## The Fastest Solution (5 minutes)

### Step 1: Add Secret to Vercel
1. Go to https://vercel.com → Your Project
2. **Settings** → **Environment Variables**
3. Add new variable:
   - Name: `ADMIN_RESET_SECRET`
   - Value: `CCS_Reset_2025_Secure!`
   - Select all environments
4. Click **Save**

### Step 2: Redeploy
1. **Deployments** tab
2. Click latest deployment → Three dots (⋮) → **Redeploy**
3. **UNCHECK** "Use existing Build Cache"
4. Click **Redeploy**
5. Wait for deployment to complete

### Step 3: Reset Admin User

Open PowerShell and run:

```powershell
$headers = @{"Content-Type" = "application/json"}
$body = @{secret = "CCS_Reset_2025_Secure!"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://YOUR-VERCEL-URL/api/admin/reset-user" -Method POST -Headers $headers -Body $body
```

Replace `YOUR-VERCEL-URL` with your actual Vercel deployment URL (from the screenshot: `ccs-lead-agent-ocz8mkoxm-dumis-projects-6fa6c193.vercel.app`)

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin user reset successfully",
  "data": {
    "email": "dumi@ccsapparel.africa",
    "passwordVerified": true
  }
}
```

### Step 4: Login
Go to your login page and use:
- Email: `dumi@ccsapparel.africa`
- Password: `Dcs_BD7@`

✅ **Should work now!**

---

## Alternative: Pull Latest Code & Follow Guide

If the above doesn't work:

```bash
cd C:\Users\dumi\ccs-lead-agent-v2
git pull origin main
```

Then read `docs/LOGIN_FIX_GUIDE.md` for 3 other methods.

---

## What Was Fixed

I've pushed to your repo:
- ✅ API endpoint to reset admin user: `/app/api/admin/reset-user/route.ts`
- ✅ Debug script: `/scripts/debug-auth.ts`
- ✅ Comprehensive guide: `/docs/LOGIN_FIX_GUIDE.md`

All code is committed and pushed to GitHub.

---

## Need Help?

If this doesn't work, provide:
1. Screenshot of PowerShell command output
2. Screenshot of Vercel Function Logs (during login attempt)
3. Your Vercel deployment URL

**Current Status:** Ready to fix - just follow steps above! 🚀
