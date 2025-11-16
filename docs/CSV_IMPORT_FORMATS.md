# CSV Import Formats

This document describes the expected CSV formats for importing Companies, Contacts, and Leads into the CCS Lead Agent v2 system.

## General Requirements

- **File Type:** CSV (Comma-Separated Values) with `.csv` extension
- **Encoding:** UTF-8
- **File Size:** Maximum 10MB per file
- **Headers:** First row must contain column headers (case-sensitive)
- **Delimiter:** Comma (,)
- **Text Qualifier:** Double quotes (") for fields containing commas or line breaks

## Companies CSV Format

### Required Headers
```csv
name,website,industry,country,size
```

### Field Descriptions

| Field | Required | Type | Description | Example |
|-------|----------|------|-------------|---------|
| name | ✓ | String | Company name | "Acme Corporation" |
| website | ✗ | URL | Company website | "https://acme.com" |
| industry | ✗ | String | Industry sector | "Technology" |
| country | ✗ | String | Primary country of operation | "South Africa" |
| size | ✗ | String | Employee count range | "50-200" |

### Size Field Values
Recommended values: `"1-10"`, `"11-50"`, `"51-200"`, `"201-500"`, `"501-1000"`, `"1000+"`, or custom ranges

### Example CSV
```csv
name,website,industry,country,size
"Acme Corporation","https://acme.com","Technology","South Africa","50-200"
"Global Traders Ltd","https://globaltraders.co.za","Import/Export","Botswana","11-50"
"Innovation Hub","","Technology","South Africa","1-10"
```

### Validation Rules
- **name:** Cannot be empty
- Duplicate detection: Company names are matched case-insensitively
- If a company with the same name exists, it will be **updated** with new data
- If a company doesn't exist, it will be **created**

---

## Contacts CSV Format

### Required Headers
```csv
firstName,lastName,email,phone,role,companyName
```

### Field Descriptions

| Field | Required | Type | Description | Example |
|-------|----------|------|-------------|---------|
| firstName | ✓ | String | Contact's first name | "John" |
| lastName | ✓ | String | Contact's last name | "Doe" |
| email | ✓ | Email | Contact's email address | "john@acme.com" |
| phone | ✗ | String | Phone number with country code | "+27123456789" |
| role | ✗ | String | Job title or role | "CEO" |
| companyName | ✗ | String | Associated company name | "Acme Corporation" |

### Example CSV
```csv
firstName,lastName,email,phone,role,companyName
"John","Doe","john@acme.com","+27123456789","CEO","Acme Corporation"
"Jane","Smith","jane@globaltraders.com","+267987654321","Sales Director","Global Traders Ltd"
"Alice","Johnson","alice@innovation.co.za","","CTO","Innovation Hub"
```

### Validation Rules
- **firstName, lastName, email:** Cannot be empty
- **email:** Must be a valid email format
- Duplicate detection: Contacts are matched by email (case-insensitive)
- If a contact with the same email exists, it will be **updated** with new data
- If a contact doesn't exist, it will be **created**

### Company Matching Logic
- **companyName** is matched against existing companies (case-insensitive)
- If matching company found: Contact is linked to that company
- If company not found: A new company is **created** with just the name
- If companyName is empty: Contact is created without company linkage

---

## Leads CSV Format

### Required Headers
```csv
email,firstName,lastName,phone,country,status,score,source,companyName,contactEmail
```

### Field Descriptions

| Field | Required | Type | Description | Example |
|-------|----------|------|-------------|---------|
| email | ✓ | Email | Lead's email address | "jane@example.com" |
| firstName | ✗ | String | Lead's first name | "Jane" |
| lastName | ✗ | String | Lead's last name | "Smith" |
| phone | ✗ | String | Phone number with country code | "+27987654321" |
| country | ✗ | String | Lead's country | "South Africa" |
| status | ✗ | String | Lead status | "new" |
| score | ✗ | Integer (0-100) | Lead score | "75" |
| source | ✗ | String | Lead source | "referral" |
| companyName | ✗ | String | Associated company name | "Acme Corporation" |
| contactEmail | ✗ | Email | Associated contact email | "john@acme.com" |

### Status Field Values
Allowed values: `"new"`, `"contacted"`, `"qualified"`, `"proposal"`, `"negotiation"`, `"closed-won"`, `"closed-lost"`

Default if not provided: `"new"`

### Example CSV
```csv
email,firstName,lastName,phone,country,status,score,source,companyName,contactEmail
"jane@example.com","Jane","Smith","+27987654321","South Africa","new","75","referral","Acme Corporation","john@acme.com"
"peter@testcompany.com","Peter","Jones","+267123123123","Botswana","qualified","85","website","Global Traders Ltd","jane@globaltraders.com"
"lisa@demo.com","Lisa","Brown","","South Africa","new","50","linkedin","","",
```

### Validation Rules
- **email:** Cannot be empty and must be valid email format
- **score:** Must be integer between 0-100 (defaults to 0 if invalid)
- Duplicate detection: Leads are matched by email (case-insensitive)
- If a lead with the same email exists, it will be **updated** with new data
- If a lead doesn't exist, it will be **created**

### Company Matching Logic
- **companyName** is matched against existing companies (case-insensitive)
- If matching company found: Lead is linked to that company
- If company not found: A new company is **created** with just the name
- If companyName is empty: Lead is created without company linkage

### Contact Matching Logic
- **contactEmail** is matched against existing contacts (case-insensitive)
- If matching contact found: Lead is linked to that contact
- If contact not found: Lead is created without contact linkage (will NOT auto-create contact)
- If contactEmail is empty: Lead is created without contact linkage

---

## Import Process

### How Import Works

1. **File Upload:** User uploads CSV file and selects import type
2. **Validation:** File is validated for:
   - Correct file type (.csv)
   - File size (max 10MB)
   - Valid headers matching expected format
3. **Job Creation:** ImportJob record is created with status "pending"
4. **Processing:** Each row is processed:
   - Row validation
   - Matching logic applied (check for duplicates)
   - Create or update records
   - Track success/error counts
5. **Completion:** ImportJob is updated with final statistics

### Error Handling

- **Row-level errors:** If a single row fails validation, it is skipped and counted as an error
- **The import continues** processing remaining rows
- **Partial imports:** Successful rows are saved even if some rows fail
- **Error reporting:** Error details are logged in the ImportJob's errorMessage field

### Common Error Scenarios

| Error | Description | Resolution |
|-------|-------------|------------|
| Missing required field | Required field is empty | Fill in the required field or remove the row |
| Invalid email format | Email doesn't match pattern | Correct the email format |
| Invalid score | Score is not 0-100 | Provide valid score or leave empty for default |
| File too large | File exceeds 10MB | Split into multiple smaller files |
| Wrong headers | Headers don't match expected format | Use exact header names from documentation |

---

## Best Practices

1. **Test with small files first:** Start with 5-10 rows to validate format
2. **Clean data:** Remove duplicates and validate data before import
3. **Use UTF-8 encoding:** Ensure special characters are preserved
4. **Quote text fields:** Use quotes around fields containing commas or special characters
5. **Backup data:** Export existing data before large imports
6. **Monitor import status:** Check the import history table after uploading
7. **Review errors:** If rowsError > 0, review error messages and re-import corrected rows

---

## Sample Files

Sample CSV files are available in the `test-data/` directory:
- `sample-companies.csv`
- `sample-contacts.csv`
- `sample-leads.csv`

Use these as templates for your own imports.

---

## Support

For issues or questions about CSV imports:
- Check the import history table for error messages
- Verify your CSV format matches the examples above
- Ensure all required fields are present and valid
- Contact technical support if errors persist
