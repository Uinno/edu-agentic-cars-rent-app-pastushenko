[← Geolocation Guide](geolocation.md) · [Back to README](../README.md) · [Deployment →](deployment.md)

# Architecture

This project uses a **Modular Monolith** pattern built on NestJS's native module system.

> For the full architecture guidelines, see [.ai-factory/ARCHITECTURE.md](../.ai-factory/ARCHITECTURE.md).

## Pattern: Modular Monolith

Each domain is a self-contained NestJS module with clear public APIs. Modules communicate through exported services or events — never by directly accessing another module's repository.

## Module Structure

```
src/
├── auth/          # JWT auth, guards, Passport strategies
├── users/         # User CRUD, soft delete
├── cars/          # Car management, PostGIS queries
├── rentals/       # Booking, availability, conflict detection
├── common/        # Shared filters, interceptors, decorators
└── config/        # TypeORM and environment configuration
```

## Module Dependency Graph

```
AppModule
├── AuthModule   → imports UsersModule (validates users)
├── UsersModule  → no module dependencies
├── CarsModule   → no module dependencies
└── RentalsModule → imports CarsModule + UsersModule
```

- **UsersModule** — no dependencies (leaf module)
- **CarsModule** — no dependencies (leaf module)
- **AuthModule** — depends on `UsersModule`
- **RentalsModule** — depends on `CarsModule` and `UsersModule`

**No circular dependencies.**

## Request Flow

```
HTTP Request
    → NestJS Router
        → JwtAuthGuard (verify token)
            → RolesGuard (check role)
                → Controller (thin layer, no business logic)
                    → Service (business logic, validation)
                        → TypeORM Repository (database access)
```

## Key Design Decisions

| Decision      | Choice               | Reason                                         |
| ------------- | -------------------- | ---------------------------------------------- |
| Architecture  | Modular Monolith     | NestJS native, single deploy, clear boundaries |
| Auth          | JWT + refresh tokens | Stateless, scalable, secure rotation           |
| Geolocation   | PostGIS              | Best spatial query support in PostgreSQL       |
| Soft delete   | `deletedAt` column   | Preserve data for audit trail                  |
| DB migrations | TypeORM migrations   | Version-controlled schema changes              |

## Frontend Architecture

```
React + Vite SPA

src/
├── pages/        # Route-level components (one per page)
├── components/   # Reusable UI components by domain
├── api/          # Axios client + typed API functions
├── hooks/        # Custom React hooks (useAuth, useCars, etc.)
├── contexts/     # React Context (AuthContext)
└── types/        # Shared TypeScript types
```

## API-First Integration

The frontend communicates exclusively through the REST API. No direct database access from the frontend. JWT tokens are stored in memory (access token) and `httpOnly` cookies (refresh token) to prevent XSS.

## See Also

- [Full Architecture Guidelines](../.ai-factory/ARCHITECTURE.md)
- [API Reference](api.md)
- [Deployment](deployment.md)
