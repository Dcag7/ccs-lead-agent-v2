# Architecture Overview

**Last Updated:** January 14, 2026  
**Status:** Production Ready

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CCS Lead Agent v2                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   API Layer  │    │   Database   │  │
│  │  (Next.js)  │◄───►│  (Next.js)   │◄───►│ (PostgreSQL) │  │
│  │              │    │              │    │              │  │
│  │  React 19    │    │  API Routes   │    │  Prisma ORM  │  │
│  │  Tailwind    │    │  Auth (JWT)  │    │  Neon DB     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                     │                    │         │
│         │                     │                    │         │
│         └─────────────────────┼────────────────────┘         │
│                               │                               │
│                    ┌───────────▼───────────┐                 │
│                    │   External Services   │                 │
│                    │                       │                 │
│                    │  • Google CSE        │                 │
│                    │  • Respond.io (6A+)  │                 │
│                    └───────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Application Layers

### 1. Presentation Layer (Frontend)

**Technology:** Next.js 16 (App Router), React 19, Tailwind CSS 4

**Components:**
- **Dashboard Pages** (`app/dashboard/`)
  - Lead management
  - Company management
  - Contact management
  - Discovery UI
  - Outreach queue
  - Import management

- **Authentication Pages** (`app/login/`)
  - Login form
  - Session management

- **Print Pages** (`app/print/`)
  - Print-friendly discovery reports
  - Standalone layout (no dashboard chrome)

**Features:**
- Server-side rendering (SSR)
- Client-side interactivity
- Responsive design
- Print optimization

---

### 2. API Layer

**Technology:** Next.js API Routes

**Endpoints:**

**Authentication:**
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

**Leads:**
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/[id]` - Get lead
- `PUT /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Archive lead

