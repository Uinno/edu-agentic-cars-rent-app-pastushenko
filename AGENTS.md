# AGENTS.md

> Project map for AI agents. Keep this file up-to-date as the project evolves.

## Project Overview

A full-stack car rental platform with geolocation-based search, role-based access control, and rental management. Users can find and rent cars within customizable radius, while admins manage inventory and monitor active rentals.

## Tech Stack

- **Language:** TypeScript/Node.js
- **Backend Framework:** NestJS
- **Frontend Framework:** React + Vite
- **Database:** PostgreSQL (with PostGIS)
- **ORM:** TypeORM
- **Authentication:** JWT with refresh tokens
- **Authorization:** Role-based (superadmin, admin, user)

## Project Structure

```
edu-agentic-cars-rent-app-pastushenko/
├── backend/                    # NestJS backend API
│   └── (to be implemented)    # Will contain:
│                               # - src/auth/      (JWT, guards, strategies)
│                               # - src/users/     (user management, soft delete)
│                               # - src/cars/      (car CRUD, geolocation)
│                               # - src/rentals/   (booking, availability)
│                               # - src/main.ts    (application entry point)
│                               # - prisma/ or migrations/ (database schema)
│
├── frontend/                   # React + Vite frontend
│   └── (to be implemented)    # Will contain:
│                               # - src/pages/     (Login, Register, Dashboard)
│                               # - src/components/ (CarCard, Map, Filters)
│                               # - src/api/       (API client, auth)
│                               # - src/main.tsx   (app entry point)
│
├── .ai-factory/               # AI Factory context
│   ├── DESCRIPTION.md         # Project specification and tech stack
│   └── ARCHITECTURE.md        # (to be generated) Architecture decisions
│
├── .agents/                   # Agent skills directory
│   └── skills/                # Custom and installed skills
│       ├── nestjs-best-practices/      # NestJS patterns (external)
│       ├── typeorm/                    # TypeORM guidelines (external)
│       ├── vercel-react-best-practices/ # React optimization (external)
│       ├── nestjs-jwt-auth-rbac/      # JWT + RBAC patterns (custom)
│       ├── postgis-geolocation/       # PostGIS queries (custom)
│       └── car-rental-domain/         # Rental logic (custom)
│
├── .github/                   # GitHub workflows and AI Factory built-in skills
│   └── skills/                # Built-in AI Factory skills
│       ├── aif/               # Project setup skill
│       ├── aif-architecture/  # Architecture generator
│       ├── aif-skill-generator/ # Skill creation tool
│       └── ...                # Other AI Factory utilities
│
├── .mcp.json                  # MCP server configuration (PostgreSQL, GitHub)
└── AGENTS.md                  # This file - project structure map
```

## Key Entry Points

| File                        | Purpose                                  | Status          |
| --------------------------- | ---------------------------------------- | --------------- |
| backend/src/main.ts         | Backend application entry point          | To be created   |
| frontend/src/main.tsx       | Frontend application entry point         | To be created   |
| .ai-factory/DESCRIPTION.md  | Project specification and tech decisions | ✅ Created      |
| .ai-factory/ARCHITECTURE.md | Architecture patterns and guidelines     | To be generated |
| .mcp.json                   | MCP servers (PostgreSQL, GitHub)         | ✅ Configured   |

## Documentation

| Document            | Path                        | Description                                                      |
| ------------------- | --------------------------- | ---------------------------------------------------------------- |
| README              | README.md                   | Project landing page with quick start                            |
| AGENTS.md           | AGENTS.md                   | This file — project structure map                                |
| Project Description | .ai-factory/DESCRIPTION.md  | Tech stack, features, requirements                               |
| Architecture Guide  | .ai-factory/ARCHITECTURE.md | Modular Monolith pattern, folder structure, and dependency rules |
| Project Roadmap     | .ai-factory/ROADMAP.md      | Strategic milestones and progress tracking                       |
| Getting Started     | docs/getting-started.md     | Installation, configuration, and first run                       |
| API Reference       | docs/api.md                 | All endpoints with request/response examples                     |
| User Roles          | docs/roles.md               | Role hierarchy and permissions matrix                            |
| Geolocation         | docs/geolocation.md         | PostGIS setup and radius search                                  |
| Architecture (doc)  | docs/architecture.md        | Module graph and design decisions summary                        |
| Deployment          | docs/deployment.md          | Docker setup and production deployment                           |

## AI Context Files

| File                        | Purpose                                                |
| --------------------------- | ------------------------------------------------------ |
| AGENTS.md                   | Project structure map for quick navigation             |
| .ai-factory/DESCRIPTION.md  | Comprehensive project specification                    |
| .ai-factory/ARCHITECTURE.md | Architecture decisions and patterns (Modular Monolith) |
| .mcp.json                   | MCP server configuration for enhanced capabilities     |

## Development Workflow

### For New Features

1. **Plan**: Use `/aif-plan <feature description>` to create implementation plan
2. **Implement**: Use `/aif-implement` to execute the plan
3. **Review**: Use `/aif-review` to review changes before commit

### For Bug Fixes

1. **Diagnose**: Use `/aif-fix <bug description>` to analyze and fix
2. **Test**: Verify the fix works as expected
3. **Review**: Check for side effects

### For Architecture Questions

- Consult `.ai-factory/ARCHITECTURE.md` for project architecture guidelines
- Refer to installed skills for framework-specific best practices

## Key Features to Implement

### Authentication & Authorization

- User registration and login (JWT)
- Role-based access control (superadmin, admin, user)
- Refresh token rotation
- Soft delete for users

### Car Management

- CRUD operations for cars (admin only)
- Car availability status
- Geolocation data (PostGIS Point)
- Car details (brand, model, year, price)

### Geolocation Search

- Radius filtering (5km, 10km, 15km)
- Distance calculation from user location
- Spatial indexing for performance
- PostGIS ST_DWithin queries

### Rental System

- Create rental bookings
- Check car availability
- View active rentals (admin)
- View rental history (user & admin)
- Rental status tracking (pending, active, completed, cancelled)
- Conflict detection

### Admin Dashboard

- View all registered users
- View active rentals with renter details
- Manage car inventory
- User management (soft delete)

## Environment Variables

### Backend

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/car_rental
JWT_SECRET=<32-char-random-string>
JWT_REFRESH_SECRET=<32-char-random-string>
PORT=3000
LOG_LEVEL=info
```

### Frontend

```bash
VITE_API_URL=http://localhost:3000
```

### MCP Servers

```bash
GITHUB_TOKEN=<your-github-token>
DATABASE_URL=<same-as-backend>
```

## Next Steps

1. **Generate Architecture**: Run `/aif-architecture` to create architecture guidelines
2. **Plan Backend Structure**: Use `/aif-plan "setup NestJS backend structure with modules"`
3. **Plan Frontend Setup**: Use `/aif-plan "setup React + Vite frontend with routing"`
4. **Implement Features**: Follow the planning workflow above

---

_This file is maintained by AI agents during project development. Update it when project structure changes significantly._
