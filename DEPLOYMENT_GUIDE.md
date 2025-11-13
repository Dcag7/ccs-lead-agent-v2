
# 🚀 CCS Lead Agent v2 - Deployment Guide

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy the `.env` file or create one with:
```env
DATABASE_URL="postgresql://neondb_owner:npg_LylZ2UXRmfq4@ep-bitter-mode-agugkcbt-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="5Iy3daVb6OMa5zAKcYUDS67CXf9fvsZ7XNmONauBnZ4="
```

### 3. Set Up Database
```bash
npm run db:setup
```

This command will:
- Push the Prisma schema to your database
- Seed the database with admin and test users

### 4. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Fix: React hydration error and authentication"
git push origin main
```

### Step 2: Configure Vercel

1. **Go to your Vercel project settings**
2. **Add Environment Variables:**
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_LylZ2UXRmfq4@ep-bitter-mode-agugkcbt-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   
   NEXTAUTH_URL=https://your-vercel-domain.vercel.app
   
   NEXTAUTH_SECRET=5Iy3daVb6OMa5zAKcYUDS67CXf9fvsZ7XNmONauBnZ4=
   ```

3. **Important Vercel Settings:**
   - ✅ Framework Preset: **Next.js**
   - ✅ Root Directory: **Leave blank** (or specify if needed)
   - ✅ Build Command: `npm run build`
   - ✅ Install Command: `npm install`

4. **Build Settings:**
   - ⚠️ **Disable Build Cache** for first deployment
   - Settings → General → "Use existing build cache" → **OFF**

### Step 3: Trigger Deployment

**Option A: From Vercel Dashboard**
1. Go to Deployments tab
2. Click "Redeploy" on latest deployment
3. Uncheck "Use existing Build Cache"
4. Click "Redeploy"

**Option B: From Git**
```bash
git commit --allow-empty -m "Trigger Vercel rebuild"
git push origin main
```

### Step 4: Verify Deployment

1. Wait for deployment to complete (~2-3 minutes)
2. Visit your Vercel URL
3. You should be redirected to `/login`
4. Try logging in with admin credentials

## Troubleshooting

### Issue: "Invalid credentials" error

**Solution:**
The database might not be seeded. Run locally:
```bash
npm run prisma:seed
```

### Issue: 500 error on login

**Check:**
1. ✅ `DATABASE_URL` is correct in Vercel environment variables
2. ✅ `NEXTAUTH_SECRET` is set in Vercel
3. ✅ `NEXTAUTH_URL` matches your Vercel domain
4. ✅ Database is accessible from Vercel (check Neon dashboard)

### Issue: Build fails on Vercel

**Check:**
1. ✅ All dependencies are in `package.json`
2. ✅ Run `npm run build` locally to test
3. ✅ Check Vercel build logs for specific error

### Issue: Still see old version after deployment

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private window
3. Hard refresh (Ctrl+Shift+R)
4. Redeploy with cache disabled

## Database Management

### Seed Database
```bash
npm run prisma:seed
```

### Reset Database (⚠️ This will delete all data)
```bash
npx prisma db push --force-reset
npm run prisma:seed
```

### View Database
```bash
npx prisma studio
```

Opens Prisma Studio at http://localhost:5555

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:setup` | Push schema + seed database |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:seed` | Seed database with users |

## Security Notes

### For Production

1. **Change NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```
   Use this value in Vercel environment variables

2. **Secure Database:**
   - Keep `DATABASE_URL` secret
   - Never commit `.env` to Git
   - Use Vercel's secret management

3. **Update Admin Password:**
   After first login, change the default password

### Allowed Email Domains

Only these domains can log in:
- `@ccsapparel.africa`
- `@ccsapparel.co.za`

To add more domains, edit `lib/auth.ts`:
```typescript
const allowedDomains = ["ccsapparel.africa", "ccsapparel.co.za", "newdomain.com"];
```

## Support

If issues persist:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Try deploying from a fresh Git commit

---

**Your app is now ready for production!** 🎉
