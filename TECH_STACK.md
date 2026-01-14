# Technology Stack

**Last Updated:** January 14, 2026  
**Status:** Production Ready

---

## Core Technologies

### Frontend Framework

**Next.js 16.0.10** (App Router)
- React Server Components
- Server-side rendering (SSR)
- API routes
- File-based routing
- Built-in optimizations

### Language

**TypeScript 5**
- Type safety
- Enhanced developer experience
- Compile-time error checking

### Database

**PostgreSQL** (via Neon)
- Relational database
- ACID compliance
- JSON field support for flexible metadata

### ORM

**Prisma 6.1.0**
- Type-safe database client
- Migration management
- Schema definition language
- Query builder

### Authentication

**NextAuth.js 4.24.11**
- Email/password authentication
- Session management (30-day sessions)
- JWT tokens
- Domain-restricted access

### Styling

**Tailwind CSS 4**
- Utility-first CSS framework
- Responsive design
- Custom design system
- PostCSS integration

---

## Development Tools

### Build Tools

- **Next.js Build System** - Integrated build pipeline
- **TypeScript Compiler** - Type checking and compilation
- **PostCSS** - CSS processing
- **ESLint** - Code linting

### Runtime

- **Node.js** - Server runtime
- **React 19.2.0** - UI library
- **React DOM 19.2.0** - DOM rendering

---

## External Dependencies

### Required Services

**Google Custom Search Engine (CSE)**
- Discovery channel (Google search)
- Company enrichment
- Required environment variables:
  - `GOOGLE_CSE_API_KEY`
  - `GOOGLE_CSE_ID`
- Impact: Discovery and enrichment features disabled if not configured

**PostgreSQL Database (Neon)**
- Production database
- Required environment variable:
  - `DATABASE_URL`

### Planned Integrations

**Respond.io** (Phase 6A)
- Omnichannel messaging platform
- WhatsApp, Instagram, Facebook, Email
- Webhook ingestion
- Read-only inbox (Phase 6A)
- Message sending (Phase 6B+)

---

## Development Environment

### Package Manager

**npm** - Node package manager

### Scripts

```json
{
  "dev": "node scripts/cleanup-dev.js && next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "tsx prisma/seed.ts",
  "db:setup": "prisma db push && tsx prisma/seed.ts"
}
```

### Development Server

- **Local:** `http://localhost:3000`
- **Hot reload:** Enabled
- **Type checking:** On save

---

## Deployment

### Hosting Platform

**Vercel**
- Automatic deployments from Git
- Serverless functions
- Edge network
- Environment variable management

### Cron Jobs

**Vercel Cron Jobs**
- Daily discovery runs (06:00 UTC)
- Configuration in `vercel.json`

### Database

**Neon PostgreSQL**
- Serverless PostgreSQL
- Auto-scaling
- Connection pooling

---

## Key Libraries

### Data Processing

- **papaparse 5.5.3** - CSV parsing for imports

### Security

- **bcryptjs 2.4.3** - Password hashing

### Database

- **pg 8.16.3** - PostgreSQL driver

### Utilities

- **tsx 4.20.6** - TypeScript execution
- **dotenv 17.2.3** - Environment variable loading

---

## Architecture Patterns

### File Structure

```
app/
├── api/              # API routes
├── dashboard/        # Protected dashboard pages
├── login/            # Authentication pages
└── print/            # Print-friendly pages

lib/
├── auth.ts           # NextAuth configuration
├── prisma.ts         # Prisma client singleton
├── discovery/        # Discovery logic
├── enrichment/       # Enrichment logic
├── scoring/          # Scoring logic
└── outreach/         # Outreach logic

prisma/
├── schema.prisma     # Database schema
├── migrations/       # Migration files
└── seed.ts           # Seed script
```

### API Routes

- RESTful API design
- Server-side authentication
- JSON responses
- Error handling

### Database Access

- Prisma Client singleton pattern
- Type-safe queries
- Transaction support
- Connection pooling

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Password manager compatible
- Browser extension compatible

---

## Security Considerations

### Authentication

- Password hashing with bcryptjs
- Session management with NextAuth
- Domain-restricted access (@ccsapparel.africa, @ccsapparel.co.za)

### Data Protection

- Environment variables for secrets
- No secrets in source code
- HTTPS required in production

### Input Validation

- Server-side validation
- Type checking with TypeScript
- Prisma schema validation

---

## Performance

### Optimization

- Next.js automatic optimizations
- Server-side rendering
- Static generation where possible
- Image optimization (if used)

### Database

- Connection pooling
- Indexed queries
- Efficient Prisma queries

---

## Related Documentation

- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System architecture
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [README.md](./README.md) - Quick start guide
