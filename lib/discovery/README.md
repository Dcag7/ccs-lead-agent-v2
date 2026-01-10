# Phase 1 Discovery - Architecture & Interfaces

This directory contains the architecture and interface definitions for Phase 1 Discovery MVP.

## STEP 1 - Architecture & Interfaces (Current)

This step defines:
1. **Discovery Channel Interface** - Input/output contract for all discovery channels
2. **Website Signal Extraction Interface** - Structured signal extraction contract
3. **Common Discovery Result Structure** - Unified structure for Company, Contact, Lead
4. **Discovery Metadata Fields** - How discovery metadata attaches to CRM records

## File Structure

```
lib/discovery/
├── README.md                          # This file
├── types.ts                           # Core type definitions
│
├── channels/                          # Discovery channel interfaces
│   ├── IDiscoveryChannel.ts          # Base discovery channel interface
│   │
│   ├── google/                       # Google Search Discovery (Day 1 Enabled)
│   │   └── IGoogleDiscoveryChannel.ts
│   │
│   ├── linkedin/                     # LinkedIn Discovery (CORE - GATED)
│   │   └── ILinkedInDiscoveryChannel.ts
│   │
│   ├── social/                       # Social Platform Monitoring (CORE - GATED)
│   │   └── ISocialDiscoveryChannel.ts
│   │
│   └── keyword/                      # Keyword-Based Prospecting (Day 1 Enabled)
│       └── IKeywordDiscoveryChannel.ts
│
└── signals/                          # Website signal extraction
    └── IWebsiteSignalExtractor.ts    # Website signal extraction interface
```

## Channel Separation

### Day 1 Enabled Channels (Always Active)
- **Google Search Discovery** (`IGoogleDiscoveryChannel`)
- **Industry Keyword-Based Prospecting** (`IKeywordDiscoveryChannel`)

### Gated Channels (Activation Conditional)
- **LinkedIn Profile Discovery** (`ILinkedInDiscoveryChannel`) - CORE but GATED
- **Social Platform Monitoring** (`ISocialDiscoveryChannel`) - CORE but GATED

**Important:** Gated channels must not block the build. If disabled, Phase 1 continues with other channels.

## Core Types

All core types are defined in `types.ts`:

- `DiscoveryChannelType` - Channel type identifiers
- `DiscoveryChannelInput` / `DiscoveryChannelOutput` - Channel contracts
- `WebsiteSignals` - Structured signal types
- `WebsiteSignalExtractionInput` / `WebsiteSignalExtractionOutput` - Extraction contracts
- `DiscoveryResult` - Common result structure (Company | Contact | Lead)
- `DiscoveryMetadata` - Metadata attached to CRM records
- `CompanyDiscoveryFields` / `ContactDiscoveryFields` / `LeadDiscoveryFields` - CRM field mappings

## Discovery Metadata on CRM Records

Discovery metadata is attached to CRM records via these field structures:

### Company Record
- `discoverySource` - Channel that discovered the company
- `discoveryTimestamp` - When it was discovered
- `discoveryMethod` - Method/query used
- `discoveryMetadata` - Additional metadata (JSON)

### Contact Record
- `discoverySource` - Channel that discovered the contact
- `discoveryTimestamp` - When it was discovered
- `discoveryMethod` - Method/query used
- `linkedInUrl` - LinkedIn profile (if discovered via LinkedIn)
- `discoveryMetadata` - Additional metadata (JSON)

### Lead Record
- `source` - Discovery method (maps to existing `source` field)
- `discoveryTimestamp` - When it was discovered
- `discoveryMethod` - Method/query used
- `discoveryMetadata` - Additional metadata (JSON)

**Note:** Exact field mapping depends on existing CRM schema. Some fields may need to be added to Prisma schema.

## UNDEFINED Items

The following items are explicitly UNDEFINED and must remain UNDEFINED:

1. **Trigger Mechanism** - How discovery runs are triggered (scheduled, manual, event-driven)
2. **Google Search Implementation** - API vs scraping, quota limits, authentication
3. **LinkedIn Access** - Access type (API vs scraping), credentials, permissions
4. **Social Platform Selection** - Which platforms to monitor, access methods
5. **Keyword Source** - Where keywords come from (file, database, UI)
6. **Website Crawl Depth** - Homepage only vs multiple pages
7. **Raw Content Storage** - Whether raw website content is stored

## Next Steps

After STEP 1 confirmation, proceed to STEP 2:
- Implement concrete discovery channel classes
- Implement website signal extractor
- Implement discovery result mapping to CRM records
