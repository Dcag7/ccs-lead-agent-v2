# Phase 6: Omnichannel Messaging Architecture Design

> **Status:** Design Document (No Implementation Yet)  
> **Created:** January 11, 2026  
> **Last Updated:** January 11, 2026  
> **Related:** [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md)

---

## Document Purpose

This document provides the detailed technical specification for the omnichannel messaging system, covering:

1. Data model proposal (schema specification)
2. Connector architecture with `IChannelConnector` interface
3. Identity resolution strategy
4. Timeline and threading rules
5. Safety and compliance guardrails
6. Incremental rollout checklist (6A → 6B → 6C)

**Important:** This is a specification document only. No Prisma migrations, no runtime code changes. Implementation requires separate approval.

---

## 1. Data Model Proposal

### 1.1 Conversation

Represents a unified conversation thread across any channel.

```text
Model: Conversation
Table: conversations

Fields:
├── id              String    @id @default(cuid())
├── externalId      String?   Unique conversation ID from external platform
├── channelType     String    Channel type enum (see below)
├── channelAccountId String   FK → ChannelAccount.id
├── status          String    Conversation status enum (see below)
│
├── leadId          String?   FK → Lead.id (nullable, may not be matched yet)
├── contactId       String?   FK → Contact.id (nullable)
├── companyId       String?   FK → Company.id (nullable)
│
├── participantIdentities Json    Array of ParticipantIdentity objects
├── subject         String?   Email subject or conversation title
├── lastMessageAt   DateTime  Timestamp of most recent message
├── lastMessagePreview String Max 200 chars preview of last message
├── unreadCount     Int       @default(0)
│
├── assignedToId    String?   FK → User.id (assigned team member)
├── tags            String[]  User-defined tags for categorization
├── metadata        Json      Channel-specific metadata
│
├── createdAt       DateTime  @default(now())
├── updatedAt       DateTime  @updatedAt

Relations:
├── channelAccount  ChannelAccount @relation
├── lead            Lead?          @relation
├── contact         Contact?       @relation
├── company         Company?       @relation
├── assignedTo      User?          @relation
├── messages        Message[]      @relation

Indexes:
├── @@index([channelType])
├── @@index([channelAccountId])
├── @@index([status])
├── @@index([leadId])
├── @@index([contactId])
├── @@index([companyId])
├── @@index([assignedToId])
├── @@index([lastMessageAt])
├── @@unique([channelAccountId, externalId])  // Prevent duplicate imports

Enums:
├── ChannelType: email | whatsapp | instagram | facebook | sms | linkedin | other
└── ConversationStatus: open | closed | snoozed | archived | spam
```

### 1.2 Message

Represents a single message within a conversation.

```text
Model: Message
Table: messages

Fields:
├── id                String    @id @default(cuid())
├── conversationId    String    FK → Conversation.id
├── externalMessageId String    Unique ID from external platform (for dedup)
│
├── direction         String    Enum: inbound | outbound
├── senderType        String    Enum: lead | contact | user | system | bot
├── senderId          String?   FK → User.id (if outbound by team member)
├── senderIdentity    Json?     ParticipantIdentity for external senders
│
├── content           String    Message text/body
├── contentType       String    Enum (see below)
├── contentHtml       String?   HTML version for rich email
│
├── status            String    Enum: pending | sent | delivered | read | failed
├── errorMessage      String?   Error details if status = failed
│
├── attachments       Json      Array of AttachmentMetadata objects
├── replyToMessageId  String?   FK → Message.id (for threading)
│
├── sentAt            DateTime  When message was sent
├── deliveredAt       DateTime? When message was delivered
├── readAt            DateTime? When message was read
│
├── channelMetadata   Json      Platform-specific fields (message_id, etc.)
├── automatedBy       String?   Automation rule ID if auto-sent (for audit)
│
├── createdAt         DateTime  @default(now())
├── updatedAt         DateTime  @updatedAt

Relations:
├── conversation      Conversation @relation
├── sender            User?        @relation
├── replyToMessage    Message?     @relation("ReplyTo")
├── replies           Message[]    @relation("ReplyTo")

Indexes:
├── @@index([conversationId])
├── @@index([externalMessageId])
├── @@index([direction])
├── @@index([senderType])
├── @@index([senderId])
├── @@index([status])
├── @@index([sentAt])
├── @@unique([conversationId, externalMessageId])  // Dedup within conversation

Enums:
├── MessageDirection: inbound | outbound
├── MessageSenderType: lead | contact | user | system | bot
├── MessageContentType: text | html | image | file | audio | video | location | template | reaction | sticker
└── MessageStatus: pending | sent | delivered | read | failed
```

