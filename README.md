# LandscapeAI

AI-powered landscape design SaaS. Upload yard photos, generate concepts, revise, and export.

## Architecture

- **Frontend/API**: Next.js 15 App Router (Vercel)
- **Database/Auth/Storage**: Supabase
- **Background Workers**: Railway (Node.js)
- **Payments**: Stripe

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase account with project created
- Stripe account with products configured
- OpenAI API key

## Environment Variables

Copy `.env.example` to `.env.local` (web app) and `.env` (worker):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_PRO_PRICE_ID=price_...

# AI (Railway worker only)
OPENAI_API_KEY=sk-...

# Worker
WORKER_ID=worker-1
JOB_POLL_INTERVAL_MS=3000
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Run the migration files against your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL Editor in Supabase Dashboard:
# Run supabase/migrations/00001_initial_schema.sql
# Run supabase/migrations/00002_acquire_job_function.sql
```

### 3. Set up Stripe

1. Create a product "Pro Plan" in Stripe Dashboard
2. Create a recurring price ($29/month)
3. Copy the price ID to `STRIPE_PRO_PRICE_ID`
4. Set up webhook endpoint pointing to `/api/stripe/webhook`
5. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 4. Run the web app

```bash
npm run dev:web
```

Opens at http://localhost:3000

### 5. Run the worker

```bash
npm run dev:worker
```

### 6. Stripe webhook testing (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Deployment

### Vercel (Web App)

1. Connect your GitHub repo to Vercel
2. Set root directory to `apps/web`
3. Add all environment variables
4. Deploy

### Railway (Worker)

1. Create new project in Railway
2. Point to the `packages/worker` directory
3. Use the Dockerfile at `packages/worker/Dockerfile`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `WORKER_ID`
   - `JOB_POLL_INTERVAL_MS`

## Project Structure

```
├── apps/
│   └── web/                  # Next.js 15 App Router
│       ├── src/
│       │   ├── app/          # App Router pages & API routes
│       │   ├── components/   # React components
│       │   └── lib/          # Supabase clients, utilities
│       └── middleware.ts     # Auth session refresh
├── packages/
│   ├── shared/               # Shared types (Database, Jobs)
│   └── worker/               # Railway background worker
│       └── src/handlers/     # Job type handlers
└── supabase/
    └── migrations/           # SQL migration files
```
