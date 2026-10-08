# Empire Ops

Operations intelligence for Riance LLC: pipeline, financials, AR, and portfolio risk across
Empire Management Group, Riance Realty, Wind Fire & Water, and FixIQ, built from live HubSpot,
QuickBooks, and Vantaca data.

- Setup: [SETUP.md](SETUP.md)
- Architecture and data rules: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
npm run typecheck && npm test && npm run build
```
