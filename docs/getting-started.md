[Back to README](../README.md) · [Next: API Reference →](api.md)

# Getting Started

Complete guide for setting up the Car Rental Service development environment.

## Prerequisites

| Requirement | Version | Notes                          |
| ----------- | ------- | ------------------------------ |
| Node.js     | 18+     | [Download](https://nodejs.org) |
| PostgreSQL  | 14+     | With PostGIS extension         |
| npm         | 9+      | Bundled with Node.js           |
| Git         | 2.30+   |                                |

### Install PostGIS (macOS)

```bash
brew install postgresql@14 postgis
brew services start postgresql@14
```

### Install PostGIS (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install postgresql-14 postgresql-14-postgis-3
```

## Database Setup

```bash
# Create database and enable PostGIS
psql -U postgres -c "CREATE DATABASE car_rental;"
psql -U postgres -d car_rental -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

## Backend Setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings
```

### Backend Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/car_rental

# JWT Authentication
JWT_SECRET=your-access-token-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

**Generate secure JWT secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Run Migrations

```bash
npm run migration:run
```

### Start Backend Development Server

```bash
npm run start:dev
# API runs on http://localhost:3000
```

## Frontend Setup

```bash
cd frontend
npm install

# Copy and configure environment
cp .env.example .env
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
```

### Initialize shadcn/ui (first-time setup only)

shadcn/ui is configured via `components.json`. If the `src/components/ui/` directory is missing (e.g., after a fresh clone), re-generate the primitives:

```bash
# Inside frontend/
npx shadcn@latest init         # select New York style, Neutral color, CSS variables yes
npx shadcn@latest add button card badge input label dialog table alert toggle-group separator
```

> **Note:** shadcn/ui components are copied into `src/components/ui/` and are committed to the repository, so team members do not need to re-run `shadcn init` after `npm install`.

### Start Frontend Development Server

```bash
npm run dev
# App runs at http://localhost:5173
# Login at /login, cars at /cars, admin panel at /admin/*
```

## Verify Setup

1. Open http://localhost:5173 — login page should load
2. Register a new user account
3. Try the geolocation search for available cars

## Creating the Initial Superadmin

```bash
# Using the NestJS CLI seed script (run from backend/)
npm run seed:superadmin

# Or via direct database insert:
psql -U postgres -d car_rental -c "
  INSERT INTO users (email, password, role)
  VALUES ('superadmin@example.com', '<bcrypt-hash>', 'superadmin');
"
```

## Useful Commands

### Backend

| Command                             | Description                            |
| ----------------------------------- | -------------------------------------- |
| `npm run start:dev`                 | Start with hot-reload                  |
| `npm run build`                     | Build for production                   |
| `npm run migration:run`             | Run pending migrations                 |
| `npm run migration:revert`          | Revert last migration                  |
| `npm run migration:generate <Name>` | Generate migration from entity changes |
| `npm test`                          | Run unit tests                         |
| `npm run test:e2e`                  | Run E2E tests                          |

### Frontend

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start dev server         |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |
| `npm test`        | Run tests                |

## See Also

- [API Reference](api.md) — Available endpoints and examples
- [User Roles & Permissions](roles.md) — Role setup and capabilities
- [Deployment](deployment.md) — Docker and production setup
