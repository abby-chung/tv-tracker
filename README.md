# WatchReel

A personal TV & movie tracker — inspired by TV Time. Track what you're watching, mark episodes and movies as watched, browse what's popular, organize titles into custom lists, and see your all-time watch stats.

Built with **Next.js**, **Supabase** (database + login), and **TMDB** (show/movie data). Deploys to **Vercel** for free.

---

## What's in this app

- **Shows** — your TV watchlist, poster grid with filters (Watching / Watchlist / Watched), season-by-season episode tracking, and a "mark whole season watched" shortcut
- **Movies** — watchlist, watched, and upcoming releases, with a single tap to log watch time
- **Discover** — search TMDB and browse what's trending this week; tap a poster to add it straight to your library
- **Lists** — create custom named lists (e.g. "Watch with Sarah"), search and add titles to them, and delete lists you no longer need
- **Favorites** — heart any show or movie to pin it to a dedicated Favorites row on your profile
- **Profile** — your total watch-time "clock," episodes/movies watched, and quick access to everything above
- **Stats** — a dedicated breakdown page (`/profile/stats`) showing time spent per category and your top genres, shows vs. movies
- **Login** — simple, passwordless email sign-in (a magic link, no passwords to remember)

No social features (comments, friends, reactions) — it's a solo tracker by design.

---

## Preview it first, no API keys needed

Want to see what it looks like before setting up TMDB/Supabase? You can run it locally with sample data.

**1. Install Node.js** (skip if you already have it): go to https://nodejs.org, download the **LTS** version, and run the installer.

**2. Open a terminal in this project folder.**
   - Windows: open the `watchreel`/`tvtracker` folder in File Explorer, then type `cmd` into the address bar and press Enter.
   - Mac: right-click the folder in Finder → "New Terminal at Folder" (or open Terminal and `cd` into the folder).

**3. Rename `.env.local.preview` to `.env.local`.** This turns on preview mode, which fills the app with sample shows/movies/posters instead of calling any real service — nothing to sign up for yet.

**4. Run these two commands:**
```bash
npm install
npm run dev
```

**5. Open http://localhost:3000 in your browser.** You'll see the full app — Shows, Movies, Discover, Profile, Lists — with sample data. Adding/removing titles won't be saved yet (that needs a real Supabase project), but you'll see exactly how everything looks and navigates.

When you're ready to make it fully functional (your own data, saved permanently), delete `.env.local` and follow the "One-time setup" section below instead.

---

## One-time setup (about 15 minutes)

You'll create two free accounts and copy 3 keys into one file. No coding required.

### 1. Get a TMDB API key (free)

1. Go to https://www.themoviedb.org/ and create a free account.
2. Once logged in, go to **Settings → API** (or visit https://www.themoviedb.org/settings/api directly).
3. Click **Request an API key**, choose **Developer**, and fill in the short form (you can put "personal project" for commercial use questions).
4. Copy the **API Key (v3 auth)** value — you'll paste this in step 3 below.

### 2. Create a Supabase project (free)

1. Go to https://supabase.com and sign up (GitHub or email both work).
2. Click **New Project**. Pick any name and a database password (save the password somewhere safe, though you won't need it day-to-day).
3. Once the project finishes setting up (~2 minutes), go to **Settings → API Keys** in the left sidebar.
4. Copy the **Project URL** (also in Settings → API) and the **Publishable key** (`sb_publishable_...`) — if you don't see one yet, click **Create new API keys** to generate it. You'll paste both in step 3 below. This app never needs the **Secret key** — that one stays out of the codebase entirely.
5. Go to **SQL Editor** in the left sidebar, click **New query**, open the file `supabase/schema.sql` from this project, paste its entire contents in, and click **Run**. This creates all the tables the app needs (library items, watched episodes, lists, list items) *and* turns on Row Level Security with policies that restrict every row to its owner — you can double check this worked by going to **Table Editor** and confirming all tables show RLS as enabled.
6. Go to **Authentication → Providers** and make sure **Email** is enabled (it is by default). Also go to **Authentication → URL Configuration** and add your site's URL once you know it (see deployment step below) so login links work correctly.

### 3. Add your keys to the app

In the project folder, copy `.env.example` to a new file named `.env.local`, then fill in the three values:

```
TMDB_API_KEY=paste_your_tmdb_key_here
NEXT_PUBLIC_SUPABASE_URL=paste_your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=paste_your_supabase_anon_key_here
```

---

## Running it locally (optional, to preview before deploying)

If you have Node.js installed:

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

---

## Deploying (free, ~5 minutes)

1. Create a free account at https://github.com if you don't have one, and create a new repository.
2. Upload this entire project folder to that repository (GitHub's website lets you drag-and-drop files if you don't want to use the command line).
3. Go to https://vercel.com, sign up with your GitHub account, click **Add New → Project**, and select the repository you just created.
4. In the "Environment Variables" section of the import screen, add the same 3 keys from your `.env.local` file (`TMDB_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
5. Click **Deploy**. In about a minute you'll get a live URL like `watchreel.vercel.app`.
6. Go back to Supabase → **Authentication → URL Configuration** and set your Vercel URL as the **Site URL** so login emails link back correctly.

From then on, any time you (or Claude, in a future session) push updated code to GitHub, Vercel automatically redeploys the live site — no manual steps.

---

## Project structure

```
app/                       Pages (Shows, Movies, Discover, Profile, Stats, Lists, Login, Title detail)
  api/tmdb/                Server routes that securely call TMDB (your key never reaches the browser)
  auth/callback/           Handles the magic-link sign-in redirect
  lists/[id]/              A single list's detail page — search, add, remove titles
  profile/stats/           Detailed watch-time and top-genre breakdown
  title/[type]/[id]/       Show/movie detail page — seasons, episodes, status, favorites
components/                Reusable UI: NavBar, PosterCard, ProgressRing, ListCard, StatCards
  ui/                      Design-system primitives: Button, Card, Pill, Badge, Avatar, IconButton, Input, Modal
lib/                       Supabase clients, TMDB helper, shared types, useLibrary/useLists data hooks, LibraryContext
supabase/schema.sql        Database tables + security rules — run this once in Supabase's SQL Editor
middleware.ts              Keeps you logged in across page visits; redirects to /login if signed out
DESIGN_SYSTEM.md           Visual language reference (colors, type, components) — see below
```

See `DESIGN_SYSTEM.md` for the full visual language reference (colors, typography, spacing, and component conventions) if you're extending the UI later.

## Maintaining it later

- **Add a feature**: describe what you want changed and share this repo; Claude Code or a future chat can edit these files directly.
- **Data outages**: if TMDB or Supabase ever have downtime, the app will show loading/error states rather than crash.
- **Costs**: TMDB, Supabase, and Vercel are all free at this scale (personal use, one user). You'd only hit paid tiers with heavy traffic.
