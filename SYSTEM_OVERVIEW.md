# 📋 CCS Lead Agent v2 - System Overview

**Purpose:** A B2B Lead Generation and Business Development system designed specifically for CCS Apparel. More than a CRM—the CCS Lead Agent is evolving into an autonomous digital employee that finds, qualifies, and nurtures leads across multiple communication channels.

**Version:** 5.0  
**Last Updated:** January 14, 2026  
**Status:** Production Ready (Phases 1–4 + 5A Discovery + 5B Assisted Outreach)  
**What Changed:** Phase 5B complete: Assisted Outreach (Human-Approved) with Yolandé Formula playbooks, draft generation, safety guardrails, and print report improvements

---

## 🤖 **What is the CCS Lead Agent?**

The CCS Lead Agent is a **purpose-built system** that operates as a tireless digital team member for CCS Apparel's business development efforts. It is designed to:

1. **Find prospects autonomously** — Discover new leads through web searches, keywords, and signals
2. **Enrich and qualify leads** — Add missing data and score leads based on fit
3. **Manage the pipeline** — Track status, ownership, and notes across the sales cycle
4. **Assist with outreach** — ✅ Generate suggested messages with human approval required (Phase 5B)
5. **Communicate across channels** — (Future) Unified inbox via Respond.io (Email, WhatsApp, Instagram, Facebook)
6. **Handle replies** — (Future) Manage conversations, suggest responses, handoff to human when needed
7. **Learn and improve** — (Future) Get smarter based on outcomes

### Agent vs. Platform

| Traditional CRM | CCS Lead Agent |
|-----------------|----------------|
| Waits for data input | Actively discovers prospects |
| Requires manual data entry | Enriches data automatically |
| Shows static records | Recommends next actions |
| Separate tools for messaging | Unified conversation management (Phase 6) |
| Manual outreach only | Assisted outreach with templates (Phase 5B) |
| Static scoring rules | (Future) Learns from outcomes |

**The system is evolving through controlled phases**, moving from a passive database toward an intelligent, autonomous agent—always with human oversight and safety guardrails.

---

## 🏢 **Who Is This For?**

- **CCS Apparel Business Development Team**
- **Sales Representatives**
- **Account Managers**
- **Management** (for reporting and oversight)

**Target Market:** South Africa and Botswana businesses

---

## 🎯 **Core Purpose**

CCS Lead Agent v2 helps CCS Apparel:
- **Find new business opportunities** through autonomous discovery (evolving)
- **Track and manage** potential business leads
- **Identify high-quality prospects** through automated scoring
- **Enrich company data** using external sources
- **Organize contacts and relationships** effectively
- **Prioritize sales efforts** based on lead quality scores
- **Communicate across channels** (evolving—omnichannel inbox planned)
- **Import and process** lead data in bulk

---

## 🧠 **The Agent Brain (Evolving)**

The Lead Agent's "brain" is a layered decision-making system that combines deterministic rules with optional AI assistance:

### Current State
- **Scoring Engine:** Rule-based scoring (0-100) using status, source, country, size, industry
- **Classification:** Hot/warm/cold lead classification based on score ranges
- **Enrichment Logic:** Automated data completion from Google searches

### Future Evolution (Phase 5B+)

| Layer | Purpose | Technology |
|-------|---------|------------|
| **ICP Rules** | Define ideal customer characteristics | Deterministic rules engine |
| **Allow/Block Lists** | Prevent contacting certain domains/people | Database lookups |
| **Action Planner** | Recommend next steps for each lead | Rule matching + templates |
| **Outreach Playbook** | Generate suggested outreach messages (Yolande Formula) | Template-based with context |
| **Draft Suggestions** | Suggest reply content (templates) | Template matching |
| **LLM Assistance** | Optional: Help draft messages, summarize | AI as a tool, not decision-maker |

### Important: LLMs Are Tools, Not Magic

The system may use Large Language Models (LLMs) to assist with:
- Drafting message suggestions
- Summarizing conversation history
- Extracting structured data from text

