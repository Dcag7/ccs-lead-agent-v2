# Phase 2: Enrichment - MVP Definition

## MVP Scope

This document defines what is **IN** and **OUT** for the Phase 2 Enrichment MVP (Minimum Viable Product).

---

## IN Scope (MVP)

### ✅ Documentation
- `PHASE_2_ENRICHMENT_CONSTRAINTS.md` - Goals, non-goals, and boundaries
- `PHASE_2_ENRICHMENT_DESIGN.md` - Architecture, data model, and design
- `PHASE_2_ENRICHMENT_MVP.md` - This document

### ✅ Core Types and Interfaces
- `lib/enrichment/types.ts` - EnrichmentData v1 types
- `lib/enrichment/ICompanyEnricher.ts` - Enricher interface
- TypeScript types for all enrichment results

### ✅ Enrichment Modules
- `lib/enrichment/modules/WebsiteEnricher.ts`
  - Basic website metadata extraction (title, description, status code)
  - HTTP fetch with timeout (10 seconds)
  - Error handling for inaccessible websites
  - **Limitation**: Homepage only, no full-page crawling

- `lib/enrichment/modules/GoogleCseEnricher.ts`
  - Reuses existing `lib/googleSearch.ts` utilities
  - Wraps `searchCompany()` function
  - Returns structured enrichment result
  - Handles configuration errors gracefully

### ✅ Orchestrator
- `lib/enrichment/CompanyEnrichmentRunner.ts`
  - Loads company from database
  - Runs enrichers (WebsiteEnricher if website exists, GoogleCseEnricher always)
  - Merges results with existing enrichmentData
  - Implements merge strategy (preserve existing unless forceRefresh)
  - Updates database (enrichmentData, enrichmentStatus, enrichmentLastRun)

### ✅ API Route
- `POST /api/enrichment/company`
  - Request: `{ companyId: string, forceRefresh?: boolean }`
  - Authentication required (NextAuth)
  - Returns enrichment summary and updated company
  - Error handling (400, 401, 404, 500)

### ✅ Data Persistence
- Uses existing Prisma schema fields:
  - `Company.enrichmentData` (JSON)
  - `Company.enrichmentStatus` (String: "never" | "pending" | "success" | "failed")
  - `Company.enrichmentLastRun` (DateTime)
- No schema migrations needed (fields already exist)

### ✅ Merge Strategy
- Preserves existing `enrichmentData` unless `forceRefresh: true`
- Merges new source results with existing sources
- Tracks enrichment run history in metadata
- Idempotent: Safe to run multiple times

### ✅ Error Handling
- Individual enricher failures captured in `enrichmentData.errors[]`
- Overall status reflects success/failure
- API returns appropriate HTTP status codes
- Error messages stored in enrichmentData

### ✅ Verification
- Manual test script: `scripts/test-enrichment.ts`
  - Accepts company ID as argument
  - Runs enrichment via CompanyEnrichmentRunner
  - Prints results and verifies database updates
- TypeScript compilation: `npm run build` succeeds
- Linter: `npm run lint` passes

---

## OUT Scope (Future Phases)

### ❌ Advanced Website Enrichment
- Full-page crawling (multiple pages)
- JavaScript execution (Puppeteer/Playwright)
- Structured signal extraction (services, industries, locations, contact channels)
- Content parsing beyond basic metadata
- **Note**: These are Phase 1 Discovery features, not enrichment

### ❌ Additional Enrichment Sources
- LinkedIn enrichment
- Crunchbase enrichment
- Clearbit enrichment
- Any other external APIs
- **Note**: Google CSE is the only external source for MVP

### ❌ Field Updates
- Auto-updating `Company.website` from enrichment results
- Auto-updating `Company.industry` from enrichment results
- Any modification to non-enrichment fields
- **Note**: All results go into `enrichmentData` JSON only

### ❌ Scoring Integration
- Using enrichment data in lead scoring
- Enrichment quality scores
- **Note**: Scoring is Phase 5, not Phase 2

### ❌ Batch Processing
- Bulk enrichment endpoint (`POST /api/enrichment/companies/batch`)
- Enriching multiple companies in one request
- **Note**: One company per API call in MVP

