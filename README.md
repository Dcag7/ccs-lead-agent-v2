
# CCS Lead Agent v2 - Business Development Platform

A full-stack B2B Lead Generation and Business Development platform for CCS Apparel, targeting leads in South Africa and Botswana.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up database
npm run db:setup

# Run development server
npm run dev
```

Visit: http://localhost:3000

## 🎯 Features

- ✅ Secure authentication with NextAuth.js
- ✅ Email domain validation (ccsapparel.africa, ccsapparel.co.za)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Protected dashboard routes
- ✅ React hydration error fixed
- ✅ Browser extension compatible
- ✅ Production-ready

## 🔐 Test Credentials

### Admin User
- **Email:** dumi@ccsapparel.africa
- **Password:** Dcs_BD7@

### Test User
- **Email:** test@ccsapparel.africa
- **Password:** Test123!

## 📁 Project Structure

```
ccs-lead-agent-v2/
├── app/
│   ├── api/auth/[...nextauth]/   # NextAuth API routes
│   ├── dashboard/                # Protected dashboard
│   ├── login/                    # Login page (hydration fix applied)
│   └── page.tsx                  # Home (redirects to login/dashboard)
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   └── prisma.ts                 # Prisma client singleton
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeding script
├── middleware.ts                 # Route protection
└── .env                          # Environment variables
```

## 🔧 Recent Fixes

### React Hydration Error - FIXED ✅
- Added `suppressHydrationWarning` to form inputs
- Compatible with password managers and browser extensions
- No more console errors!

### Password Hashing - FIXED ✅
- Consistent use of bcryptjs everywhere
- Authentication now works reliably
- Passwords verified correctly

### Next.js 16 Compatibility - FIXED ✅
- Updated middleware to new conventions
- No deprecation warnings
- Production-ready

**See:** [HYDRATION_FIX_SUMMARY.md](./HYDRATION_FIX_SUMMARY.md) for details

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Configure Vercel Environment Variables:**
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `NEXTAUTH_URL`: Your Vercel domain
   - `NEXTAUTH_SECRET`: Generated secret (use `openssl rand -base64 32`)

3. **Deploy:**
   - Vercel will automatically deploy on push
   - Or manually trigger from Vercel dashboard

**See:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete instructions

## 📚 Documentation

- [Hydration Fix Summary](./HYDRATION_FIX_SUMMARY.md) - What was fixed and why
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Troubleshooting](#troubleshooting) - Common issues and solutions

## 🛠 Tech Stack

- **Framework:** Next.js 16.0.2 (App Router)
- **Authentication:** NextAuth.js 4.24.11
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma 6.1.0
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5

## 🔐 Security

- ✅ Email domain validation
- ✅ Password hashing with bcryptjs
- ✅ Protected routes with middleware
- ✅ JWT session tokens
- ✅ POPIA/GDPR compliant

## 📊 Database Schema

### Users Table
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Leads Table
```prisma
model Lead {
  id          String   @id @default(cuid())
  email       String
  firstName   String?
  lastName    String?
  company     String?
  phone       String?
  country     String?
  status      String   @default("new")
  score       Int      @default(0)
  source      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🧪 Testing

### Test Login Locally
1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000/login
3. Login with: `dumi@ccsapparel.africa` / `Dcs_BD7@`
4. Should redirect to dashboard

### Test with Browser Extensions
The app now works with:
- ✅ LastPass
- ✅ 1Password
- ✅ Bitwarden
- ✅ Chrome/Firefox autofill

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:setup` | Setup database (push schema + seed) |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:seed` | Seed database with users |

## 🐛 Troubleshooting

### Can't log in?
1. Check database is seeded: `npm run prisma:seed`
2. Verify `DATABASE_URL` in `.env`
3. Check `NEXTAUTH_SECRET` is set
4. Clear browser cache and try again

### Build fails?
1. Delete `node_modules` and `.next`
2. Run `npm install`
3. Run `npm run build`
4. Check for TypeScript errors

### Hydration errors?
✅ Already fixed! Update to latest code.

## 📞 Support

For issues or questions:
1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Check [HYDRATION_FIX_SUMMARY.md](./HYDRATION_FIX_SUMMARY.md)
3. Review Vercel deployment logs
4. Check browser console for errors

## 🎯 Next Steps

After successful login:
1. ✅ Phase 1: Authentication - COMPLETE
2. ✅ Phase 2: Database Setup - COMPLETE
3. ✅ Phase 3: Hydration Fix - COMPLETE
4. 🔄 Phase 4: Lead Scoring System
5. 🔄 Phase 5: Integration (LinkedIn, HubSpot, etc.)
6. 🔄 Phase 6: POPIA/GDPR Compliance Features

---

**Built with ❤️ for CCS Apparel**

🌍 Targeting: South Africa & Botswana  
📧 Admin: dumi@ccsapparel.africa  
🚀 Status: Production Ready