**However:**
- LLMs do NOT make decisions autonomously
- LLMs do NOT send messages without human approval (until Phase 6C opt-in)
- All LLM outputs are reviewed by deterministic rules before action
- The brain is primarily rule-based; AI augments, it doesn't replace human judgment

---

## 🔄 **The Agent's Operating Loop**

The CCS Lead Agent operates through a cyclical process:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEAD AGENT OPERATING LOOP                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐  │
│  │ DISCOVER │ →  │ ENRICH   │ →  │ SCORE   │ →  │ MANAGE   │  │
│  │          │    │          │    │         │    │          │  │
│  │ Find new │    │ Add data │    │ Rate &  │    │ Assign,  │  │
│  │ prospects│    │ from web │    │ classify│    │ status,  │  │
│  └──────────┘    └──────────┘    └─────────┘    └──────────┘  │
│       │                                              │         │
│       │              ┌──────────┐                   ▼         │
│       │              │ LEARN    │    ┌─────────────────────┐  │
│       │              │          │    │      MESSAGE        │  │
│       │              │ Track    │ ←  │  (Omnichannel)      │  │
│       └─────────────►│ outcomes │    │  Reply, nurture     │  │
│                      │          │    └─────────────────────┘  │
│                      └──────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Current Implementation Status

| Stage | Status | What It Does Today |
|-------|--------|-------------------|
| **DISCOVER** | ✅ Active | Phase 5A: Autonomous discovery with intent templates, manual + daily runs |
| **ENRICH** | ✅ Active | Google CSE enrichment, website metadata |
| **SCORE** | ✅ Active | Rule-based 0-100 scoring with classification |
| **MANAGE** | ✅ Active | Full CRM: status, ownership, notes, bulk ops |
| **OUTREACH** | ✅ Active | Assisted outreach with templates (Phase 5B) - Human approval required |
| **MESSAGE** | ❌ Planned | Omnichannel inbox via Respond.io (Phase 6) |
| **HANDOFF** | ❌ Planned | Human escalation and handoff workflows (Phase 6B+) |
| **LEARN** | ❌ Future | Outcome tracking coming (Phase 8) |

---

## 📱 **Omnichannel Communication (Evolving)**

### Current State
Today, all communication happens outside the system (email clients, Respond.io dashboard, etc.).

### Future State (Phase 6)
The Lead Agent will become a unified communication hub:

| Channel | Provider | Status |
|---------|----------|--------|
| WhatsApp | Respond.io | Planned (Phase 6A) |
| Instagram | Respond.io | Planned (Phase 6A) |
| Facebook | Respond.io | Planned (Phase 6A) |
| Email | Respond.io / Gmail | Planned (Phase 6A) |
| SMS | Respond.io | Planned (Phase 6A) |

### Evolution Path

```
Phase 6A: Read-Only Inbox
    └── See all conversations in one place
    └── NO sending capability
    
Phase 6B: Assisted Replies
    └── Human types and clicks Send
    └── Templates and draft suggestions
    └── Every send requires human approval
    
Phase 6C: Controlled Autopilot
    └── Opt-in per conversation
    └── Template-only responses
    └── Rate limits, quiet hours, kill switch
    └── Full audit trail
```

### Conversation Continuity
Regardless of channel, the agent maintains:
- **Unified timeline** — All messages in one thread
- **Identity resolution** — Match messages to known contacts/leads
- **Context preservation** — See company, lead, and contact info alongside messages

---

## 🔒 **Human Control and Safety**

The Lead Agent is designed with multiple layers of human oversight:

### Current Guardrails (Active)
| Guardrail | Description |
|-----------|-------------|
| Authentication | All actions require CCS team login |
| Domain Restriction | Only @ccsapparel domains can access |
| Role-Based Access | Admin vs User permissions |
| Data Validation | Input validation on all forms |

