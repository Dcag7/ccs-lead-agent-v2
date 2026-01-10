# STEP 5 - Persistence Layer Implementation

## Summary

STEP 5 implements persistence layer that writes discovery results to Company, Contact, and Lead records in the database. Performs basic existence checks (exact match only), links records correctly, and attaches discovery metadata using dedicated `discoveryMetadata` fields.

## Schema Changes

### Migration: `add_discovery_metadata_fields`

**Migration File:** `prisma/migrations/add_discovery_metadata_fields/migration.sql`

### Schema Diff

```diff
model Company {
  // ... existing fields ...
+  // Discovery metadata fields (Phase 1)
+  discoveryMetadata Json? // Stores discovery metadata (source, timestamp, method, etc.)
  
  @@map("companies")
}

model Contact {
  id                String   @id @default(cuid())
  firstName         String?
  lastName          String?
- email             String
+ email             String?  // Made optional
  phone             String?
  role              String?
  companyId         String?
+ linkedInUrl       String?  // LinkedIn profile URL (from discovery)
+ discoveryMetadata Json?    // Stores discovery metadata (source, timestamp, method, etc.)
  // ... rest of fields ...
  
+ @@index([linkedInUrl])
  @@index([email])
  @@map("contacts")
}

model Lead {
  // ... existing fields ...
  source            String? // Lead source (can be discovery channel type)
  companyId         String?
  contactId         String?
+ discoveryMetadata Json?   // Stores discovery metadata (source, timestamp, method, etc.)
  // ... rest of fields ...
}
```

### Changes Made

1. **Company Model**
   - Added `discoveryMetadata Json?` field

2. **Contact Model**
   - Changed `email` from `String` (required) to `String?` (optional)
   - Added `linkedInUrl String?` field
   - Added `discoveryMetadata Json?` field
   - Added index on `linkedInUrl`

3. **Lead Model**
   - Added `discoveryMetadata Json?` field

## Files Created/Modified

### Implementation
1. **`lib/discovery/persistDiscoveryResults.ts`** (Updated)
   - Implements persistence logic for discovery results
   - Writes Company, Contact, and Lead records
   - Performs exact match existence checks
   - Links records correctly (Contact->Company, Lead->Company/Contact)
   - Attaches discovery metadata to dedicated `discoveryMetadata` fields
   - Synchronous execution - no side effects beyond DB writes
   - Idempotent for exact duplicates

2. **`lib/discovery/index.ts`** (Updated)
   - Exports `persistDiscoveryResults` function and `PersistenceResult` type

3. **`prisma/schema.prisma`** (Updated)
   - Added `discoveryMetadata` fields to Company, Contact, Lead models
   - Made Contact.email optional
   - Added Contact.linkedInUrl field
   - Added index on Contact.linkedInUrl

4. **`prisma/migrations/add_discovery_metadata_fields/migration.sql`** (Created)
   - Migration SQL for schema changes

## Implementation Details

### persistDiscoveryResults Function

