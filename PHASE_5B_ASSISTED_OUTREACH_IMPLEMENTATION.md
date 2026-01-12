# Phase 5B: Assisted Outreach Implementation

**Status:** ✅ Complete  
**Date:** January 12, 2026  
**Related:** [PHASE_5B_ASSISTED_OUTREACH_MVP.md](./PHASE_5B_ASSISTED_OUTREACH_MVP.md), [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md)

---

## Overview

Phase 5B implements **Assisted Outreach (Human-Approved)** using the "Yolandé Formula". This phase enables users to generate high-quality outreach drafts from templates, review and edit them, then approve and send—all with strict safety guardrails.

**Key Principle:** All outreach requires human approval. No autonomous sending in Phase 5B.

---

## What Was Built

### 1. Data Model (Prisma)

Four new models were added:

#### `OutreachPlaybook`
- Stores template playbooks with subject/body templates
- Supports variable substitution (`{{variable.path}}`)
- Includes audience type classification
- Enabled/disabled flag

#### `OutreachDraft`
- Links leads to playbooks
- Stores generated/edited subject and body
- Tracks status: `draft` → `approved` → `sent` / `cancelled` / `failed`
- Records creator and approver
- Stores metadata (warnings, missing fields)

#### `SuppressionEntry`
- Blocks emails, domains, or companies
- Supports opt-out handling
- Unique constraint on (type, value)

#### `OutboundMessageLog`
- Logs all sent messages
- Tracks provider message IDs
- Records errors for failed sends
- Used for rate limiting

### 2. Playbooks (Yolandé Formula)

Five default playbooks are seeded:

1. **Agencies (All)** - For marketing/branding agencies
2. **Schools (All)** - For school uniforms and embroidery
3. **Businesses (SME CEO + Corporate Marketing/Procurement)** - For corporate apparel
4. **Events/Exhibitions (SA)** - For event/exhibition branded merchandise
5. **Tenders (etenders.gov.za opportunities)** - For tender submissions

Each playbook follows the Yolandé Formula:
- Context trigger ("I saw X...")
- Value proposition (CCS Apparel services)
- Credibility signals (client examples)
- Clear CTA (quote, call, catalog)

### 3. Draft Generation

**Location:** `lib/outreach/draft-generation.ts`

- Deterministic template substitution (no LLM required)
- Variable resolution from Lead/Company/Contact/User data
- Missing field detection and warnings
- Suppression check integration

**Variables Supported:**
- `{{contact.firstName}}`, `{{contact.lastName}}`, `{{contact.email}}`, etc.
- `{{company.name}}`, `{{company.industry}}`, `{{company.website}}`, etc.
- `{{user.name}}`, `{{user.email}}`, `{{user.phone}}`
- `{{eventContext}}`, `{{exhibitorRole}}` (for events playbook)

### 4. UI Components

#### Lead Detail Page (`/dashboard/leads/[id]`)
- **Outreach Section** (`OutreachSection.tsx`)
  - Playbook selector
  - Generate draft button
  - List of existing drafts with status
  - Links to edit/view drafts

#### Outreach Queue (`/dashboard/outreach`)
- **Queue Page** (`OutreachQueueClient.tsx`)
  - Table of all drafts
  - Status filters (draft/approved/sent/cancelled/failed)
  - Bulk actions (approve, cancel)
  - Send button for approved drafts

#### Draft Editor (`/dashboard/outreach/[id]`)
- **Editor Page** (`DraftEditorClient.tsx`)
  - Edit subject and body
  - View warnings and missing fields
  - Approve button (moves to approved queue)
  - Send button (for approved drafts)

### 5. API Endpoints

#### `POST /api/outreach/generate`
- Generates a draft from a playbook
- Returns draft with warnings and missing fields

#### `GET /api/outreach/playbooks`
- Lists all enabled playbooks

#### `GET /api/outreach/drafts`
- Lists drafts with optional filters (status, leadId)

#### `GET /api/outreach/drafts/[id]`
- Gets a single draft with relations

#### `PUT /api/outreach/drafts/[id]`
- Updates draft subject/body
- Resets status to "draft" if editing approved draft

#### `DELETE /api/outreach/drafts/[id]`
- Cancels a draft (sets status to "cancelled")

#### `POST /api/outreach/drafts/[id]/approve`
- Approves a draft (moves to approved queue)