### Planned Guardrails (Phase 5+)
| Guardrail | Phase | Description |
|-----------|-------|-------------|
| Discovery Budgets | 5A | Max API calls per day, cost limits |
| ICP Rules | 5B | Only engage leads matching profile |
| Allow/Block Lists | 5B | Never contact blocked domains |
| Read-Only Mode | 6A | See messages, cannot send |
| Human Approval | 6B | Every send requires click |
| Rate Limits | 6C | Max messages per hour/day |
| Quiet Hours | 6C | No sends during specified times |
| Kill Switch | 6C | Instant disable all automation |
| Audit Trail | 6C | Full log of automated actions |
| Escalation Rules | 6C | Auto-escalate on triggers |

### The Evolution of Autonomy

```
TODAY (Phase 1-4)           NEAR FUTURE (Phase 5-6)       FUTURE (Phase 7-8)
─────────────────           ─────────────────────────     ───────────────────
Fully Human-Controlled      Human-in-the-Loop             Controlled Autopilot
                            
• Manual data entry         • Auto-discovery runs         • Multi-step sequences
• Manual enrichment         • Brain recommends actions    • Auto-replies (opt-in)
• Manual scoring            • Assisted outreach drafts    • Self-improving rules
• Manual outreach           • Human approves/rejects      • Forecasting
• Manual messaging          • Assisted reply drafts       • Daily autonomous cycles
                            • Human clicks Send           • Learning from outcomes
```

### Autonomy Levels

| Level | Description | Current Phase | Example |
|-------|-------------|---------------|---------|
| **Manual** | All actions require human initiation | Phase 1-4 | User manually adds lead, sends email |
| **Assisted** | System suggests, human approves | Phase 5B-6B | System generates outreach draft, user reviews and sends |
| **Semi-Autonomous** | System acts within strict guardrails | Phase 6C+ | Opt-in auto-replies with rate limits, kill switch |
| **Autonomous** | System operates independently with oversight | Phase 8+ | Self-improving discovery and messaging (future) |

---

## ✨ **What The System Can Do Today**

### 1. **Lead Management** 🎯

**Purpose:** Track and manage potential customers throughout the sales pipeline.

**Capabilities:**
- ✅ **Create individual leads** with contact information (email, name, phone, company)
- ✅ **Track lead status** (new, contacted, qualified, archived, etc.)
- ✅ **Link leads to companies** and contacts
- ✅ **Record lead source** (referral, partnership, website, cold outreach, etc.)
- ✅ **Assign lead ownership** to team members
- ✅ **Add internal notes** to leads
- ✅ **Bulk operations** (change status, assign owner for multiple leads)
- ✅ **View and filter leads** by status, score, owner, date, country
- ✅ **Edit and update** lead information
- ✅ **View lead details** with full history

**What You Can Do:**
- Add a new lead manually
- Update lead status as you progress through the sales process
- Assign leads to yourself or team members
- See all leads in one place, sorted by priority/score
- Filter leads by country (prioritize South Africa & Botswana)
- Track which leads came from referrals vs. cold outreach

---

### 2. **Company Management** 🏢

**Purpose:** Organize and enrich company information for better targeting.

**Capabilities:**
- ✅ **Store company information** (name, website, industry, country, size)
- ✅ **Link multiple contacts** to each company
- ✅ **Link multiple leads** to each company
- ✅ **View company details** with associated contacts and leads
- ✅ **Edit company information**
- ✅ **Enrich company data** using Google Custom Search (automatically find websites, infer industry)
- ✅ **Track company scores** (see which companies are most valuable)

**What You Can Do:**
- Add companies manually or import via CSV
- Use "Enrich" feature to automatically find company websites and industry info
- See all contacts and leads associated with a company in one view
- Identify companies with multiple leads (higher interest = better prospects)
- Filter companies by size, industry, or country

---

### 3. **Contact Management** 👥

**Purpose:** Manage individual contacts at companies and track relationships.

**Capabilities:**
- ✅ **Store contact information** (name, email, phone, role/title)
- ✅ **Link contacts to companies**
- ✅ **Track which leads** are associated with each contact
- ✅ **View contact details** and related company/leads
- ✅ **Edit contact information**
- ✅ **See contact count** per company (more contacts = better coverage)

**What You Can Do:**
- Maintain a database of decision-makers and contacts at target companies
- See all contacts at a specific company
- Track which contact a lead came from
- Update contact information as roles change