### 1.3 ChannelAccount

Represents a connected messaging account/integration.

```text
Model: ChannelAccount
Table: channel_accounts

Fields:
├── id                String    @id @default(cuid())
├── provider          String    Enum: respond_io | gmail | ms365 | whatsapp_cloud | meta_business
├── channelType       String    Enum: email | whatsapp | instagram | facebook | sms
├── name              String    Display name (e.g., "CCS Sales WhatsApp")
├── accountIdentifier String    Email, phone, page ID that identifies this account
│
├── credentials       Json      Encrypted API tokens/keys (see security section)
├── webhookSecret     String?   Secret for verifying incoming webhooks
│
├── status            String    Enum: active | inactive | error | disconnected
├── lastSyncAt        DateTime? Last successful sync/webhook receive
├── syncError         String?   Last sync error message
│
├── configuration     Json      Account-specific settings
├── autopilotEnabled  Boolean   @default(false) Master autopilot toggle for account
├── rateLimitConfig   Json?     Account-specific rate limits
│
├── createdAt         DateTime  @default(now())
├── updatedAt         DateTime  @updatedAt

Relations:
├── conversations     Conversation[] @relation

Indexes:
├── @@index([provider])
├── @@index([channelType])
├── @@index([status])
├── @@unique([provider, accountIdentifier])  // One account per identifier
```

### 1.4 ParticipantIdentity (Embedded JSON)

Represents a participant in a conversation (not a separate table).

```typescript
interface ParticipantIdentity {
  // Core identifiers (at least one required)
  email?: string;           // Normalized lowercase
  phone?: string;           // E.164 format (+27821234567)
  handle?: string;          // Platform handle (@username, page ID)
  
  // Resolution
  resolvedContactId?: string;  // FK to Contact if matched
  resolvedLeadId?: string;     // FK to Lead if matched
  resolutionMethod?: "email" | "phone" | "handle" | "manual" | "unresolved";
  resolutionConfidence?: number;  // 0-1, 1 = exact match
  
  // Display
  displayName?: string;
  avatarUrl?: string;
  
  // Channel-specific
  channelType: string;
  channelUserId?: string;   // Platform-specific user ID
  
  // Metadata
  firstSeenAt: string;      // ISO timestamp
  lastSeenAt: string;       // ISO timestamp
}
```

### 1.5 AttachmentMetadata (Embedded JSON)

Stored in `Message.attachments` as JSON array.

```typescript
interface AttachmentMetadata {
  id: string;               // Generated ID
  filename: string;         // Original filename
  mimeType: string;         // MIME type (image/jpeg, application/pdf)
  sizeBytes: number;
  
  // URLs
  externalUrl?: string;     // URL from provider (may expire)
  storageUrl?: string;      // Our storage URL (if downloaded)
  thumbnailUrl?: string;    // Thumbnail for images/videos
  
  // Additional metadata
  width?: number;           // For images/videos
  height?: number;
  duration?: number;        // For audio/video (seconds)
  
  metadata?: Record<string, any>;  // Provider-specific metadata
}
```

### 1.6 Supporting Models

#### MessageTemplate

