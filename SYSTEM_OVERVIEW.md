# 📋 CCS Lead Agent v2 - System Overview

**Purpose:** A comprehensive B2B Lead Generation and Business Development platform designed specifically for CCS Apparel to manage, score, and develop leads in South Africa and Botswana.

---

## 🎯 **Core Purpose**

CCS Lead Agent v2 is a **centralized business development platform** that helps CCS Apparel:
- **Track and manage** potential business leads
- **Identify high-quality prospects** through automated scoring
- **Enrich company data** using external sources
- **Organize contacts and relationships** effectively
- **Prioritize sales efforts** based on lead quality scores
- **Import and process** lead data in bulk

---

## 🏢 **Who Is This For?**

- **CCS Apparel Business Development Team**
- **Sales Representatives**
- **Account Managers**
- **Management** (for reporting and oversight)

**Target Market:** South Africa and Botswana businesses

---

## ✨ **What The System Can Do**

### 1. **Lead Management** 🎯

**Purpose:** Track and manage potential customers throughout the sales pipeline.

**Capabilities:**
- ✅ **Create individual leads** with contact information (email, name, phone, company)
- ✅ **Track lead status** (new, contacted, qualified, archived, etc.)
- ✅ **Link leads to companies** and contacts
- ✅ **Record lead source** (referral, partnership, website, cold outreach, etc.)
- ✅ **View and filter leads** by status, score, date, country
- ✅ **Edit and update** lead information
- ✅ **View lead details** with full history

**What You Can Do:**
- Add a new lead manually
- Update lead status as you progress through the sales process
- See all leads in one place, sorted by priority/score
- Filter leads by country (prioritize South Africa & Botswana)
- Track which leads came from referrals vs. cold outreach

---

### 2. **Company Management** 🏢

**Purpose:** Organize and enrich company information for better targeting.

**Capabilities:**
- ✅ **Store company information** (name, website, industry, country, size)
- ✅ **Link multiple contacts** to each company
- ✅ **Link multiple leads** to each company
- ✅ **View company details** with associated contacts and leads
- ✅ **Edit company information**
- ✅ **Enrich company data** using Google Custom Search (automatically find websites, infer industry)
- ✅ **Track company scores** (see which companies are most valuable)

**What You Can Do:**
- Add companies manually or import via CSV
- Use "Enrich" feature to automatically find company websites and industry info
- See all contacts and leads associated with a company in one view
- Identify companies with multiple leads (higher interest = better prospects)
- Filter companies by size, industry, or country

**Future Enhancement:**
- Automatic company enrichment from LinkedIn, Crunchbase, etc.

---

### 3. **Contact Management** 👥

**Purpose:** Manage individual contacts at companies and track relationships.

**Capabilities:**
- ✅ **Store contact information** (name, email, phone, role/title)
- ✅ **Link contacts to companies**
- ✅ **Track which leads** are associated with each contact
- ✅ **View contact details** and related company/leads
- ✅ **Edit contact information**
- ✅ **See contact count** per company (more contacts = better coverage)

**What You Can Do:**
- Maintain a database of decision-makers and contacts at target companies
- See all contacts at a specific company
- Track which contact a lead came from
- Update contact information as roles change

---

### 4. **Lead Scoring System** ⭐

**Purpose:** Automatically prioritize leads and companies based on likelihood to convert.

**Capabilities:**
- ✅ **Automatic scoring** (0-100 scale) for leads and companies
- ✅ **Rule-based scoring algorithm** that considers:
  - Lead status (qualified = higher score)
  - Lead source (referrals = highest score)
  - Company size (larger companies = higher score)
  - Country (South Africa & Botswana prioritized)
  - Number of leads per company (more leads = higher interest)
  - Number of contacts per company (better coverage = higher score)
  - Industry relevance
- ✅ **Score explanation** (see why a lead/company scored what it did)
- ✅ **Recalculate scores** on-demand or when data changes
- ✅ **Filter by minimum score** (focus on high-priority leads)

**Scoring Factors (Leads):**
- Status: Qualified (30 pts), Contacted (20 pts), New (10 pts)
- Source: Referral (25 pts), Partnership (20 pts), Inbound/Website (15 pts), Cold (5 pts)
- Country: South Africa (15 pts), Botswana (10 pts), Other (5 pts)
- Company Size: 500+ employees (30 pts), 200+ (25 pts), 50+ (20 pts), 10+ (10 pts)