---

### 4. **Lead Scoring System** ⭐

**Purpose:** Automatically prioritize leads and companies based on likelihood to convert.

**Capabilities:**
- ✅ **Automatic scoring** (0-100 scale) for leads and companies
- ✅ **Rule-based scoring algorithm** that considers:
  - Lead status (qualified = higher score)
  - Lead source (referrals = highest score)
  - Company size (larger companies = higher score)
  - Country (South Africa & Botswana prioritized)
  - Number of leads per company (more leads = higher interest)
  - Number of contacts per company (better coverage = higher score)
  - Industry relevance
- ✅ **Score explanation** (see why a lead/company scored what it did)
- ✅ **Classification** (hot/warm/cold based on score ranges)
- ✅ **Recalculate scores** on-demand or when data changes
- ✅ **Filter by minimum score** (focus on high-priority leads)

**Scoring Factors (Leads):**
- Status: Qualified (30 pts), Contacted (20 pts), New (10 pts)
- Source: Referral (25 pts), Partnership (20 pts), Inbound/Website (15 pts), Cold (5 pts)
- Country: South Africa (15 pts), Botswana (10 pts), Other (5 pts)
- Company Size: 500+ employees (30 pts), 200+ (25 pts), 50+ (20 pts), 10+ (10 pts)

**Scoring Factors (Companies):**
- Lead Count: 6+ leads (50 pts), 3+ (35 pts), 1+ (20 pts)
- Contact Count: 6+ contacts (35 pts), 3+ (25 pts), 1+ (15 pts)
- Country: South Africa (15 pts), Botswana (10 pts), Other (5 pts)
- Industry: Target sectors (10 pts), Related sectors (8 pts), Other (5 pts)

---

### 5. **Data Enrichment** 🔍

**Purpose:** Automatically find missing company information from the web.

**Capabilities:**
- ✅ **Google Custom Search integration** to find company websites
- ✅ **Automatic website discovery** (if company website is missing)
- ✅ **Industry inference** from web search results
- ✅ **Enrichment status tracking** (never, pending, success, failed)
- ✅ **One-click enrichment** for any company

**What You Can Do:**
- Click "Enrich" button on any company
- System searches Google for the company
- Automatically fills in website and industry if found
- Track which companies have been enriched and when

---

### 6. **CSV Import System** 📥

**Purpose:** Import leads, companies, and contacts in bulk from spreadsheets.

**Capabilities:**
- ✅ **Import Companies** from CSV
- ✅ **Import Contacts** from CSV
- ✅ **Import Leads** from CSV
- ✅ **Batch processing** (handles large files)
- ✅ **Duplicate detection** (updates existing records instead of creating duplicates)
- ✅ **Error reporting** (shows which rows failed and why)
- ✅ **Import history** (track all imports with success/error counts)
- ✅ **Company matching** (automatically links contacts/leads to companies)

**CSV Formats Supported:**
- **Companies:** name, website, industry, country, size
- **Contacts:** firstName, lastName, email, phone, role, companyName
- **Leads:** email, firstName, lastName, phone, country, status, source, companyName, contactEmail

---

### 7. **Dashboard & Analytics** 📊

**Purpose:** Get a quick overview of your business development pipeline.

**Capabilities:**
- ✅ **Key metrics** at a glance:
  - Total leads
  - New leads (last 7 days)
  - Qualified leads (in progress)
  - Total companies
  - Total contacts
- ✅ **Quick actions** (add lead, add company, add contact)
- ✅ **Navigation** to all sections

---

### 8. **Search & Filtering** 🔎

**Purpose:** Find specific leads, companies, or contacts quickly.

**Capabilities:**
- ✅ **Sort by score** (highest first)
- ✅ **Sort by date** (newest first)
- ✅ **Filter by status, owner, source, classification**
- ✅ **Filter by minimum score** (show only leads/companies above X score)
- ✅ **View all records** or focus on specific subsets

---

### 9. **User Authentication & Security** 🔐

