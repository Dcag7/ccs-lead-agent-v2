# 🔒 Login Fix Guide - CCS Lead Agent v2

## Problem Diagnosis

You're experiencing **"Invalid credentials"** error when trying to login with `dumi@ccsapparel.africa` on your Vercel deployment.

### Root Cause

The issue is that your **production database (Neon) is not properly seeded** with the admin user. When you deployed to Vercel, the database was created but the seed script was never run, so the admin user doesn't exist or has an incorrect password hash.

---

## ✅ Solution: Fix the Database

We've created multiple methods to fix this. Choose the one that works best for you:

### Method 1: Use the Admin Reset API Endpoint (EASIEST) ⭐

We've created a special API endpoint that can reset your admin user directly from your browser.

#### Step 1: Add Environment Variable to Vercel

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `ADMIN_RESET_SECRET`
   - **Value**: `CCS_Reset_2025_Secure!` (or any secret phrase you want)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

#### Step 2: Redeploy Your Application

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Click the three dots (⋮) menu
4. Select **Redeploy**
5. Make sure "Use existing Build Cache" is **UNCHECKED**
6. Click **Redeploy**

#### Step 3: Check Database Status

Once redeployment is complete, open this URL in your browser:

```
https://your-vercel-url.vercel.app/api/admin/reset-user
```

You should see something like:

```json
{
  "success": true,
  "databaseConnected": true,
  "adminUserExists": false,
  "adminUser": null,
  "totalUsers": 0
}
```

If `adminUserExists` is `false`, proceed to Step 4.

#### Step 4: Reset the Admin User

Use a tool like **Postman**, **Insomnia**, or **curl** to send a POST request:

**Using curl (PowerShell):**

```powershell
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    secret = "CCS_Reset_2025_Secure!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-vercel-url.vercel.app/api/admin/reset-user" -Method POST -Headers $headers -Body $body
```

**Using Postman:**

1. Create a new POST request
2. URL: `https://your-vercel-url.vercel.app/api/admin/reset-user`
3. Body → raw → JSON:
   ```json
   {
     "secret": "CCS_Reset_2025_Secure!"
   }
   ```
4. Click Send

You should get a response like:

```json
{
  "success": true,
  "message": "Admin user reset successfully",
  "data": {
    "email": "dumi@ccsapparel.africa",
    "name": "Dumi",
    "role": "admin",
    "passwordVerified": true,
    "totalUsers": 1
  }
}
```

#### Step 5: Try Logging In

Now go to your login page and use:
- **Email**: `dumi@ccsapparel.africa`
- **Password**: `Dcs_BD7@`

✅ **Login should now work!**

---

### Method 2: Run Seed Script via Vercel CLI

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
cd C:\Users\dumi\ccs-lead-agent-v2
vercel link

# Run seed command on production
vercel env pull .env.production.local
npm run prisma:seed
```

---

### Method 3: Run Seed Script Locally Pointing to Production DB

1. **Get your production DATABASE_URL from Vercel:**
   - Go to Vercel Dashboard
   - Settings → Environment Variables
   - Copy the `DATABASE_URL` value

2. **Create a `.env.production` file locally:**

   ```bash
   # In your project root
   cd C:\Users\dumi\ccs-lead-agent-v2
   ```

   Create `.env.production`:
   ```env
   DATABASE_URL="your-neon-database-url-from-vercel"
   ```

3. **Run the seed script:**

   ```bash
   # Install dependencies if not already
   npm install

   # Generate Prisma Client
   npm run prisma:generate

   # Run seed pointing to production database
   npm run prisma:seed
   ```

4. **Verify it worked:**
   
   Run the debug script:
   ```bash
   npx tsx scripts/debug-auth.ts
   ```

---

### Method 4: Use Neon Console Directly

1. Login to your Neon dashboard: https://console.neon.tech
2. Go to your CCS Lead Agent database
3. Open the SQL Editor
4. Run this SQL:

```sql
-- First, check if admin user exists
SELECT * FROM "User" WHERE email = 'dumi@ccsapparel.africa';

