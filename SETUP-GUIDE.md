# GameVault: admin + customer on one Supabase database

You now have three folders:

| Folder | What it is | Local port |
|---|---|---|
| `gamevault-customer` | Public store site | 3000 |
| `gamevault-admin` | Owner dashboard | 3001 |
| `gamevault-migrate` | One-time import of your old `store.db` + images. Delete after use. Do **not** push to GitHub | - |

Both apps read and write the **same Supabase project**. That is the only link between them.

---

## 1. Create the Supabase project

1. Go to supabase.com, sign in, **New project**.
2. Name: `gamevault`. Set a database password (save it). Region: closest to you (Mumbai if available). Create.
3. Wait about 2 minutes until the project is ready.

## 2. Create the tables

1. Left menu, **SQL Editor**, **New query**.
2. Open `gamevault-customer/supabase/schema.sql`, copy everything, paste, click **Run**. You should see "Success".
3. Check: **Table Editor** lists `users, games, offers, rentals, orders, audit, live_pings`. **Storage** lists the bucket `game-images`.

Run it once. Running it again is harmless.

## 3. Get your keys

Supabase dashboard, **Project Settings**, **API Keys** (and **Data API** for the URL).

| You need | Also called | Goes in |
|---|---|---|
| Project URL `https://xxxx.supabase.co` | | `NEXT_PUBLIC_SUPABASE_URL` |
| anon key | Publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | Secret key (`sb_secret_...`) | `SUPABASE_SERVICE_ROLE_KEY` |

If you only see the new key names, use them. If you need the older ones, open the "Legacy API keys" tab.

The service_role / secret key bypasses all security. Server only. Never paste it into code, chat, or GitHub.

## 4. Get your existing data in (games, trending, images, admin login)

Skip this section for an empty shop; create the admin with the SQL block at the bottom of `schema.sql` instead.

```bash
cd gamevault-migrate
npm install
cp .env.example .env        # fill URL + service role key
npm run migrate
```

It copies users, games, offers, rentals, orders and audit, uploads your 4 images to Supabase Storage, and
rewrites the image links. Your old admin email and password keep working (`owner@yourshop.com`).

## 5. Configure and run both apps

Generate two different secrets (one per app):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Customer app (terminal 1):

```bash
cd gamevault-customer
npm install
cp .env.example .env.local   # fill the 3 Supabase values + SESSION_SECRET
npm run dev                  # http://localhost:3000
```

Admin app (terminal 2):

```bash
cd gamevault-admin
npm install
cp .env.example .env.local   # SAME 3 Supabase values, DIFFERENT SESSION_SECRET
npm run dev                  # http://localhost:3001
```

Test: add or edit a game in admin (3001). The customer site (3000) updates within a second without a reload.

## 6. Push each project to GitHub

Make **two repositories**, one per app. Make the admin one **private**.

1. github.com, **New repository**. Name `gamevault-customer`. Leave "Add README" unchecked. Create. Repeat for `gamevault-admin` (Private).
2. Install Git if needed (git-scm.com).
3. For each app folder:

```bash
cd gamevault-customer
git init
git add .
git status                   # make sure .env.local is NOT in the list
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gamevault-customer.git
git push -u origin main
```

Repeat in `gamevault-admin` with its own repo URL.

When Git asks for a password, GitHub does not accept your account password. Use a Personal Access Token
(GitHub, Settings, Developer settings, Personal access tokens, "Tokens (classic)", tick `repo`), or install GitHub Desktop,
or run `gh auth login` once with the GitHub CLI.

Later updates:

```bash
git add .
git commit -m "Describe the change"
git push
```

If a secret ever reaches GitHub, treat it as leaked: Supabase, Project Settings, API Keys, roll the key.

## 7. Deploy (Vercel, one project per repo)

1. vercel.com, **Add New, Project**, import `gamevault-customer`. Add the env vars from `.env.example` (no quotes). Set `TRUST_PROXY=1`. Deploy.
2. Repeat for `gamevault-admin` with its own `SESSION_SECRET`.
3. Every `git push` redeploys automatically.

---

## What changed from the single project

- SQLite file replaced by Supabase Postgres. Stock, rental and order changes run inside database functions, so two people cannot take the last copy.
- Images are in Supabase Storage (`game-images`), not on the server disk.
- Live updates use Supabase Realtime instead of the old in-process stream, so an admin change reaches customers even though they are separate apps.
- Customers sign in only on the store; admins only on the dashboard. Separate cookies and separate `SESSION_SECRET`s.
- Admin dashboard is the home page `/` of the admin app (it was `/admin`).
- Browser can read only `live_pings` (no private data). Every other table has Row Level Security on and is reached only through each app's server.

## Known limits

- The login and request rate limiter is in memory per server instance. On Vercel it is weak protection. For real protection use Upstash Redis or Vercel's firewall rate limits.
- No online payments, email reminders or password reset (same as before).
- The code was syntax- and import-checked, but could not be run against a live Supabase project in the environment where it was written. If something errors on first run, send the exact message.

## Upgrading an existing database (consoles and accessories)

Already ran `schema.sql` before? Open the Supabase SQL editor, paste `supabase/add-products.sql` and click **Run**. It is safe to run twice. Fresh installs get this from `schema.sql` already.

## Upgrading: saved items, notifications, cart, overview stats

Already ran `schema.sql` before? Run `supabase/add-products.sql` first if you have not (consoles and accessories), then paste `supabase/add-features.sql` into the Supabase SQL editor and click **Run**. Both are safe to run twice. Fresh installs get everything from `schema.sql`.

### Reminders and email (customer app)

- Due-soon (2 days) and overdue reminders, order updates and back-in-stock alerts appear in the bell in the navbar. No setup needed: reminders are created whenever a signed-in customer's page loads (at most every 10 minutes).
- To also run them on a schedule and send email: set `CRON_SECRET` (Vercel calls `/api/cron/notify` daily through `vercel.json`), plus `RESEND_API_KEY` and `MAIL_FROM` from resend.com.
- In the admin app, Overview and Rentals have a WhatsApp button that opens a pre-written reminder to the customer.
