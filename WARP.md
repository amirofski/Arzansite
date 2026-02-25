# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: React + TypeScript + Vite + React Router + @tanstack/react-query + TailwindCSS + Radix UI/shadcn components
- Entry: src/main.tsx → src/App.tsx (providers and routing)
- Alias: import "@/…" resolves to ./src (vite.config.ts)
- API base URL: process via VITE_API_URL (.env). BaseApiService defaults to https://nest.arzansite.com/api if not provided

Common commands
- Install deps (respects package-lock.json)
  ```powershell path=null start=null
  npm ci
  ```
  If you need to update dependencies explicitly:
  ```powershell path=null start=null
  npm run update
  ```
- Start dev server (Vite on port 8080, host "::")
  ```powershell path=null start=null
  npm run dev
  ```
  Access http://localhost:8080
- Build
  ```powershell path=null start=null
  npm run build
  ```
- Preview built app (Vite preview; default port unless overridden)
  ```powershell path=null start=null
  npm run preview
  ```
- Lint (ESLint 9, TypeScript aware)
  ```powershell path=null start=null
  npm run lint
  ```
- Type-check (noEmit)
  ```powershell path=null start=null
  npx tsc -p tsconfig.json --noEmit
  ```
- Tests
  There is no test runner configured in this repository (no *.test.ts(x) files and no test script). Running a single test is not applicable.

Environment and configuration
- .env (at repo root) includes:
  - VITE_API_URL: backend base (e.g., https://nest.arzansite.com/api)
  - VITE_APP_NAME, VITE_APP_VERSION
- Vite alias: "@" → ./src for imports
- Dev server: port 8080 (vite.config.ts)
- Node: Vite 5.x is used; Node 18+ is recommended

High-level architecture
- Application shell and routing
  - src/App.tsx wires providers: HelmetProvider, QueryClientProvider (react-query), BrowserRouter, AuthProvider, TooltipProvider, Toasters
  - Routes include public pages (/, /wizard, /auth, /forgot-password, /reset-password, /verify-email, /debug) and protected areas (/dashboard, /admin). Payment callbacks handled at /payment/callback and /wallet/payment/callback
  - Site mode gating via useSiteMode; special full-page states for temporarily_unavailable and update_mode
  - ProtectedRoute enforces auth and optional admin role
- Services layer (API integration)
  - Location: src/lib/services
  - BaseApiService (src/lib/services/api/baseApiService.ts)
    - Centralized fetch wrapper, adds Authorization from tokenManager, includes credentials (cookie support), single 401 refresh attempt, JSON/text response handling
    - Uses VITE_API_URL; falls back to https://nest.arzansite.com/api when env missing
  - Token management (src/lib/tokenManager.ts)
    - Manages access/refresh tokens in ephemeral memory + localStorage; decodes JWT expiry; supports auto-refresh coordination
  - Field mapping (src/lib/utils/fieldMapper.ts)
    - Bi-directional camelCase ↔ snake_case conversion for requests/responses; list-aware; handles wrapped payloads
  - Error and retry utilities
    - ErrorHandler (src/lib/utils/errorHandler.ts): formatting, retryability checks, user-friendly messages
    - Retry (src/lib/utils/retry.ts): exponential backoff with jitter and helpers (by status codes/network)
  - Domain services (selected modules; see directory for full set):
    - auth, wizard, orders, payments, wallet, invoices, receipts, emails, site configuration, files, admin, notifications, support
    - Aggregated exports via src/lib/services/index.ts for types and instances
- React hooks (data and UX helpers)
  - useAuth (src/hooks/useAuth.tsx) provides auth context, session/role state, OAuth handling, password flows, verify flows, and integrates authService/tokenManager
  - useApi and specialized variants (exported from services index; implementation in src/hooks/useApi.ts): standard loading/error/execute pattern with optional retry/caching/optimistic/polling helpers
  - Additional hooks: useSiteMode, useNotifications, usePagination, useRateLimit, useSiteConfigSocket, etc.
- UI components
  - Reusable UI under src/components/ui (Shadcn-style). Layout, form primitives, dialogs, toasts, charts, etc.
  - Feature components under src/components/* (wizard, dashboard, admin, payments)
- Wizard and payment flows (integration boundaries)
  - Wizard
    - Primary endpoint in use: POST /api/wizard/complete-order
    - Missing endpoints (save/load progress, save-order) are currently handled with localStorage fallbacks; see docs/WIZARD_INTEGRATION_STATUS.md
  - Payments and wallet
    - Flows and endpoints documented in BACKEND_USAGE_GUIDE.md (payments.request/verify, wallets deposit/verify, invoices/receipts)
    - Frontend pages/components handle redirects and verification callbacks

Repository docs to consult
- BACKEND_USAGE_GUIDE.md: Backend endpoints overview (NestJS + Appwrite) and key flows (orders, payments, wallets, files, admin)
- docs/FRONTEND_API_INTEGRATION_GUIDE.md: Field mapping strategy, base service patterns, and implementation examples
- docs/API_INTEGRATION_SUMMARY.md: Summarizes the frontend API integration architecture and benefits
- docs/WIZARD_INTEGRATION_STATUS.md: Current wizard endpoint availability and fallbacks
- docs/MIGRATION_GUIDE.md and docs/MIGRATION_STATUS.md: Migration patterns/status for services and components

Notes for agents working in this repo
- Use the "@" alias for imports from src
- Prefer using the exported service singletons from src/lib/services rather than ad-hoc fetch code
- React Query is available globally; leverage it for data fetching/caching if adding features
- For backend assumptions (e.g., wizard progress endpoints), verify availability before removing fallbacks; keep behavior aligned with the docs until backend endpoints exist

