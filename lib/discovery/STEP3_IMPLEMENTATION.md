# STEP 3 - Keyword Discovery Channel Implementation

## Summary

STEP 3 implements Keyword-Based Prospecting Discovery Channel (Day 1 Enabled). Delegates to Google discovery channel and returns aggregated `DiscoveryResult` objects without writing to database.

## Files Created

### Implementation
1. **`lib/discovery/channels/keyword/KeywordDiscoveryChannel.ts`**
   - Implements `IKeywordDiscoveryChannel`
   - Takes keywords from `DiscoveryChannelInput.searchCriteria`
   - Delegates to Google discovery channel for actual searches
   - Aggregates and deduplicates results from multiple keyword searches
   - Updates discovery metadata to reflect keyword source
   - No database writes - only returns results

2. **`lib/discovery/channels/keyword/index.ts`**
   - Exports `IKeywordDiscoveryChannel` interface and `KeywordDiscoveryChannel` class

## Implementation Details

### KeywordDiscoveryChannel

#### Key Features
- **Keyword-Based Discovery**: Uses industry keywords to find prospects
- **Delegation**: Delegates actual discovery to Google discovery channel
- **Query Transformation**: Transforms keywords into search queries (adds "company" suffix)
- **Result Aggregation**: Aggregates results from multiple keyword searches
- **Deduplication**: Basic exact deduplication by website URL (for companies) or name (fallback)
- **Metadata Update**: Updates discovery metadata to reflect keyword source while preserving original source

#### Input
- `DiscoveryChannelInput` with:
  - `searchCriteria`: string or string[] (keywords to search for)
  - `config`: `DiscoveryChannelConfig` with channel type and activation status

#### Output
- `DiscoveryChannelOutput` with:
  - `channelType`: 'keyword'
  - `results`: `DiscoveryResult[]` (aggregated from keyword searches)
  - `success`: boolean
  - `error`: string (if failed)
  - `metadata`: additional metadata (keywords used, queries executed, results found)

#### Delegation Strategy
- **Delegates to GoogleDiscoveryChannel**: Uses existing Google discovery channel for actual searches
- **Requires Google CSE**: Must have `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` configured
- **Stub Behavior**: Returns error if Google discovery is not available (typed error output)

#### Keyword Processing
1. **Extract Keywords**: From `input.searchCriteria` (string or string[])
2. **Transform to Queries**: Adds "company" suffix to each keyword (if not present)
3. **Execute Searches**: Delegates each query to Google discovery channel
4. **Update Metadata**: Changes `discoverySource` to 'keyword' and preserves original source info
5. **Aggregate Results**: Combines all results from keyword searches
6. **Deduplicate**: Removes duplicates based on website URL (exact match)

#### Deduplication Logic
- **For Companies**:
  - Primary: Exact match on website URL
  - Fallback: Exact match on company name (if no website)
- **For Contacts/Leads**:
  - No deduplication logic yet (keeps all results)
- **UNDEFINED**: Advanced deduplication algorithms (fuzzy matching, etc.)

## Constraints Compliance

✅ **Keyword Discovery Only**: Only keyword discovery is implemented  
✅ **No Database Writes**: Results are returned only, not written to database  
✅ **No Orchestration Framework**: Simple composition/delegation, no orchestration system  
✅ **No Schedulers/Jobs**: No execution scheduling or job system  
✅ **No Activity Logging**: No execution history or activity logging  
✅ **No Scoring/Enrichment/Orders**: None of these features included  
✅ **DiscoveryResult Objects**: Returns proper `DiscoveryResult` objects  
✅ **Delegates to Existing Google Channel**: Uses GoogleDiscoveryChannel (no new assumptions)  
✅ **Typed Stub Output**: Returns typed error if Google discovery unavailable  

## UNDEFINED Items Preserved

- **Keyword Source**: Where keywords come from is UNDEFINED (currently from input.searchCriteria)
- **Search Strategy**: How keywords are transformed into queries is UNDEFINED (MVP: direct transformation with "company" suffix)
- **Keyword Examples**: What keywords to use is UNDEFINED
- **Keyword Categories**: Keyword categorization is UNDEFINED
- **Deduplication Algorithm**: Beyond basic URL/name matching, algorithm is UNDEFINED

## Usage Example

### Basic Usage

