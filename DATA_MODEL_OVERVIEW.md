# Data Model Overview

**Last Updated:** January 14, 2026  
**Status:** Production Ready

---

## Core Entities

### User

**Purpose:** System users (CCS Apparel team members)

**Key Fields:**
- `id` - Unique identifier (cuid)
- `email` - Unique email address (domain-restricted)
- `password` - Hashed password (bcryptjs)
- `name` - Display name (optional)
- `role` - User role ("admin" or "user")

**Relationships:**
- `assignedLeads` - Leads assigned to this user
- `notes` - Lead notes created by this user
- `createdOutreachDrafts` - Outreach drafts created by this user
- `approvedOutreachDrafts` - Outreach drafts approved by this user

---

### Company

**Purpose:** Company/organization records

**Key Fields:**
- `id` - Unique identifier (cuid)
- `name` - Company name (required)
- `website` - Company website URL (optional)
- `industry` - Industry classification (optional)
- `country` - Country (optional)
- `size` - Company size (e.g., "1-10", "11-50", "51-200")
- `score` - Company score (0-100, default: 0)
- `scoreFactors` - JSON field storing scoring reasons/metadata
- `enrichmentStatus` - Enrichment status ("never", "pending", "success", "failed")
- `enrichmentLastRun` - Last enrichment timestamp
- `enrichmentData` - JSON field storing enrichment results
- `discoveryMetadata` - JSON field storing discovery metadata (source, timestamp, method)

**Relationships:**
- `contacts` - Contacts associated with this company
- `leads` - Leads associated with this company

**Indexes:**
- None (name/website used for lookups)

---

### Contact

**Purpose:** Individual contact records at companies

**Key Fields:**
- `id` - Unique identifier (cuid)
- `firstName` - First name (optional)
- `lastName` - Last name (optional)
- `email` - Email address (optional - can be null)
- `phone` - Phone number (optional)
- `role` - Job title/role (optional)
- `companyId` - Foreign key to Company (optional)
- `linkedInUrl` - LinkedIn profile URL (optional)
- `discoveryMetadata` - JSON field storing discovery metadata

**Relationships:**
- `company` - Associated company (optional)
- `leads` - Leads associated with this contact

**Indexes:**
- `email` - For lookups and deduplication
- `linkedInUrl` - For LinkedIn-based deduplication

---

### Lead

**Purpose:** Sales lead records

**Key Fields:**
- `id` - Unique identifier (cuid)
- `email` - Email address (required)
- `firstName` - First name (optional)
- `lastName` - Last name (optional)
- `company` - Company name (legacy field, kept for backward compatibility)
- `phone` - Phone number (optional)
- `country` - Country (optional)
- `status` - Lead status ("new", "contacted", "qualified", "archived", etc.)
- `score` - Lead score (0-100, default: 0)
- `scoreFactors` - JSON field storing scoring reasons/metadata
- `classification` - Lead classification ("hot", "warm", "cold")
- `scoredAt` - Timestamp when score was last calculated
- `source` - Discovery channel type ("google", "keyword", "linkedin", "social") or null
- `businessSource` - Business/acquisition source ("referral", "existing_customer", "partner", "inbound", "outbound", etc.)
- `companyId` - Foreign key to Company (optional)
- `contactId` - Foreign key to Contact (optional)
- `assignedToId` - Foreign key to User (optional)
- `discoveryMetadata` - JSON field storing discovery metadata

**Relationships:**
- `companyRel` - Associated company
- `contactRel` - Associated contact
- `assignedTo` - Assigned user
- `notes` - Lead notes
- `outreachDrafts` - Outreach drafts for this lead

**Indexes:**
- `email` - For lookups
- `status` - For filtering
- `businessSource` - For filtering
- `assignedToId` - For filtering by owner

---

## Discovery & Run Tracking

### DiscoveryRun

**Purpose:** Tracks discovery run execution

