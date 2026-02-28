# 🚗 Car Rental Service

A web-based car rental platform with geolocation-based search, role-based access control, and real-time rental management.

## Features

- **Geolocation Search** — Find available cars within 5km, 10km, or 15km radius using PostGIS
- **Role-Based Access** — Three-tier system: superadmin, admin, and user
- **Rental Management** — Create, track, and manage car rentals with availability conflict detection
- **Admin Dashboard** — Monitor active rentals, manage cars, and oversee user accounts

## Tech Stack

| Layer    | Technology                |
| -------- | ------------------------- |
| Backend  | NestJS + TypeScript       |
| Frontend | React + Vite + TypeScript |
| Database | PostgreSQL + PostGIS      |
| ORM      | TypeORM                   |
| Auth     | JWT with refresh tokens   |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- npm (or pnpm/yarn)

### Setup

```bash
# Clone and install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run database migrations
cd backend && npm run migration:run

# Start development servers
cd backend && npm run start:dev    # http://localhost:3000
cd frontend && npm run dev          # http://localhost:5173
```

See [docs/getting-started.md](docs/getting-started.md) for detailed setup instructions.

## API Overview

| Method | Endpoint          | Description            | Auth   |
| ------ | ----------------- | ---------------------- | ------ |
| POST   | `/auth/register`  | Register new user      | Public |
| POST   | `/auth/login`     | Login with credentials | Public |
| GET    | `/cars/nearby`    | Find cars by radius    | User   |
| POST   | `/cars`           | Add a new car          | Admin  |
| POST   | `/rentals`        | Create a rental        | User   |
| GET    | `/rentals/active` | View active rentals    | Admin  |
| GET    | `/users`          | List all users         | Admin  |

Full API reference → [docs/api.md](docs/api.md)

## User Roles

| Role           | Capabilities                            |
| -------------- | --------------------------------------- |
| **superadmin** | Manage admins, full system access       |
| **admin**      | Manage cars, view rentals, manage users |
| **user**       | Register, login, search and rent cars   |

See [docs/roles.md](docs/roles.md) for detailed permissions.

## Documentation

| Document                                   | Description                                        |
| ------------------------------------------ | -------------------------------------------------- |
| [Getting Started](docs/getting-started.md) | Installation, configuration, and first run         |
| [API Reference](docs/api.md)               | All endpoints with request/response examples       |
| [User Roles & Permissions](docs/roles.md)  | Role hierarchy and access control matrix           |
| [Geolocation Guide](docs/geolocation.md)   | PostGIS setup and radius search usage              |
| [Architecture](docs/architecture.md)       | Modular monolith structure and module dependencies |
| [Deployment](docs/deployment.md)           | Docker setup and production deployment             |

## Project Structure

```
├── backend/        # NestJS API (auth, cars, rentals, users modules)
├── frontend/       # React + Vite SPA
├── docs/           # Detailed documentation
└── .ai-factory/    # AI agent context (DESCRIPTION.md, ARCHITECTURE.md)
```

## License

MIT