**Scoring Factors (Companies):**
- Lead Count: 6+ leads (50 pts), 3+ (35 pts), 1+ (20 pts)
- Contact Count: 6+ contacts (35 pts), 3+ (25 pts), 1+ (15 pts)
- Country: South Africa (15 pts), Botswana (10 pts), Other (5 pts)
- Industry: Target sectors (10 pts), Related sectors (8 pts), Other (5 pts)

**What You Can Do:**
- Focus on leads/companies with scores above 50 (high priority)
- Understand why a lead scored high (it came from a referral, company is large, etc.)
- Prioritize your day by starting with highest-scoring leads
- See which companies have the most engagement (multiple leads = high score)

**Future Enhancement:**
- AI-based scoring using machine learning
- Email engagement scoring (open rates, click rates)
- Sentiment analysis of interactions

---

### 5. **Data Enrichment** 🔍

**Purpose:** Automatically find missing company information from the web.

**Capabilities:**
- ✅ **Google Custom Search integration** to find company websites
- ✅ **Automatic website discovery** (if company website is missing)
- ✅ **Industry inference** from web search results
- ✅ **Enrichment status tracking** (never, pending, success, failed)
- ✅ **One-click enrichment** for any company

**What You Can Do:**
- Click "Enrich" button on any company
- System searches Google for the company
- Automatically fills in website and industry if found
- Track which companies have been enriched and when