**Key Fields:**
- `id` - Unique identifier (cuid)
- `startedAt` - Run start timestamp
- `finishedAt` - Run completion timestamp (optional)
- `status` - Run status ("pending", "running", "completed", "completed_with_errors", "failed", "cancelled")
- `cancelRequestedAt` - Cancellation request timestamp (optional)
- `cancelRequestedBy` - User ID who requested cancellation (optional)
- `mode` - Run mode ("daily", "manual", "test")
- `dryRun` - Whether this is a preview run (boolean)
- `intentId` - Intent template ID (optional)
- `intentName` - Human-readable intent name (optional)
- `triggeredBy` - Trigger source ("cron", "manual", "test-script")
- `triggeredById` - User ID if manually triggered (optional)
- `stats` - JSON field storing run statistics
- `error` - Error message if failed (optional)
- `resultsJson` - JSON array of DiscoveryResult objects (capped to limits)
- `createdCompaniesCount` - Number of companies created
- `createdContactsCount` - Number of contacts created
- `createdLeadsCount` - Number of leads created
- `skippedCount` - Number of records skipped (duplicates)
- `errorCount` - Number of errors encountered
- `archivedAt` - Archive timestamp (soft delete, optional)
- `archivedById` - User ID who archived (optional)

**Indexes:**
- `status` - For filtering by status
- `startedAt` - For sorting by date
- `mode` - For filtering by mode
- `intentId` - For filtering by intent
- `archivedAt` - For filtering archived runs

---

## Outreach & Messaging

### OutreachPlaybook

**Purpose:** Outreach message templates

**Key Fields:**
- `id` - Unique identifier (cuid)
- `name` - Playbook name
- `audienceType` - Target audience type ("agencies", "schools", "businesses", "events", "tenders")
- `subjectTemplate` - Subject line template with variables (optional)
- `bodyTemplate` - Body template with {{variable}} placeholders
- `variablesSchema` - JSON schema describing available variables (optional)
- `enabled` - Whether playbook is enabled (boolean)

**Relationships:**
- `drafts` - Outreach drafts using this playbook

**Indexes:**
- `enabled` - For filtering enabled playbooks
- `audienceType` - For filtering by audience

---

### OutreachDraft

**Purpose:** Generated outreach message drafts

**Key Fields:**
- `id` - Unique identifier (cuid)
- `leadId` - Foreign key to Lead
- `playbookId` - Foreign key to OutreachPlaybook
- `channel` - Communication channel ("email", "whatsapp", "linkedin_manual")
- `subject` - Generated/edited subject line (optional)
- `body` - Generated/edited body text
- `status` - Draft status ("draft", "approved", "sent", "cancelled", "failed")
- `metadataJson` - JSON field storing missingFields, warnings, etc.
- `createdByUserId` - Foreign key to User (creator)
- `approvedByUserId` - Foreign key to User (approver, optional)

**Relationships:**
- `lead` - Associated lead
- `playbook` - Source playbook
- `createdBy` - User who created draft
- `approvedBy` - User who approved draft (optional)

**Indexes:**
- `leadId` - For filtering by lead
- `playbookId` - For filtering by playbook
- `status` - For filtering by status
- `createdByUserId` - For filtering by creator
- `createdAt` - For sorting by date

---

### SuppressionEntry

**Purpose:** Blocks emails, domains, or companies from outreach

**Key Fields:**
- `id` - Unique identifier (cuid)
- `type` - Suppression type ("email", "domain", "company")
- `value` - The email/domain/company name to suppress
- `reason` - Optional reason for suppression

**Constraints:**
- Unique constraint on `(type, value)` - prevents duplicates

**Indexes:**
- `type` - For filtering by type
- `value` - For lookups

---

### OutboundMessageLog

**Purpose:** Logs all sent messages for audit and rate limiting