**Purpose:** Secure access control for your business data.

**Capabilities:**
- ✅ **Email-based login** (ccsapparel.africa or ccsapparel.co.za domains only)
- ✅ **Role-based access** (admin, user roles)
- ✅ **Secure password storage** (encrypted with bcryptjs)
- ✅ **Session management** (stays logged in for 30 days)
- ✅ **Protected routes** (dashboard requires login)

---

## 🎯 **Typical User Workflows**

### **Workflow 1: Adding a New Lead**
1. Go to Dashboard → Leads → Add Lead
2. Fill in lead information (email, name, company, phone, country, source)
3. System automatically:
   - Creates/updates the company
   - Links lead to company
   - Calculates lead score
4. Lead appears in list, sorted by score

### **Workflow 2: Importing Leads from CSV**
1. Export leads from existing system to CSV
2. Go to Dashboard → Imports
3. Select "Leads" as import type
4. Upload CSV file
5. System processes file and shows results
6. All leads are scored automatically

### **Workflow 3: Prioritizing Your Day**
1. Go to Dashboard → Leads
2. Sort by Score (highest first)
3. Filter by minimum score (e.g., 50+)
4. Focus on top-scoring leads first
5. Check score factors to understand why they scored high

### **Workflow 4: Enriching Company Data**
1. Go to Dashboard → Companies
2. Click on a company
3. Click "Enrich Company" button
4. System searches Google for company info
5. Website and industry are automatically filled in (if found)

### **Workflow 5: Managing Lead Ownership**
1. Go to Dashboard → Leads
2. Filter by "Unassigned" or select leads without owners
3. Use bulk select to choose multiple leads
4. Assign to yourself or a team member
5. Leads now appear in owner's filtered view

---

## 📈 **Business Value**

### **For Sales Team:**
- ✅ **Focus on high-quality leads** (scoring system prioritizes best prospects)
- ✅ **Save time** (automatic scoring, bulk imports, data enrichment)
- ✅ **Never miss a lead** (centralized database with ownership)
- ✅ **Track relationships** (see all contacts and leads at each company)

### **For Management:**
- ✅ **Pipeline visibility** (see total leads, qualified leads, new leads)
- ✅ **Data-driven decisions** (scores help identify best opportunities)
- ✅ **Team efficiency** (automated processes reduce manual work)
- ✅ **Accountability** (lead ownership tracking)

### **For Business Development:**
- ✅ **Identify opportunities** (companies with multiple leads = high interest)
- ✅ **Prioritize markets** (South Africa & Botswana automatically prioritized)
- ✅ **Track sources** (see which channels generate best leads)

---

## 🚀 **Future Capabilities (Planned)**

### **Phase 5A: Autonomous Daily Discovery** ✅ *Complete*
- ✅ Scheduled daily discovery runs via Vercel Cron (06:00 UTC)
- ✅ Manual discovery with intent templates (5 required CCS-aligned intents: agencies_all, schools_all, tenders_uniforms_merch, businesses_sme_ceo_and_corporate_marketing, events_exhibitions_sa)
- ✅ **NEW:** Intent templates aligned to CCS Apparel's real-world targets:
  - `agencies_all` - Marketing/branding/creative agencies (Gauteng-first)
  - `schools_all` - Schools for uniforms/embroidery
  - `tenders_uniforms_merch` - Government tenders via etenders.gov.za
  - `businesses_sme_ceo_and_corporate_marketing` - SME and corporate buyers
- ✅ **NEW:** Gauteng-first geography bias (not exclusion) with scoring boost
- ✅ **NEW:** Global negative keywords to filter jobs/vacancies/retail pollution
- ✅ **NEW:** Tender sourcing via National Treasury eTender Portal (site:etenders.gov.za)
- ✅ **NEW:** Daily runs execute multiple intents sequentially
- ✅ Run tracking with DiscoveryRun model (full stats, errors, limits)
- ✅ Budget and quota management via env vars
- ✅ Safety guardrails: kill switch, time budgets, max limits
- ✅ Dry-run mode for safe testing
- ✅ Admin-only Discovery UI with limit overrides at /dashboard/discovery
- ✅ Run history UI at /dashboard/discovery-runs
- **Note:** No outreach, no LLM brain in this phase

