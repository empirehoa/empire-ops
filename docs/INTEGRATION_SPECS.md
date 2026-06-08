# Vera Integration Specifications

## 1. BankUnited — Banking Integration

### Contact
Meredith @ BankUnited (via email in Vera Integrations folder)

### File Transmission Services (built with Vantaca)

| Service | Format | Direction | Frequency |
|---------|--------|-----------|-----------|
| Previous day balances & transactions | BAI2 | Bank → Vera | Daily |
| Monthly bank statements | ZIP of PDFs | Bank → Vera | Monthly (4th) |
| Paid check image archive | ZIP (TIFF + CSV index) | Bank → Vera | Daily |
| Return deposited item reporting | ZIP (PDF + CSV index) | Bank → Vera | Daily |
| ACH origination | NACHA | Vera → Bank | On demand |
| ACH return & NOC reporting | NACHA | Bank → Vera | Daily |

### Real-time API (available, not yet integrated)

| Endpoint | Description |
|----------|-------------|
| Account list lookup | Confirm account existence |
| Live available balances | Real-time balance check |
| Transaction reporting | Live transaction feed |
| Statement & check images | On-demand retrieval |
| Account-to-account transfers | Internal transfers |

### Lockbox Validation File (Vera → Bank, daily)

**Naming:** `CUSTOMERID_MGMTID_VALIDATION_YYYYMMDD.CSV`
- Customer ID: assigned by BankUnited at setup
- MGMT ID: assigned by BankUnited based on PO Box address

**Format:** Comma & quote delimited CSV

| Field | Format | Example |
|-------|--------|---------|
| Association ID | Zero-filled, 4 chars | "0005" |
| Account ID | Zero-filled, 8 chars | "0000000001000156" |
| Last Name | String | "LastName" |
| First Name | String | "FirstName" |
| Address Name | String | "Mailing Name" |
| Balance | Decimal | "0.00" |
| Address Street | String | "Mailing Address" |
| Address City | String | "Honolulu" |
| Address State | String | "HI" |
| Address Zip | String | "96815" |
| Unit Address | String | "Unit Address" |
| Unit City | String | "Honolulu" |
| Unit State | String | "HI" |
| Unit Zip | String | "96815" |
| On Hold | String | "HOLD" or "" |

### Lockbox Payment Receipt File (Bank → Vera, daily)

**Naming:** `CUSTOMERID_GENDATAREC_MGMTID_LBXRECEIPT_MMDDYYYY.TXT`

**Format:** Fixed-width, 50 characters per record

| Field | Length | Position | Format | Required | Example |
|-------|--------|----------|--------|----------|---------|
| Lock box date | 8 | 1-8 | YYYYMMDD | Yes | 20190426 |
| Association ID | 10 | 9-18 | Numeric, right-justified, zero-filled | Yes | 1873456211 |
| Account ID | 14 | 19-32 | Numeric, right-justified, zero-filled | Yes | 93017850234905 |
| Check Amount | 10 | 33-42 | Numeric, right-justified, zero-filled, no decimal | Yes | 0000021499 |
| Check Number | 8 | 43-50 | Numeric, right-justified, zero-filled | Yes | 00777777 |

**Sample:** `20190426187345621193017850234905000002149900777777`

### BAI2 File Format (Bank → Vera, daily)

Standard BAI Version 2 format with record types:
- 01: File Header (sender/receiver IDs, creation date/time)
- 02: Group Header (originator, group status, as-of-date)
- 03: Account Identifier & Summary Status (account number, balances)
- 16: Transaction Detail (individual transactions with type codes)
- 88: Continuation Record
- 49: Account Trailer (control total)
- 98: Group Trailer
- 99: File Trailer

**Type Code Ranges:**
- 001-099: Account status (ledger balance, available balance, float)
- 100: Total Credits summary
- 101-399: Credit details (lockbox deposits, ACH credits, wire transfers)
- 400: Total Debits summary
- 401-699: Debit details (checks paid, ACH debits, fees)
- 700-799: Loan summary/detail
- 900-999: Custom codes

### Other File Deliveries

**Monthly Bank Statements:**
- Naming: `CUSTOMERID_GENDATAREC_MMDDYYYY.ZIP`
- Contents: One PDF per account: `ACCT NUMBER – ACCT NAME – ACCT TYPE – MMDDYYYY.PDF`
- Delivered by 4th calendar day of month

