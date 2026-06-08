# Vera Security Documentation

## Overview

Vera implements multiple layers of security to protect sensitive HOA data and user information.

---

## Security Features

### 1. Authentication & Authorization
- **Supabase Auth:** Email/password + OAuth (Azure AD)
- **Row-Level Security (RLS):** Database-level access control
- **Multi-tenant Isolation:** Strict tenant separation
- **Session Management:** HTTP-only cookies, secure flags
- **Password Requirements:** Min 12 characters, complexity rules

### 2. Network Security
- **HTTPS Only:** All traffic encrypted via TLS 1.3
- **HSTS:** Strict-Transport-Security header enforced
- **Security Headers:**
  - `X-Frame-Options: DENY` (clickjacking protection)
  - `X-Content-Type-Options: nosniff` (MIME sniffing protection)
  - `X-XSS-Protection: 1; mode=block` (XSS protection)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (CSP) enforced

### 3. API Security
- **Rate Limiting:** 60 req/min per IP (configurable per endpoint)
- **CSRF Protection:** Double-submit cookie pattern
- **Input Validation:** Zod schemas on all inputs
- **SQL Injection Protection:** Parameterized queries only
- **XSS Protection:** React auto-escaping + CSP
- **Authentication:** JWT tokens via Supabase

### 4. Data Protection
- **Encryption at Rest:** PostgreSQL encryption (Supabase)
- **Encryption in Transit:** TLS 1.3
- **PII Handling:** Minimal collection, encrypted storage
- **Payment Data:** PCI-compliant (Stripe handles card data)
- **Audit Logging:** All sensitive actions logged

### 5. Third-Party Integrations
- **Webhook Signature Verification:** All webhooks validated
- **OAuth 2.0:** Secure token exchange
- **API Key Rotation:** Regular key rotation enforced
- **Least Privilege:** Minimal scopes requested

---

## Rate Limiting

### Configuration

```typescript
// Default: 60 requests per minute
import { rateLimiters } from '@/lib/security/rate-limiter'

// Apply to API route
export const POST = withRateLimit(rateLimiters.api, async (req) => {
  // Your handler
})
```

### Rate Limit Tiers

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| API routes | 60 req | 1 min |
| Auth routes | 5 req | 1 min |
| Webhooks | 100 req | 1 min |
| File uploads | 10 req | 1 min |

---

## CSRF Protection

### Usage in API Routes

```typescript
import { withCsrfProtection } from '@/lib/security/csrf'

export const POST = withCsrfProtection(async (req) => {
  // Your handler (CSRF validated automatically)
})
```

### Client-Side Usage

```typescript
import { getCsrfTokenFromCookie } from '@/lib/security/csrf'

const csrfToken = getCsrfTokenFromCookie()

fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'x-csrf-token': csrfToken!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
```

---

## Authentication Flow

### 1. Email/Password Login
```
User → Login Form → Supabase Auth → Session Cookie → Protected Routes
```

### 2. Azure AD SSO
```
User → SSO Button → Azure AD OAuth → Callback → Supabase Auth → Session
```

### 3. Session Validation
```
Request → Middleware → Supabase Auth Check → Allow/Deny
```

---

## Data Access Control

### Row-Level Security (RLS)

All tables use RLS policies:

```sql
-- Example: Users can only see their own tenant's data
CREATE POLICY "Users see own tenant"
ON associations
FOR SELECT
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

### Access Levels

| Role | Permissions |
|------|-------------|
| Super Admin | Full system access |
| Company Admin | All associations in company |
| Association Manager | Single association admin |
| Board Member | Read-only association data |
| Owner | Own property data only |
| Inspector | Inspection data only |

---

## Secure Coding Guidelines

### 1. Input Validation
```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
})

const validated = schema.parse(input) // Throws if invalid
```

### 2. SQL Injection Prevention
```typescript
// ✅ Good: Parameterized query
const { data } = await supabase
  .from('users')
  .select()
  .eq('email', userInput)

// ❌ Bad: String concatenation
const query = `SELECT * FROM users WHERE email = '${userInput}'`
```

### 3. XSS Prevention
```typescript
// ✅ Good: React auto-escapes
<div>{userInput}</div>

// ❌ Bad: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 4. Sensitive Data
```typescript
// ✅ Good: Never log sensitive data
console.log('User logged in:', { userId })

// ❌ Bad: Logging passwords/tokens
console.log('Auth attempt:', { password, apiKey })
```

---

## Incident Response

### 1. Security Vulnerability Discovered
1. **Assess severity** (CVSS score)
2. **Create private security advisory** (GitHub)
3. **Develop patch** (test thoroughly)
4. **Deploy hotfix** (within 24 hours for critical)
5. **Notify affected users** (if data exposed)
6. **Post-mortem** (document learnings)

### 2. Data Breach
1. **Contain breach** (revoke compromised credentials)
2. **Assess scope** (what data was accessed?)
3. **Legal notification** (GDPR, state laws)
4. **User notification** (email + in-app)
5. **Remediation** (patch vulnerability)
6. **Monitoring** (enhanced logging)

---

## Compliance

### GDPR
- ✅ Data minimization
- ✅ Right to access (data export)
- ✅ Right to erasure (account deletion)
- ✅ Consent management
- ✅ Breach notification (<72 hours)

### PCI-DSS
- ✅ No card data stored (Stripe handles)
- ✅ TLS 1.3 for all transactions
- ✅ Secure payment forms (Stripe Elements)

### SOC 2 Type II (planned)
- [ ] Security monitoring
- [ ] Access logging
- [ ] Change management
- [ ] Vendor management
- [ ] Incident response plan

---

## Security Checklist (Pre-Deployment)

### Infrastructure
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] TLS 1.3 enabled
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CSRF protection enabled
- [ ] Database encryption at rest
- [ ] Backups encrypted

### Application
- [ ] All inputs validated (Zod schemas)
- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] CSRF tests passed
- [ ] Authentication tests passed
- [ ] Authorization tests passed
- [ ] Sensitive data not logged

### Third-Party
- [ ] Webhook signatures verified
- [ ] API keys rotated
- [ ] OAuth scopes minimal
- [ ] Dependencies updated
- [ ] npm audit clean (0 vulnerabilities)

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (Uptime Robot)
- [ ] Log aggregation (Vercel logs)
- [ ] Alerts configured (Slack/email)
- [ ] Audit log retention (90 days)

---

## Reporting Security Issues

**Do NOT create public GitHub issues for security vulnerabilities.**

**Email:** security@empirehoa.com  
**PGP Key:** [Coming soon]

We aim to respond within 24 hours and patch critical issues within 72 hours.

---

**Last Updated:** 2026-03-20  
**Version:** 1.0  
**Owner:** Security Team
