# BackerHub — Technical Documentation

## Overview

BackerHub is a bilingual (English / Traditional Chinese) poker tournament backing platform built with Next.js. Investors back skilled poker players by purchasing shares of tournament action, and share in winnings. The platform handles listing creation, investment checkout, escrow, tournament result settlement, crypto payments, and KYC verification.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Frontend | React 19.2.3, Tailwind CSS 4, Framer Motion |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth |
| Payments | Crypto — USDT, USDC on Tron TRC-20; Bitcoin; Ethereum |
| i18n | next-intl (en, zh-TW) |
| UI Library | shadcn/ui + Base UI |
| Data Fetching | SWR (client-side caching) |
| Testing | Vitest (unit), Playwright (E2E) |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/               # Locale dynamic segment (en, zh-TW)
│   │   ├── layout.tsx          # Root layout with auth provider
│   │   ├── page.tsx            # Landing page
│   │   ├── (app)/              # Protected app routes
│   │   │   ├── marketplace/    # Browse player listings
│   │   │   ├── players/        # Player directory
│   │   │   ├── dashboard/      # Investor & player dashboards
│   │   │   ├── profile/        # User profile with KYC
│   │   │   ├── create-listing/ # Players sell action
│   │   │   ├── checkout/       # Investment checkout
│   │   │   └── admin/          # Admin panel
│   │   └── (auth)/             # Auth routes (login/signup/forgot-password)
│   └── api/                    # 47 API routes
├── components/
│   ├── ui/                     # 14 shadcn components
│   ├── layout/                 # Header, Footer, MobileTabBar
│   ├── shared/                 # Reusable (DepositDialog, WalletBalance, etc.)
│   └── landing/                # Landing page sections
├── lib/
│   ├── supabase/               # DB clients (server, client, middleware)
│   ├── constants.ts            # Platform config & limits
│   ├── format.ts               # Currency/date/number formatters
│   ├── logger.ts               # Structured JSON logging
│   ├── player-colors.ts        # 8-tone color system for player cards
│   ├── rate-limit.ts           # In-memory rate limiting
│   ├── idempotency.ts          # Double-click protection for financial ops
│   └── swr.ts                  # Pre-configured SWR hooks
├── i18n/                       # Routing, request config, navigation utils
├── providers/                  # React context (auth-provider.tsx)
├── types/                      # TypeScript type definitions
├── hooks/                      # Custom React hooks
└── middleware.ts               # Auth + i18n middleware chain
messages/                       # Translation files (en.json, zh-TW.json)
supabase/                       # Migrations & schema
e2e/                            # Playwright tests
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Users — role (investor/player/both), KYC status, wallet balance, avatar, bio, color tone |
| `player_stats` | Aggregated performance — ROI, tournament count, cash rate |
| `monthly_roi` | Historical monthly ROI tracking |
| `tournaments` | Tournament definitions — name, date, buy-in, guaranteed pool, type, game, region |
| `listings` | Player-created action sales — markup, shares offered/sold, status, deadlines |
| `investments` | Investor purchases — shares bought, amount paid, status |
| `transactions` | Financial ledger — deposits, withdrawals, purchases, payouts, fees |
| `escrow` | Holding amounts for unsettled listings |
| `reviews` | Player ratings from backers |
| `tournament_results` | Outcome submissions — win/loss/cancelled, prize, finish position |

### Status Machines

**Listing lifecycle:**
```
active → filled → buy_in_released → registered → in_progress
       → pending_result → pending_deposit → settled
       → cancelled (at any stage)
```

**Investment lifecycle:**
```
pending → confirmed → settled | refunded
```

**Tournament result:**
```
pending_review → approved | rejected
```

**KYC:**
```
none → pending → approved | rejected
```

---

## Authentication & Authorization

**Provider:** `src/providers/auth-provider.tsx`

- Supabase Auth with auto-confirm on signup
- Protected routes: `/dashboard`, `/create-listing`, `/checkout`
- KYC gating: only approved players can create listings
- Admin role via `is_admin` flag on profiles
- Demo mode (localStorage-backed) when Supabase is not configured
- Exposes `useAuth()` hook for user state, login, signup, logout

**Middleware chain** (`src/middleware.ts`):
1. Supabase session refresh + protected route redirect
2. next-intl locale routing
3. Cookie synchronization

---

## API Routes (47 total)

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Rate-limited signup, auto-confirm, upsert profile |
| GET | `/api/auth/callback` | OAuth callback |