### **Phase 5B: Brain/Policy Layer + Assisted Outreach** ✅ *Complete*
- ✅ **Assisted Outreach (Yolande Formula):**
  - Message generator with templates (5 playbooks seeded)
  - Context-aware suggestions (lead/company, intent, event context)
  - Social proof integration (Standard Bank PPBSA, Vodacom, ISUZU, etc.)
  - Catalog/portfolio link placeholders
  - **Human approval required** before sending
  - Rate limits and suppression lists
  - Opt-out handling
  - Draft generation, editing, approval workflow
  - Outreach queue UI at `/dashboard/outreach`
- ❌ **Planned (Future):** ICP rules, allow/block lists UI, policy configuration UI

### **Phase 6A: Omnichannel Inbox (Read-Only)**
- Unified inbox for all channels (WhatsApp, Instagram, Facebook, Email)
- Message ingestion via Respond.io
- Identity resolution (match messages to contacts/leads)
- Conversation timeline

### **Phase 6B: Assisted Replies**
- Reply composer with templates
- Draft suggestions
- Human-initiated sending (click to send)
- Attachment support for email

### **Phase 6C: Controlled Autopilot**
- Opt-in auto-replies per conversation
- Template-only responses
- Rate limits and quiet hours
- Global kill switch
- Full audit trail

### **Phase 7: Multi-Step Playbooks**
- Sequence definitions
- Enrollment and exit rules
- Compliance checks
- A/B testing

### **Phase 8: Learning & Improvement**
- Outcome tracking
- Discovery quality scoring
- Message effectiveness analysis
- Scoring model calibration

---

## 🎓 **Key Concepts**

### **Lead Score (0-100)**
A numerical value indicating how likely a lead is to convert. Higher scores = better prospects. Based on lead status, source, company characteristics, and geographic location.

### **Company Score (0-100)**
A numerical value indicating the overall value of a company as a prospect. Based on number of leads, contacts, location, and industry relevance.

### **Enrichment**
Automatically finding missing company information (website, industry) from web searches. Helps build complete company profiles without manual research.

### **Discovery**
The process of finding new prospects automatically through web searches, keywords, and signal extraction. Phase 5A is complete with:
- **Intent Templates:** Predefined discovery strategies targeting specific prospect types (agencies_all, schools_all, tenders_uniforms_merch, businesses_sme_ceo_and_corporate_marketing, events_exhibitions_sa)
- **Manual Discovery** (`/dashboard/discovery`): Page to trigger discovery runs
  - Select intent template and configure limits
  - **Preview Only** mode: Discover and score without creating database records (dry-run)
  - **Run Now** mode: Create actual Company records from discovered results
  - **Manual Run History:** Shows only runs triggered manually (separate from automated runs)
  - Bulk actions: Archive, Print selected runs
- **Automated Discovery** (`/dashboard/discovery-runs`): View scheduled/cron discovery runs
  - Shows only automated runs (triggered by cron or daily mode)
  - Clear "Triggered By" label (Manual, Automated, Test)
  - Bulk actions: Archive, Print selected runs
  - Archive functionality to hide zero-result runs
- **Archived Runs** (`/dashboard/discovery/archived`): Manage archived discovery runs
  - Lists all archived runs (manual, automated, or test)
  - Bulk actions: Unarchive, Delete (hard delete), Print
  - **Delete safety:** Delete only available for archived runs, requires confirmation
- **Print Functionality:** Print-friendly view for discovery runs
  - Route: `/dashboard/discovery/print?ids=...`
  - Opens browser print dialog with clean layout
  - Shows run summaries, stats, and key results
- **Preview Mode:** Dry-run mode that discovers and scores companies without creating database records. Results can be reviewed and selectively created, or the run can be re-executed as a real run to create records automatically.
- **Navigation:** Discovery section in sidebar with:
  - Manual Discovery
  - Automated Discovery
  - Archived Runs