#### Key Features
- **Accepts DiscoveryResult[]**: Takes array of discovery results to persist
- **Exact Match Existence Checks**: Checks for existing records using exact matching
- **Record Linking**: Links contacts to companies, leads to companies and contacts
- **Metadata Storage**: Stores discovery metadata in dedicated `discoveryMetadata` JSON fields
- **Idempotent**: Skips exact duplicates (won't create duplicate records)
- **Synchronous**: Executes synchronously - no background jobs or async processing

#### Input
- `results: DiscoveryResult[]` - Discovery results to persist

#### Output
- `PersistenceResult` with:
  - `companiesCreated`: number
  - `companiesSkipped`: number
  - `contactsCreated`: number
  - `contactsSkipped`: number
  - `leadsCreated`: number
  - `leadsSkipped`: number
  - `errors`: Array<{ resultType, error }>
  - `success`: boolean

#### Processing Order
1. **Companies First**: Process all company results first
2. **Contacts Second**: Process contact results (can link to companies)
3. **Leads Last**: Process lead results (can link to companies and contacts)

#### Existence Checks (Exact Match Only)

**Company:**
- Primary: Exact match on website URL
- Fallback: Exact match on company name (case-insensitive)

**Contact:**
- **Step 1**: Exact match on email (if email present)
- **Step 2**: Exact match on linkedInUrl (if LinkedIn URL present and no email match)
- **Step 3**: Exact match on (name + companyId) (if no email/LinkedIn match)
  - Matches by firstName/lastName or full name parts
  - Requires both name and companyId match

**Lead:**
- Primary: Exact match on email (required field)

#### Record Linking

**Contact -> Company:**
- Links via `companyId` if company name provided
- Searches for existing company by name (case-insensitive)
- Uses company ID from current batch if company was just created

**Lead -> Company:**
- Links via `companyId` if company provided
- Searches by website first, then by name
- Uses company ID from current batch if company was just created

**Lead -> Contact:**
- Links via `contactId` if contact provided
- Searches by email
- Uses contact ID from current batch if contact was just created

### Discovery Metadata Storage

**All metadata stored in dedicated `discoveryMetadata` JSON fields - no conflicts with other fields.**

#### Company Records
- **Metadata Storage**: Stored in `discoveryMetadata` JSON field
- **Stored Data**:
  - `discoverySource`: Discovery channel type ('google', 'keyword', 'linkedin', 'social')
  - `discoveryTimestamp`: When discovered (ISO string)
  - `discoveryMethod`: Method/query used
  - Additional metadata from `additionalMetadata`

#### Contact Records
- **Metadata Storage**: Stored in `discoveryMetadata` JSON field
- **LinkedIn URL**: Stored in `linkedInUrl` field (separate from metadata)
- **Stored Data**:
  - `discoverySource`: Discovery channel type
  - `discoveryTimestamp`: When discovered (ISO string)
  - `discoveryMethod`: Method/query used
  - Additional metadata from `additionalMetadata`
- **Email**: Now optional - contacts can be created without email

#### Lead Records
- **Metadata Storage**: Stored in `discoveryMetadata` JSON field
- **Source Field**: Only set if `source` is a valid discovery channel type ('google', 'keyword', 'linkedin', 'social')
- **Stored Data**:
  - `discoverySource`: Discovery channel type
  - `discoveryTimestamp`: When discovered (ISO string)
  - `discoveryMethod`: Method/query used
  - Additional metadata from `additionalMetadata`
- **Note**: `source` field is only set for discovery channel types - does not overwrite existing sources

## Constraints Compliance

✅ **Write ONLY to Existing Models**: Only writes to Company, Contact, Lead models  
✅ **Attach Metadata to Dedicated Fields**: Metadata stored in dedicated `discoveryMetadata` fields (no conflicts)  
✅ **NO Schedulers/Jobs**: Synchronous execution - no background workers  
✅ **NO Execution History**: No tracking of runs or execution status  
✅ **NO Activity Logging**: No activity logging tables  
✅ **NO Enrichment Triggers**: Does not trigger enrichment  
✅ **NO Scoring Updates**: Does not update scoring  
✅ **NO Orders/Learning**: No order or learning logic  
✅ **Prisma Only**: Uses existing Prisma configuration  
✅ **Exact Match Only**: Basic existence checks using exact matching  
✅ **Idempotent**: Skips exact duplicates - won't create duplicate records  
✅ **Contact Email Optional**: Contacts can be created without email  

## Usage Example

### Basic Usage

```typescript
import { persistDiscoveryResults } from '@/lib/discovery';
import type { DiscoveryResult } from '@/lib/discovery/types';

// Discovery results from aggregator
const results: DiscoveryResult[] = [
  // ... discovery results ...
];

// Persist results to database
const persistenceResult = await persistDiscoveryResults(results);

// Check results
if (persistenceResult.success) {
  console.log(`Companies created: ${persistenceResult.companiesCreated}`);
  console.log(`Companies skipped: ${persistenceResult.companiesSkipped}`);
  console.log(`Contacts created: ${persistenceResult.contactsCreated}`);
  console.log(`Contacts skipped: ${persistenceResult.contactsSkipped}`);
  console.log(`Leads created: ${persistenceResult.leadsCreated}`);
  console.log(`Leads skipped: ${persistenceResult.leadsSkipped}`);
  
  if (persistenceResult.errors.length > 0) {
    console.error('Errors:', persistenceResult.errors);
  }
} else {
  console.error('Persistence failed');
}
```

### Complete Flow Example

```typescript
import { DiscoveryAggregator, persistDiscoveryResults } from '@/lib/discovery';
import type { DiscoveryChannelInput } from '@/lib/discovery/types';

// Step 1: Aggregate discovery results
const aggregator = new DiscoveryAggregator();
const aggregationResult = await aggregator.execute({
  enabledChannels: ['google', 'keyword'],
  input: {
    config: { channelType: 'google', activationStatus: 'enabled' },
    searchCriteria: ['event management companies', 'wedding planners'],
  },
});

if (!aggregationResult.success) {
  console.error('Aggregation failed');
  return;
}

// Step 2: Persist results to database
const persistenceResult = await persistDiscoveryResults(aggregationResult.results);

// Step 3: Check results
console.log('Persistence completed:');
console.log(`  Companies: ${persistenceResult.companiesCreated} created, ${persistenceResult.companiesSkipped} skipped`);
console.log(`  Contacts: ${persistenceResult.contactsCreated} created, ${persistenceResult.contactsSkipped} skipped`);
console.log(`  Leads: ${persistenceResult.leadsCreated} created, ${persistenceResult.leadsSkipped} skipped`);

if (persistenceResult.errors.length > 0) {
  console.error('Errors encountered:', persistenceResult.errors);
}
```

## Data Mapping

### DiscoveryResult → Prisma Models

**Company:**
- `name` → `Company.name` (required)
- `website` → `Company.website`
- `industry` → `Company.industry`
- `country` → `Company.country`
- `discoveryMetadata` → `Company.discoveryMetadata` (JSON)

**Contact:**
- `email` → `Contact.email` (optional)
- `name` → `Contact.firstName` + `Contact.lastName` (parsed)
- `phone` → `Contact.phone`
- `role` → `Contact.role`
- `linkedInUrl` → `Contact.linkedInUrl`
- `companyName` → `Contact.companyId` (via lookup)
- `discoveryMetadata` → `Contact.discoveryMetadata` (JSON)

**Lead:**
- `contact.email` or `company.contactChannels.emails[0]` → `Lead.email` (required)
- `contact.firstName/lastName` → `Lead.firstName/lastName`
- `company.name` → `Lead.company` (legacy field) + `Lead.companyId`
- `source` → `Lead.source` (only if valid discovery channel type: 'google', 'keyword', 'linkedin', 'social')
- `contact.phone` or `company.contactChannels.phones[0]` → `Lead.phone`
- `company.country` → `Lead.country`
- Discovery metadata → `Lead.discoveryMetadata` (JSON)

## Error Scenarios

1. **Lead Without Email**: Skipped with error (email is required)
2. **Company Already Exists**: Skipped (idempotent behavior)
3. **Contact Already Exists**: Skipped (idempotent behavior - matches by email, linkedInUrl, or name+companyId)
4. **Lead Already Exists**: Skipped (idempotent behavior)
5. **Database Connection Error**: Returns error in result.errors

## Testing

To test the implementation:

1. **Run Migration**: Apply migration to add discovery metadata fields
   ```bash
   npx prisma migrate dev
   ```

2. **Run Discovery**: Execute discovery aggregator to get results

3. **Persist Results**: Call `persistDiscoveryResults()` with results

4. **Verify Records**: Check database for created records

5. **Verify Metadata**: Check `discoveryMetadata` JSON fields for discovery metadata

6. **Verify Linking**: Check that contacts link to companies, leads link to both

7. **Verify Idempotency**: Run persistence twice - second run should skip duplicates

8. **Verify Contact Deduplication**: Test with contacts having only email, only LinkedIn URL, or only name+company

## Changes from Previous Version

### Schema Changes
- ✅ Added dedicated `discoveryMetadata` fields to all models
- ✅ Made Contact.email optional
- ✅ Added Contact.linkedInUrl field
- ✅ Added index on Contact.linkedInUrl

### Persistence Logic Changes
- ✅ Use only `discoveryMetadata` fields (not `enrichmentData` or `scoreFactors`)
- ✅ Relaxed Contact requirements (email now optional)
- ✅ Updated Contact deduplication (email OR linkedInUrl OR name+companyId)
- ✅ Lead.source only set for valid discovery channel types

### Removed
- ❌ No longer stores metadata in `enrichmentData` (Company)
- ❌ No longer stores metadata in `scoreFactors` (Lead)
- ❌ No longer requires Contact.email

## Migration Details

**Migration Name:** `add_discovery_metadata_fields`

**Migration SQL:**
```sql
-- AlterTable: Add discovery metadata field to companies
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "discoveryMetadata" JSONB;

-- AlterTable: Make email optional and add discovery fields to contacts
ALTER TABLE "contacts" ALTER COLUMN "email" DROP NOT NULL,
ADD COLUMN IF NOT EXISTS "linkedInUrl" TEXT,
ADD COLUMN IF NOT EXISTS "discoveryMetadata" JSONB;

-- CreateIndex: Index on linkedInUrl for contacts
CREATE INDEX IF NOT EXISTS "contacts_linkedInUrl_idx" ON "contacts"("linkedInUrl");

-- AlterTable: Add discovery metadata field to leads
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "discoveryMetadata" JSONB;
```

**To Apply Migration:**
```bash
npx prisma migrate dev
```

## Notes

1. **Dedicated Fields**: All discovery metadata stored in dedicated fields (no conflicts)
2. **Contact Email Optional**: Contacts can be created without email using LinkedIn URL or name+companyId
3. **Contact Deduplication**: Three-tier deduplication: email → linkedInUrl → (name + companyId)
4. **Lead Source**: Only set for discovery channel types - does not overwrite existing sources
5. **Exact Matching Only**: Basic existence checks - no fuzzy matching
6. **Synchronous**: All database writes are synchronous (may be slow for large batches)
7. **No Transactions**: Individual record operations are independent (not wrapped in transaction)

## Next Steps

After STEP 5 review:
- **Migration Application**: Apply migration to database
- **Validation**: Add validation for discovery results before persistence
- **Error Handling**: Enhance error handling for edge cases
- **Performance**: Consider batching for large result sets
- **Transactions**: Consider wrapping operations in transactions for consistency