**Companies:**
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/companies/[id]` - Get company
- `PUT /api/companies/[id]` - Update company
- `POST /api/companies/[id]/enrich` - Enrich company

**Contacts:**
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact

**Discovery:**
- `POST /api/discovery/manual/run` - Trigger manual discovery
- `GET /api/discovery-runs` - List discovery runs
- `GET /api/discovery/runs/[id]` - Get run details
- `POST /api/discovery/runs/[id]/materialize` - Materialize dry-run
- `PATCH /api/discovery/runs/[id]/archive` - Archive run
- `PATCH /api/discovery/runs/bulk` - Bulk operations

**Outreach:**
- `POST /api/outreach/generate` - Generate draft
- `GET /api/outreach/playbooks` - List playbooks
- `GET /api/outreach/drafts` - List drafts
- `GET /api/outreach/drafts/[id]` - Get draft
- `PUT /api/outreach/drafts/[id]` - Update draft
- `DELETE /api/outreach/drafts/[id]` - Cancel draft
- `POST /api/outreach/drafts/[id]/approve` - Approve draft
- `POST /api/outreach/send` - Send approved draft

**Imports:**
- `POST /api/imports` - Upload CSV file

**Jobs:**
- `POST /api/jobs/discovery/run` - Cron job for daily discovery

---

### 3. Business Logic Layer

**Location:** `lib/`

**Modules:**

**Discovery** (`lib/discovery/`)
- `DiscoveryAggregator` - Executes discovery channels
- `persistDiscoveryResults` - Persists results to database
- `channels/` - Discovery channel implementations
  - `google/GoogleDiscoveryChannel`
  - `keyword/KeywordDiscoveryChannel`
- `runner/DailyDiscoveryRunner` - Orchestrates discovery runs

**Enrichment** (`lib/enrichment/`)
- `CompanyEnrichmentRunner` - Enriches company data
- `modules/GoogleCseEnricher` - Google CSE integration
- `modules/WebsiteEnricher` - Website metadata extraction

**Scoring** (`lib/scoring.ts`)
- Lead scoring algorithm (0-100)
- Company scoring algorithm (0-100)
- Classification (hot/warm/cold)

**Outreach** (`lib/outreach/`)
- `playbooks.ts` - Playbook definitions and seeding
- `draft-generation.ts` - Draft generation logic
- `safety.ts` - Safety guardrails (suppression, rate limits)

---

### 4. Data Access Layer

**Technology:** Prisma ORM

**Location:** `prisma/`

**Components:**
- `schema.prisma` - Database schema definition
- `migrations/` - Database migration files
- `seed.ts` - Database seeding script

**Pattern:**
- Prisma Client singleton (`lib/prisma.ts`)
- Type-safe queries
- Connection pooling
- Transaction support

---

## External Integrations

### Google Custom Search Engine (CSE)

**Purpose:** Discovery and enrichment

**Integration:**
- API key and CSE ID via environment variables
- `lib/googleSearch.ts` - Google CSE client
- Used by:
  - `GoogleDiscoveryChannel` - Discovery
  - `GoogleCseEnricher` - Enrichment

**Impact:**
- Discovery disabled if not configured
- Enrichment partially disabled if not configured

---

### Respond.io (Planned - Phase 6A)

**Purpose:** Omnichannel messaging

**Integration:**
- Webhook ingestion (planned)
- Message sending (planned)
- Channels: WhatsApp, Instagram, Facebook, Email

**Status:** Not yet implemented

---

## Deployment Architecture

### Hosting

**Platform:** Vercel

**Components:**
- Serverless functions (API routes)
- Edge network
- Automatic deployments from Git
- Environment variable management

### Database

**Provider:** Neon PostgreSQL

**Features:**
- Serverless PostgreSQL
- Auto-scaling
- Connection pooling
- Backup and recovery

### Cron Jobs

**Provider:** Vercel Cron Jobs

**Jobs:**
- Daily discovery run (06:00 UTC)
- Configuration in `vercel.json`

---

## Security Architecture

### Authentication

**Technology:** NextAuth.js

**Features:**
- Email/password authentication
- Domain restriction (@ccsapparel.africa, @ccsapparel.co.za)
- JWT session tokens
- 30-day session duration
- Password hashing (bcryptjs)

### Authorization

**Roles:**
- `admin` - Full access
- `user` - Limited access

**Protection:**
- Middleware-based route protection
- API route authentication checks
- Role-based access control

### Data Protection

- Environment variables for secrets
- No secrets in source code
- HTTPS required in production
- Input validation
- SQL injection prevention (Prisma)

---

## File Structure

```
ccs-lead-agent-v2/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication
│   │   ├── companies/          # Company endpoints
│   │   ├── contacts/           # Contact endpoints
│   │   ├── discovery/          # Discovery endpoints
│   │   ├── imports/            # Import endpoints
│   │   ├── jobs/               # Cron jobs
│   │   ├── leads/              # Lead endpoints
│   │   └── outreach/           # Outreach endpoints
│   ├── dashboard/              # Dashboard pages
│   │   ├── discovery/          # Discovery UI
│   │   ├── leads/              # Lead management
│   │   ├── outreach/           # Outreach queue
│   │   └── ...                 # Other pages
│   ├── login/                  # Login page
│   └── print/                  # Print pages
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client
│   ├── discovery/              # Discovery logic
│   ├── enrichment/             # Enrichment logic
│   ├── outreach/               # Outreach logic
│   └── scoring.ts              # Scoring logic
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Seed script
├── scripts/                    # Utility scripts
└── public/                     # Static assets
```

---

## Data Flow

### Discovery Flow

```
1. Trigger (Manual/Cron)
   ↓
2. DailyDiscoveryRunner
   ↓
3. DiscoveryAggregator
   ↓
4. Discovery Channels (Google, Keyword)
   ↓
5. Results Aggregation & Deduplication
   ↓
6. Persist to Database (if not dry-run)
   ↓
7. Store resultsJson in DiscoveryRun
   ↓
8. Update run status
```

### Outreach Flow

```
1. User selects playbook on lead
   ↓
2. Generate draft (template substitution)
   ↓
3. User edits draft (optional)
   ↓
4. User approves draft
   ↓
5. User clicks send
   ↓
6. Safety checks (suppression, rate limits, cooldown)
   ↓
7. Send message (if checks pass)
   ↓
8. Log to OutboundMessageLog
```

---

## Related Documentation

- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System overview
- [TECH_STACK.md](./TECH_STACK.md) - Technology details
- [DATA_MODEL_OVERVIEW.md](./DATA_MODEL_OVERVIEW.md) - Data model
- [DISCOVERY_LIFECYCLE.md](./DISCOVERY_LIFECYCLE.md) - Discovery process
