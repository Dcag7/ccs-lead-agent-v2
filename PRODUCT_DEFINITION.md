# Product Definition

**Last Updated:** January 14, 2026  
**Status:** Production Ready

---

## Product Overview

**CCS Lead Agent v2** is a B2B Lead Generation and Business Development system designed specifically for CCS Apparel. It operates as an autonomous digital employee that finds, qualifies, and nurtures leads across multiple communication channels.

**Target Market:** South Africa and Botswana businesses

**Primary Users:**
- CCS Apparel Business Development Team
- Sales Representatives
- Account Managers
- Management (for reporting and oversight)

---

## Core Value Propositions

### 1. Autonomous Discovery

**What It Does:**
- Automatically discovers new prospects through web searches
- Uses intent templates aligned to CCS Apparel's target markets
- Runs daily via automated cron jobs
- Manual discovery available for on-demand prospecting

**Value:**
- Saves time on manual research
- Finds prospects 24/7 without human intervention
- Targets specific market segments (agencies, schools, tenders, businesses, events)

### 2. Data Enrichment

**What It Does:**
- Automatically finds missing company information (website, industry)
- Uses Google Custom Search Engine
- Enriches company profiles with structured data

**Value:**
- Completes company profiles automatically
- Reduces manual data entry
- Improves data quality

### 3. Lead Scoring

**What It Does:**
- Automatically scores leads (0-100) based on multiple factors
- Classifies leads as hot/warm/cold
- Prioritizes high-value prospects

**Value:**
- Focus sales efforts on best prospects
- Data-driven prioritization
- Improves conversion rates

### 4. Lead Management

**What It Does:**
- Tracks leads through sales pipeline
- Manages lead ownership and status
- Stores internal notes and history
- Bulk operations for efficiency

**Value:**
- Centralized lead database
- Team collaboration
- Pipeline visibility
- Accountability

### 5. Assisted Outreach

**What It Does:**
- Generates outreach message drafts from templates
- Uses "Yolandé Formula" for high-quality messaging
- Requires human approval before sending
- Manages outreach queue and drafts

**Value:**
- Consistent messaging quality
- Saves time on draft creation
- Maintains brand voice
- Safety through human approval

---

## Key Features

### Discovery

**Manual Discovery:**
- Location: `/dashboard/discovery`
- Intent template selection (5 templates)
- Preview mode (dry-run) or real run
- Configurable limits
- Run history

**Automated Discovery:**
- Daily runs via Vercel Cron (06:00 UTC)
- Multiple intent templates executed sequentially
- Automatic record creation
- Run history at `/dashboard/discovery-runs`

**Intent Templates:**
1. `agencies_all` - Marketing/branding/creative agencies
2. `schools_all` - Schools for uniforms/embroidery
3. `tenders_uniforms_merch` - Government tenders
4. `businesses_sme_ceo_and_corporate_marketing` - SME/Corporate buyers
5. `events_exhibitions_sa` - Event organizers/exhibitors

### Enrichment

- One-click company enrichment
- Google CSE integration
- Website discovery
- Industry inference
- Status tracking

### Scoring

**Lead Scoring Factors:**
- Status (qualified, contacted, new)
- Source (referral, partnership, inbound, cold)
- Country (South Africa, Botswana prioritized)
- Company size
- Number of leads per company

**Company Scoring Factors:**
- Lead count
- Contact count
- Country
- Industry relevance

### Lead Management

- Status tracking (new, contacted, qualified, archived)
- Ownership assignment
- Internal notes
- Bulk operations (status change, owner assignment)
- Filtering and sorting
- Lead detail pages

### Outreach

**Draft Generation:**
- Template-based message generation
- Context-aware personalization
- Variable substitution
- Missing field warnings

**Approval Workflow:**
- Draft → Approved → Sent
- Human approval required
- Edit capability before approval
- Outreach queue management

**Safety Features:**
- Suppression lists (email, domain, company)
- Rate limiting (per day, hour, minute)
- Cooldown periods (7 days between messages)
- Sending disabled by default

### Data Import

- CSV import for Companies, Contacts, Leads
- Batch processing
- Duplicate detection
- Error reporting
- Import history

---

## User Workflows

### Workflow 1: Daily Discovery

1. System runs automated discovery at 06:00 UTC
2. Executes multiple intent templates
3. Creates Company/Contact/Lead records
4. Scores all new leads automatically
5. Users see new leads in dashboard

### Workflow 2: Manual Discovery

1. User navigates to `/dashboard/discovery`
2. Selects intent template
3. Chooses Preview (dry-run) or Run Now
4. Reviews results (if preview)
5. Materializes preview run (if desired)
6. New leads appear in system

### Workflow 3: Lead Outreach

1. User navigates to lead detail page
2. Selects outreach playbook
3. Generates draft
4. Edits draft (if needed)
5. Approves draft
6. Sends from outreach queue
7. Message logged in system

### Workflow 4: Lead Prioritization

1. User navigates to Leads page
2. Sorts by score (highest first)
3. Filters by minimum score
4. Reviews score factors
5. Focuses on top-scoring leads

### Workflow 5: Company Enrichment

1. User navigates to Companies page
2. Clicks on company
3. Clicks "Enrich Company" button
4. System searches Google
5. Website and industry filled automatically

---

## Safety and Compliance

### Human Oversight

- All outreach requires human approval
- No autonomous message sending (Phase 5B)
- Draft review before sending
- Manual send button

### Data Protection

- Domain-restricted access
- Password hashing
- Secure session management
- No secrets in source code

### Rate Limiting

- Configurable limits (day, hour, minute)
- Prevents spam/over-contacting
- Cooldown periods between messages

### Suppression Lists

- Email-level blocking
- Domain-level blocking
- Company-level blocking
- Opt-out handling

---

## Future Capabilities (Planned)

### Phase 6A: Omnichannel Inbox (Read-Only)

- Unified inbox for all channels
- Message ingestion via Respond.io
- Identity resolution
- Conversation timeline

### Phase 6B: Assisted Replies

- Reply composer with templates
- Draft suggestions
- Human-initiated sending

### Phase 6C: Controlled Autopilot

- Opt-in auto-replies
- Template-only responses
- Rate limits and quiet hours
- Global kill switch

### Phase 7: Multi-Step Playbooks

- Sequence definitions
- Enrollment and exit rules
- Compliance checks

### Phase 8: Learning & Improvement

- Outcome tracking
- Discovery quality scoring
- Message effectiveness analysis
- Scoring model calibration

---

## Related Documentation

- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System architecture
- [DISCOVERY_LIFECYCLE.md](./DISCOVERY_LIFECYCLE.md) - Discovery process details
- [PHASE_STATUS_MATRIX.md](./PHASE_STATUS_MATRIX.md) - Feature completion status