- **Geography Bias:** Gauteng-first scoring (priority regions get score boost, others not excluded)
- **Tender Sourcing:** Government tenders via National Treasury eTender Portal (etenders.gov.za)
- **Safety Guardrails:** Kill switch, time budgets, max limits, cancel support

### **Brain / Policy Layer**
A deterministic rules engine that defines ICP characteristics, allow/block lists, and recommends actions. Uses rules, not AI guesswork. (Phase 5B)

### **Omnichannel**
Unified communication across multiple channels (Email, WhatsApp, Instagram, Facebook, SMS) from a single inbox. (Phase 6)

### **Autopilot**
Controlled automatic message replies with strict guardrails: opt-in only, template-based, rate-limited, with kill switch. (Phase 6C)

---

## 🔧 **Google Dependency**

The CCS Lead Agent requires **Google Custom Search Engine (CSE)** for discovery and enrichment features.

### Required Configuration

**Environment Variables:**
- `GOOGLE_CSE_API_KEY` - Google Custom Search API key
- `GOOGLE_CSE_ID` - Google Custom Search Engine ID

### Impact on Features

| Feature | Status Without Google CSE |
|---------|--------------------------|
| **Google Discovery** | ❌ Disabled (runs marked as `completed_with_errors`) |
| **Company Enrichment** | ⚠️ Partial (website scraping only, no Google search) |
| **Keyword Discovery** | ✅ Works (does not require Google) |

### Diagnostics

**Health Check Endpoint:**
```
GET /api/health/google
```

Returns:
```json
{
  "configured": boolean,
  "apiKeyPresent": boolean,
  "cseIdPresent": boolean,
  "quotaStatus": "ok" | "unknown"
}
```

**Test Script:**
```bash
npx tsx scripts/test-google-cse.ts
```

### Setup for Vercel

1. Go to Vercel project settings → Environment Variables
2. Add `GOOGLE_CSE_API_KEY` with your API key
3. Add `GOOGLE_CSE_ID` with your CSE ID
4. Redeploy the application

**Note:** Discovery runs will fail loudly (status: `completed_with_errors`) if Google CSE is not configured, ensuring visibility of the issue.

---

## 📞 **Support & Access**

**Application URL:** https://ccs-lead-agent-v2.vercel.app

**Admin Access:**
- Email: `dumi@ccsapparel.africa`
- Password: `Dcs_BD7@`

**Access Requirements:**
- Must use @ccsapparel.africa or @ccsapparel.co.za email domain

---

## 📚 **Related Documentation**

| Document | Purpose |
|----------|---------|
| [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md) | Living source of truth for agent capabilities |
| [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) | Detailed phase definitions |
| [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md) | Messaging architecture spec |
| [PHASE_STATUS_MATRIX.md](./PHASE_STATUS_MATRIX.md) | Current phase completion status |
| [VISION_GAP_ANALYSIS.md](./VISION_GAP_ANALYSIS.md) | Gap analysis and priorities |

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-10 | 2.0 | Original system overview |
| 2026-01-11 | 3.0 | Reframed as Lead Agent; added brain/autonomy concepts; aligned with Roadmap v2 |
| 2026-01-11 | 3.1 | Updated DISCOVER status to In Progress (Phase 5A implementation started) |
| 2026-01-11 | 3.2 | Phase 5A complete: autonomous + manual discovery with intents, safety guardrails |
| 2026-01-12 | 3.3 | Added CCS-aligned intent templates (agencies/schools/tenders/businesses), Gauteng-first geography, tender sourcing via National Treasury eTender Portal, daily multi-intent runs |
| 2026-01-13 | 4.0 | Reframed as evolving "Omnichannel Lead Agent"; added assisted outreach (Yolande Formula), Respond.io integration plan, autonomy levels, handoff workflows; updated operating loop |

---

**Last Updated:** January 14, 2026  
**Version:** 5.0  
**Status:** Production Ready (Phases 1–4 + 5A + 5B) ✅  
**Next:** Phase 6A (Omnichannel Messaging - Read-Only Inbox via Respond.io)
