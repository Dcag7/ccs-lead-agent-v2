# Phase 1 (Discovery) - Design Document

> This design document strictly conforms to PHASE_1_DISCOVERY_CONSTRAINTS.md
> All decisions are constrained by what is explicitly defined or marked as UNDEFINED.

---

## 1. High-Level System Responsibilities

### REQUIRED Responsibilities

1. **Automatic Prospect Discovery**
   - Perform automated Google searches to find prospects
   - Identify companies and contacts relevant to discovery criteria

2. **Initial Website Signal Extraction (Crawl Depth UNDEFINED)**
   - Extract structured signals from company websites discovered through searches
   - Focus on structured data extraction: services, industries, locations, contact channels
   - **UNDEFINED:** Crawl depth (homepage only vs multiple pages), full-site crawling approach, raw content storage strategy

3. **Social Platform Monitoring (CORE Channel)**
   - Monitor social platforms for prospect activity and mentions
   - **UNDEFINED:** Which specific platforms to monitor (options must be presented)
   - **Activation Gated by UNDEFINED access constraints** - Phase 1 must function with other channels if social monitoring is disabled

4. **LinkedIn Profile Discovery (CORE Channel)**
   - Discover LinkedIn profiles for companies and contacts
   - Extract LinkedIn profile information
   - **UNDEFINED:** LinkedIn access type and permissions (must be clarified)
   - **Activation Gated by UNDEFINED access constraints** - Phase 1 must function with other channels if LinkedIn discovery is disabled

5. **Industry Keyword-Based Prospecting**
   - Use industry keywords to find prospects
   - **UNDEFINED:** Keyword source, categories, and examples (options must be presented)

6. **Continuous Discovery Operations**
   - Maintain a continuous inbound stream of prospects
   - Operate as an active discovery engine (not passive)

7. **Discovery Execution (Trigger Mechanism UNDEFINED)**
   - Execute discovery runs to perform prospect discovery
   - **UNDEFINED:** Trigger mechanism (scheduled, event-driven, manual, continuous), frequency, and configuration format

8. **Prospect Data Storage**
   - Store discovered prospects in existing CRM models (Company, Contact, Lead)
   - Preserve discovery source information for each prospect

### OPTIONAL Responsibilities

1. **Automatic Enrichment Triggering**
   - **UNDEFINED:** Whether discovery should automatically trigger existing enrichment
   - If yes: Trigger enrichment after discovery
   - If no: Discovery completes without enrichment

2. **Discovery Source Tracking**
   - Store discovery source metadata (Google, LinkedIn, social platform, keyword search) on prospect records
   - **CLARIFIED:** Storing discovery metadata on prospect records is allowed and not considered activity logging
   - **CLARIFIED:** Run/job execution history and execution tracking are not allowed in Phase 1 (this would be activity logging)

---

## 2. Data Inputs and Outputs

### REQUIRED Inputs

1. **Discovery Criteria**
   - Search queries for Google searches
   - Industry keywords for keyword-based prospecting
   - **UNDEFINED:** Where these come from (user input, configuration file, database, API)

2. **Discovery Execution Configuration**
   - Trigger mechanism configuration (if applicable)
   - **UNDEFINED:** Trigger mechanism type, configuration format and storage location

3. **LinkedIn Credentials (if LinkedIn discovery enabled)**
   - Access credentials for LinkedIn API/service
   - **UNDEFINED:** Access type (API, scraping), permissions, rate limits

4. **Social Platform Configuration (if social monitoring enabled)**
   - Platform identifiers
   - **UNDEFINED:** Which platforms, access credentials, monitoring parameters

5. **Existing CRM Schema**
   - Company, Contact, Lead data models
   - Required fields and relationships

### OPTIONAL Inputs

