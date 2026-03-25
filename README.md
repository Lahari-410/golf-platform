# GolfGive — Golf Charity Subscription Platform
## Complete Setup Guide

---

## WHAT THIS PROJECT IS

A subscription web app where:
- Users subscribe (monthly £10 or yearly £100)
- Enter their last 5 Stableford golf scores (1-45)
- Scores become their draw numbers each month
- Admin runs monthly draws — matching scores to winning numbers
- Winners (3/4/5 match) receive prize money
- 10%+ of every subscription goes to user's chosen charity

**Stack:** Next.js 14 + TypeScript + Tailwind CSS + Supabase + Stripe

---

## STEP 1 — CREATE ACCOUNTS (do this once)

### Supabase (your database)
1. Go to https://supabase.com → sign up free
2. Click "New Project"
3. Name: `golf-platform`
4. Set a database password — SAVE IT
5. Region: South Asia (Singapore)
6. Wait 2 minutes for it to create

### Stripe (payments)
1. Go to https://stripe.com → you already have an account
2. Dashboard → Developers → API Keys
3. Copy the Secret key (sk_test_...)
4. Copy the Publishable key (pk_test_...)

---

## STEP 2 — SET UP SUPABASE DATABASE

1. Open your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Open the file `supabase-schema.sql` from this project
5. Copy the ENTIRE contents
6. Paste into Supabase SQL Editor
7. Click "Run"
8. You should see "Success. No rows returned"

This creates all 7 tables, security rules, and sample charities.

---

## STEP 3 — GET YOUR SUPABASE KEYS

1. In Supabase: Settings → API
2. Copy "Project URL" (looks like https://xxxx.supabase.co)
3. Copy "anon public" key
4. Copy "service_role secret" key (click to reveal)

---

## STEP 4 — CREATE STRIPE PRODUCTS

1. Stripe Dashboard → Products → Add Product
2. Create Product 1:
   - Name: "GolfGive Monthly"
   - Price: £10.00, recurring, monthly
   - Click Save → copy the Price ID (price_xxx)
3. Create Product 2:
   - Name: "GolfGive Yearly"
   - Price: £100.00, recurring, yearly
   - Click Save → copy the Price ID (price_xxx)

---

## STEP 5 — CREATE .env.local FILE

In the golf-platform/ folder, create a file called `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace each value with your real keys from Steps 3 and 4.

---

## STEP 6 — INSTALL AND RUN

Open Terminal in the golf-platform/ folder:

```bash
npm install
npm run dev
```

Open http://localhost:3000

You should see the GolfGive homepage.

---

## STEP 7 — CREATE AN ADMIN USER

1. Register a new account at http://localhost:3000/register
2. Go to Supabase Dashboard → Table Editor → profiles
3. Find your user row
4. Click the role column → change "subscriber" to "admin"
5. Save
6. Log out and log back in → you will now go to /admin

---

## STEP 8 — SET UP STRIPE WEBHOOK (for local testing)

Install Stripe CLI: https://stripe.com/docs/stripe-cli
Then run:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
It will print a webhook secret (whsec_...) — copy it into .env.local as STRIPE_WEBHOOK_SECRET

---

## STEP 9 — TEST THE FULL FLOW

1. Register a new subscriber account
2. Choose a plan → complete payment with test card: 4242 4242 4242 4242
3. Add 5 golf scores on the dashboard
4. Select a charity
5. Log in as admin → run a draw simulation → publish it
6. Check winners tab

---

## STEP 10 — DEPLOY TO VERCEL

1. Push code to GitHub (new repo, no node_modules)
2. Go to https://vercel.com → Import Project
3. Select your GitHub repo
4. Add all environment variables from .env.local
5. Change NEXT_PUBLIC_APP_URL to your Vercel URL
6. Deploy

For Stripe webhook in production:
- Stripe Dashboard → Webhooks → Add Endpoint
- URL: https://your-vercel-url.vercel.app/api/webhooks/stripe
- Events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted

---

## FILE STRUCTURE

```
golf-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Homepage
│   │   ├── layout.tsx                  ← Root layout
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx          ← Login
│   │   │   └── register/page.tsx       ← Register
│   │   ├── dashboard/page.tsx          ← User dashboard (scores, charity, draws, wins)
│   │   ├── admin/page.tsx              ← Admin panel (draws, users, charities, winners)
│   │   ├── subscribe/page.tsx          ← Stripe checkout
│   │   ├── success/page.tsx            ← Post-payment success
│   │   └── api/
│   │       ├── scores/route.ts         ← Score CRUD
│   │       ├── draws/route.ts          ← Draw engine
│   │       ├── charities/route.ts      ← Charity listing
│   │       ├── admin/route.ts          ← Admin actions
│   │       ├── subscriptions/
│   │       │   └── create-checkout/route.ts  ← Stripe checkout session
│   │       └── webhooks/
│   │           └── stripe/route.ts     ← Stripe webhook handler
│   ├── lib/
│   │   ├── supabase.ts                 ← Supabase client
│   │   └── drawEngine.ts              ← Draw logic (random + algorithmic)
│   └── types/index.ts                 ← TypeScript types
├── supabase-schema.sql                 ← Run this in Supabase SQL Editor
├── .env.local                          ← Your secrets (never commit)
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## HOW TO EXPLAIN THIS IN AN INTERVIEW

**"What is GolfGive?"**
A subscription platform where golfers enter their Stableford scores, which become their draw numbers in a monthly prize draw. A portion of every subscription goes automatically to the charity they choose. Built with Next.js, Supabase (PostgreSQL), and Stripe subscriptions.

**"How does the draw engine work?"**
Two modes: random (generates 5 unique numbers from 1-45) and algorithmic (weighted by most frequent user scores). After generating winning numbers, we loop through all active subscribers' scores, count how many match, and create winner records for anyone with 3 or more matches. Prize pools are split: 40% for 5-match jackpot, 35% for 4-match, 25% for 3-match.

**"How does Stripe work here?"**
We use Stripe Checkout Sessions for subscriptions. The frontend calls our API which creates a session and returns a URL. User is redirected to Stripe's hosted page. After payment, Stripe calls our webhook endpoint which activates the subscription in Supabase. This is retry-safe — even if the user closes their browser, Stripe fires the webhook.

**"What is Supabase?"**
Supabase is a hosted PostgreSQL database with a JavaScript SDK, authentication, and Row Level Security. RLS means users can only read/write their own data — security rules enforced at the database level, not just in application code.
