# Phase 1 Discovery MVP Definition

> Based on PHASE_1_Discovery_Design_Locked.md
> Rules: No vendors/APIs/tools, no schedulers/job systems, no outreach/scoring/orders/learning

---

## 1. MVP Discovery Channels

### Day 1 Enabled Channels (Always Active)

1. **Google Search Discovery**
   - Execute searches using configured search queries
   - Parse search results for company websites and contact information
   - Extract URLs, company names, brief descriptions

2. **Website Signal Extraction**
   - Access company websites discovered through searches
   - Extract structured signals from website content
   - Performed for each discovered company URL

3. **Industry Keyword-Based Prospecting**
   - Use industry keywords to find prospects
   - Search across discovery sources using keywords
   - Aggregate results from keyword-based searches

### Gated Channels (Activation Conditional)

4. **LinkedIn Profile Discovery** (CORE Channel - Gated)
   - **Activation Status:** Gated by UNDEFINED access constraints
   - **Behavior:** If disabled, Phase 1 continues with other channels
   - **Function:** Discover LinkedIn profiles for companies and contacts
   - **Requires:** Access credentials/permissions (UNDEFINED)
   - **Note:** Must function without this channel if access unavailable

5. **Social Platform Monitoring** (CORE Channel - Gated)
   - **Activation Status:** Gated by UNDEFINED access constraints
   - **Behavior:** If disabled, Phase 1 continues with other channels
   - **Function:** Monitor social platforms for prospect activity and mentions
   - **Requires:** Platform identifiers and access (UNDEFINED)
   - **Note:** Must function without this channel if access unavailable

---

## 2. Minimum Website Signals to Extract

### Explicit Field List

For each discovered company website, extract the following structured signals:

1. **Services Offered**
   - Services or products listed on the website
   - Service descriptions or categories

2. **Industries Served**
   - Industries or sectors the company targets
   - Industry categories or classifications mentioned

3. **Locations**
   - Geographic locations mentioned
   - Service areas or office locations
   - Address information (if available)

4. **Contact Channels**
   - **Email addresses** (public contact emails)
   - **Phone numbers** (public contact phones)
   - **Contact forms** (presence/URL of contact forms)
   - Other contact methods mentioned

**Note:** Raw website content storage is UNDEFINED and deferred. Only structured signal extraction is required.

**Crawl Depth:** UNDEFINED (homepage only vs multiple pages is not specified for MVP)

---

## 3. Minimum Discovery Metadata Fields Required

### Company Record

**Required Fields:**
- Company name
- Website URL
- Discovery source (Google, LinkedIn, social platform, keyword search)
- Discovery timestamp

**Optional Fields (if found):**
- Services offered (from website signals)
- Industries served (from website signals)
- Locations (from website signals)
- Contact channels (from website signals)

**Note:** Exact field mapping depends on existing CRM Company schema

### Contact Record

**Required Fields:**
- Contact name
- Discovery source (Google, LinkedIn, social platform, keyword search)
- Discovery timestamp

**Optional Fields (if found):**
- Email address
- LinkedIn profile URL
- Phone number
- Company association (link to Company record)

**Note:** Exact field mapping depends on existing CRM Contact schema

### Lead Record

**Required Fields:**
- Lead source (discovery method: Google search, LinkedIn, social platform, keyword search)
- Discovery timestamp
- Link to Company record (if company discovered)
- Link to Contact record (if contact discovered)
- Link to both Company and Contact (if both discovered)

**Optional Fields:**
- Additional discovery metadata preserved from source

**Note:** Exact field mapping depends on existing CRM Lead schema

**Clarification:** Discovery source metadata stored on prospect records (Company, Contact, Lead) is allowed and is considered prospect data, not activity logging.

---

## 4. Explicitly Deferred Capabilities

The following capabilities are NOT part of Phase 1 MVP, even if allowed by the design:

### Discovery Execution
- **Scheduled/Triggered Execution:** Trigger mechanism is UNDEFINED - no scheduler or job system assumed
- **Run/Job Execution History:** Explicitly excluded - no execution tracking, status monitoring, or run history
- **Continuous Operation:** Operation mode is UNDEFINED - no assumption of continuous vs manual execution

### Data Storage
- **Raw Website Content Storage:** Whether raw scraped content is stored is UNDEFINED - only structured signals extracted
- **Social Platform Mentions Storage:** Storage format and location is UNDEFINED - deferred
- **Full-Site Crawling:** Crawl depth is UNDEFINED - only initial website signal extraction required

### Enrichment
- **Automatic Enrichment Triggering:** Whether discovery should automatically trigger existing enrichment is UNDEFINED - deferred
- **Enrichment Integration:** Discovery and enrichment relationship is UNDEFINED - separate processes assumed

### Filtering and Classification
- **Industry Classification Filtering:** Whether Phase 1 should use industry classification (Event Agency, Corporate Client, etc.) is UNDEFINED - deferred
- **CCS Client Database Deduplication:** Whether to check against existing CCS client database is UNDEFINED - deferred

### Advanced Features
- **Deduplication Algorithm:** Matching algorithm (exact, fuzzy, URL matching) is UNDEFINED beyond basic existence check
- **Data Validation Rules:** Validation rules and error handling are UNDEFINED beyond minimum required fields
- **Retry Strategies:** Retry logic for failures is UNDEFINED
- **Concurrency Model:** Run concurrency handling is UNDEFINED