1. **Industry Classification Data**
   - Classification categories (Event Agency, Corporate Client, Brand Owner, Reseller)
   - **UNDEFINED:** Whether Phase 1 should use industry classification (constraints say it's missing)

2. **Existing CCS Client Data**
   - Client database information
   - **UNDEFINED:** Whether Phase 1 needs this to avoid duplicates or if it's only for later phases

3. **Enrichment Configuration**
   - Settings for triggering existing enrichment
   - **UNDEFINED:** Whether discovery and enrichment are connected

### REQUIRED Outputs

1. **Discovered Companies**
   - Company records stored in CRM Company model
   - Includes: company name, website URL, discovery source, discovery timestamp
   - **UNDEFINED:** Exact field mapping depends on existing Company schema

2. **Discovered Contacts**
   - Contact records stored in CRM Contact model
   - Includes: contact name, email (if found), LinkedIn profile URL (if found), discovery source
   - **UNDEFINED:** Exact field mapping depends on existing Contact schema

3. **Generated Leads**
   - Lead records stored in CRM Lead model
   - Linked to discovered Companies and/or Contacts
   - Includes: lead source (discovery method), discovery timestamp
   - **UNDEFINED:** Exact field mapping depends on existing Lead schema

4. **Discovery Metadata**
   - Source identification (Google search, LinkedIn, social platform, keyword search)
   - Discovery method used
   - Timestamp of discovery
   - **CLARIFIED:** This metadata is stored on prospect records (Company, Contact, Lead) and is allowed
   - **UNDEFINED:** Exact field mapping depends on existing CRM schema

### OPTIONAL Outputs

1. **Website Raw Content**
   - Raw scraped content from company websites
   - **UNDEFINED:** Whether raw content is stored, storage location (full text in CRM, excerpts, separate storage, or discarded)

2. **Social Platform Mentions**
   - Mentions or activity captured from social platforms
   - **UNDEFINED:** Storage format and location

---

## 3. Discovery Flow

### Step-by-Step Discovery Process

#### Flow 1: Discovery Execution (Trigger Mechanism UNDEFINED)

1. **Run Trigger**
   - Discovery run is triggered
   - **UNDEFINED:** Trigger mechanism (scheduled, event-driven, manual, continuous), frequency, trigger configuration

2. **Run Initialization**
   - Load discovery configuration (keywords, search queries, platforms to monitor, channel activation status)
   - **UNDEFINED:** Configuration source (file, database, environment variables)

3. **Execute Discovery Methods** (run in parallel or sequence, UNDEFINED: orchestration approach)
   - Check channel activation status (LinkedIn, social platforms may be disabled based on access constraints)
   - Execute enabled discovery methods only

#### Flow 2: Google Search Discovery

1. **Search Execution**
   - Execute Google search using configured search queries
   - **UNDEFINED:** Google Search API vs scraping, quota limits, authentication method

2. **Result Processing**
   - Parse search results for company websites and contact information
   - Extract URLs, company names, brief descriptions

3. **Initial Website Signal Extraction** (for each discovered company URL)
   - Access company website
   - Extract structured signals: services offered, industries served, locations, contact channels (email, phone, contact forms)
   - **UNDEFINED:** Crawl depth (homepage only vs multiple pages), scraping technology, whether full-site crawling is performed

4. **Structured Data Extraction**
   - Extract structured data from website signals
   - Identify contact channels (emails, phone numbers), company details, service offerings
   - **UNDEFINED:** Whether raw website content is stored or only extracted structured data

#### Flow 3: LinkedIn Profile Discovery (CORE Channel, Activation Gated)

1. **LinkedIn Activation Check**
   - Check if LinkedIn discovery is enabled based on access constraints
   - If disabled: Skip LinkedIn discovery, continue with other channels
   - If enabled: Verify LinkedIn access credentials/permissions
   - **UNDEFINED:** Access method, API endpoints, authentication flow, access constraints

2. **Profile Search** (if enabled)
   - Search LinkedIn for companies or contacts based on discovery criteria
   - **UNDEFINED:** Search parameters, search type (company search, people search, or both)

3. **Profile Extraction** (if enabled)
   - Extract LinkedIn profile information (company profile, individual profiles)
   - Capture: profile URL, name, title, company association, basic profile data
   - **UNDEFINED:** Profile data depth (public profile only vs extended data), rate limits

#### Flow 4: Social Platform Monitoring (CORE Channel, Activation Gated)

1. **Social Platform Activation Check**
   - Check if social platform monitoring is enabled based on access constraints
   - If disabled: Skip social platform monitoring, continue with other channels
   - If enabled: Determine which social platforms to monitor
   - **UNDEFINED:** Platform list, platform access methods, API availability, access constraints

2. **Monitoring Execution** (if enabled)
   - Query social platforms for relevant activity
   - Search for mentions, posts, or profiles matching discovery criteria
   - **UNDEFINED:** Monitoring query format, search parameters, API endpoints

3. **Activity Capture** (if enabled)
   - Extract relevant prospect information from social platform activity
   - Identify companies or contacts mentioned or active

#### Flow 5: Industry Keyword-Based Prospecting

1. **Keyword Loading**
   - Load industry keywords for prospecting
   - **UNDEFINED:** Keyword source (static list, configuration file, database), keyword examples, keyword categories

2. **Keyword Search Execution**
   - Use keywords to search across discovery sources (Google, LinkedIn, social platforms)
   - **UNDEFINED:** Search strategy (exact match, variations, combinations), search scope

3. **Result Aggregation**
   - Collect results from keyword-based searches
   - Identify unique prospects across multiple keyword searches

#### Flow 6: Prospect Deduplication and Storage

1. **Deduplication Check**
   - Check if discovered prospect (company or contact) already exists in CRM
   - Match against existing Company/Contact records
   - **UNDEFINED:** Matching algorithm (exact name match, fuzzy matching, URL matching), whether to check against CCS client database

2. **Prospect Creation**
   - Create new Company record if company doesn't exist
   - Create new Contact record if contact doesn't exist
   - Link Contact to Company if relationship is discovered
   - **UNDEFINED:** Handling of partial data (create record with minimal data or wait for enrichment)

3. **Lead Generation**
   - Create Lead record for discovered prospect
   - Link Lead to Company and/or Contact
   - Mark Lead source as discovery method (Google, LinkedIn, social, keyword)
   - **UNDEFINED:** Lead status assignment (new, discovered), lead qualification fields

4. **Optional: Enrichment Trigger**
   - If enabled: Trigger existing enrichment process for new prospect
   - **UNDEFINED:** Whether this happens automatically or is separate step

#### Flow 7: Run Completion

1. **Prospect Storage Completion**
   - Complete storage of all discovered prospects in CRM
   - Discovery metadata (source, method, timestamp) stored on prospect records

2. **Run Completion**
   - Discovery run completes
   - **CLARIFIED:** No run/job execution history or status tracking is stored (this would be activity logging)
   - **UNDEFINED:** Trigger mechanism for next discovery run (if applicable)

---

## 4. Explicit Assumptions

### Assumptions Related to UNDEFINED Items

1. **LinkedIn Access**
   - **ASSUMPTION OPTION A:** LinkedIn access is via official API with API key/credentials
   - **ASSUMPTION OPTION B:** LinkedIn access is via scraping (with associated risks)
   - **ASSUMPTION OPTION C:** LinkedIn discovery is optional/disabled if no access available
   - **REQUIRED DECISION:** Which access method is available, what credentials/permissions exist

2. **Social Platform Monitoring**
   - **ASSUMPTION OPTION A:** Monitor specific platforms (e.g., Twitter/X, Facebook, Instagram)
   - **ASSUMPTION OPTION B:** Social monitoring is optional/disabled if platforms undefined
   - **ASSUMPTION OPTION C:** Start with one platform and expand later
   - **REQUIRED DECISION:** Which platforms to monitor, what access methods available

3. **Industry Keywords**
   - **ASSUMPTION OPTION A:** Keywords come from manual configuration (admin input)
   - **ASSUMPTION OPTION B:** Keywords are predefined in a configuration file
   - **ASSUMPTION OPTION C:** Keywords are stored in database and managed through UI
   - **ASSUMPTION OPTION D:** Keywords are derived from industry classification (if available)
   - **REQUIRED DECISION:** Keyword source, keyword examples, keyword categories

4. **Discovery Execution Trigger**
   - **ASSUMPTION OPTION A:** Continuous operation (runs constantly or very frequently)
   - **ASSUMPTION OPTION B:** Scheduled intervals (daily, hourly, multiple times per day)
   - **ASSUMPTION OPTION C:** Event-driven (triggered by external events)
   - **ASSUMPTION OPTION D:** Manual trigger only
   - **ASSUMPTION OPTION E:** Configurable per discovery method (different triggers for different channels)
   - **REQUIRED DECISION:** Desired trigger mechanism, frequency (if scheduled), configuration format

5. **Google Search Quota**
   - **ASSUMPTION:** Google Search has quota limits (API quota or scraping rate limits)
   - **RISK:** Quota exhaustion may limit discovery volume
   - **REQUIRED DECISION:** Quota limits, budget constraints, cost limits

6. **Deduplication Scope**
   - **ASSUMPTION OPTION A:** Deduplicate only against existing CRM Company/Contact records
   - **ASSUMPTION OPTION B:** Also check against CCS client database to avoid discovering existing clients
   - **ASSUMPTION OPTION C:** No deduplication (allow duplicates, handle later)
   - **REQUIRED DECISION:** Whether Phase 1 needs access to CCS client data

7. **Enrichment Relationship**
   - **ASSUMPTION OPTION A:** Discovery automatically triggers existing enrichment
   - **ASSUMPTION OPTION B:** Discovery and enrichment are separate processes
   - **ASSUMPTION OPTION C:** Enrichment is manually triggered after discovery
   - **REQUIRED DECISION:** Discovery-enrichment connection model

8. **Discovery Source Tracking**
   - **CLARIFIED:** Storing discovery source metadata (Google vs LinkedIn vs social vs keyword) on prospect records is allowed and is part of prospect data, not activity logging
   - **CLARIFIED:** Run/job execution history, execution tracking, status monitoring are not allowed (these would be activity logging)
   - **ASSUMPTION:** Source tracking on prospect records is needed for data quality

9. **Industry Classification**
   - **ASSUMPTION OPTION A:** Phase 1 uses industry classification (Event Agency, Corporate Client, etc.) in discovery criteria
   - **ASSUMPTION OPTION B:** Phase 1 does not use industry classification (classification added in later phases)
   - **REQUIRED DECISION:** Whether Phase 1 should filter by industry classification

10. **Configuration Storage**
    - **ASSUMPTION OPTION A:** Configuration stored in configuration files
    - **ASSUMPTION OPTION B:** Configuration stored in database
    - **ASSUMPTION OPTION C:** Configuration provided via environment variables or API
    - **REQUIRED DECISION:** Configuration management approach

---

## 5. Risks and Edge Cases

### REQUIRED Risk Mitigation

1. **Rate Limiting and Quota Exhaustion**
   - **RISK:** Google Search, LinkedIn, social platforms may have rate limits or quotas
   - **IMPACT:** Discovery may be interrupted or incomplete
   - **MITIGATION OPTIONS:**
     - Implement rate limit awareness and throttling
     - Queue requests when limits are reached
     - Distribute discovery across multiple time periods
   - **UNDEFINED:** Exact quota limits, throttling strategy

2. **Data Quality and Incomplete Information**
   - **RISK:** Discovered prospects may have incomplete or inaccurate data
   - **IMPACT:** Poor quality leads stored in CRM
   - **MITIGATION OPTIONS:**
     - Implement data validation before storing
     - Store prospects with minimum required fields only
     - Mark incomplete records for manual review
   - **UNDEFINED:** Minimum data requirements for prospect creation

3. **Duplicate Prospect Creation**
   - **RISK:** Same prospect discovered multiple times from different sources
   - **IMPACT:** Duplicate records in CRM
   - **MITIGATION OPTIONS:**
     - Implement deduplication matching logic
     - Check existing records before creating new ones
   - **UNDEFINED:** Deduplication algorithm, matching criteria, whether to check CCS client database

4. **Website Crawling Failures**
   - **RISK:** Websites may block crawlers, be inaccessible, or have dynamic content
   - **IMPACT:** Incomplete company information
   - **MITIGATION OPTIONS:**
     - Handle crawling errors gracefully
     - Store partial data if full crawl fails
     - Respect robots.txt and crawling etiquette
   - **UNDEFINED:** Crawling technology, error handling strategy

5. **LinkedIn Access Changes**
   - **RISK:** LinkedIn may change API, block access, or change terms of service
   - **IMPACT:** LinkedIn discovery becomes unavailable, but Phase 1 must continue with other channels
   - **MITIGATION OPTIONS:**
     - Design modular discovery so LinkedIn can be disabled without breaking other channels
     - Have fallback discovery methods (Google Search, website crawling, keyword search)
     - Handle access failures gracefully and continue with enabled channels
   - **UNDEFINED:** LinkedIn access type (API is more stable than scraping), access constraint monitoring approach

6. **Social Platform Access Failures**
   - **RISK:** Social platforms may block access, change API, or become unavailable
   - **IMPACT:** Social platform discovery becomes unavailable, but Phase 1 must continue with other channels
   - **MITIGATION OPTIONS:**
     - Design modular discovery so social platforms can be disabled without breaking other channels
     - Have fallback discovery methods (Google Search, LinkedIn, website crawling, keyword search)
     - Handle access failures gracefully and continue with enabled channels
   - **UNDEFINED:** Social platform access methods, access constraint monitoring approach

### Edge Cases

1. **No Discovery Results**
   - **SCENARIO:** Discovery methods return no results
   - **HANDLING:** Run completes successfully with zero prospects created

2. **Partial Discovery Data**
   - **SCENARIO:** Only company name found, no contact information
   - **HANDLING OPTIONS:**
     - Create Company record only, no Contact or Lead
     - Create Company and Lead without Contact
   - **UNDEFINED:** Minimum data requirements

3. **Multiple Contacts for Same Company**
   - **SCENARIO:** Discovery finds multiple contacts for one company
   - **HANDLING:** Create one Company record, multiple Contact records, one or multiple Lead records
   - **UNDEFINED:** Lead creation strategy (one Lead per Contact vs one Lead per Company)

4. **Same Prospect from Multiple Sources**
   - **SCENARIO:** Same company discovered via Google Search and LinkedIn
   - **HANDLING:** Deduplication should identify as same prospect, potentially merge source information
   - **UNDEFINED:** Merging strategy, whether to preserve all source identifiers

5. **Invalid or Malformed Data**
   - **SCENARIO:** Discovery extracts invalid email addresses, broken URLs, or corrupted data
   - **HANDLING:** Data validation should filter invalid records before storage
   - **UNDEFINED:** Validation rules, error handling

6. **Access Denied or Blocked**
   - **SCENARIO:** Website blocks crawler, LinkedIn rejects API request, social platform blocks access
   - **HANDLING:** Skip that source for that prospect, continue with other discovery methods
   - **UNDEFINED:** Retry strategy, fallback behavior

7. **Configuration Missing or Invalid**
   - **SCENARIO:** Keywords not configured, LinkedIn/social credentials missing, trigger mechanism not defined
   - **HANDLING:** Skip affected discovery methods/channels, continue with available methods
   - **UNDEFINED:** Error handling approach (no logging if activity logging prohibited), whether to halt run or continue partially

8. **CRM Storage Failures**
   - **SCENARIO:** Database unavailable, schema mismatch, constraint violations
   - **HANDLING:** Implement error handling for storage operations, retry logic, graceful degradation
   - **UNDEFINED:** Storage error recovery strategy

9. **Concurrent Run Execution**
   - **SCENARIO:** Multiple discovery runs triggered simultaneously
   - **HANDLING:** Implement locking or queuing to prevent duplicate work, or allow parallel execution with deduplication
   - **UNDEFINED:** Run concurrency model

10. **Discovery Source Unavailability**
    - **SCENARIO:** Google Search API down, LinkedIn unavailable, social platform offline
    - **HANDLING:** Continue with available sources, skip unavailable sources
    - **UNDEFINED:** Retry strategy (no monitoring if activity logging prohibited)

---

## 6. Decisions Required Before Implementation

### Critical Decisions (Block Implementation)

1. **LinkedIn Access Method**
   - What type of LinkedIn access is available?
   - What are the credentials, permissions, and rate limits?

2. **Social Platform Selection**
   - Which social platforms should be monitored?
   - What access methods are available for each platform?

3. **Industry Keywords**
   - What are the keyword examples?
   - What keyword categories are needed?
   - Where should keywords be stored/managed?

4. **Discovery Execution Trigger Configuration**
   - What trigger mechanism should be used (scheduled, event-driven, manual, continuous)?
   - If scheduled, how often should discovery runs execute?
   - What is the trigger configuration format preference?
   - Should different discovery channels have different triggers?

5. **Google Search Quota**
   - What are the quota limits or budget constraints?
   - What is the expected discovery volume?

### Important Decisions (Impact Design)

6. **Deduplication Scope**
   - Should Phase 1 check against CCS client database?
   - What matching algorithm should be used?

7. **Enrichment Relationship**
   - Should discovery automatically trigger existing enrichment?
   - Or are discovery and enrichment separate processes?

8. **Discovery Source Metadata**
   - **CLARIFIED:** Discovery source metadata stored on prospect records is allowed (not activity logging)
   - **CLARIFIED:** Run/job execution history is not allowed (this is activity logging)

9. **Industry Classification**
   - Should Phase 1 use industry classification in discovery?
   - Or is classification added in later phases?

10. **Configuration Management**
    - Where should configuration be stored (files, database, environment)?
    - How should configuration be managed?

---

## 7. Constraints Compliance Verification

### Conforms to Constraints

✅ **No Outreach Activities** - Design excludes all outreach features  
✅ **No Scoring Changes** - Design excludes all scoring/enrichment matching features  
✅ **No Enrichment Beyond Basic Discovery** - Design excludes client comparison and order history integration  
✅ **No Learning/ML** - Design excludes all learning and optimization features  
✅ **No Orders System Integration** - Design excludes all order-related features  
✅ **No Activity Logging** - Design excludes run/job execution history, execution tracking, and status monitoring; discovery source metadata on prospect records is allowed (prospect data, not activity logging)  
✅ **No Operations Console** - Design excludes ops console features  
✅ **Strictly Phase 1 Scope** - Design only includes Phase 1 discovery capabilities  
✅ **No Scheduled Jobs as Modeled Feature** - Job-centric language replaced with run-centric language; trigger mechanism is UNDEFINED; no job status tracking, monitoring, alerts, or retries as modeled features  
✅ **Core Channels with Activation Gates** - Social platforms and LinkedIn are treated as CORE channels but activation is gated by UNDEFINED access constraints; Phase 1 must function with other channels if these are disabled  
✅ **Website Signal Extraction** - Website crawling redefined as initial signal extraction with emphasis on structured signals (services/industries/locations/contact channels); crawl depth and raw content storage marked as UNDEFINED

### UNDEFINED Items Preserved

✅ All UNDEFINED items from constraints are explicitly called out as assumptions  
✅ Options presented instead of arbitrary decisions for UNDEFINED items  
✅ Required decisions documented before implementation  
✅ Trigger mechanism for discovery execution is UNDEFINED (not assumed to be scheduled jobs)  
✅ Social platform and LinkedIn activation constraints are UNDEFINED (gated, but Phase 1 works without them)  
✅ Website crawl depth and raw content storage are UNDEFINED (only structured signal extraction emphasized)

---

**Document Status:** Ready for review and decision-making on UNDEFINED items
