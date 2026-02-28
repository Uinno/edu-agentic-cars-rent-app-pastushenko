# Plan: Setup React + Vite Frontend

**Branch:** `feature/react-frontend-setup`
**Created:** 2026-02-28
**Status:** Ready for implementation

## Settings

| Setting | Value                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------ |
| Testing | No tests                                                                                               |
| Logging | Verbose — `console.debug` for API calls, auth state changes, geolocation; `console.error` for failures |
| Docs    | Yes — update `docs/getting-started.md` and `docs/api.md` after implementation                          |

## Context

- Vite + React 19 + TypeScript scaffold already exists in `frontend/`
- Current deps: only `react`, `react-dom` — no router, no axios, no map library installed
- Backend API runs at `http://localhost:3000/api` with global JWT guard (`@Public()` on login/register)
- API endpoints:
  - `POST /api/auth/register` → `{ accessToken, refreshToken }`
  - `POST /api/auth/login` → `{ accessToken, refreshToken }`
  - `POST /api/auth/refresh` → `{ accessToken, refreshToken }` (requires refresh token in Bearer)
  - `POST /api/auth/logout`
  - `GET /api/cars` — all cars (public)
  - `GET /api/cars/available` — available cars
  - `GET /api/cars/nearby?latitude=&longitude=&radius=` — radius 5|10|15 km, returns `distance_meters`
  - `GET /api/cars/:id`
  - `POST /api/cars` (admin), `PATCH /api/cars/:id` (admin), `DELETE /api/cars/:id` (admin)
  - `GET /api/rentals/my` — current user's rentals
  - `POST /api/rentals`
  - `GET /api/rentals` (admin), `GET /api/rentals/active` (admin)
  - `PATCH /api/rentals/:id/complete` (admin), `PATCH /api/rentals/:id/cancel`
  - `GET /api/users` (admin), `DELETE /api/users/:id` (admin)
- Rental dates are `YYYY-MM-DD` strings, `distance_meters` is raw number (divide by 1000 for km)
- User roles: `superadmin | admin | user`

## Architecture Notes (from ARCHITECTURE.md)

```
frontend/src/
├── pages/          # Route-level page components
├── components/     # Reusable UI components
│   ├── auth/
│   ├── cars/
│   ├── rentals/
│   └── layout/
├── api/            # Axios client + per-domain API functions
├── hooks/          # Custom React hooks
├── contexts/       # React contexts (AuthContext)
├── types/          # TypeScript interfaces
└── utils/          # Formatters, validators
```

---

## Phase 1 — Infrastructure & Types

### Task 1: Install Frontend Dependencies

**Deliverable:** All required packages installed and `package.json` updated.

**File:** `frontend/package.json`

Install runtime:

```bash
cd frontend
npm install react-router-dom axios leaflet react-leaflet
```

Install dev types:

```bash
npm install -D @types/leaflet @types/react-router-dom
```

**Expected result:** `npm list` shows all 4 runtime deps without errors.

---

### Task 2: Create TypeScript Types

**Deliverable:** Three type definition files covering all domain entities.

**Files to create:**

`frontend/src/types/user.types.ts`

- `UserRole` enum: `'superadmin' | 'admin' | 'user'`
- `User` interface: `id`, `email`, `firstName`, `lastName`, `role: UserRole`, `createdAt`
- `AuthTokens` interface: `accessToken`, `refreshToken`
- `CurrentUserPayload` interface: `id`, `email`, `role: UserRole` (matches JWT payload)

`frontend/src/types/car.types.ts`

- `Car` interface: `id`, `brand`, `model`, `year`, `pricePerDay: number`, `isAvailable: boolean`, `latitude: number | null`, `longitude: number | null`, `createdAt`
- `CarWithDistance` extends `Car` with `distance_meters: number`
- `CreateCarDto`, `UpdateCarDto` types

`frontend/src/types/rental.types.ts`

- `RentalStatus` type: `'pending' | 'active' | 'completed' | 'cancelled'`
- `Rental` interface: `id`, `car: Car`, `user?: User`, `startDate: string`, `endDate: string`, `status: RentalStatus`, `createdAt`
- `CreateRentalDto`: `carId`, `startDate`, `endDate`

**Logging:** None needed for type files.

---