```typescript
import { KeywordDiscoveryChannel } from '@/lib/discovery/channels/keyword';
import type { DiscoveryChannelInput } from '@/lib/discovery/types';

// Create keyword discovery channel
const keywordChannel = new KeywordDiscoveryChannel();

// Prepare input with keywords
const input: DiscoveryChannelInput = {
  config: {
    channelType: 'keyword',
    activationStatus: 'enabled',
  },
  searchCriteria: [
    'event management',
    'wedding planners',
    'corporate event planning',
    'conference organizers',
  ],
};

// Execute keyword-based discovery
const output = await keywordChannel.discover(input);

// Process results
if (output.success) {
  console.log(`Found ${output.results.length} unique prospects`);
  console.log(`Keywords used: ${output.metadata?.keywordsUsed}`);
  console.log(`Queries executed: ${output.metadata?.queriesExecuted}`);
  
  for (const result of output.results) {
    if (result.type === 'company') {
      console.log(`Company: ${result.name}`);
      console.log(`Website: ${result.website}`);
      console.log(`Discovery source: ${result.discoveryMetadata.discoverySource}`); // 'keyword'
      console.log(`Keywords used: ${result.discoveryMetadata.additionalMetadata?.keywordsUsed}`);
      console.log(`Original source: ${result.discoveryMetadata.additionalMetadata?.originalDiscoverySource}`); // 'google'
    }
  }
} else {
  console.error(`Discovery failed: ${output.error}`);
}
```

### Using Single Keyword

```typescript
// Single keyword as string
const input: DiscoveryChannelInput = {
  config: {
    channelType: 'keyword',
    activationStatus: 'enabled',
  },
  searchCriteria: 'event management companies',
};

const output = await keywordChannel.discover(input);
```

### Error Handling

```typescript
// If Google discovery is not configured
const output = await keywordChannel.discover(input);

if (!output.success) {
  // output.error will contain: "Google Custom Search not configured. Keyword discovery requires Google discovery to be available."
  console.error(output.error);
}
```

## Implementation Flow

1. **Input Validation**
   - Check if Google CSE is configured (required for delegation)
   - Extract keywords from `input.searchCriteria`
   - Return error if not configured or no keywords provided

2. **Keyword Processing**
   - Transform keywords into search queries (add "company" suffix)
   - Each keyword becomes a separate query

3. **Delegation to Google Discovery**
   - Create `GoogleDiscoveryChannel` instance
   - For each query, call `googleChannel.discover()` with query as `searchCriteria`
   - Collect all results

4. **Metadata Update**
   - Change `discoverySource` from 'google' to 'keyword'
   - Update `discoveryMethod` to show keywords used
   - Preserve original source info in `additionalMetadata`

5. **Result Aggregation**
   - Combine all results from keyword searches
   - Deduplicate by website URL (exact match)
   - Return aggregated unique results

## Integration Points

### Dependencies
- **GoogleDiscoveryChannel**: Required for delegation (must be configured)
- **Environment Variables**: 
  - `GOOGLE_CSE_API_KEY` (required)
  - `GOOGLE_CSE_ID` (required)

### No Dependencies On
- Database (no writes)
- Schedulers/job systems
- Activity logging
- Scoring/enrichment/orders

## Testing

To test the implementation:

1. Set environment variables:
   ```
   GOOGLE_CSE_API_KEY=your_api_key
   GOOGLE_CSE_ID=your_search_engine_id
   ```

2. Use the usage examples above to test keyword discovery

3. Verify:
   - Keywords are extracted correctly from input
   - Queries are transformed correctly
   - Results are aggregated from multiple searches
   - Deduplication works (same company from different keywords appears once)
   - Metadata is updated to show 'keyword' source
   - No database writes occur
   - Error handling works if Google discovery unavailable

## Next Steps

**STEP 4: Database Writes**
- Write discovery results to Company, Contact, Lead records
- Map DiscoveryResult to CRM schema
- Handle deduplication before database writes
- Preserve discovery metadata on CRM records

## Notes

- **Delegation Pattern**: Keyword discovery uses composition/delegation to Google discovery, not orchestration
- **Metadata Preservation**: Original discovery source ('google') is preserved in `additionalMetadata` for traceability
- **MVP Simplicity**: Search strategy is simple (direct keyword-to-query transformation). Future enhancements could add variations, combinations, etc.
- **No Load Keywords Implementation**: `loadKeywords()` method returns empty array - keywords come from input.searchCriteria. Future: could load from config file, database, etc.
