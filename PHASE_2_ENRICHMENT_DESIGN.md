# Phase 2: Enrichment - Design Document

## Architecture Overview

Phase 2 enrichment follows a modular, interface-based architecture similar to Phase 1 Discovery. The system is designed for extensibility while maintaining clear boundaries.

```
lib/enrichment/
├── types.ts                    # EnrichmentData v1 types and interfaces
├── ICompanyEnricher.ts         # Main enrichment interface
├── CompanyEnrichmentRunner.ts  # Orchestrator (runs multiple enrichers, merges results)
└── modules/
    ├── WebsiteEnricher.ts      # Website-based enrichment
    └── GoogleCseEnricher.ts    # Google CSE enrichment (reuses lib/googleSearch.ts)
```

---

## Data Model

### Company Schema (Existing Fields)
```prisma
model Company {
  enrichmentStatus  String?  // "never" | "pending" | "success" | "failed"
  enrichmentLastRun DateTime?
  enrichmentData    Json?    // EnrichmentData v1 structure
}
```

### EnrichmentData v1 JSON Schema

```typescript
interface EnrichmentData {
  version: "1.0";
  timestamp: string; // ISO 8601
  sources: {
    website?: WebsiteEnrichmentResult;
    googleCse?: GoogleCseEnrichmentResult;
  };
  metadata: {
    enrichmentRunId: string; // Unique ID for this run
    forceRefresh: boolean;   // Whether this run forced refresh
    previousVersion?: string; // Previous version timestamp (for merge tracking)
  };
  errors?: Array<{
    source: "website" | "googleCse";
    error: string;
    timestamp: string;
  }>;
}

interface WebsiteEnrichmentResult {
  source: "website";
  timestamp: string;
  url: string;
  success: boolean;
  data?: {
    title?: string;
    description?: string;
    accessible: boolean;
    statusCode?: number;
    contentType?: string;
    // Future: Extracted signals (services, industries, locations, contact channels)
  };
  error?: string;
}

interface GoogleCseEnrichmentResult {
  source: "googleCse";
  timestamp: string;
  success: boolean;
  configured: boolean;
  query: string; // Actual search query used
  data?: {
    primaryUrl?: string;
    snippet?: string;
    rawResults?: Array<{
      title: string;
      link: string;
      snippet: string;
      displayLink?: string;
    }>;
    metadata?: {
      totalResults?: string;
      searchTime?: number;
      formattedSearchTime?: string;
    };
    inferredIndustry?: string;
    websiteFound?: boolean;
  };
  error?: string;
}
```

---

## Module Design

### ICompanyEnricher Interface

```typescript
interface ICompanyEnricher {
  /**
   * Unique identifier for this enricher (e.g., "website", "googleCse")
   */
  getName(): string;

  /**
   * Enrich a company using this enricher
   * 
   * @param company - Company record (at minimum: id, name, website?, country?)
   * @param options - Enrichment options (forceRefresh, etc.)
   * @returns Enrichment result for this source
   */
  enrich(
    company: { id: string; name: string; website?: string | null; country?: string | null },
    options?: { forceRefresh?: boolean }
  ): Promise<EnrichmentResult>;
}

interface EnrichmentResult {
  source: string;
  success: boolean;
  timestamp: string;
  data?: any; // Source-specific data
  error?: string;
}
```

### WebsiteEnricher

**Purpose**: Extract basic metadata from company website (when `Company.website` is available).

**Implementation**:
- Fetches the website URL (from `Company.website`)
- Validates accessibility (HTTP status check)
- Extracts basic metadata:
  - Page title (from `<title>` tag)
  - Meta description (from `<meta name="description">`)
  - Content-Type header
  - HTTP status code
- **Future**: Extract structured signals (reuse `IWebsiteSignalExtractor` from Phase 1)

**Error Handling**:
- Invalid URL → error result
- HTTP timeout/error → error result with status code
- Non-200 status → partial result with status code

**Limitations (MVP)**:
- No full-page crawling (homepage only)
- No JavaScript execution (static HTML only)
- No content extraction beyond metadata
- Simple fetch with timeout (no retry logic)

### GoogleCseEnricher

**Purpose**: Enrich company using Google Custom Search Engine.

**Implementation**:
- Reuses `lib/googleSearch.ts` utilities:
  - `searchCompany(name, country)` - Performs Google CSE search
  - `isLikelyCompanyWebsite(url)` - Validates URLs
  - `inferIndustryFromSnippet(snippet)` - Industry inference
- Wraps existing functionality in enrichment result structure
- Handles configuration errors gracefully (if Google CSE not configured)

**Error Handling**:
- Not configured → error result with `configured: false`
- API errors → error result with error message
- Network errors → error result with error message

**Limitations (MVP)**:
- Uses existing `searchCompany` function as-is
- No query optimization or refinement
- No caching (each run hits API)

### CompanyEnrichmentRunner

**Purpose**: Orchestrates multiple enrichers and merges results.

**Responsibilities**:
1. Load company from database
2. Initialize enrichers (WebsiteEnricher, GoogleCseEnricher)
3. Run enrichers in parallel (or sequentially if dependencies exist)
4. Merge results into `EnrichmentData` structure
5. Apply merge strategy (preserve existing data unless `forceRefresh`)
6. Update database with new enrichment data
7. Update `enrichmentStatus` and `enrichmentLastRun`

