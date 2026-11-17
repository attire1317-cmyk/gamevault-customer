# GameVault: customer store

Next.js 15 storefront (browse, rent, buy, my rentals). Data lives in **Supabase**, the same project the
`gamevault-admin` app uses. Changes made in admin show up here live.

## Run locally (Node 20.9+)

```bash
npm install
cp .env.example .env.local     # fill in the Supabase keys + SESSION_SECRET
npm run dev                    # http://localhost:3000
```

Set up Supabase first (run `supabase/schema.sql` once). Full steps are in `SETUP-GUIDE.md`.

## Environment variables

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same value in both apps |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same value in both apps. Safe in the browser (live updates only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same value in both apps. **Server only**, never commit |
| `SESSION_SECRET` | 32+ random chars. Use a **different** one from the admin app |
| `NEXT_PUBLIC_STORE_NAME` | Shop name |
| `TRUST_PROXY` | `1` on Vercel |

## Who can sign in here

Customers only. Admin accounts are rejected on this site; the owner signs in on the admin app.
Anyone can register as a customer.

## Layout

```
app/          pages and /api routes (games, orders, rentals, auth)
components/   UI
lib/          db.js (Supabase), auth, validation, live.js (Realtime)
supabase/     schema.sql (identical in both apps)
```