-- If exists, delete it first
DELETE FROM "User" WHERE email = 'dumi@ccsapparel.africa';

-- Create admin user with bcrypt hash of 'Dcs_BD7@'
-- Note: You need to generate this hash first using bcryptjs
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'dumi@ccsapparel.africa',
  '$2a$10$YourBcryptHashHere',  -- You need to generate this
  'Dumi',
  'admin',
  NOW(),
  NOW()
);
```

**To generate the hash:**

Create a temporary file `hash-password.js`:

```javascript
const bcrypt = require('bcryptjs');

async function hashPassword() {
  const hash = await bcrypt.hash('Dcs_BD7@', 10);
  console.log('Hash:', hash);
}

hashPassword();
```

Run it:
```bash
node hash-password.js
```

Copy the hash and use it in the SQL above.

---

## 🧪 Verification Steps

After applying any fix method:

1. **Test Database Connection:**
   - Visit: `https://your-vercel-url.vercel.app/api/admin/reset-user`
   - Should show `"databaseConnected": true`
   - Should show `"adminUserExists": true`

2. **Test Login:**
   - Go to login page
   - Email: `dumi@ccsapparel.africa`
   - Password: `Dcs_BD7@`
   - Should redirect to dashboard

3. **Check Vercel Logs:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to **Deployments** → Click latest deployment
   - Click **View Function Logs**
   - Try logging in and watch for error messages

---

## 🔍 Common Issues

### Issue: "Unable to acquire lock" error locally

**Cause:** Another instance of `npm run dev` is running.

**Fix:**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Find `node.exe` processes
3. End all node processes
4. Try `npm run dev` again

---

### Issue: Database connection fails

**Cause:** DATABASE_URL is not set correctly in Vercel.

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Verify `DATABASE_URL` is set
3. Make sure it's a valid Neon PostgreSQL connection string
4. Format should be: `postgresql://user:password@host/database?sslmode=require`
5. Redeploy after making changes

---

### Issue: Password still doesn't work after reset

**Cause:** Browser cache or session storage issue.

**Fix:**
1. Clear browser cache and cookies
2. Try in incognito/private window
3. Try a different browser
4. Make sure you're using the exact password: `Dcs_BD7@`
   - Capital D
   - Lowercase cs
   - Underscore
   - Capital BD7
   - @ symbol

---

## 🚀 Next Steps After Login Works

Once you can successfully login:

1. **Secure the Reset Endpoint:**
   - Option A: Delete `/app/api/admin/reset-user/route.ts`
   - Option B: Add IP whitelist or stronger authentication
   - Option C: Disable it via environment variable

2. **Create Additional Users:**
   - Use the dashboard to invite team members
   - Or update the seed script to add more users

3. **Continue Development:**
   - Proceed with Lead Scoring System implementation
   - Set up business logic and integrations
   - Configure CRM connections

---

## 📞 Still Having Issues?

If none of these methods work, please provide:

1. **Screenshot of Vercel Function Logs** (when you try to login)
2. **Screenshot of environment variables** (blur sensitive parts)
3. **Response from** `GET /api/admin/reset-user` endpoint
4. **Any error messages** from browser console (F12 → Console tab)

This will help diagnose the exact issue preventing authentication.

---

## 🎯 Quick Checklist

Before trying to login, verify:

- [ ] DATABASE_URL is set in Vercel environment variables
- [ ] NEXTAUTH_URL is set to your Vercel deployment URL
- [ ] NEXTAUTH_SECRET is set (any random string)
- [ ] ADMIN_RESET_SECRET is set (for API reset method)
- [ ] Latest code is deployed to Vercel
- [ ] Build cache was cleared on redeploy
- [ ] Admin user exists in database (check via GET endpoint)
- [ ] Using exact credentials: `dumi@ccsapparel.africa` / `Dcs_BD7@`

---

**Last Updated:** 2025-11-13
**Version:** 2.0
