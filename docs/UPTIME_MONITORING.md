# Uptime Monitoring Setup Guide

## Endpoint

The health check endpoint is at:
```
GET /api/health
```

Returns JSON with status `200` (healthy) or `503` (degraded/down):
```json
{
  "status": "ok",
  "version": "abc1234",
  "timestamp": "2026-04-14T22:00:00.000Z",
  "uptime_seconds": 3600,
  "response_time_ms": 45,
  "checks": {
    "server": { "status": "ok" },
    "supabase": { "status": "ok", "latency_ms": 23 },
    "stripe": { "status": "ok" },
    "automation": { "status": "ok" },
    "sentry": { "status": "ok" }
  }
}
```

## Option 1: BetterStack (Recommended)

1. Go to https://betterstack.com and create an account
2. Add a new **HTTP monitor**:
   - **URL**: `https://your-vera-domain.vercel.app/api/health`
   - **Method**: GET
   - **Check interval**: 60 seconds
   - **Expected status code**: 200
   - **Timeout**: 10 seconds
3. Set up **alert channels**:
   - Email: jr@empiremanagementgroup.com
   - Discord webhook: Use the `DISCORD_WEBHOOK_URL` from Vercel env vars
4. Create an **incident policy**: Alert after 2 consecutive failures

## Option 2: UptimeRobot (Free Tier Available)

1. Go to https://uptimerobot.com and create an account
2. Add a new **HTTP(s) monitor**:
   - **URL**: `https://your-vera-domain.vercel.app/api/health`
   - **Monitoring interval**: 5 minutes (free tier)
   - **Alert contacts**: Add your email and Discord webhook
3. Optionally create a **status page** at a public URL for transparency

## Option 3: Vercel Native Monitoring

Vercel Pro/Enterprise plans include:
- **Speed Insights**: Real User Monitoring (RUM) metrics
- **Web Analytics**: Core Web Vitals tracking
- **Logs**: Serverless function logs with filtering

Enable in Vercel Dashboard → Project → Analytics tab.

## Discord Webhook Integration

Both BetterStack and UptimeRobot can post to Discord webhooks directly:
- BetterStack: Settings → Integrations → Discord
- UptimeRobot: My Settings → Alert Contacts → Add Contact → Webhook

Use the same `DISCORD_WEBHOOK_URL` configured for automation alerts.

## Recommended Monitoring Stack

| Tool | Purpose | Cost |
|------|---------|------|
| BetterStack | Uptime monitoring + incident management | Free tier: 5 monitors |
| Sentry | Error tracking + performance monitoring | Free tier: 5K events/mo |
| Vercel Analytics | Speed insights + web analytics | Included with Pro |
