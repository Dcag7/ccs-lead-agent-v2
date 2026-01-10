> This document defines constraints and boundaries for Phase 1 (Discovery).
> Any design or implementation MUST conform to this document.

# Phase 1 (Discovery) - Constraints

**Source:** VISION_GAP_ANALYSIS.md

---

## 1. Explicit Goals Phase 1 Must Achieve

- Automatic Google search for prospects
- Company website scraping/crawling
- Social platform monitoring
  - **UNDEFINED:** Which specific social platforms
- LinkedIn profile discovery
- Industry keyword-based prospecting
  - **UNDEFINED:** Keyword source, keyword categories, keyword examples
- Continuous inbound stream of prospects
- Active discovery engine
- Scheduled discovery jobs
  - **UNDEFINED:** Schedule frequency, schedule format, schedule configuration

---

## 2. Explicit Non-Goals Phase 1 Must Not Include

### No Outreach Activities (Phase 5 scope)
- Email-based outreach
- Campaign-style nurturing sequences
- Internal task prompts/reminders
- WhatsApp notifications
- Outreach recommendations
- Message type recommendations based on lead profile
- Follow-up scheduling and reminders
- Email templates
- Campaign tracking

### No Scoring Changes (Phase 3 scope)
- Scoring based on similarity to existing CCS clients
- Order potential estimation
- Industry-specific classification scoring
- Match to CCS ideal client profile

### No Enrichment Beyond Basic Discovery (Phase 2 scope)
- Comparison against existing CCS clients
- Integration with order history
- Known high-value customer profile matching
- Historical relevance scoring

### No Learning or Machine Learning (Phase 7 scope)
- Learning from discovery outcomes
- Adjusting discovery keywords based on results
- Predicting which discovery sources are more effective
- Machine learning/AI capabilities
- Analyzing discovery success rates for optimization
- Self-improving algorithms
- Learning from conversion outcomes
- Monthly revenue potential prediction
- Trend identification
- Client pattern recognition

### No Orders System Integration
- Order tracking
- Order history integration
- Comparing prospects to existing clients using order data
- Order potential estimation
- Client order pattern analysis

### No Activity Logging
- Activity tracking
- Sync history
- Audit trail for system activity
- User action tracking

### No Operations Console Features
- Operations-focused console
- Sync and scoring activity logs interface
- System health monitoring interface
- Manual sync triggers interface
- Finance/ops export tools

### No Roadmap Beyond Phase 1
- Planning Phase 2, 3, 4, 5, 6, or 7 features

---

## 3. Dependencies Phase 1 Has on Missing Systems

### Missing: Existing CCS Client Database
- **Phase 1 Dependency:** UNDEFINED - Document does not specify if Phase 1 discovery needs client data

### Missing: Orders System
- **Phase 1 Dependency:** UNDEFINED - Document does not specify if Phase 1 needs order data

### Missing: Industry Classification
- Vision mentions specific types: Event Agency, Corporate Client, Brand Owner, Reseller
- **Phase 1 Dependency:** UNDEFINED - Document does not specify if Phase 1 discovery should use industry classification

### Missing: Activity Logging
- **Phase 1 Dependency:** UNDEFINED - Document does not specify if Phase 1 needs to log discovery activity

### Existing: Basic CRM (Companies, Contacts, Leads)
- Phase 1 must store discovered prospects in existing Company, Contact, Lead models

### Existing: Basic Enrichment
- **Phase 1 Dependency:** UNDEFINED - Document does not specify if Phase 1 should use existing enrichment

---

## 4. Open Questions That Block Implementation

### Do you have LinkedIn access for prospecting?
- **UNDEFINED:** LinkedIn access type, permissions/credentials, rate limits or quotas

### What quota/budget for discovery?
- **UNDEFINED:** Google Search quota limits, budget constraints, cost limits

### What's the priority: Discovery or Outreach first?
- Document indicates both Phase 1 and Phase 5 are critical

### Do you have existing CCS client data/order history to import?
- **UNDEFINED:** Whether Phase 1 needs client data or if it's only needed for later phases

### Which social platforms should be monitored?
- **UNDEFINED:** Social platform specifics

### What keywords should be used for industry keyword-based prospecting?
- **UNDEFINED:** Keyword source, keyword examples, keyword categories

### How often should discovery jobs run?
- **UNDEFINED:** Schedule frequency for continuous inbound stream

### Should discovery trigger existing enrichment automatically?
- **UNDEFINED:** Discovery and enrichment relationship