**Paid Check Images:**
- Naming: `CUSTOMERID_GENDATAREC_CHECKIMAGES_MMDDYYYYHHMMSS.ZIP`
- Contents: `CUSTOMER ID / ACCOUNT NUMBER / CHECK # 1234 – AMOUNT $100.00.TIFF`
- Index: `IDX-CUSTOMER ID-ACCOUNT NUMBER-ON-US CHECK IMAGE.CSV`

**Return Deposited Items:**
- Naming: `CUSTOMERID_GENDATAREC__RETURNS_MMDDYYYYHHMMSS.ZIP`
- Contents: `TCM CHARGEBACK NOTICE – ACCT NUMBER – AMOUNT – ACCOUNT NAME – DATE.PDF`
- Index: `IDX-CUSTOMER ID-ACCOUNT NUMBER-TCM CHARGEBACK NOTICE.CSV`

---

## 2. HOAMailers — Physical Mail Processing

### Contact
HOAMailers team (via email in Vera Integrations folder)

### Integration Method
API integration with manifest file + PDF upload. Flexible format, no file size restrictions.

### Manifest File (Vera → HOAMailers)

**Format:** Tab-delimited (.tab file)

| Column | Description | Example |
|--------|-------------|---------|
| 1 | Account ID | GPH21687 |
| 2 | Owner Name | Mark D. Patz |
| 3 | Mailing Address | 3843 Gatlin Woods Drive |
| 4 | City, State Zip | Orlando, FL 32812 |
| 5 | (empty) | |
| 6 | (empty) | |
| 7 | Page Number (in PDF) | 1 |
| 8 | Pages per letter | 1 |
| 9 | PDF filename | HOAMailers_PDF_20260324-181527692.pdf |
| 10 | (empty) | |
| 11 | Return Address Line 1 | 801 N. Main St |
| 12 | (empty) | |
| 13 | Return City, State Zip | Kissimmee, FL 34744 |
| 14 | Community Code | GPH |
| 15 | Job Number | 177974 |
| 16 | Document Type Code | 2 |
| 17 | Mail Class Code | 1030 |
| 18 | Color Flag | N (B&W) or Y (Color) |

### PDF File (Vera → HOAMailers)

**Format:** Single merged PDF with all letters in sequence
- One letter per page (or multi-page letters)
- Page numbers in manifest map to positions in the PDF
- Contains: Empire logo, association info, owner address, notice type, violation description, photo, compliance deadline, portal link

### Letter Types Observed
- **COURTESY NOTICE** — First violation notice
- **SECOND NOTICE** — Follow-up for unresolved violations

### Key Elements in Letters
- Empire Management Group branding (logo, (407) 770-1748)
- Association name and address
- Owner name and property address
- Violation photo (embedded)
- Specific violation description with correction instructions
- Compliance deadline (bold red text)
- Portal link: https://portal.empirehoa.com
- Signed by association name
- "Professionally Managed By: Empire Management Group, Inc."

---

## Implementation Requirements for Vera

### Banking Module (BankUnited)

1. **BAI2 Parser** — Parse daily BAI2 files to populate bank_statement_lines table
2. **Lockbox Validation File Generator** — Export CSV from owner accounts for BankUnited
3. **Lockbox Payment Importer** — Parse fixed-width receipt files, auto-match to owner accounts
4. **NACHA File Generator** — Already partially built (AP payment batches), extend for ACH origination
5. **Bank Statement Importer** — Unzip and store monthly PDF statements per association
6. **Check Image Viewer** — Store and display paid check TIFF images
7. **Return Item Processor** — Parse return item files, create chargebacks on owner accounts
8. **SFTP Integration** — Secure file transfer to/from BankUnited servers

### Mailing Module (HOAMailers)

1. **Print Queue System** — Batch violation notices, statements, and other mailings
2. **Manifest Generator** — Create tab-delimited manifest from violation/mailing data
3. **PDF Merger** — Combine individual letter PDFs into single batch PDF
4. **HOAMailers API Client** — Submit manifest + PDF for processing
5. **Mail Tracking** — Track mailing status (queued, sent, delivered, returned)
6. **Letter Template Engine** — Generate violation notices matching Empire's format
7. **Certified Mail Support** — Flag mailings for certified delivery
