# Phase 2B: Contacts + Leads Extraction from Enrichment Results - MVP

## Overview

Phase 2B extracts contact candidates (emails and phones) from Phase 2A enrichment results and creates Contact and Lead records in the database.

**Scope**: Extract from existing `Company.enrichmentData` JSON (no new enrichment sources).

**Goal**: When enrichment runs for a company:
1. Phase 2A enrichment happens as-is (WebsiteEnricher + GoogleCseEnricher)
2. Phase 2B extracts contact candidates from `Company.enrichmentData`
3. Phase 2B creates Contact and Lead records (idempotent, no duplicates)

---

## Data Sources

Extract contact candidates from the following fields in `Company.enrichmentData`:

### a) Website Enrichment Data
- **Source**: `enrichmentData.sources.website.data.description`
- **Extract**: Parse description text for email addresses and phone numbers
- **Reason**: Website descriptions often contain contact information

### b) Google CSE Snippets
- **Source**: `enrichmentData.sources.googleCse.data.snippet`
- **Extract**: Parse snippet text for email addresses and phone numbers

### c) Google CSE Raw Results
- **Source**: `enrichmentData.sources.googleCse.data.rawResults[].snippet`
- **Extract**: Parse each result snippet for email addresses and phone numbers
- **Limit**: Process up to 3 raw results (first 3 entries)

**Note**: The current Phase 2A MVP structure does not include `contactChannels` fields or `discoveredProfiles`. We extract from text snippets only. Future phases may add structured contact data.

---

## Extraction Rules