### Task 3: Configure Axios Client & Token Storage

**Deliverable:** Axios instance with JWT interceptors, token storage utility, and `.env` file.

**Files to create/update:**

`frontend/.env`

```
VITE_API_URL=http://localhost:3000/api
```

`frontend/.env.example`

```
VITE_API_URL=http://localhost:3000/api
```

`frontend/src/utils/token.storage.ts`

- `getAccessToken()` / `setAccessToken(token)` / `removeAccessToken()` — `localStorage`
- `getRefreshToken()` / `setRefreshToken(token)` / `removeRefreshToken()` — `localStorage`
- `clearTokens()` — removes both

`frontend/src/api/client.ts`

- Create `axios` instance with `baseURL: import.meta.env.VITE_API_URL`
- **Request interceptor**: attach `Authorization: Bearer <accessToken>` from localStorage
  - `console.debug('[API] Request:', method.toUpperCase(), url)`
- **Response interceptor (error)**:
  - On 401: attempt token refresh using `refreshToken` from storage
    - `console.debug('[API] 401 received, attempting token refresh')`
    - If refresh succeeds: store new tokens, retry original request
    - If refresh fails: `console.error('[API] Token refresh failed, clearing session')`, clear tokens, redirect `window.location.href = '/login'`
  - Other errors: `console.error('[API] Request failed:', status, message)`
- Export as `apiClient`

**Logging requirements:**

- DEBUG every outgoing request (method + url, mask auth header value)
- DEBUG on token refresh attempts and outcomes
- ERROR on refresh failure + session clear

---

## Phase 2 — Auth

### Task 4: Auth Context & useAuth Hook

**Deliverable:** `AuthContext` that manages user session state with login, register, logout, and auto-refresh.

**Files to create:**

`frontend/src/contexts/AuthContext.tsx`

- State: `user: CurrentUserPayload | null`, `isLoading: boolean`, `isAuthenticated: boolean`
- On mount: decode `accessToken` from localStorage (use `JSON.parse(atob(token.split('.')[1]))`) to restore session
  - `console.debug('[AuthContext] Restoring session from stored token')`
  - If token is expired (check `exp` field), clear tokens
  - `console.debug('[AuthContext] Session restored:', { id, email, role })`
- `login(email, password)`: calls `authApi.login()`, stores tokens, sets user, logs `console.debug('[AuthContext] Login successful:', email)`
- `register(email, password, firstName, lastName)`: calls `authApi.register()`, stores tokens, sets user
- `logout()`: calls `authApi.logout()` (fire+forget), clears tokens, sets `user = null`, `console.debug('[AuthContext] Logged out')`
- Export `AuthProvider` and `useAuth` hook (throws if used outside provider)

`frontend/src/hooks/useAuth.ts`

- Re-export `useAuth` from `AuthContext` for convenience

**Logging requirements:**

- DEBUG on session restore (with email/role, NOT password or tokens)
- DEBUG on login/register success (email, role)
- DEBUG on logout
- ERROR on login/register failure (message only, not credentials)

---

### Task 5: API Layer

**Deliverable:** Four domain API modules with typed request/response functions.

**Files to create:**

`frontend/src/api/auth.api.ts`

- `login(email, password): Promise<AuthTokens>`
- `register(email, password, firstName, lastName): Promise<AuthTokens>`
- `refresh(refreshToken): Promise<AuthTokens>`
- `logout(): Promise<void>`

`frontend/src/api/cars.api.ts`

- `getCars(): Promise<Car[]>`
- `getAvailableCars(): Promise<Car[]>`
- `getNearbyCars(latitude, longitude, radius: 5|10|15): Promise<CarWithDistance[]>`
- `getCar(id): Promise<Car>`
- `createCar(data: CreateCarDto): Promise<Car>`
- `updateCar(id, data: UpdateCarDto): Promise<Car>`
- `deleteCar(id): Promise<void>`

`frontend/src/api/rentals.api.ts`

- `getMyRentals(): Promise<Rental[]>`
- `createRental(data: CreateRentalDto): Promise<Rental>`
- `getAllRentals(): Promise<Rental[]>` (admin)
- `getActiveRentals(): Promise<Rental[]>` (admin)
- `completeRental(id): Promise<Rental>` (admin)
- `cancelRental(id): Promise<Rental>`