#### `POST /api/outreach/send`
- Sends an approved draft
- Enforces all safety checks

### 6. Safety Guardrails

**Location:** `lib/outreach/safety.ts`

#### Suppression Checks
- Blocks emails in suppression list
- Blocks domains in suppression list
- Blocks companies in suppression list
- Checked before sending

#### Rate Limiting
- Configurable via environment variables:
  - `OUTREACH_RATE_LIMIT_DAY` (default: 20)
  - `OUTREACH_RATE_LIMIT_HOUR` (default: 5)
  - `OUTREACH_RATE_LIMIT_MINUTE` (default: 2)
- Enforced in send API
- Returns 429 if exceeded

#### Cooldown Period
- Default: 7 days between messages to same lead
- Prevents spam/over-contacting
- Configurable in code

#### Sending Disabled Flag
- `OUTREACH_SENDING_ENABLED=false` (default)
- Must be explicitly enabled for production
- Sending API returns error if disabled

### 7. Email Sending

**Location:** `app/api/outreach/send/route.ts`

- Placeholder implementation (logs to console)
- Ready for integration with:
  - SMTP
  - Resend
  - SendGrid
- Provider selected via `OUTREACH_EMAIL_PROVIDER` env var
- Only sends if `OUTREACH_SENDING_ENABLED=true`

### 8. Verification Scripts

#### `scripts/phase5b-verification.ts`
- Asserts playbooks exist
- Tests draft generation (dry run)
- Tests suppression prevention
- Tests sending disabled flag
- Validates data model integrity

#### `scripts/phase5b-deployment-readiness.ts`
- Checks environment variables (never prints secrets)
- Validates Prisma schema
- Checks database tables exist
- Verifies API routes exist
- Verifies UI components exist
- Checks playbook seeding

---

## How to Use

### 1. Setup

```bash
# Run migration
npx prisma migrate dev

# Seed playbooks
npm run prisma:seed

# Verify installation
tsx scripts/phase5b-verification.ts
```

### 2. Generate a Draft

1. Navigate to a lead detail page (`/dashboard/leads/[id]`)
2. Scroll to "Outreach" section
3. Select a playbook
4. Click "Generate Draft"
5. Review warnings (if any)

### 3. Edit and Approve

1. Click "View & Edit" on a draft
2. Edit subject/body as needed
3. Click "Save Draft"
4. Click "Approve" (moves to approved queue)

### 4. Send

1. Go to Outreach Queue (`/dashboard/outreach`)
2. Filter by "Approved"
3. Click "Send" on an approved draft
4. System checks:
   - Suppression list
   - Rate limits
   - Cooldown period
   - Sending enabled flag
5. If all checks pass, email is sent

### 5. Safety Operations

#### Add to Suppression List

```typescript
import { addSuppression } from "@/lib/outreach/safety";
import { prisma } from "@/lib/prisma";

// Block an email
await addSuppression(prisma, "email", "spam@example.com", "Opted out");

// Block a domain
await addSuppression(prisma, "domain", "competitor.com", "Competitor");

// Block a company
await addSuppression(prisma, "company", "Bad Company Ltd", "Blacklisted");
```

#### Check Rate Limits

Rate limits are automatically enforced. To check manually:

```typescript
import { checkRateLimit } from "@/lib/outreach/safety";

const result = await checkRateLimit(prisma, userId);
if (!result.allowed) {
  console.log(result.reason);
}
```

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...