### ❌ Scheduling and Automation
- Cron jobs or scheduled enrichment
- Background job queues
- Automated enrichment triggers
- **Note**: Manual execution only in MVP

### ❌ Caching
- Caching website responses
- Caching Google CSE results
- Cache invalidation logic
- **Note**: Each run hits APIs directly (future optimization)

### ❌ Rate Limiting
- Built-in rate limiting for Google CSE
- Quota management
- **Note**: Handle at API/infrastructure level, not in code

### ❌ Webhooks and Notifications
- Webhook notifications on enrichment completion
- Email notifications
- **Note**: Synchronous API response only

### ❌ Activity Logging
- Separate activity log table
- Detailed audit trail
- **Note**: Metadata lives on Company record

### ❌ Real-Time Updates
- WebSocket updates during enrichment
- Streaming progress updates
- **Note**: Synchronous API response only

### ❌ ML/AI Features
- Machine learning models for classification
- NLP for industry inference (beyond keyword matching)
- Predictive enrichment
- **Note**: Simple rule-based extraction only

---

## MVP Success Criteria

The MVP is considered **complete** when all of the following are true:

1. ✅ Documentation files created and reviewed
2. ✅ All TypeScript types defined and exported
3. ✅ ICompanyEnricher interface implemented
4. ✅ WebsiteEnricher module implemented and tested
5. ✅ GoogleCseEnricher module implemented and tested
6. ✅ CompanyEnrichmentRunner orchestrator implemented and tested
7. ✅ API route refactored to use new enrichment modules
8. ✅ Merge strategy works correctly (preserves existing data)
9. ✅ Error handling works for all failure scenarios
10. ✅ Manual test script successfully enriches one company
11. ✅ TypeScript compiles without errors (`npm run build`)
12. ✅ Linter passes without errors (`npm run lint`)
13. ✅ Enrichment data structure matches EnrichmentData v1 schema
14. ✅ Database updates work correctly (enrichmentStatus, enrichmentLastRun, enrichmentData)

---

## MVP Limitations and Future Enhancements

### Known Limitations
1. **Website Enrichment**: Only basic metadata (title, description, status code). No content extraction.
2. **Google CSE**: Uses existing utilities as-is. No query optimization.
3. **No Caching**: Each run hits APIs directly. May hit rate limits.
4. **Single Company Only**: No batch processing.
5. **Manual Only**: No automation or scheduling.
6. **Simple Error Handling**: Errors stored but no retry logic.

### Future Enhancements (Post-MVP)
1. Enhanced website enricher with structured signal extraction
2. Additional enrichment sources (LinkedIn, Crunchbase, etc.)
3. Caching layer for website and Google CSE responses
4. Batch processing endpoint
5. Scheduled/automated enrichment jobs
6. Advanced error handling with retry logic
7. Enrichment quality scoring
8. Integration with lead scoring (Phase 5)

---

## Testing Checklist

### Manual Testing (Required for MVP)
- [ ] Test enrichment on company with website (WebsiteEnricher + GoogleCseEnricher)
- [ ] Test enrichment on company without website (GoogleCseEnricher only)
- [ ] Test enrichment with `forceRefresh: false` (merge behavior)
- [ ] Test enrichment with `forceRefresh: true` (replace behavior)
- [ ] Test enrichment when Google CSE is not configured (error handling)
- [ ] Test enrichment when website is inaccessible (error handling)
- [ ] Test API route with invalid companyId (404 error)
- [ ] Test API route without authentication (401 error)
- [ ] Verify enrichmentData structure in database
- [ ] Verify enrichmentStatus and enrichmentLastRun updates

### Code Quality (Required for MVP)
- [ ] TypeScript compiles without errors
- [ ] Linter passes without warnings
- [ ] All functions have JSDoc comments
- [ ] Error messages are clear and actionable
- [ ] Code follows existing project patterns

---

## Delivery Timeline

### Phase 2 MVP Deliverables
1. Documentation (3 files) - Day 1
2. Types and interfaces - Day 1
3. Enrichment modules - Day 2
4. Orchestrator - Day 2
5. API route refactor - Day 2
6. Testing and verification - Day 3
7. Code review and finalization - Day 3

**Total Estimated Time**: 3 days for MVP implementation and testing.