`frontend/src/api/users.api.ts`

- `getUsers(): Promise<User[]>` (admin)
- `deleteUser(id): Promise<void>` (admin)

**Logging requirements:**

- `console.debug('[API:cars] getNearbyCars', { latitude, longitude, radius })` before each call
- `console.debug('[API:rentals] createRental', { carId, startDate, endDate })`
- `console.error('[API:<domain>] <function> failed:', error.message)` on catch in each function

---

### Task 6: Auth Pages & Route Guards

**Deliverable:** Login page, Register page, and `ProtectedRoute`/`AdminRoute` guards.

**Files to create:**

`frontend/src/components/auth/ProtectedRoute.tsx`

- If `!isAuthenticated`: redirect to `/login`
- If `isLoading`: render `<div>Loading...</div>`
- Otherwise: render `<Outlet />`

`frontend/src/components/auth/AdminRoute.tsx`

- Extends ProtectedRoute: additionally check `user.role === 'admin' || 'superadmin'`
- If user is authenticated but not admin: redirect to `/` with `console.warn('[AdminRoute] Access denied for role:', user.role)`

`frontend/src/pages/LoginPage.tsx`

- Form: email + password fields
- On submit: `useAuth().login()`, redirect to `/` on success
- Show inline error on failure (e.g., "Invalid credentials")
- Link to `/register`
- `console.debug('[LoginPage] Login attempt:', email)` (no password)

`frontend/src/pages/RegisterPage.tsx`

- Form: email, password, firstName, lastName fields
- On submit: `useAuth().register()`, redirect to `/` on success
- Show inline error on failure
- Link to `/login`
- `console.debug('[RegisterPage] Register attempt:', email)`

No CSS frameworks — use inline styles or minimal CSS modules.

**Logging requirements:**

- DEBUG on form submit (email only, never password)
- ERROR on auth failure with user-visible message
- WARN in AdminRoute when non-admin accesses

---

## Commit Checkpoint 1

After completing Tasks 1–6, commit:

```
git add .
git commit -m "feat(frontend): infrastructure, auth context, API layer, and auth pages"
```

---

## Phase 3 — Layout & Routing

### Task 7: App Routing, Header & Layout

**Deliverable:** `App.tsx` wired with `react-router-dom`, `Header` component, and page shell.

**Files to update/create:**

`frontend/src/App.tsx`

- Wrap app in `<AuthProvider>` + `<BrowserRouter>`
- Routes:
  ```
  /login           → LoginPage       (public)
  /register        → RegisterPage    (public)
  /                → DashboardPage   (protected)
  /cars            → CarsPage        (protected)
  /admin/cars      → AdminCarsPage   (admin)
  /admin/rentals   → AdminRentalsPage (admin)
  /admin/users     → AdminUsersPage  (admin)
  ```
- Redirect `/` to `/cars` if no dashboard page renders yet (can update later)
- Public routes redirect to `/cars` if `isAuthenticated`

`frontend/src/components/layout/Header.tsx`

- Show app name "Car Rental"
- Nav links: "Cars" (`/cars`), "My Rentals" (`/`) — always visible when authenticated
- Admin links: "Manage Cars", "Active Rentals", "Users" — only when `user.role` is `admin | superadmin`
- Logout button: calls `useAuth().logout()`
- If not authenticated: "Login" and "Register" links

`frontend/src/components/layout/Layout.tsx`

- Wrapper with `<Header />` + `<main><Outlet /></main>`
- Used as parent route for protected routes

**Logging requirements:**

- `console.debug('[App] User navigated to:', location.pathname)` in a `useEffect` on location change

---

## Phase 4 — Car Browsing

### Task 8: Geolocation Hook & Car Components

**Deliverable:** `useGeolocation` hook, `CarCard`, `RadiusFilter`, and `CarMap` components.

**Files to create:**

`frontend/src/hooks/useGeolocation.ts`

- State: `{ latitude, longitude, error, isLoading }`
- On mount: calls `navigator.geolocation.getCurrentPosition()`
  - `console.debug('[useGeolocation] Requesting browser geolocation')`
  - On success: set coords, `console.debug('[useGeolocation] Position acquired:', { latitude, longitude })`
  - On error: set error message, `console.warn('[useGeolocation] Geolocation denied:', error.message)`
