## VERA COMPLIANCE ARCHITECTURE: EXHAUSTIVE STATUTORY REQUIREMENTS

This is your definitive compliance blueprint. Every requirement below must be hardcoded into Vera's logic engine.

---

## 1. VIOLATIONS MODULE

### **STATUTORY FOUNDATION:**
- **FS 720.305** - Fining procedures for HOAs
- **FS 718.303** - Fining procedures for condos  
- **FS 719.303** - Fining procedures for co-ops
- **FS 720.311** - Dispute resolution
- **FS 61B-23** - Administrative rules for fining

### **EXACT REQUIREMENTS:**

#### **INITIAL VIOLATION NOTICE (Pre-Fine Notice):**
**MANDATORY CONTENT per FS 720.305(2)(b):**
```
- Date of alleged violation
- Description of alleged violation
- Reference to specific governing document provision violated
- Statement that owner has 14 days to request hearing OR cure violation
- Notice of right to legal counsel at hearing
- Contact information for requesting hearing
```

**SYSTEM LOGIC:** Vera must auto-populate:
- Violation date field (required)
- Drop-down of community's CC&Rs/Rules sections (required)
- Template text: "You have fourteen (14) days from receipt of this notice to request a hearing before the committee or to cure the alleged violation."

#### **NOTICE OF HEARING:**
**MANDATORY CONTENT per FS 720.305(2)(c):**
```
- At least 14 days advance notice
- Time, date, and location of hearing
- Right to attend with counsel
- Right to present evidence and witnesses
- Right to cross-examine witnesses
```

#### **FINAL NOTICE OF FINE:**
**MANDATORY CONTENT:**
```
- Specific violation found
- Fine amount (must comply with community limits or $1,000 max per FS 720.305(2)(b))
- Payment due date
- Appeal rights to dispute resolution (FS 720.311)
- Reference to specific governing document provision
```

### **ENFORCEMENT TIMELINES:**
- **14 days** - Owner response time to initial notice
- **14 days minimum** - Notice period for hearing
- **5 business days** - Committee decision notice after hearing
- **30 days** - Appeal deadline after final decision

### **COMMUNITY DOCUMENT OVERRIDES:**
- Fine amounts (community may set lower than statutory max)
- Specific violation categories
- Hearing committee composition
- Appeal procedures (can be more generous, not less)

### **AI COMPLIANCE PROMPTS:**
```
"Generate violation notice that cites [COMMUNITY CC&R SECTION] and includes all FS 720.305(2)(b) required language. Ensure 14-day cure/hearing option is prominently stated."
```

---

## 2. COLLECTIONS MODULE

### **STATUTORY FOUNDATION:**
- **FS 720.3085** - HOA assessment collection/lien procedures
- **FS 718.116** - Condo assessment collection
- **FS 719.108** - Co-op assessment collection  
- **FS 720.3088** - Payment plans
- **FS 45.031** - Notice requirements for acceleration

### **EXACT REQUIREMENTS:**

#### **INTENT TO LIEN NOTICE:**
**MANDATORY CONTENT per FS 720.3085(2)(a):**
```
- Total amount of lien (principal, interest, costs, attorney fees)
- Description of each assessment and due date
- Name of current record owner
- Legal description of property
- Statement: "INTENT TO RECORD LIEN"
- 45-day deadline to pay before lien recording
- Right to contest/request hearing on assessments
- Payment plan availability per FS 720.3088
```

**DELIVERY METHOD:** Certified mail AND regular mail to both:
- Property address
- Mailing address of record

#### **CLAIM OF LIEN:**
**MANDATORY CONTENT per FS 720.3085(2)(b):**
```
- Legal description of property  
- Name of record owner
- Last known address
- Description of assessments with due dates
- Total amount (principal, interest, costs, reasonable attorney fees)
- Notarized signature of authorized association representative
```

#### **INTENT TO FORECLOSE:**
**MANDATORY CONTENT per FS 720.3085(4):**
```
- 45 days advance notice
- Right to cure by paying full amount
- Available payment plan options
- Legal description and current owner
- Certified mail delivery required
```

### **ENFORCEMENT TIMELINES:**
- **45 days** - Payment period after Intent to Lien
- **45 days** - Payment period after Intent to Foreclose  
- **30 days** - Assessment delinquent before collection action
- **12 months** - Payment plan maximum duration (FS 720.3088)

### **COMMUNITY DOCUMENT OVERRIDES:**
- Interest rates (subject to statutory/community maximums)
- Late fees (must be reasonable)
- Collection costs allocation
- Payment plan terms (can be more generous)

### **AI COMPLIANCE PROMPTS:**
```
"Generate Intent to Lien notice with exact FS 720.3085(2)(a) language. Include 45-day payment deadline and payment plan rights. Calculate total with interest at [COMMUNITY RATE]% per annum."
```

---

## 3. MEETINGS MODULE

### **STATUTORY FOUNDATION:**
- **FS 720.303** - HOA board and member meetings
- **FS 718.112** - Condo board and member meetings
- **FS 719.106** - Co-op board and member meetings
- **FS 286.011** - Florida Sunshine Law (applies to condos/co-ops)

### **EXACT REQUIREMENTS:**

#### **BOARD MEETINGS:**
**NOTICE REQUIREMENTS:**
- **FS 720.303(2)(c):** HOA - 48 hours posted notice required
- **FS 718.112(2)(c):** Condo - 48 hours posted notice + unit owners have right to attend
- **FS 719.106(1)(c):** Co-op - 48 hours posted notice

**MANDATORY POSTING LOCATIONS:**
```
- Conspicuous location on property
- Association website (if maintained)
- Any other locations specified in
