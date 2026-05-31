# MAC Solar — Setup Guide

## Stack
- **Next.js 14** (App Router + Server Actions)
- **TypeScript** + **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth)
- **Leaflet** / OpenStreetMap
- **Vercel** (free deploy)

---

## Step 1 — Install Dependencies

```bash
cd mac-solar
npm install
```

---

## Step 2 — Create Supabase Project (Free)

1. Go to [supabase.com](https://supabase.com) and **sign up** (free)
2. Click **"New project"**
   - Name: `mac-solar`
   - Database password: pick a strong one (save it!)
   - Region: **Southeast Asia (Singapore)** — closest to Cebu
3. Wait ~1 minute for the project to spin up

---

## Step 3 — Run the Database Schema

1. In your Supabase project, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it and click **"Run"**
5. You should see: `Success. No rows returned`

---

## Step 4 — Get Your API Keys

1. In Supabase, go to **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 5 — Configure Environment Variables (Local)

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 6 — Create the Admin User

1. In Supabase, go to **Authentication** → **Users** → **"Add user"**
2. Enter:
   - Email: `admin@macsolar.ph` (or any email you want)
   - Password: choose a strong password
   - ✅ Check **"Auto Confirm User"**
3. Click **Create User**

That email + password is what you'll use to log in at `/admin/login`.

---

## Step 7 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| Page | URL |
|------|-----|
| Home | `/` |
| Assessment | `/assessment` |
| Thank You | `/thank-you` |
| Admin Login | `/admin/login` |
| Admin Dashboard | `/admin` |

---

## Step 8 — Deploy to Vercel (Free)

### Option A — GitHub (Recommended)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **"Add New Project"**
3. Import your GitHub repo
4. Under **"Environment Variables"**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your value
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your value
5. Click **Deploy**

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
# Follow prompts, then:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

---

## Step 9 — Configure Supabase Auth Redirect URLs

After deploying, add your Vercel URL to Supabase:

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL**: `https://your-app.vercel.app`
3. **Redirect URLs**: add `https://your-app.vercel.app/**`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Map doesn't show | Check browser console — usually a CSS import issue. Leaflet CSS is in `globals.css`. |
| "Invalid credentials" on admin login | Double-check you created the user in Supabase Auth with "Auto Confirm" checked |
| Submissions not appearing in admin | Check RLS policies were created — re-run the schema.sql |
| Build error on Vercel | Ensure both env vars are set in the Vercel project settings |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── assessment/page.tsx   # 3-step assessment form
│   ├── thank-you/page.tsx    # Confirmation page
│   └── admin/
│       ├── page.tsx          # Dashboard (protected)
│       └── login/page.tsx    # Admin login
├── components/
│   ├── assessment/           # Form step components
│   ├── admin/                # Submissions table
│   └── ui/                   # Logo, shared UI
└── lib/
    ├── actions.ts            # Server actions
    ├── types.ts              # TypeScript types
    └── supabase/             # Client + server Supabase clients
middleware.ts                 # Auth guard for /admin
supabase/schema.sql           # DB schema + RLS
```