```text
Model: MessageTemplate
Table: message_templates

Fields:
├── id              String    @id @default(cuid())
├── name            String    Template name
├── description     String?   Usage description
├── channelTypes    String[]  Applicable channels
├── subject         String?   Email subject template
├── content         String    Message body with {{variables}}
├── variables       Json      Variable definitions
├── category        String?   Category for organization
├── isAutopilotSafe Boolean   @default(false) Can be used in autopilot
├── createdBy       String    FK → User.id
├── createdAt       DateTime  @default(now())
├── updatedAt       DateTime  @updatedAt
```

#### MessageAuditLog (Phase 6C)

```text
Model: MessageAuditLog
Table: message_audit_logs

Fields:
├── id              String    @id @default(cuid())
├── messageId       String    FK → Message.id
├── action          String    Enum: auto_sent | manual_sent | blocked | rate_limited | escalated
├── automationRuleId String?  Which rule triggered this
├── reason          String    Why this action was taken
├── metadata        Json      Additional context
├── userId          String?   FK → User.id (if human involved)
├── createdAt       DateTime  @default(now())
```

---

## 2. Connector Architecture

### 2.1 IChannelConnector Interface

```typescript
/**
 * Core interface for all channel connectors.
 * Each provider (Respond.io, Gmail, WhatsApp Cloud, etc.) implements this.
 */
interface IChannelConnector {
  /**
   * Unique identifier for this connector (e.g., "respond_io", "gmail")
   */
  readonly providerId: string;
  
  /**
   * Supported channel types for this connector
   */
  readonly supportedChannels: ChannelType[];
  
  /**
   * Initialize the connector with account credentials
   */
  initialize(account: ChannelAccount): Promise<void>;
  
  /**
   * Verify webhook signature/authenticity
   * @returns true if valid, throws error if invalid
   */
  verifyWebhookSignature(
    request: WebhookRequest
  ): Promise<boolean>;
  
  /**
   * Parse incoming webhook payload into normalized format
   */
  parseWebhookPayload(
    payload: unknown
  ): Promise<IncomingMessageEvent | IncomingStatusEvent | null>;
  
  /**
   * Pull messages from the provider (for initial sync or catch-up)
   * @param since Only fetch messages after this timestamp
   * @param conversationId Optional - limit to specific conversation
   */
  pullMessages(
    account: ChannelAccount,
    options?: {
      since?: Date;
      conversationId?: string;
      limit?: number;
    }
  ): Promise<PulledMessage[]>;
  
  /**
   * Send a message through this channel
   */
  sendMessage(
    account: ChannelAccount,
    conversation: Conversation,
    message: OutgoingMessage
  ): Promise<SendResult>;
  
  /**
   * List available accounts/channels (for account setup)
   */
  listAccounts(credentials: unknown): Promise<AvailableAccount[]>;
  
  /**
   * Test connection and credentials
   */
  testConnection(account: ChannelAccount): Promise<ConnectionTestResult>;
  
  /**
   * Get rate limit status for an account
   */
  getRateLimitStatus(account: ChannelAccount): Promise<RateLimitStatus>;
}

// Supporting types
interface IncomingMessageEvent {
  eventType: "message";
  externalConversationId: string;
  externalMessageId: string;
  channelType: ChannelType;
  direction: "inbound";
  sender: ParticipantIdentity;
  content: string;
  contentType: MessageContentType;
  attachments?: AttachmentMetadata[];
  sentAt: Date;
  rawPayload: unknown;  // Original webhook payload for debugging
}

interface IncomingStatusEvent {
  eventType: "status_update";
  externalMessageId: string;
  status: MessageStatus;
  timestamp: Date;
  errorMessage?: string;
}

interface OutgoingMessage {
  content: string;
  contentType: MessageContentType;
  attachments?: AttachmentUpload[];
  replyToMessageId?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

interface SendResult {
  success: boolean;
  externalMessageId?: string;
  status: MessageStatus;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}

interface RateLimitStatus {
  isLimited: boolean;
  currentUsage: number;
  limit: number;
  resetAt?: Date;
  windowType: "minute" | "hour" | "day";
}
```

### 2.2 Provider Implementation Plan

#### Phase 6A/6B: Respond.io (Primary)

