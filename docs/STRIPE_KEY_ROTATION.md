# Stripe API Key Rotation Guide

## CRITICAL: Live Key Exposed in Git History

The Stripe live secret key (`sk_live_*`) was committed to git history. Even though it may have been removed from tracked files, **it remains in git history forever**. You MUST rotate the key immediately.

## Step-by-Step Rotation Process

### 1. Generate New Keys (Stripe Dashboard)

1. Go to https://dashboard.stripe.com/apikeys
2. Click **"Roll key..."** next to the Secret key
3. Stripe will show both the old and new keys simultaneously
4. Set an expiration on the OLD key (recommend 24 hours to allow transition)
5. Copy the NEW secret key (`sk_live_...`)

### 2. Update All Environments

**Vercel (Production + Preview):**
```bash
# Via Vercel CLI
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production
# Paste the new key when prompted

# Also update preview environments
vercel env rm STRIPE_SECRET_KEY preview
vercel env add STRIPE_SECRET_KEY preview
```

**Or via Vercel Dashboard:**
1. Go to https://vercel.com → Vera project → Settings → Environment Variables
2. Update `STRIPE_SECRET_KEY` with the new value
3. Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` if rotating that too

**Local Development:**
- Update `.env.local` with the new key

### 3. Update Webhook Secrets

If you also need to rotate webhook secrets:
1. Go to https://dashboard.stripe.com/webhooks
2. Click on each webhook endpoint
3. Click "Roll secret"
4. Update `STRIPE_WEBHOOK_SECRET` and `STRIPE_IDENTITY_WEBHOOK_SECRET` in Vercel

### 4. Redeploy

```bash
# Trigger a fresh deployment to pick up new env vars
vercel --prod
```

### 5. Verify

- Test a payment flow in production
- Check Stripe Dashboard → Developers → Logs for successful API calls with the new key
- Confirm the old key shows "Restricted" or "Expired" in the dashboard

### 6. Expire the Old Key

Once verified (give it 24 hours):
1. Return to https://dashboard.stripe.com/apikeys
2. Delete/expire the old key

## Prevention: Git Secrets Scanning

To prevent future key leaks, consider:
- **GitHub Secret Scanning**: Already enabled for public repos; enable for private repos in Settings → Security
- **Pre-commit hooks**: Use `git-secrets` or `trufflehog` to scan before commits
- **Vercel Integration**: Use Vercel's native Stripe integration which manages keys automatically

## Environment Variables to Rotate

| Variable | Location | Priority |
|----------|----------|----------|
| `STRIPE_SECRET_KEY` | Vercel env vars | **CRITICAL** |
| `STRIPE_WEBHOOK_SECRET` | Vercel env vars | HIGH |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | Vercel env vars | HIGH |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Vercel env vars | Medium (public key, lower risk) |