- Export `{ latitude, longitude, error, isLoading }`

`frontend/src/components/cars/CarCard.tsx`

- Props: `car: Car | CarWithDistance`, `onRent?: (carId: string) => void`
- Display: brand + model + year, price/day, availability badge
- If `distance_meters` present: show as `(X.X km away)`
- "Rent" button (only if `isAvailable && onRent` provided)

`frontend/src/components/cars/RadiusFilter.tsx`

- Props: `value: 5|10|15`, `onChange: (r: 5|10|15) => void`, `disabled?: boolean`
- Renders three radio buttons / toggle buttons for 5km, 10km, 15km
- `console.debug('[RadiusFilter] Radius changed to:', radius)` on change

`frontend/src/components/cars/CarMap.tsx`

- Import `MapContainer`, `TileLayer`, `Marker`, `Popup` from `react-leaflet`
- Fix Leaflet default icon URL issue (import `leaflet/dist/leaflet.css`, reassign `L.Icon.Default.prototype`)
- Props: `cars: (Car | CarWithDistance)[]`, `userLat?: number`, `userLng?: number`
- Center on user position (or Kyiv `[50.45, 30.52]` as fallback)
- Render a marker for each car with popup showing `brand model (price/day)`
- User position marker (different icon or color)
- `console.debug('[CarMap] Rendering map with', cars.length, 'cars')`

**Logging requirements:**

- DEBUG on geolocation events
- WARN on geolocation denied
- DEBUG in CarMap with count of cars rendered

---

### Task 9: CarsPage

**Deliverable:** Full car browsing page with list view, map view, and rental booking modal.

**File to create:** `frontend/src/pages/CarsPage.tsx`

**Features:**

- On load: fetch `getAvailableCars()`, display in card grid
  - `console.debug('[CarsPage] Fetching available cars')`
- **Geolocation search section:**
  - "Use my location" button — calls `useGeolocation()`, then fetches `getNearbyCars(lat, lng, radius)` on button click
  - `<RadiusFilter>` to select radius (default: 10km)
  - Show `CarWithDistance` results when geolocation is active (replace list with nearby results)
  - Display count: "X cars found within Y km"
  - `console.debug('[CarsPage] Nearby search:', { latitude, longitude, radius, count: results.length })`
- **Map toggle**: "Show Map" / "Hide Map" button renders `<CarMap>` below the list
- **Rent modal**: clicking "Rent" on a `CarCard` opens an inline form with `startDate` + `endDate` inputs
  - Call `createRental({ carId, startDate, endDate })`
  - On success: show success message, refresh car list
  - On error (409 conflict): show "Car already booked for selected dates"
  - `console.debug('[CarsPage] Rental submitted:', { carId, startDate, endDate })`
- **Error state**: if geolocation denied, show "Enable location access to search nearby cars"

**Logging requirements:**

- DEBUG on fetch calls with result counts
- DEBUG on rental submission
- ERROR on API failures with displayed user message

---

## Commit Checkpoint 2

After completing Tasks 7–9, commit:

```
git add .
git commit -m "feat(frontend): routing, layout, and car browsing with geolocation"
```

---

## Phase 5 — User Dashboard & Admin Pages

### Task 10: User Dashboard (My Rentals)

**Deliverable:** Dashboard page showing the authenticated user's rental history.

**Files to create:**

`frontend/src/components/rentals/RentalCard.tsx`

- Props: `rental: Rental`, `onCancel?: (id: string) => void`
- Display: car brand + model, dates (formatted `MMM D, YYYY`), status badge (color-coded)
- "Cancel" button for `pending` rentals (if `onCancel` provided)

`frontend/src/components/rentals/RentalsList.tsx`

- Props: `rentals: Rental[]`, `onCancel?: (id: string) => void`, `emptyText?: string`
- Renders list of `<RentalCard>`, or `emptyText` if empty

`frontend/src/pages/DashboardPage.tsx`

- On load: `getMyRentals()`
  - `console.debug('[DashboardPage] Fetching user rentals')`
- Show `<RentalsList>` with `onCancel={handleCancel}`
- `handleCancel(id)`: calls `cancelRental(id)`, refreshes list
  - `console.debug('[DashboardPage] Cancelling rental:', id)`