```typescript
class RespondIoConnector implements IChannelConnector {
  readonly providerId = "respond_io";
  readonly supportedChannels = ["whatsapp", "instagram", "facebook", "email", "sms"];
  
  // Respond.io provides unified API across all their supported channels
  // Benefits:
  // - Single integration for multiple channels
  // - Handles platform-specific complexities
  // - Built-in webhook handling
  // - Contact management features
}
```

**Implementation Priority:** HIGH (Phase 6A)

**API Capabilities:**
- Receive webhooks for all channels
- Send messages via API
- Manage contacts
- Access conversation history

**Limitations:**
- Dependent on Respond.io uptime
- API rate limits apply
- Some features may require higher tiers

#### Future: Gmail / Microsoft 365 (Email)

```typescript
class GmailConnector implements IChannelConnector {
  readonly providerId = "gmail";
  readonly supportedChannels = ["email"];
  
  // Direct Gmail API integration
  // Benefits:
  // - No intermediary service
  // - Full email features (threading, labels)
  // - Lower latency
}

class Microsoft365Connector implements IChannelConnector {
  readonly providerId = "ms365";
  readonly supportedChannels = ["email"];
  
  // Microsoft Graph API integration
}
```

**Implementation Priority:** MEDIUM (After Phase 6B)

#### Future: WhatsApp Cloud API (Direct)

```typescript
class WhatsAppCloudConnector implements IChannelConnector {
  readonly providerId = "whatsapp_cloud";
  readonly supportedChannels = ["whatsapp"];
  
  // Direct WhatsApp Business Cloud API
  // Benefits:
  // - No intermediary fees
  // - Full control over messaging
  // - Template message support
  // Limitations:
  // - Must be approved business
  // - 24-hour messaging window rules
  // - Template approval process
}
```

**Implementation Priority:** LOW (Only if bypassing Respond.io needed)

#### Future: Meta Business (Instagram/Facebook Direct)

```typescript
class MetaBusinessConnector implements IChannelConnector {
  readonly providerId = "meta_business";
  readonly supportedChannels = ["instagram", "facebook"];
  
  // Instagram Messaging API + Facebook Messenger API
  // Benefits:
  // - Direct integration, no intermediary
  // Limitations:
  // - Separate app reviews for each
  // - Complex permission system
}
```

**Implementation Priority:** LOW

#### LinkedIn: Limited Support Note

```text
⚠️ LINKEDIN MESSAGING LIMITATIONS

LinkedIn has significant restrictions on automated messaging:

1. NO API for direct messaging (InMail)
   - LinkedIn Sales Navigator API exists but doesn't support sending messages
   - Connection requests via API are restricted
   
2. Scraping/automation is against TOS
   - Risk of account suspension
   - Legal liability
   
3. What IS possible:
   - LinkedIn profile enrichment (limited data via official API)
   - Lead Gen Forms integration
   - Company page data
   
4. Recommendation:
   - Do NOT implement LinkedIn messaging connector
   - Focus LinkedIn integration on:
     - Profile data enrichment (Phase 2)
     - Lead Gen Form webhook capture
     - Company information lookup
   - LinkedIn outreach remains manual through native platform

Implementation: NOT PLANNED for messaging
Partial support: Profile enrichment in Phase 2, Lead Gen Forms in future phase
```

### 2.3 Connector Registry

```typescript
interface ConnectorRegistry {
  /**
   * Get connector by provider ID
   */
  getConnector(providerId: string): IChannelConnector;
  
  /**
   * Get all available connectors
   */
  listConnectors(): IChannelConnector[];
  
  /**
   * Register a new connector (for extensibility)
   */
  registerConnector(connector: IChannelConnector): void;
}

// Usage
const registry = new ConnectorRegistry();
registry.registerConnector(new RespondIoConnector());
registry.registerConnector(new GmailConnector());

// Get connector for account
const connector = registry.getConnector(account.provider);
await connector.sendMessage(account, conversation, message);
```

---