# Optional (defaults shown)
OUTREACH_SENDING_ENABLED=false  # Must be "true" to send emails
OUTREACH_EMAIL_PROVIDER=smtp    # smtp|resend|sendgrid
OUTREACH_RATE_LIMIT_DAY=20
OUTREACH_RATE_LIMIT_HOUR=5
OUTREACH_RATE_LIMIT_MINUTE=2
```

---

## Safety Features

### Human Approval Required
- ✅ All drafts require explicit approval
- ✅ No automatic sending
- ✅ No background/cron sending

### Suppression List
- ✅ Email-level blocking
- ✅ Domain-level blocking
- ✅ Company-level blocking
- ✅ Opt-out handling

### Rate Limiting
- ✅ Per-day limits
- ✅ Per-hour limits
- ✅ Per-minute limits
- ✅ Configurable via env vars

### Cooldown Period
- ✅ 7-day cooldown between messages to same lead
- ✅ Prevents over-contacting

### Sending Disabled by Default
- ✅ `OUTREACH_SENDING_ENABLED=false` by default
- ✅ Must explicitly enable for production
- ✅ Prevents accidental sends

---

## Testing

### Run Verification

```bash
tsx scripts/phase5b-verification.ts
```

### Run Deployment Readiness

```bash
tsx scripts/phase5b-deployment-readiness.ts
```

### Manual Testing Checklist

- [ ] Generate draft from lead detail page
- [ ] Edit draft subject/body
- [ ] Approve draft
- [ ] View draft in outreach queue
- [ ] Send approved draft (if enabled)
- [ ] Verify suppression blocks sending
- [ ] Verify rate limit blocks sending
- [ ] Verify cooldown blocks sending
- [ ] Verify sending disabled flag blocks sending

---

## Known Limitations

1. **Email Sending:** Placeholder implementation. Needs actual email provider integration.
2. **Rate Limiting:** Currently global (not per-user). Can be enhanced later.
3. **Attachments:** Not supported in Phase 5B. Deferred to Phase 5C/6.
4. **LinkedIn/WhatsApp:** Only creates "tasks" for manual sending. No API automation.
5. **Templates:** Fixed templates. No UI for editing playbooks yet (can be added later).

---

## Future Enhancements

1. **Playbook Editor UI** - Allow users to create/edit playbooks
2. **A/B Testing** - Test different templates
3. **Scheduling** - Schedule sends for optimal times
4. **Follow-up Sequences** - Multi-message sequences (Phase 7)
5. **Response Tracking** - Track opens, clicks, replies (Phase 6+)
6. **LLM-Assisted Personalization** - Optional AI enhancement (Phase 8)

---

## Migration

The migration file is: `prisma/migrations/20260112201830_phase5b_outreach/migration.sql`

To apply:

```bash
npx prisma migrate dev
```

To seed playbooks:

```bash
npm run prisma:seed
```

---

## Files Changed/Added

### New Files
- `lib/outreach/playbooks.ts` - Playbook definitions and seeding
- `lib/outreach/draft-generation.ts` - Draft generation logic
- `lib/outreach/safety.ts` - Safety guardrails
- `lib/outreach/index.ts` - Module exports
- `app/api/outreach/generate/route.ts` - Generate draft API
- `app/api/outreach/playbooks/route.ts` - List playbooks API
- `app/api/outreach/drafts/route.ts` - List drafts API
- `app/api/outreach/drafts/[id]/route.ts` - Get/Update/Delete draft API
- `app/api/outreach/drafts/[id]/approve/route.ts` - Approve draft API
- `app/api/outreach/send/route.ts` - Send draft API
- `app/dashboard/leads/[id]/components/OutreachSection.tsx` - Lead detail outreach UI
- `app/dashboard/outreach/page.tsx` - Outreach queue page
- `app/dashboard/outreach/components/OutreachQueueClient.tsx` - Queue client component
- `app/dashboard/outreach/[id]/page.tsx` - Draft editor page
- `app/dashboard/outreach/[id]/components/DraftEditorClient.tsx` - Draft editor client
- `scripts/phase5b-verification.ts` - Verification script
- `scripts/phase5b-deployment-readiness.ts` - Deployment readiness script
- `PHASE_5B_ASSISTED_OUTREACH_IMPLEMENTATION.md` - This file

### Modified Files
- `prisma/schema.prisma` - Added 4 new models
- `prisma/seed.ts` - Added playbook seeding
- `app/dashboard/leads/[id]/page.tsx` - Added OutreachSection
- `SYSTEM_OVERVIEW.md` - Updated status

---

## Commit History

This implementation was done in multiple commits:

1. `feat(phase5b): schema + migrations for outreach drafts/playbooks/suppression/logs`
2. `feat(phase5b): draft generation + playbook seeding`
3. `feat(phase5b): outreach UI (lead detail + queue)`
4. `feat(phase5b): send API + safety guardrails + rate limits`
5. `test(phase5b): scripts + docs + checklists`

---

## Related Documentation

- [PHASE_5B_ASSISTED_OUTREACH_MVP.md](./PHASE_5B_ASSISTED_OUTREACH_MVP.md) - Design document
- [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) - Overall roadmap
- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System overview
- [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md) - Core definition

---

**Implementation Complete:** January 12, 2026  
**Status:** ✅ Ready for testing and deployment