`frontend/src/utils/formatters.ts`

- `formatDate(dateStr: string): string` — converts `YYYY-MM-DD` to `"Feb 28, 2026"`
- `formatCurrency(amount: number): string` — `"$X.XX/day"`
- `formatDistance(meters: number): string` — `"1.5 km"` (divide by 1000, 1 decimal)

**Logging requirements:**

- DEBUG on fetch + cancel operations

---

### Task 11: Admin Pages

**Deliverable:** Three admin-only pages for car management, active rentals, and user management.

**Files to create:**

`frontend/src/pages/AdminCarsPage.tsx`

- On load: `getCars()` — show all cars regardless of availability
  - `console.debug('[AdminCarsPage] Fetching all cars')`
- Table view: id, brand, model, year, price, available (yes/no), location (lat/lng)
- **Add car** form (modal or inline): brand, model, year, pricePerDay, latitude, longitude inputs
  - `createCar(data)` on submit, refresh list
- **Delete** button per row: `deleteCar(id)` with confirm dialog
  - `console.debug('[AdminCarsPage] Deleting car:', id)`
- **Toggle availability**: PATCH car with `isAvailable` flipped
- Basic inline error display

`frontend/src/pages/AdminRentalsPage.tsx`

- On load: `getActiveRentals()`
  - `console.debug('[AdminRentalsPage] Fetching active rentals')`
- Table: renter email, car (brand + model), start/end dates, status
- "Complete" button: `completeRental(id)`, refresh
  - `console.debug('[AdminRentalsPage] Completing rental:', id)`
- Tab or toggle for "All Rentals" (calls `getAllRentals()`)

`frontend/src/pages/AdminUsersPage.tsx`

- On load: `getUsers()`
  - `console.debug('[AdminUsersPage] Fetching users')`
- Table: email, firstName, lastName, role, created date
- "Remove" button: `deleteUser(id)` with confirm (soft delete on backend)
  - `console.debug('[AdminUsersPage] Removing user:', id)`
- Filter/search input (client-side, by email)

**Logging requirements:**

- DEBUG on every fetch + mutation
- ERROR on failure with user-visible text

---

### Task 12: Update Documentation

**Deliverable:** Updated `docs/getting-started.md` with frontend setup steps.

**File to update:** `docs/getting-started.md`

Add frontend section:

- Prerequisites: Node.js 24.x, npm
- Install: `cd frontend && npm install`
- Configure: copy `.env.example` → `.env`, set `VITE_API_URL`
- Run: `npm run dev` → `http://localhost:5173`
- Pages: Login (`/login`), Register (`/register`), Cars (`/cars`), Dashboard (`/`), Admin (`/admin/*`)

Also update `frontend/.env.example` path in the doc if not already present.

---

## Commit Checkpoint 3

After completing Tasks 10–12, commit:

```
git add .
git commit -m "feat(frontend): user dashboard, admin pages, and updated docs"
```

---

## Task Summary

| #   | Task                              | Phase          | Depends On |
| --- | --------------------------------- | -------------- | ---------- |
| 1   | Install dependencies              | Infrastructure | —          |
| 2   | TypeScript types                  | Infrastructure | —          |
| 3   | Axios client & token storage      | Infrastructure | 1, 2       |
| 4   | AuthContext & useAuth             | Auth           | 3          |
| 5   | API layer (4 modules)             | Auth           | 3, 2       |
| 6   | Auth pages & guards               | Auth           | 4, 5       |
| 7   | App routing, Header, Layout       | Layout         | 6          |
| 8   | Geolocation hook & car components | Car Browsing   | 5, 2       |
| 9   | CarsPage                          | Car Browsing   | 7, 8       |
| 10  | User Dashboard & formatters       | Dashboard      | 7, 5       |
| 11  | Admin pages (3)                   | Admin          | 7, 5       |
| 12  | Update documentation              | Docs           | 11         |

## Commit Plan

| After Task | Commit Message                                                            |
| ---------- | ------------------------------------------------------------------------- |
| Task 6     | `feat(frontend): infrastructure, auth context, API layer, and auth pages` |
| Task 9     | `feat(frontend): routing, layout, and car browsing with geolocation`      |
| Task 12    | `feat(frontend): user dashboard, admin pages, and updated docs`           |