## 3. Identity Resolution Strategy

### 3.1 Overview

Identity resolution matches incoming message participants to existing Contact and Lead records. This enables:

- Unified conversation history per person
- Context from CRM in inbox
- Accurate attribution

### 3.2 Version 1: Deterministic Matching (Phase 6A)

```typescript
interface IdentityResolutionV1 {
  /**
   * Attempt to resolve a participant identity to existing records.
   * Uses deterministic (exact match) rules only.
   */
  resolve(identity: ParticipantIdentity): Promise<ResolutionResult>;
}

interface ResolutionResult {
  matched: boolean;
  contactId?: string;
  leadId?: string;
  method: "email" | "phone" | "handle" | "unresolved";
  confidence: number;  // Always 1.0 for deterministic matches
}
```

**Matching Rules (evaluated in order):**

1. **Email Match** (highest priority)
   ```
   IF identity.email IS NOT NULL
   AND Contact.email = LOWER(identity.email)
   THEN match to Contact
   CONFIDENCE: 1.0
   ```

2. **Phone Match (E.164 normalized)**
   ```
   IF identity.phone IS NOT NULL
   AND Contact.phone = normalize_e164(identity.phone)
   THEN match to Contact
   CONFIDENCE: 1.0
   ```

3. **Lead Email Match**
   ```
   IF identity.email IS NOT NULL
   AND Lead.email = LOWER(identity.email)
   THEN match to Lead
   CONFIDENCE: 1.0
   ```

4. **Lead Phone Match**
   ```
   IF identity.phone IS NOT NULL
   AND Lead.phone = normalize_e164(identity.phone)
   THEN match to Lead
   CONFIDENCE: 1.0
   ```

5. **No Match**
   ```
   ELSE
   Mark as unresolved
   Create pending resolution for human review
   ```

**Phone Normalization (E.164):**

```typescript
function normalizeE164(phone: string, defaultCountry = "ZA"): string {
  // Use libphonenumber or similar
  // Input: "082 123 4567" → Output: "+27821234567"
  // Input: "+27 82 123 4567" → Output: "+27821234567"
  // Input: "0821234567" → Output: "+27821234567" (assumes ZA)
}
```

### 3.3 Version 2: Assisted Matching (Phase 6B+)

```typescript
interface IdentityResolutionV2 extends IdentityResolutionV1 {
  /**
   * Get suggested matches for manual review
   */
  getSuggestedMatches(identity: ParticipantIdentity): Promise<SuggestedMatch[]>;
  
  /**
   * Manually confirm/reject a suggested match
   */
  confirmMatch(
    identityId: string,
    contactId: string,
    confirmedBy: string
  ): Promise<void>;
  
  /**
   * Create new contact from unresolved identity
   */
  createContactFromIdentity(
    identity: ParticipantIdentity,
    createdBy: string
  ): Promise<Contact>;
}

interface SuggestedMatch {
  contactId: string;
  contact: Contact;
  matchReason: string;   // "Similar name", "Same company domain"
  confidence: number;    // 0-1, lower for fuzzy matches
}
```

**Fuzzy Matching Rules (for suggestions only):**

1. **Name Similarity**
   - Levenshtein distance < 3
   - Soundex/Metaphone match

2. **Domain Match**
   - Email domain matches company domain

3. **Company Association**
   - Same company, similar name

**Human Review Queue:**

```text
Model: IdentityResolutionQueue
Table: identity_resolution_queue

Fields:
├── id              String    @id @default(cuid())
├── participantIdentity Json  The identity to resolve
├── conversationId  String    FK → Conversation.id
├── suggestedMatches Json     Array of SuggestedMatch
├── status          String    Enum: pending | resolved | skipped
├── resolvedContactId String? FK → Contact.id (if resolved)
├── resolvedBy      String?   FK → User.id (who resolved)
├── resolvedAt      DateTime?
├── createdAt       DateTime  @default(now())
```

---

## 4. Timeline + Threading Rules

### 4.1 Message-to-Conversation Mapping

