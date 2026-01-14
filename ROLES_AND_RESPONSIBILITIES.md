# Roles and Responsibilities

**Last Updated:** January 14, 2026  
**Status:** Production Ready

---

## Human Roles

### Product Owner (User)

**Responsibilities:**
- Define business requirements
- Prioritize features and phases
- Approve outreach messages before sending
- Review discovery results
- Manage lead pipeline
- Make strategic decisions about system usage

**Access:**
- Full system access (admin role)
- All dashboard features
- Discovery configuration
- Outreach approval

**Key Activities:**
- Review and approve outreach drafts
- Monitor discovery run results
- Assign leads to team members
- Add notes to leads
- Manage company and contact data

---

### Sales Team Members (Users)

**Responsibilities:**
- Manage assigned leads
- Update lead status
- Add notes to leads
- Generate outreach drafts
- Review and send outreach messages

**Access:**
- Limited access (user role)
- Lead management features
- Outreach draft generation
- Cannot configure discovery

**Key Activities:**
- Update lead status as sales progresses
- Add internal notes
- Generate outreach drafts
- Review and send messages

---

### System Administrator

**Responsibilities:**
- System configuration
- Environment variable management
- Database maintenance
- Deployment management
- Monitoring and troubleshooting

**Access:**
- Full system access
- Server configuration
- Database access
- Deployment pipeline

**Key Activities:**
- Configure Google CSE credentials
- Manage environment variables
- Monitor system health
- Handle deployment issues
- Database backups

---

## System Autonomy

### Current Autonomy Level: Assisted

**What the System Does Automatically:**
- Daily discovery runs (06:00 UTC)
- Company enrichment (on-demand)
- Lead scoring (automatic on create/update)
- Draft generation (on-demand)

**What Requires Human Approval:**
- All outreach message sending
- Discovery run materialization (for dry-runs)
- Lead assignment
- Status changes

---

## AI Pair Developer (Cursor)

**Responsibilities:**
- Code implementation
- Bug fixes
- Feature development
- Code refactoring
- Documentation updates
- Testing support

**Limitations:**
- Does NOT make business decisions
- Does NOT approve outreach messages
- Does NOT configure production settings
- Does NOT access production data

**Key Activities:**
- Implement features per requirements
- Fix bugs and issues
- Write and update documentation
- Create test scripts
- Review code for quality

---

## Safety Philosophy

### Human-in-the-Loop

**Principle:** Critical actions require human approval

**Examples:**
- Outreach message sending (Phase 5B)
- Discovery run materialization
- Bulk operations
- Data deletion

### Safety Guardrails

**Automated Safety:**
- Rate limiting (outreach)
- Suppression lists (outreach)
- Cooldown periods (outreach)
- Kill switches (discovery)
- Time budgets (discovery)
- Max limits (discovery)

**Human Oversight:**
- Approval workflows
- Confirmation dialogs
- Audit trails
- Error notifications

---

## Decision-Making Authority

### Product Owner Decisions

- Feature prioritization
- Business rules configuration
- Outreach message approval
- Lead assignment
- System usage strategy

### System Decisions

- Discovery execution (automated)
- Scoring calculations (automatic)
- Data enrichment (on-demand)
- Deduplication (automatic)

### Developer Decisions

- Implementation approach
- Code structure
- Technology choices
- Performance optimizations

---

## Communication Channels

### Internal Communication

- **Dashboard:** System notifications and status
- **Email:** (Future) System alerts and reports
- **Notes:** Lead notes for team collaboration

### External Communication

- **Outreach:** Email, WhatsApp, Instagram, Facebook (Phase 6+)
- **Respond.io:** (Planned) Unified inbox

---

## Escalation Paths

### Technical Issues

1. System Administrator
2. Developer (if needed)
3. External support (Vercel, Neon)

### Business Decisions

1. Product Owner
2. Management (if needed)

### Data Issues

1. Product Owner
2. System Administrator
3. Database backup/restore (if needed)

---

## Related Documentation

- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System overview
- [PRODUCT_DEFINITION.md](./PRODUCT_DEFINITION.md) - Product features
- [DISCOVERY_LIFECYCLE.md](./DISCOVERY_LIFECYCLE.md) - Discovery process