**Key Fields:**
- `id` - Unique identifier (cuid)
- `leadId` - Foreign key to Lead
- `channel` - Communication channel ("email", "whatsapp", "linkedin_manual")
- `providerMessageId` - External provider's message ID (optional)
- `to` - Recipient email/phone/etc
- `subject` - Message subject (optional)
- `bodyPreview` - First 200 chars of body for logging
- `status` - Message status ("sent", "failed", "pending")
- `error` - Error message if failed (optional)

**Indexes:**
- `leadId` - For filtering by lead
- `channel` - For filtering by channel
- `status` - For filtering by status
- `createdAt` - For rate limiting queries

---

## Supporting Entities

### ImportJob

**Purpose:** Tracks CSV import jobs

**Key Fields:**
- `id` - Unique identifier (cuid)
- `type` - Import type ("company", "contact", "lead")
- `filename` - Original filename
- `rowsIn` - Total rows in file
- `rowsSuccess` - Successfully imported rows
- `rowsError` - Failed rows
- `status` - Job status ("pending", "running", "completed", "failed")
- `createdAt` - Job creation timestamp
- `finishedAt` - Job completion timestamp (optional)
- `errorMessage` - Error message if failed (optional)

**Indexes:**
- `status` - For filtering by status
- `createdAt` - For sorting by date

---

### LeadNote

**Purpose:** Internal notes on leads

**Key Fields:**
- `id` - Unique identifier (cuid)
- `leadId` - Foreign key to Lead
- `userId` - Foreign key to User
- `content` - Note content
- `createdAt` - Note creation timestamp
- `updatedAt` - Note update timestamp

**Relationships:**
- `lead` - Associated lead (cascade delete)
- `user` - Note author (cascade delete)

**Indexes:**
- `leadId` - For filtering by lead
- `userId` - For filtering by author
- `createdAt` - For sorting by date

---

## JSON Field Structures

### discoveryMetadata

**Structure:**
```json
{
  "discoverySource": "google" | "keyword" | "linkedin" | "social",
  "discoveryTimestamp": "ISO 8601 timestamp",
  "discoveryMethod": "Search query or method used",
  "relevanceScore": number,
  "relevanceReasons": string[],
  "channel": string,
  "scrapedDescription": string
}
```

**Used in:** Company, Contact, Lead

---

### scoreFactors

**Structure:**
```json
{
  "factors": [
    {
      "name": "Status",
      "value": 30,
      "reason": "Lead is qualified"
    },
    {
      "name": "Source",
      "value": 25,
      "reason": "Referral source"
    }
  ],
  "total": 55
}
```

**Used in:** Company, Lead

---

### enrichmentData

**Structure:**
```json
{
  "website": "https://example.com",
  "industry": "Technology",
  "description": "Company description",
  "metadata": {}
}
```

**Used in:** Company

---

### metadataJson (OutreachDraft)

**Structure:**
```json
{
  "missingFields": ["contact.firstName", "company.website"],
  "warnings": ["Missing company website"],
  "variables": {
    "contact.firstName": "John",
    "company.name": "Example Corp"
  }
}
```

**Used in:** OutreachDraft

---

## Data Relationships Diagram

```
User
├── assignedLeads (Lead[])
├── notes (LeadNote[])
├── createdOutreachDrafts (OutreachDraft[])
└── approvedOutreachDrafts (OutreachDraft[])

Company
├── contacts (Contact[])
└── leads (Lead[])

Contact
├── company (Company?)
└── leads (Lead[])

Lead
├── companyRel (Company?)
├── contactRel (Contact?)
├── assignedTo (User?)
├── notes (LeadNote[])
└── outreachDrafts (OutreachDraft[])

OutreachDraft
├── lead (Lead)
├── playbook (OutreachPlaybook)
├── createdBy (User)
└── approvedBy (User?)
```

---

## Related Documentation

- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System architecture
- [DISCOVERY_LIFECYCLE.md](./DISCOVERY_LIFECYCLE.md) - Discovery process
- [prisma/schema.prisma](./prisma/schema.prisma) - Prisma schema definition