```typescript
interface ConversationMatcher {
  /**
   * Find or create conversation for incoming message
   */
  findOrCreateConversation(
    event: IncomingMessageEvent,
    account: ChannelAccount
  ): Promise<Conversation>;
}
```

**Matching Rules:**

1. **External ID Match (Primary)**
   ```
   IF event.externalConversationId IS NOT NULL
   AND Conversation.externalId = event.externalConversationId
   AND Conversation.channelAccountId = account.id
   THEN return existing Conversation
   ```

2. **Participant + Channel Match (Fallback)**
   ```
   IF event.externalConversationId IS NULL
   AND existing Conversation exists with:
     - Same channelAccountId
     - Same participant identities (by email/phone)
     - Status != "archived"
     - Created within last 30 days
   THEN return existing Conversation
   ```

3. **Create New**
   ```
   ELSE create new Conversation
   ```

### 4.2 Message Deduplication

```typescript
interface MessageDeduplicator {
  /**
   * Check if message already exists (prevent duplicate webhook processing)
   */
  isDuplicate(
    conversationId: string,
    externalMessageId: string
  ): Promise<boolean>;
}
```

**Dedup Rules:**

1. **Exact External ID Match**
   ```
   IF Message exists with:
     - conversationId = given conversationId
     - externalMessageId = given externalMessageId
   THEN return true (duplicate)
   ```

2. **Content + Timestamp Match (Fuzzy Dedup)**
   ```
   IF Message exists with:
     - conversationId = given conversationId
     - content = given content (exact)
     - sentAt within 5 seconds of given sentAt
   THEN return true (probable duplicate)
   ```

### 4.3 Threading Rules

**Email Threading:**

```
For email conversations:
1. Use In-Reply-To / References headers to find parent message
2. Set replyToMessageId to parent message
3. If no headers, thread by subject + participants
```

**Messaging App Threading:**

```
For WhatsApp/Instagram/Facebook:
1. All messages in same conversation are one thread
2. Use platform's reply feature if available
3. replyToMessageId only set if explicit reply
```

### 4.4 Timeline Display Order

```sql
-- Messages in timeline (conversation detail view)
SELECT * FROM messages
WHERE conversationId = :conversationId
ORDER BY sentAt ASC;  -- Oldest first (chat style)

-- Conversations in inbox (list view)
SELECT * FROM conversations
WHERE status IN ('open', 'snoozed')
ORDER BY lastMessageAt DESC;  -- Most recent first
```

---

## 5. Safety and Compliance Guardrails

### 5.1 Read-Only Mode (Phase 6A)

```typescript
interface ReadOnlyGuard {
  /**
   * Throws if attempting to send in read-only mode
   */
  assertSendingAllowed(): void;
}

// Implementation
class ReadOnlyGuard {
  private readonly readOnlyMode: boolean;
  
  assertSendingAllowed(): void {
    if (this.readOnlyMode) {
      throw new Error("Sending disabled: System in read-only mode (Phase 6A)");
    }
  }
}
```

### 5.2 Human Approval Guard (Phase 6B)

```typescript
interface HumanApprovalGuard {
  /**
   * Verify message was initiated by authenticated user
   */
  requireHumanInitiation(userId: string, conversationId: string): void;
}
```

### 5.3 Autopilot Guards (Phase 6C)

```typescript
interface AutopilotGuards {
  /**
   * Check all conditions before auto-sending
   */
  canAutoSend(
    conversation: Conversation,
    account: ChannelAccount,
    template: MessageTemplate
  ): Promise<AutopilotCheckResult>;
}

interface AutopilotCheckResult {
  allowed: boolean;
  blockedBy?: string[];  // Which checks failed
  warnings?: string[];   // Non-blocking warnings
}
```

**Autopilot Checklist:**

1. ✅ Global autopilot enabled
2. ✅ Account autopilot enabled
3. ✅ Conversation autopilot enabled
4. ✅ Not in quiet hours
5. ✅ Under rate limit
6. ✅ Template is autopilot-safe
7. ✅ No recent escalation trigger
8. ✅ Kill switch not activated