### Email Extraction
- **Pattern**: Use regex to match email addresses in text
- **Pattern**: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`
- **Normalization**:
  - Convert to lowercase
  - Trim whitespace
  - Remove duplicates within the same extraction

### Phone Extraction
- **Pattern**: Use regex to match phone numbers
- **Pattern**: `/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g`
- **Normalization**:
  - Trim whitespace
  - Remove common formatting characters (keep +, digits, spaces)
  - Remove duplicates within the same extraction

### Placeholder Filtering
- **Filter out** obvious placeholder/test emails:
  - Contains "example" (e.g., `example@example.com`)
  - Contains "noreply" or "no-reply" (e.g., `noreply@company.com`)
  - Contains "test" (e.g., `test@test.com`)
  - Contains "placeholder" (e.g., `placeholder@example.com`)
- **Keep** everything else (even if it looks generic)

---

## Contact Creation Rules

### Deduplication
- **Primary Key**: `(companyId, normalizedEmail)`
- **Normalized Email**: Lowercase, trimmed
- **Behavior**: If Contact exists with same `companyId` + `email` (case-insensitive), do not create duplicate

### Contact Fields Mapping
- **email** (required): Extracted email address (normalized)
- **phone** (optional): Extracted phone number (if found with same source)
- **companyId** (required): Company ID from enrichment
- **firstName** (optional): `null` (not extracted in MVP)
- **lastName** (optional): `null` (not extracted in MVP)
- **role** (optional): `null` (not extracted in MVP - too error-prone)
- **linkedInUrl** (optional): `null` (not available in Phase 2A)
- **discoveryMetadata** (optional): Store minimal metadata:
  ```json
  {
    "source": "enrichment",
    "enrichmentSource": "website" | "googleCse",
    "extractedAt": "2024-01-01T00:00:00Z",
    "rawEvidence": "snippet text where email/phone was found"
  }
  ```

### Update Logic (Idempotency)
- **If Contact exists**: Only update `phone` field if:
  - Existing `phone` is `null` AND
  - New `phone` is not `null`
- **Do NOT overwrite** existing non-null fields
- **Do NOT update** `discoveryMetadata` on existing contacts (preserve first extraction)

---

## Lead Creation Rules

### Deduplication
- **Primary Lookup**: Find existing Lead by `(contactId, email)` OR `(companyId, email)`
- **Behavior**: If Lead exists with same `contactId` + `email` OR `companyId` + `email`, do not create duplicate

### Lead Fields Mapping
- **email** (required): Same as Contact email
- **firstName** (optional): `null` (not extracted in MVP)
- **lastName** (optional): `null` (not extracted in MVP)
- **company** (optional): Company name (backward compatibility field)
- **phone** (optional): Same as Contact phone
- **country** (optional): Company country (if available)
- **status** (required): `"new"` (default)
- **score** (required): `0` (default)
- **scoreFactors** (optional): `null`
- **source** (optional): `null` (not a discovery channel type - store in discoveryMetadata instead)
- **companyId** (required): Company ID
- **contactId** (required): Contact ID (link to created/found Contact)
- **discoveryMetadata** (optional): Store enrichment metadata:
  ```json
  {
    "source": "enrichment",
    "enrichmentSource": "website" | "googleCse",
    "extractedAt": "2024-01-01T00:00:00Z",
    "contactSource": "enrichment"
  }
  ```

### Source Field Strategy
- **Lead.source**: Set to `null` (not a discovery channel type)
- **Lead.discoveryMetadata.source**: Set to `"enrichment"` (store source here)
- **Reason**: Following pattern from `persistDiscoveryResults.ts` - only set `source` if it's a valid discovery channel type (`'google'`, `'keyword'`, `'linkedin'`, `'social'`)

---

## Persistence Flow

1. **Extract candidates** from `Company.enrichmentData`
2. **For each candidate with email**:
   - Normalize email (lowercase, trim)
   - Check if Contact exists: `(companyId, email)`
   - If not exists: Create Contact
   - If exists: Optionally update `phone` if Contact.phone is null and candidate.phone is not null
3. **For each Contact** (created or existing):
   - Check if Lead exists: `(contactId, email)` OR `(companyId, email)`
   - If not exists: Create Lead linked to `companyId` + `contactId`
   - If exists: Skip (do not update)

### Idempotency Guarantees
- **Re-running enrichment** will not create duplicate Contacts
- **Re-running enrichment** will not create duplicate Leads
- **Existing Contacts** are preserved (only update missing `phone` if new one available)
- **Existing Leads** are preserved (never updated)

---

## Integration Points

### CompanyEnrichmentRunner
- **After** Phase 2A completes and persists `Company.enrichmentData`:
  - Load latest Company record (including enrichmentData)
  - Extract contact candidates
  - Persist Contacts + Leads
  - Return summary (contactsCreated, contactsExisting, leadsCreated, leadsExisting, extractedCandidatesCount)

### API Route Response
- **Extend** `/api/enrichment/company` response to include:
  ```json
  {
    "success": true,
    "company": { ... },
    "enrichmentSummary": { ... },
    "contactsLeadsSummary": {
      "extractedCandidatesCount": 5,
      "contactsCreated": 3,
      "contactsExisting": 0,
      "contactsUpdated": 1,
      "leadsCreated": 3,
      "leadsExisting": 0
    }
  }
  ```

---

## UI Updates

### Company Detail Page
- **Already shows** Contacts and Leads sections
- **Already uses** `router.refresh()` after enrichment
- **No changes needed** - counts will update automatically after enrichment

---

## Constraints

- ✅ No schema changes (uses existing Contact/Lead models)
- ✅ No new migrations
- ✅ No external services (only parses existing enrichment data)
- ✅ No background jobs (runs synchronously in enrichment flow)
- ✅ Idempotent (safe to re-run)
- ✅ No outreach/scoring/orders/ML
- ✅ No activity log tables (metadata stored on Contact/Lead records)

---

## Example Extraction

### Input: Company.enrichmentData
```json
{
  "version": "1.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "sources": {
    "website": {
      "source": "website",
      "success": true,
      "data": {
        "description": "Contact us at sales@company.com or call +27 11 123 4567"
      }
    },
    "googleCse": {
      "source": "googleCse",
      "success": true,
      "data": {
        "snippet": "Company information. Email: info@company.com Phone: +27111234567",
        "rawResults": [
          {
            "snippet": "Contact support@company.com for assistance"
          }
        ]
      }
    }
  }
}
```

### Extracted Candidates
1. `{ email: "sales@company.com", phone: "+27 11 123 4567", source: "website" }`
2. `{ email: "info@company.com", phone: "+27111234567", source: "googleCse" }`
3. `{ email: "support@company.com", source: "googleCse" }`

### Created Records
- **Contacts**: 3 contacts (one per email)
- **Leads**: 3 leads (one per contact)

---

## Testing

### Test Script
- `scripts/test-enrichment-contacts-leads.ts`
- Takes `companyId` + `forceRefresh` option
- Calls enrichment API route
- Prints summary counts
- Queries Prisma to show contacts/leads for company

### Verification Steps
1. Run enrichment on a company
2. Check Company.enrichmentData has data
3. Verify Contacts created (check by companyId + email)
4. Verify Leads created (check by contactId + email)
5. Re-run enrichment (should not create duplicates)
6. Verify counts match expectations

---

## Future Enhancements (Out of Scope)

- Extract firstName/lastName from text (requires NLP)
- Extract role/title from text (requires NLP)
- Extract LinkedIn profiles from search results
- Structured contact forms parsing (requires HTML parsing)
- Phone number validation/country detection
- Email validation (domain verification)
- Duplicate detection across companies (same email, different company)
