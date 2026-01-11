# Phase 2: Enrichment - Constraints and Scope

## Explicit Goals

### Primary Objective
Enrich existing Company records with data from external sources in a structured, idempotent, and safe-to-re-run manner.

### Allowed Sources
- **Company Website** (`Company.website` field)
  - Extract structured data from company websites (when available)
  - Validate website accessibility and extract basic metadata
  
- **Google Custom Search Engine (CSE)**
  - Reuse existing Google CSE integration (`lib/googleSearch.ts`)
  - Search for company information using company name and country
  - Extract search results, snippets, and metadata

### Data Storage
- All enrichment data stored in `Company.enrichmentData` (JSON field)
- Status tracking via `Company.enrichmentStatus`:
  - `"never"` - Never attempted
  - `"pending"` - Currently processing
  - `"success"` - Successfully enriched
  - `"failed"` - Enrichment failed (with error details in enrichmentData)
- Timestamp tracking via `Company.enrichmentLastRun` (DateTime)

### Idempotency Requirements
- Enrichment must be safe to run multiple times on the same company
- Merge strategy: Preserve existing `enrichmentData` unless `forceRefresh: true`
- Partial updates should merge with existing data (don't destroy previous results)
- Each enrichment run should be timestamped and versioned in enrichmentData

### Execution Model
- **Manual trigger only** - No schedulers or queues
- Callable via:
  - API route: `POST /api/enrichment/company` with `{ companyId: string, forceRefresh?: boolean }`
  - Script: Direct function call from Node.js scripts
- No background jobs or automated runs

### Code Organization
- Module-based architecture in `lib/enrichment/`
- Clear separation of concerns:
  - Types (`types.ts`)
  - Interface (`ICompanyEnricher.ts`)
  - Individual enrichers (`modules/WebsiteEnricher.ts`, `modules/GoogleCseEnricher.ts`)
  - Orchestrator (`CompanyEnrichmentRunner.ts`)

---

## Explicit Non-Goals

### No Outreach
- Do NOT send emails, make phone calls, or perform any outbound communication
- Do NOT attempt to contact companies or their representatives

### No Scoring Changes
- Do NOT modify `Company.score` or `Company.scoreFactors`
- Enrichment data is for information gathering only
- Scoring integration is out of scope (future phase)

### No Orders/Purchases
- Do NOT place orders, make purchases, or perform commercial transactions
- Do NOT integrate with e-commerce or payment systems

### No Machine Learning
- Do NOT implement ML models for classification, prediction, or inference
- Simple rule-based extraction only (keyword matching, pattern recognition)
- No training data, no model training, no ML pipelines

### No Schedulers/Queues
- Do NOT implement cron jobs, scheduled tasks, or background job queues
- Do NOT use job processing systems (Bull, BullMQ, Agenda, etc.)
- Manual execution only

### No Activity Logs
- Do NOT create separate activity log tables or audit trails
- Metadata lives on the Company record itself (`enrichmentStatus`, `enrichmentLastRun`)
- Historical enrichment runs may be stored in `enrichmentData` JSON structure

### No Field Updates
- Do NOT directly update `Company.website`, `Company.industry`, or other non-enrichment fields
- All enrichment results go into `enrichmentData` JSON only
- Preserve existing company fields as-is

### No Real-Time Processing
- Do NOT implement WebSockets or real-time streaming
- Synchronous API responses only
- User waits for enrichment to complete

### No Batch Processing
- Do NOT implement bulk enrichment endpoints (enrich multiple companies at once)
- One company per API call
- Batch processing is out of scope for MVP

---

## Scope Boundaries

### In Scope (MVP)
- ✅ Single company enrichment via API route
- ✅ Website enricher (basic metadata extraction from Company.website)
- ✅ Google CSE enricher (reusing existing utilities)
- ✅ Merge strategy for idempotent re-runs
- ✅ Structured JSON storage in enrichmentData
- ✅ Error handling and status tracking
- ✅ TypeScript types and interfaces

### Out of Scope (Future Phases)
- ❌ Multi-company batch enrichment
- ❌ LinkedIn, Crunchbase, or other external APIs
- ❌ Website crawling beyond basic metadata
- ❌ Automatic website field updates
- ❌ Enrichment scoring that affects lead scoring
- ❌ Webhook notifications
- ❌ Rate limiting or quota management (handled at API level)
- ❌ Caching layer (future optimization)

---

## Technical Constraints

### Dependencies
- Must reuse existing `lib/googleSearch.ts` utilities
- Must use Prisma Client for database operations
- Must follow existing code patterns (interface-based architecture)

### Error Handling
- Failures should be captured in `enrichmentData` with error details
- `enrichmentStatus` should reflect final state (`success` or `failed`)
- API should return appropriate HTTP status codes (400, 404, 500)

### Performance
- Enrichment should complete within reasonable time (< 30 seconds typical)
- No timeouts required (handled by API framework)
- No retry logic (user can retry manually)

### Security
- Authentication required for API route (existing NextAuth integration)
- No sensitive data exposure in enrichmentData
- Respect rate limits of Google CSE API (existing handling)

---

## Success Criteria

✅ MVP is complete when:
1. Documentation files created (CONSTRAINTS, DESIGN, MVP)
2. All enrichment modules implemented and tested
3. API route functional for single company enrichment
4. Merge strategy works correctly (preserves existing data)
5. TypeScript compiles without errors
6. Linter passes without errors
7. Manual test script or unit test verifies enrichment on one company