### Listings
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/listings` | Browse listings with filters |
| POST | `/api/listings` | Create listing (KYC required) |
| GET | `/api/listings/[id]` | Detail with player & tournament data |
| PUT | `/api/listings/[id]` | Update listing |
| POST | `/api/listings/[id]/confirm-registration` | Player confirms tournament registration |
| POST | `/api/listings/[id]/release-buyin` | Release funds after registration |
| POST | `/api/listings/[id]/confirm-deposit` | Confirm prize deposit received |
| POST | `/api/listings/[id]/cancel` | Cancel listing |

### Investments
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/investments` | Fetch investor's purchases |
| POST | `/api/investments` | Purchase shares (idempotency via `x-idempotency-key` header) |

### Wallet
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/wallet` | Balance & currency |
| POST | `/api/wallet/deposit` | Initiate crypto deposit (generates reference number) |
| POST | `/api/wallet/withdraw` | Initiate withdrawal (immediate balance deduction) |
| POST | `/api/wallet/deposit/ecpay-callback` | ECPay payment callback |

### Players
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/players` | Directory with filters (region, verified, search) |
| GET | `/api/players/[id]` | Player detail with stats |
| GET | `/api/players/[id]/reviews` | Player reviews |
| GET | `/api/players/hendon-mob` | Sync Hendon Mob data |

### Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/investor` | Portfolio & transaction history |
| GET | `/api/dashboard/player` | Listings & earnings |

### Tournament Results
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/tournament-results` | Submit tournament outcome |
| GET | `/api/tournament-results` | Fetch user's results |

### Profile
| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/profile` | Fetch/update profile |
| POST | `/api/profile/avatar` | Upload avatar |
| POST | `/api/profile/kyc` | Submit KYC documents |