**Requirements:**
- Google Custom Search Engine API key (optional - enrichment still works without it, just won't fetch data)

**Future Enhancement:**
- LinkedIn company data enrichment
- Crunchbase financial data
- News and press mentions
- Social media presence

---

### 6. **CSV Import System** 📥

**Purpose:** Import leads, companies, and contacts in bulk from spreadsheets.

**Capabilities:**
- ✅ **Import Companies** from CSV
- ✅ **Import Contacts** from CSV
- ✅ **Import Leads** from CSV
- ✅ **Batch processing** (handles large files)
- ✅ **Duplicate detection** (updates existing records instead of creating duplicates)
- ✅ **Error reporting** (shows which rows failed and why)
- ✅ **Import history** (track all imports with success/error counts)
- ✅ **Company matching** (automatically links contacts/leads to companies)

**What You Can Do:**
- Export leads from other systems (Excel, CRM, etc.) to CSV
- Import hundreds of companies at once
- System automatically matches contacts to companies by name
- See import results: "Successfully imported 150 companies, 2 errors"

**CSV Formats Supported:**
- **Companies:** name, website, industry, country, size
- **Contacts:** firstName, lastName, email, phone, role, companyName
- **Leads:** email, firstName, lastName, phone, country, status, source, companyName, contactEmail

**Future Enhancement:**
- Import from LinkedIn Sales Navigator
- Import from HubSpot
- Import from Google Sheets
- Scheduled automatic imports

---

### 7. **Dashboard & Analytics** 📊

**Purpose:** Get a quick overview of your business development pipeline.

**Capabilities:**
- ✅ **Key metrics** at a glance:
  - Total leads
  - New leads (last 7 days)
  - Qualified leads (in progress)
  - Total companies
  - Total contacts
- ✅ **Quick actions** (add lead, add company, add contact)
- ✅ **Navigation** to all sections

**What You Can Do:**
- See how many new leads came in this week
- Quickly add a new lead or company
- Monitor your pipeline health

**Future Enhancement:**
- Charts and graphs
- Conversion rates
- Lead source analysis
- Pipeline visualization
- Time-to-convert metrics

---

### 8. **Search & Filtering** 🔎

**Purpose:** Find specific leads, companies, or contacts quickly.

**Capabilities:**
- ✅ **Sort by score** (highest first)
- ✅ **Sort by date** (newest first)
- ✅ **Filter by minimum score** (show only leads/companies above X score)
- ✅ **View all records** or focus on specific subsets

**What You Can Do:**
- "Show me all leads with score above 50"
- "Show me companies sorted by score, highest first"
- "Show me all leads created in the last month"

---

### 9. **User Authentication & Security** 🔐

**Purpose:** Secure access control for your business data.

**Capabilities:**
- ✅ **Email-based login** (ccsapparel.africa or ccsapparel.co.za domains only)
- ✅ **Role-based access** (admin, user roles)
- ✅ **Secure password storage** (encrypted with bcryptjs)
- ✅ **Session management** (stays logged in for 30 days)
- ✅ **Protected routes** (dashboard requires login)

**What You Can Do:**
- Only team members with @ccsapparel email addresses can access
- Each user has their own account
- Secure data access with encrypted passwords

---

## 🎯 **Typical User Workflows**

### **Workflow 1: Adding a New Lead**
1. Go to Dashboard → Leads → Add Lead
2. Fill in lead information (email, name, company, phone, country, source)
3. System automatically:
   - Creates/updates the company
   - Links lead to company
   - Calculates lead score
4. Lead appears in list, sorted by score

### **Workflow 2: Importing Leads from CSV**
1. Export leads from existing system to CSV
2. Go to Dashboard → Imports
3. Select "Leads" as import type
4. Upload CSV file
5. System processes file and shows results
6. All leads are scored automatically

### **Workflow 3: Prioritizing Your Day**
1. Go to Dashboard → Leads
2. Sort by Score (highest first)
3. Filter by minimum score (e.g., 50+)
4. Focus on top-scoring leads first
5. Check score factors to understand why they scored high

### **Workflow 4: Enriching Company Data**
1. Go to Dashboard → Companies
2. Click on a company
3. Click "Enrich Company" button
4. System searches Google for company info
5. Website and industry are automatically filled in (if found)

### **Workflow 5: Tracking Multiple Leads from One Company**
1. View a company detail page
2. See all leads associated with that company
3. Higher lead count = higher company score
4. This indicates strong interest - prioritize outreach

---

## 📈 **Business Value**

### **For Sales Team:**
- ✅ **Focus on high-quality leads** (scoring system prioritizes best prospects)
- ✅ **Save time** (automatic scoring, bulk imports, data enrichment)
- ✅ **Never miss a lead** (centralized database)
- ✅ **Track relationships** (see all contacts and leads at each company)

### **For Management:**
- ✅ **Pipeline visibility** (see total leads, qualified leads, new leads)
- ✅ **Data-driven decisions** (scores help identify best opportunities)
- ✅ **Team efficiency** (automated processes reduce manual work)

### **For Business Development:**
- ✅ **Identify opportunities** (companies with multiple leads = high interest)
- ✅ **Prioritize markets** (South Africa & Botswana automatically prioritized)
- ✅ **Track sources** (see which channels generate best leads - referrals, partnerships, etc.)

---

## 🚀 **Future Capabilities (Planned)**

### **Phase 5: Advanced Integrations**
- LinkedIn Sales Navigator integration
- HubSpot CRM sync
- Email notification system
- Automated lead capture from website forms

### **Phase 6: POPIA/GDPR Compliance**
- Privacy policy page
- Cookie consent banner
- Data deletion requests
- Data export functionality
- Consent management
- Audit logging

---

## 🎓 **Key Concepts**

### **Lead Score (0-100)**
A numerical value indicating how likely a lead is to convert. Higher scores = better prospects. Based on:
- Lead status and source
- Company characteristics
- Geographic location
- Engagement level

### **Company Score (0-100)**
A numerical value indicating the overall value of a company as a prospect. Based on:
- Number of leads (more leads = more interest)
- Number of contacts (better coverage)
- Geographic location
- Industry relevance

### **Enrichment**
Automatically finding missing company information (website, industry) from web searches. Helps build complete company profiles without manual research.

### **CSV Import**
Bulk importing of leads, companies, or contacts from spreadsheet files. Useful for migrating data from other systems or importing lists.

---

## 📞 **Support & Access**

**Application URL:** https://ccs-lead-agent-v2.vercel.app

**Admin Access:**
- Email: `dumi@ccsapparel.africa`
- Password: `Dcs_BD7@`

**Access Requirements:**
- Must use @ccsapparel.africa or @ccsapparel.co.za email domain

---

**Last Updated:** January 10, 2026  
**Version:** 2.0  
**Status:** Production Ready ✅