**Merge Strategy**:
```typescript
function mergeEnrichmentData(
  existing: EnrichmentData | null,
  newResults: EnrichmentResult[],
  forceRefresh: boolean
): EnrichmentData {
  if (forceRefresh || !existing) {
    // Full replace: Create new enrichmentData from new results
    return buildEnrichmentData(newResults, forceRefresh);
  }
  
  // Merge: Preserve existing source data, only update if new data exists
  const merged: EnrichmentData = {
    ...existing,
    sources: {
      ...existing.sources,
      // Only update sources that have new data
      ...(newResults.find(r => r.source === "website") && {
        website: buildWebsiteResult(newResults.find(r => r.source === "website"))
      }),
      ...(newResults.find(r => r.source === "googleCse") && {
        googleCse: buildGoogleCseResult(newResults.find(r => r.source === "googleCse"))
      })
    },
    metadata: {
      ...existing.metadata,
      enrichmentRunId: generateRunId(),
      previousVersion: existing.timestamp
    }
  };
  
  return merged;
}
```

**Error Handling**:
- Individual enricher failures → Capture in `errors` array, continue with other enrichers
- Database errors → Throw error, don't update status
- Partial success → Mark as `success` if at least one enricher succeeded

---

## API Route Design

### POST /api/enrichment/company

**Request Body**:
```typescript
{
  companyId: string;
  forceRefresh?: boolean; // Default: false
}
```

**Response (Success)**:
```typescript
{
  success: true;
  company: Company; // Updated company record
  enrichmentSummary: {
    status: "success" | "failed";
    sourcesRun: string[]; // ["website", "googleCse"]
    sourcesSucceeded: string[];
    sourcesFailed: string[];
    timestamp: string;
  };
}
```

**Response (Error)**:
```typescript
{
  success: false;
  error: string;
  details?: string;
}
```

**Status Codes**:
- `200` - Success (enrichment completed)
- `400` - Bad request (invalid companyId)
- `401` - Unauthorized (not authenticated)
- `404` - Company not found
- `500` - Internal server error

**Authentication**: Required (NextAuth session check)

---

## Flow Diagram

```
1. API Route receives POST /api/enrichment/company
   ↓
2. Authenticate user (NextAuth)
   ↓
3. Validate request body (companyId, forceRefresh?)
   ↓
4. Load Company from database
   ↓
5. Initialize CompanyEnrichmentRunner
   ↓
6. Runner loads existing enrichmentData (if any)
   ↓
7. Runner initializes enrichers:
   - WebsiteEnricher (if Company.website exists)
   - GoogleCseEnricher (always)
   ↓
8. Runner executes enrichers (parallel execution)
   ↓
9. Runner merges results with existing data (merge strategy)
   ↓
10. Runner updates Company record:
    - enrichmentData (merged JSON)
    - enrichmentStatus ("success" or "failed")
    - enrichmentLastRun (current timestamp)
   ↓
11. API Route returns response with enrichment summary
```

---

## Extension Points (Future Phases)

### Additional Enrichers
- `LinkedInEnricher` - LinkedIn company profile data
- `CrunchbaseEnricher` - Crunchbase company data
- `ClearbitEnricher` - Clearbit enrichment API

### Enhanced Website Enricher
- Full-page crawling (multiple pages)
- JavaScript execution (Puppeteer/Playwright)
- Structured signal extraction (reuse `IWebsiteSignalExtractor`)

### Batch Processing
- `POST /api/enrichment/companies/batch` - Enrich multiple companies
- Queue-based processing for large batches

### Scoring Integration
- Use enrichment data in lead scoring calculations
- Enrichment quality scores

---

## Testing Strategy

### Unit Tests (MVP)
- `WebsiteEnricher.enrich()` - Mock HTTP responses
- `GoogleCseEnricher.enrich()` - Mock Google CSE responses
- `CompanyEnrichmentRunner.mergeEnrichmentData()` - Test merge logic

### Integration Test (MVP)
- Manual test script: `scripts/test-enrichment.ts`
  - Takes company ID as argument
  - Runs enrichment
  - Prints results
  - Verifies database updates

### Manual Testing
- Use API route from frontend or Postman/curl
- Verify enrichmentData structure in database
- Test merge strategy with `forceRefresh: false` and `true`

---

## Dependencies

### Existing Code (Reuse)
- `lib/googleSearch.ts` - Google CSE utilities
- `lib/prisma.ts` - Prisma Client
- `lib/auth.ts` - NextAuth configuration
- `app/api/enrichment/company/route.ts` - Existing API route (to be refactored)

### New Dependencies
- None (use native `fetch` for website requests)

---

## Performance Considerations

### Execution Time
- Website fetch: ~2-5 seconds (timeout: 10 seconds)
- Google CSE: ~1-3 seconds
- Database operations: <100ms
- **Total**: ~5-10 seconds typical, <30 seconds worst case

### Rate Limiting
- Google CSE: 100 queries/day free tier (existing handling)
- Website fetching: No limits (but respect robots.txt in future)

### Optimization (Future)
- Cache website responses (TTL: 24 hours)
- Batch Google CSE requests (if quota allows)
- Parallel execution of enrichers (already implemented)