### Admin (requires `is_admin` flag)
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/admin/kyc` | Review pending KYC submissions |
| GET | `/api/admin/lifecycle` | Filled listings, pending registrations/deposits |
| POST | `/api/admin/escrow` | Release escrow |
| POST | `/api/admin/tournament-results` | Review/approve results |
| GET | `/api/admin/wallet/*` | Wallet management |
| POST | `/api/admin/promote` | Promote user to admin |
| POST | `/api/admin/dev-credit` | Dev credit allocation |

### Other
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/stats` | Platform aggregates |
| GET/PUT | `/api/notifications` | User notifications |
| GET/POST | `/api/reviews` | Reviews |
| POST | `/api/testimonials` | Fetch testimonials |
| POST | `/api/tournaments/sync` | Sync tournament schedule |
| POST | `/api/contact` | Contact form |
| POST | `/api/seed` | Seed demo data |
| POST | `/api/test-flow` | End-to-end lifecycle test |
| GET | `/api/avatar/[userId]` | Avatar proxy |
| POST | `/api/cron/lifecycle` | Daily lifecycle automation (Vercel cron, 00:00 UTC) |

---

## Key Business Flows

### Investment Flow
1. Investor browses `/marketplace` → selects a listing
2. Goes to `/checkout/[id]` → enters number of shares
3. `POST /api/investments` (with idempotency key)
4. Wallet balance deducted via `adjust_wallet_balance` RPC
5. Investment record created, listing shares updated
6. Funds held in escrow

### Listing Creation
1. Player (KYC approved) creates listing via `POST /api/listings`
2. Escrow record created
3. Status progresses: active → filled → buy_in_released → registered → settled

### Tournament Settlement
1. Player submits result: `POST /api/tournament-results`
2. Admin reviews: `POST /api/admin/tournament-results`
3. On win: listing → `pending_deposit`, prize held in escrow
4. Player deposits prize: `POST /api/listings/[id]/confirm-deposit`
5. Admin releases escrow → payouts distributed to investors

### KYC Verification
1. User uploads documents: `POST /api/profile/kyc`
2. Admin reviews: `GET/POST /api/admin/kyc`
3. Approve/reject → `profiles.kyc_status` updated
4. Approved status required to create listings

---

## Payment System

**Supported cryptocurrencies:**
- USDT (Tron TRC-20)
- USDC (Tron TRC-20)
- Bitcoin
- Ethereum (ERC-20)

**Platform wallet:** `TJYMpMCx4goDn6yWUnrSJaLb8uXtoFains` (Tron)

**Limits:**
- Deposits: $10 – $100,000
- Withdrawals: $10 – $50,000
- Platform fee: 2%

**Deposit flow:** Generate reference number → display Tron address → admin verifies transfer
**Withdrawal flow:** Deduct balance immediately → create pending transaction → admin processes

---

## Internationalization

- **Locales:** `en`, `zh-TW` (Traditional Chinese)
- **Routing:** `next-intl` with `[locale]` dynamic segment
- **Translation files:** `messages/en.json`, `messages/zh-TW.json` (60KB+ each)
- **Bilingual DB fields:** `display_name_zh`, `bio_zh`, etc.
- **Currencies:** USD, TWD, HKD (locale-specific)
- **Navigation:** `src/i18n/navigation.ts` exports i18n-aware `Link`, `redirect`, `usePathname`

---

## Security

| Feature | Implementation |
|---------|---------------|
| Content Security Policy | Configured in `next.config.ts` headers |
| HSTS | 63M seconds max-age |
| Frame protection | X-Frame-Options: DENY |
| Content sniffing | X-Content-Type-Options: nosniff |
| Permissions Policy | Camera, microphone, geolocation disabled |
| Row Level Security | Supabase RLS on all tables |
| Service role isolation | Admin client only in API routes |
| Rate limiting | In-memory, presets: financial (5/60s), auth (10/300s) |
| Idempotency | In-memory cache (5-min TTL) for financial operations |
| Protected routes | Middleware redirect for unauthenticated users |

---

## Components

### UI (src/components/ui/) — 14 shadcn components
Accordion, Avatar, Badge, Button, Card, Dialog, Dropdown Menu, Input, Progress, Select, Separator, Sheet, Tabs, Tooltip

### Layout (src/components/layout/)
- **Header** — Nav bar, user menu, language switcher, notification bell
- **Footer** — Multi-column links, payment badges
- **MobileTabBar** — Bottom nav (5 tabs + center action button)
- **LanguageSwitcher** — Locale toggle

### Shared (src/components/shared/)
- AvatarCropModal, DepositDialog, WithdrawDialog, WalletBalance
- NotificationBell, PlayerAvatar, PlayerHeroImage
- TournamentBrandBanner, ScrollReveal, LegalDisclaimerBanner

### Landing (src/components/landing/)
- HeroSection, FeaturedPlayers, HowItWorks, StatsCounter
- Testimonials, PaymentMethods, TrustBadges, CtaSection

---

## Pages (19 total)

### Public
`/` · `/how-it-works` · `/about` · `/pricing` · `/contact` · `/terms` · `/why-backerhub`

### Auth
`/login` · `/signup` · `/forgot-password`

### Protected (App)
`/marketplace` · `/players` · `/player/[id]` · `/create-listing` · `/checkout/[listingId]` · `/submit-result/[listingId]` · `/dashboard/player` · `/dashboard/investor` · `/profile`

### Admin
`/admin/kyc` · `/admin/results` · `/admin/wallet`

---

## Utilities

| Module | Purpose |
|--------|---------|
| `lib/constants.ts` | Site name, platform fee (2%), crypto coins, wallet address, deposit/withdrawal limits |
| `lib/format.ts` | `formatCurrency`, `formatNumber` (K/M), `formatPercent`, `formatMarkup` (1.20x), `formatDate` |
| `lib/logger.ts` | Structured JSON logging — `info`, `warn`, `error`, `apiRequest`, `apiError` |
| `lib/player-colors.ts` | 8 color tones (red, blue, emerald, purple, amber, cyan, rose, gold) with gradient/accent/border CSS |
| `lib/rate-limit.ts` | In-memory rate limiter with auto-cleanup |
| `lib/idempotency.ts` | In-memory cache preventing duplicate financial operations |
| `lib/swr.ts` | `useListings` (10s), `usePlayers` (30s), `usePlatformStats` (60s), `useAPI<T>` |
| `lib/utils.ts` | `cn()` — Tailwind class merging |

---

## Type Definitions (src/types/index.ts)

```typescript
Locale: 'en' | 'zh-TW'
Currency: 'USD' | 'TWD' | 'HKD'
Region: 'TW' | 'HK' | 'OTHER'
UserRole: 'investor' | 'player' | 'both'
PlayerColorTone: 'red' | 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'rose' | 'gold'
ListingStatus: 'active' | 'filled' | 'buy_in_released' | 'registered' | 'in_progress'
             | 'pending_result' | 'pending_deposit' | 'settled' | 'cancelled'
```

Core interfaces: `Player`, `PlayerStats`, `MonthlyROI`, `Tournament`, `StakingListing`, `TournamentResult`, `PlayerReliability`, `Transaction`, `Review`, `PlatformStats`

---

## Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin access (RLS bypass) |

---

## Development

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

**Demo mode:** When Supabase env vars are not configured, the app falls back to localStorage-backed demo authentication for local development.

**Seed data:** `POST /api/seed` populates demo players, tournaments, listings, and investments.

**Lifecycle test:** `POST /api/test-flow` runs a full investment-to-settlement lifecycle.

**Cron:** Vercel cron runs `POST /api/cron/lifecycle` daily at 00:00 UTC for automated lifecycle transitions (release buy-ins, settle results, etc.).