### 5.4 Rate Limiting

```typescript
interface RateLimiter {
  /**
   * Check if send is within rate limits
   * @throws RateLimitExceededError if limit reached
   */
  checkRateLimit(
    accountId: string,
    config: RateLimitConfig
  ): Promise<void>;
  
  /**
   * Record a sent message for rate tracking
   */
  recordSend(accountId: string): Promise<void>;
}

interface RateLimitConfig {
  maxPerHour: number;
  maxPerDay: number;
  cooldownBetweenAutoMs: number;  // Min time between auto-messages
}
```

### 5.5 Quiet Hours

```typescript
interface QuietHoursChecker {
  /**
   * Check if current time is within quiet hours
   */
  isQuietHours(config: QuietHoursConfig): boolean;
  
  /**
   * Get next available send time
   */
  getNextSendTime(config: QuietHoursConfig): Date;
}

interface QuietHoursConfig {
  enabled: boolean;
  timezone: string;       // "Africa/Johannesburg"
  startHour: number;      // 22 (10 PM)
  endHour: number;        // 7 (7 AM)
  weekendsAllDay: boolean;
}
```

### 5.6 Kill Switch

```typescript
interface KillSwitch {
  /**
   * Check if kill switch is active
   */
  isActive(): boolean;
  
  /**
   * Activate kill switch (stops all autopilot immediately)
   */
  activate(reason: string, activatedBy: string): Promise<void>;
  
  /**
   * Deactivate kill switch (requires confirmation)
   */
  deactivate(deactivatedBy: string, confirmationCode: string): Promise<void>;
}
```

**Kill Switch Behavior:**
- Instantly stops all autopilot sends
- Does not affect manual human sends
- Logs activation event with reason
- Requires explicit confirmation to reactivate
- Persisted in database (survives restart)

### 5.7 Webhook Security

```typescript
interface WebhookVerifier {
  /**
   * Verify webhook signature
   * @throws WebhookVerificationError if invalid
   */
  verify(
    provider: string,
    request: {
      headers: Record<string, string>;
      body: string;
      signature?: string;
    },
    secret: string
  ): Promise<void>;
}
```

**Per-Provider Verification:**

| Provider | Method | Header |
|----------|--------|--------|
| Respond.io | HMAC-SHA256 | `X-Respond-Signature` |
| Gmail | Push notification token | `X-Goog-Channel-Token` |
| WhatsApp Cloud | HMAC-SHA256 | `X-Hub-Signature-256` |
| Meta | HMAC-SHA256 | `X-Hub-Signature-256` |

### 5.8 Credential Security

```typescript
interface CredentialStore {
  /**
   * Store credentials (encrypted at rest)
   */
  store(accountId: string, credentials: unknown): Promise<void>;
  
  /**
   * Retrieve credentials (decrypted)
   */
  retrieve(accountId: string): Promise<unknown>;
  
  /**
   * Rotate credentials
   */
  rotate(accountId: string, newCredentials: unknown): Promise<void>;
}
```

**Security Requirements:**
- Credentials encrypted at rest (AES-256)
- Encryption key from environment variable
- Never log credentials
- Credentials not exposed in API responses
- Audit log for credential access

---

## 6. Incremental Rollout Checklist

### 6A Checklist: Read-Only Foundation

**Data Layer:**
- [ ] Create Conversation model + migration
- [ ] Create Message model + migration
- [ ] Create ChannelAccount model + migration
- [ ] Implement ParticipantIdentity JSON schema
- [ ] Implement AttachmentMetadata JSON schema

**Connector Layer:**
- [ ] Create IChannelConnector interface
- [ ] Implement RespondIoConnector
- [ ] Implement ConnectorRegistry
- [ ] Webhook signature verification

**Identity Resolution:**
- [ ] Implement phone number normalization (E.164)
- [ ] Implement deterministic email matching
- [ ] Implement deterministic phone matching
- [ ] Handle unresolved identities

