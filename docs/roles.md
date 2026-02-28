[← API Reference](api.md) · [Back to README](../README.md) · [Geolocation Guide →](geolocation.md)

# User Roles & Permissions

The platform uses a three-tier role hierarchy for access control.

## Role Hierarchy

```
superadmin
    └── admin
            └── user
```

Higher roles do NOT automatically inherit lower-role capabilities — each role has its own permissions scope defined by endpoint guards.

## Roles Overview

| Role         | Description                             | Created by        |
| ------------ | --------------------------------------- | ----------------- |
| `user`       | Regular platform user who can rent cars | Self-registration |
| `admin`      | Manages cars, rentals, and users        | Superadmin only   |
| `superadmin` | Full system access, manages admins      | One per system    |

## Permissions Matrix

| Action                    | user | admin | superadmin |
| ------------------------- | ---- | ----- | ---------- |
| Register / Login          | ✅   | ✅    | ✅         |
| View available cars       | ✅   | ✅    | ✅         |
| Search cars by radius     | ✅   | ✅    | ✅         |
| Rent a car                | ✅   | ✅    | ✅         |
| View own rentals          | ✅   | ✅    | ✅         |
| Cancel own rental         | ✅   | ✅    | ✅         |
| Add/edit/delete cars      | ❌   | ✅    | ✅         |
| View all active rentals   | ❌   | ✅    | ✅         |
| Complete rentals (return) | ❌   | ✅    | ✅         |
| View all registered users | ❌   | ✅    | ✅         |
| Soft-delete users         | ❌   | ✅    | ✅         |
| Create admin accounts     | ❌   | ❌    | ✅         |
| Delete admin accounts     | ❌   | ❌    | ✅         |

## How It Works

Roles are enforced via NestJS guard decorators on each endpoint:

```typescript
@Post()
@Roles([UserRole.ADMIN, UserRole.SUPERADMIN])  // Only admins
createCar() { ... }

@Get('nearby')
@Roles([UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN]) // All logged in users
findNearbyCars() { ... }
```

The JWT token payload contains the user's role. On each request, the `RolesGuard` checks the token role against the required roles for that endpoint.

## Soft-Deleted Users

When an admin soft-deletes a user:

- The `deletedAt` timestamp is set on the user record
- The user cannot log in (JWT validation checks `deletedAt`)
- Historical rental data linked to the user is preserved
- The action is reversible by clearing `deletedAt` directly in the database

## Superadmin Setup

Only one superadmin exists in the system. It's configured via the seed script or direct database insertion.

```bash
# From backend/
npm run seed:superadmin
```

## See Also

- [API Reference](api.md) — Role-specific endpoint documentation
- [Architecture](architecture.md) — Guard implementation details
- [Getting Started](getting-started.md) — Initial superadmin setup