### Channel Configuration
- **LinkedIn Access Type:** Access method (API, scraping) is UNDEFINED - only activation check required
- **Social Platform Selection:** Which specific platforms to monitor is UNDEFINED - only activation check required
- **Keyword Source:** Where keywords come from (configuration, database, UI) is UNDEFINED

### Operational Features
- **Rate Limit Management:** Exact throttling strategy is UNDEFINED
- **Quota Management:** Quota limit handling strategy is UNDEFINED
- **Error Logging:** Activity logging is prohibited - error handling approach is UNDEFINED

**All UNDEFINED items are explicitly deferred and not part of Phase 1 MVP scope.**

---

## 5. Success Criteria for Phase 1 (Measurable, Non-ML, Non-Revenue)

### Discovery Volume Metrics

1. **Company Discovery Rate**
   - **Metric:** Number of unique Company records created per discovery execution
   - **Measurement:** Count of new Company records stored in CRM
   - **Target:** [TBD - requires baseline expectation]

2. **Contact Discovery Rate**
   - **Metric:** Number of unique Contact records created per discovery execution
   - **Measurement:** Count of new Contact records stored in CRM
   - **Target:** [TBD - requires baseline expectation]

3. **Lead Generation Rate**
   - **Metric:** Number of Lead records created per discovery execution
   - **Measurement:** Count of new Lead records stored in CRM
   - **Target:** [TBD - requires baseline expectation]

### Data Quality Metrics

4. **Website Signal Extraction Success Rate**
   - **Metric:** Percentage of discovered companies for which at least one structured signal (services, industries, locations, or contact channels) was successfully extracted
   - **Measurement:** (Companies with extracted signals / Total discovered companies) × 100
   - **Target:** [TBD - requires baseline expectation]

5. **Contact Channel Discovery Rate**
   - **Metric:** Percentage of discovered companies where at least one contact channel (email, phone, or contact form) was extracted
   - **Measurement:** (Companies with contact channels / Total discovered companies) × 100
   - **Target:** [TBD - requires baseline expectation]

6. **LinkedIn Profile Association Rate** (if LinkedIn channel enabled)
   - **Metric:** Percentage of discovered contacts or companies with associated LinkedIn profile URL
   - **Measurement:** (Records with LinkedIn URL / Total relevant records) × 100
   - **Target:** [TBD - requires baseline expectation]

### Source Diversity Metrics

7. **Multi-Source Discovery Rate**
   - **Metric:** Percentage of prospects discovered through multiple sources (e.g., Google + LinkedIn, keyword + website)
   - **Measurement:** (Prospects with multiple discovery sources / Total prospects) × 100
   - **Target:** [TBD - requires baseline expectation]

8. **Channel Activation Rate**
   - **Metric:** Number of discovery channels successfully executing per discovery run
   - **Measurement:** Count of enabled channels that completed without fatal errors
   - **Target:** All Day 1 channels must execute; gated channels execute only if enabled

### Data Completeness Metrics

9. **Required Field Population Rate**
   - **Metric:** Percentage of created records (Company, Contact, Lead) with all required discovery metadata fields populated
   - **Measurement:** (Records with all required fields / Total records created) × 100
   - **Target:** 100% (all required fields must be populated)

10. **Record Linkage Success Rate**
    - **Metric:** Percentage of Lead records successfully linked to Company and/or Contact records
    - **Measurement:** (Leads with valid Company/Contact links / Total Leads created) × 100
    - **Target:** 100% (all Leads must be linked to at least Company or Contact)

### Operational Metrics

11. **Discovery Execution Completion Rate**
    - **Metric:** Percentage of discovery executions that complete without fatal errors
    - **Measurement:** (Successful discovery runs / Total discovery runs attempted) × 100
    - **Target:** [TBD - requires baseline expectation, but should handle partial failures gracefully]

12. **Gated Channel Graceful Degradation**
    - **Metric:** System continues functioning when gated channels (LinkedIn, social platforms) are disabled
    - **Measurement:** Binary - Day 1 channels execute successfully when gated channels are disabled
    - **Target:** 100% (system must function with only Day 1 channels)

### Data Integrity Metrics

13. **Deduplication Effectiveness**
    - **Metric:** Percentage of discovered prospects that do not create duplicate Company or Contact records
    - **Measurement:** (Unique records created / Total discovery results before deduplication) × 100
    - **Note:** Exact deduplication algorithm is UNDEFINED, but basic existence check should prevent exact duplicates
    - **Target:** [TBD - requires deduplication logic definition]

**Note:** All success criteria are measurable through data analysis of CRM records. No machine learning or revenue metrics are included. Targets require baseline expectations to be established during implementation planning.

---

**MVP Scope Summary:**

- **In Scope:** Google search discovery, website signal extraction, keyword-based prospecting, basic LinkedIn/social discovery (if enabled), prospect storage with discovery metadata
- **Out of Scope:** Schedulers, job systems, outreach, scoring, orders, learning, enrichment triggering, raw content storage, execution history, activity logging
- **Gated:** LinkedIn and social platform channels (activation conditional)
- **Deferred:** All UNDEFINED items from design document