**API Layer:**
- [ ] POST /api/webhooks/respond-io (receive messages)
- [ ] GET /api/conversations (list)
- [ ] GET /api/conversations/[id] (detail)
- [ ] GET /api/conversations/[id]/messages (message list)

**UI Layer:**
- [ ] Unified Inbox page (conversation list)
- [ ] Conversation detail page (message timeline)
- [ ] Participant info sidebar
- [ ] Channel indicator icons

**Testing:**
- [ ] Webhook ingestion works
- [ ] Messages stored correctly
- [ ] Identity resolution matches known contacts
- [ ] UI displays conversations

### 6B Checklist: Assisted Replies

**Data Layer:**
- [ ] Create MessageTemplate model + migration
- [ ] Create MessageDraft model (optional)

**Connector Layer:**
- [ ] Implement sendMessage for RespondIoConnector
- [ ] Implement send status tracking

**API Layer:**
- [ ] POST /api/conversations/[id]/reply (send message)
- [ ] GET /api/conversations/[id]/suggestions (draft suggestions)
- [ ] CRUD endpoints for MessageTemplate

**UI Layer:**
- [ ] Reply composer in conversation view
- [ ] Template picker
- [ ] Attachment upload (email)
- [ ] Send button with confirmation
- [ ] Delivery status indicators

**Safety:**
- [ ] Human approval required for all sends
- [ ] Outbound message logging
- [ ] Error handling and retry UI

**Testing:**
- [ ] Manual reply sends successfully
- [ ] Message appears in timeline
- [ ] Delivery status updates
- [ ] Templates work correctly

### 6C Checklist: Controlled Autopilot

**Data Layer:**
- [ ] Create MessageAuditLog model + migration
- [ ] Create AutopilotConfiguration storage

**Safety Layer:**
- [ ] Implement rate limiter
- [ ] Implement quiet hours checker
- [ ] Implement kill switch
- [ ] Implement autopilot guards

**API Layer:**
- [ ] GET/PUT /api/admin/autopilot/config
- [ ] POST /api/admin/autopilot/kill-switch
- [ ] GET /api/admin/autopilot/audit-log

**UI Layer:**
- [ ] Autopilot toggle per conversation
- [ ] Admin autopilot configuration page
- [ ] Kill switch button (admin only)
- [ ] Audit log viewer
- [ ] Rate limit status display

**Automation:**
- [ ] Auto-reply trigger logic
- [ ] Template selection logic
- [ ] Escalation detection
- [ ] Audit logging for all auto-sends

**Testing:**
- [ ] Autopilot only triggers when enabled
- [ ] Rate limits enforced
- [ ] Quiet hours respected
- [ ] Kill switch stops all autopilot
- [ ] Full audit trail recorded

---

## 7. Open Questions / Future Considerations

### 7.1 File Storage

Phase 6A does not include attachment file storage. Options for future:

1. **External URLs only** - Use provider's URLs (may expire)
2. **Download to blob storage** - S3, Vercel Blob, Cloudinary
3. **Hybrid** - Cache frequently accessed, link to provider for others

### 7.2 Email Threading Complexity

Email threading is complex (References headers, subject matching). Consider:

1. **Basic threading** - Same subject = same conversation
2. **Advanced threading** - Parse In-Reply-To, References headers
3. **Use email service** - Let Gmail/Outlook handle threading

### 7.3 Multi-Account per Channel

Can a business have multiple WhatsApp numbers or email accounts?

Current design: Yes, each is a separate ChannelAccount.
UI consideration: Filter inbox by account or show all unified.

### 7.4 Contact vs Lead Ownership

When conversation matches both Contact and Lead, which "owns" the conversation?

Proposal: Lead takes precedence (sales context), Contact is reference.

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-11 | 1.0 | Initial design document |

---

## Related Documents

- [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) - Phase overview
- [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md) - Living system definition
- [PHASE_STATUS_MATRIX.md](./PHASE_STATUS_MATRIX.md) - Current phase status
