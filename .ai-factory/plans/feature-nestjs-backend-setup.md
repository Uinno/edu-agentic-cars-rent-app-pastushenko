# Plan: NestJS Backend Setup — Auth, Cars & Rentals Modules

**Branch:** `feature/nestjs-backend-setup`
**Created:** 2026-02-28
**Status:** In Progress

---

## Settings

| Setting | Value                                                                         |
| ------- | ----------------------------------------------------------------------------- |
| Testing | No                                                                            |
| Logging | Verbose (DEBUG-level throughout development)                                  |
| Docs    | Yes — update `docs/api.md` and `docs/getting-started.md` after implementation |

---

## Context

The NestJS backend was scaffolded with `@nestjs/cli` and contains only the default boilerplate:

- `src/main.ts` — basic `NestFactory.create` with port listen
- `src/app.module.ts` — empty root module (no imports)
- No TypeORM, no config module, no auth, no feature modules installed

**Target state:** A fully functional NestJS backend with:

- Infrastructure: `ConfigModule`, `TypeOrmModule` (PostGIS-enabled PostgreSQL), global `ValidationPipe`, global `LoggingInterceptor`, global exception filter
- 4 feature modules: `UsersModule`, `AuthModule`, `CarsModule`, `RentalsModule`
- Database migrations for all entities
- JWT authentication with refresh token rotation
- Role-based access control: `superadmin | admin | user`
- Geolocation radius search via PostGIS `ST_DWithin`

---

## Phases & Tasks

### Phase 1 — Infrastructure Setup

#### Task 1: Install all required backend dependencies

**Files:** `backend/package.json`, `backend/package-lock.json`

Install the following packages:

**Runtime dependencies:**

```
@nestjs/config             — ConfigModule for .env support
@nestjs/typeorm            — TypeORM integration
typeorm                    — ORM core
pg                         — PostgreSQL driver
@nestjs/passport           — Passport.js integration
@nestjs/jwt                — JWT module
passport                   — Passport core
passport-jwt               — Passport JWT strategy
bcrypt                     — Password hashing
class-validator            — DTO validation decorators
class-transformer          — DTO transformation
@nestjs/swagger            — OpenAPI/Swagger docs generation
swagger-ui-express         — Swagger UI
```

**Dev dependencies:**

```
@types/passport-jwt
@types/bcrypt
@types/pg
```

**Run:**

```bash
cd backend && npm install @nestjs/config @nestjs/typeorm typeorm pg @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt class-validator class-transformer @nestjs/swagger swagger-ui-express
npm install -D @types/passport-jwt @types/bcrypt @types/pg
```

**Logging:** None required for this task.

---

#### Task 2: Configure infrastructure — ConfigModule, TypeORM, global providers

**Files to create/modify:**

- `backend/src/config/database.config.ts` — TypeORM DataSource options factory
- `backend/src/common/filters/http-exception.filter.ts` — Global exception filter
- `backend/src/common/interceptors/logging.interceptor.ts` — Global logging interceptor
- `backend/src/common/decorators/current-user.decorator.ts` — `@CurrentUser()` decorator
- `backend/src/app.module.ts` — Wire ConfigModule + TypeOrmModule
- `backend/src/main.ts` — Enable ValidationPipe, Swagger, global filter

**`database.config.ts`** — exports `TypeOrmModuleOptions` using `ConfigService`:

- `type: 'postgres'`
- Read `DATABASE_URL` from env or individual `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `synchronize: false` (always)
- `migrationsRun: true`
- `migrations: ['dist/migrations/*.js']`
- `entities: ['dist/**/*.entity.js']`
- Log slow queries (>1000ms) at WARN level

**`logging.interceptor.ts`** — implements `NestInterceptor`:

- On every request: `DEBUG` log `[Req] METHOD /path` (include `req.user?.id` if authenticated)
- On success response: `DEBUG` log `[Res] STATUS METHOD /path durationMs`
- On error: `ERROR` log `[Err] STATUS METHOD /path durationMs message`

**`http-exception.filter.ts`** — implements `ExceptionFilter`:

- Catch `HttpException` and unknown errors
- Return structured JSON: `{ statusCode, message, path, timestamp }`
- `WARN` log for 4xx errors, `ERROR` log for 5xx errors

**`main.ts`** updates:

- Enable global `ValidationPipe` with `{ whitelist: true, transform: true, forbidNonWhitelisted: true }`
- Set global prefix `/api`
- Setup Swagger at `/api/docs` (title: "Car Rental API", version: "1.0")
- Apply global `HttpExceptionFilter`
- `DEBUG` log: `[Bootstrap] Application started on port PORT`

**`app.module.ts`** updates:

- Import `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })`
- Import `TypeOrmModule.forRootAsync({ useFactory: databaseConfig, inject: [ConfigService] })`
- Import `EventEmitterModule.forRoot()` (install `@nestjs/event-emitter` in Task 1)
- Remove boilerplate `AppController` and `AppService`

**Logging requirements:**

- `DEBUG` on app start with port
- `WARN` on slow DB queries
- `WARN`/`ERROR` in exception filter per 4xx/5xx

---

#### Task 3: Create database migrations

**Files to create:**

- `backend/migrations/1740000001-EnablePostgis.ts`
- `backend/migrations/1740000002-CreateUsers.ts`
- `backend/migrations/1740000003-CreateCars.ts`
- `backend/migrations/1740000004-CreateRentals.ts`

Also create `backend/data-source.ts` — TypeORM CLI DataSource for running migrations manually.

**Migration: EnablePostgis**

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Migration: CreateUsers**

```sql
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'user');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  refresh_token VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
```

**Migration: CreateCars**

```sql
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  price_per_day DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  image_url VARCHAR(500),
  location GEOGRAPHY(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cars_location ON cars USING GIST (location);
CREATE INDEX idx_cars_available ON cars (is_available);
```

**Migration: CreateRentals**

```sql
CREATE TYPE rental_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  car_id UUID NOT NULL REFERENCES cars(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  status rental_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rentals_user ON rentals (user_id);
CREATE INDEX idx_rentals_car ON rentals (car_id);
CREATE INDEX idx_rentals_status ON rentals (status);
CREATE INDEX idx_rentals_dates ON rentals (start_date, end_date);
```

**data-source.ts** — exports `AppDataSource` using `dotenv` to load vars:

```typescript
import "dotenv/config";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: ["src/**/*.entity.ts"],
  migrations: ["migrations/*.ts"],
  synchronize: false,
});
```

Add to `package.json` scripts:

```json
"migration:generate": "typeorm-ts-node-commonjs migration:generate -d data-source.ts",
"migration:run": "typeorm-ts-node-commonjs migration:run -d data-source.ts",
"migration:revert": "typeorm-ts-node-commonjs migration:revert -d data-source.ts"
```

**Logging:** None required — migrations are run at startup, TypeORM logs internally.

---

### 🔖 Commit Checkpoint 1 (after Task 3)

```
feat(backend): setup infrastructure, TypeORM config and DB migrations

- Install all dependencies (typeorm, passport-jwt, bcrypt, swagger, etc.)
- Configure ConfigModule, TypeOrmModule with PostGIS-enabled PostgreSQL
- Add global ValidationPipe, LoggingInterceptor, HttpExceptionFilter
- Setup Swagger at /api/docs
- Add migrations: EnablePostgis, CreateUsers, CreateCars, CreateRentals
- Add TypeORM CLI data-source.ts
```

---

### Phase 2 — Users Module

#### Task 4: Implement UsersModule

**Files to create:**

- `backend/src/users/entities/user.entity.ts`
- `backend/src/users/dto/create-user.dto.ts`
- `backend/src/users/dto/update-user.dto.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/users.controller.ts`
- `backend/src/users/users.module.ts`

**`user.entity.ts`:**

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ unique: true }) email: string;
  @Column() password: string; // hashed with bcrypt
  @Column({ name: "first_name" }) firstName: string;
  @Column({ name: "last_name" }) lastName: string;
  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;
  @Column({ name: "refresh_token", nullable: true }) refreshToken:
    | string
    | null;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt: Date;
  @DeleteDateColumn({ name: "deleted_at" }) deletedAt: Date | null;
}
export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  USER = "user",
}
```

**`users.service.ts`** methods:

- `findAll(): Promise<User[]>` — find all non-deleted users; `DEBUG` log `[UsersService] findAll - found N users`
- `findById(id: string): Promise<User | null>` — find by UUID; `DEBUG` log result
- `findByEmail(email: string): Promise<User | null>` — used by AuthService; `DEBUG` log `[UsersService] findByEmail email=<email>`
- `create(dto): Promise<User>` — save new user (password pre-hashed by caller); `INFO` log `[UsersService] user created id=<id> role=<role>`
- `updateRefreshToken(id, hashedToken | null)` — hashed refresh token storage; `DEBUG` log
- `softDelete(id: string): Promise<void>` — call `repository.softDelete(id)`; `INFO` log `[UsersService] user soft-deleted id=<id>`
- `restore(id: string): Promise<void>` — `repository.restore(id)`; `INFO` log

**`users.controller.ts`** — `@Controller('users')`:

- `GET /users` — `@Roles([admin, superadmin])` — list all users
- `GET /users/:id` — `@Roles([admin, superadmin])` — get user by id
- `DELETE /users/:id` — `@Roles([admin, superadmin])` — soft delete user

**`users.module.ts`** — exports `UsersService` for `AuthModule`.

**Logging requirements:**

- `DEBUG` on every service method call with input params
- `INFO` on create, soft-delete, restore
- `WARN` if user not found when expected (e.g., soft delete on non-existent id)

---

### Phase 3 — Auth Module

#### Task 5: Implement AuthModule with JWT + RBAC

**Files to create:**

- `backend/src/auth/entities/` (no entity — refresh token stored on User)
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/auth/dto/tokens.dto.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/strategies/jwt-refresh.strategy.ts`
- `backend/src/auth/guards/jwt-auth.guard.ts`
- `backend/src/auth/guards/roles.guard.ts`
- `backend/src/auth/decorators/roles.decorator.ts`
- `backend/src/auth/decorators/public.decorator.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.module.ts`

**`register.dto.ts`:** `email` (IsEmail), `password` (MinLength 8), `firstName` (IsString), `lastName` (IsString)

**`login.dto.ts`:** `email`, `password`

**`jwt.strategy.ts`** — validates `Authorization: Bearer <accessToken>`:

- Secret: `JWT_SECRET` from `ConfigService`
- Payload: `{ sub: userId, email, role }`
- `validate()`: returns `{ id, email, role }` → set as `req.user`

**`jwt-refresh.strategy.ts`** — validates refresh token from `Authorization: Bearer <refreshToken>`:

- Secret: `JWT_REFRESH_SECRET` from `ConfigService`
- In `validate()`: compare `bcrypt.compare(rawToken, user.refreshToken)` → throw `UnauthorizedException` if mismatch

**`roles.guard.ts`** — reads `Roles` metadata, compares against `req.user.role`; throw `ForbiddenException` with `WARN` log

**`public.decorator.ts`** — `@Public()` sets metadata to skip `JwtAuthGuard`

**`auth.service.ts`** methods:

- `register(dto)`: hash password with `bcrypt.hash(password, 10)`; call `usersService.create()`; generate tokens; store hashed refresh token; `INFO` log `[AuthService] register email=<email>`
- `login(dto)`: `findByEmail`; `bcrypt.compare`; throw `UnauthorizedException` if invalid; generate tokens; `INFO` log `[AuthService] login userId=<id>`
- `refresh(userId, rawRefreshToken)`: verify stored hashed token; re-issue access + refresh tokens; `DEBUG` log
- `logout(userId)`: `updateRefreshToken(userId, null)`; `INFO` log `[AuthService] logout userId=<id>`
- `generateTokens(userId, email, role)`: returns `{ accessToken, refreshToken }`
  - `accessToken`: expires `JWT_ACCESS_EXPIRES` (default `'15m'`)
  - `refreshToken`: expires `JWT_REFRESH_EXPIRES` (default `'7d'`)

**`auth.controller.ts`** — `@Controller('auth')`, mark all routes `@Public()`:

- `POST /auth/register` → 201 with tokens
- `POST /auth/login` → 200 with tokens
- `POST /auth/refresh` → `@UseGuards(JwtRefreshGuard)` → new tokens
- `POST /auth/logout` → `@UseGuards(JwtAuthGuard)` → 200 `{ message: 'Logged out' }`

**`app.module.ts`** — register `JwtAuthGuard` as global guard with `APP_GUARD`.

**Logging requirements:**

- `INFO` on register, login, logout
- `WARN` on failed login attempts (wrong password)
- `WARN` when `RolesGuard` blocks access (include `userId`, `role`, `required roles`)
- `DEBUG` on token generation (no token values in logs, only userId)

---

### 🔖 Commit Checkpoint 2 (after Task 5)

```
feat(backend): add UsersModule and AuthModule with JWT + RBAC

- UsersModule: User entity, CRUD service, admin controller, soft delete
- AuthModule: JWT access/refresh tokens, bcrypt hashing, refresh rotation
- JwtStrategy and JwtRefreshStrategy (passport)
- RolesGuard + @Roles decorator + @Public decorator
- Global JwtAuthGuard registered as APP_GUARD
```

---

### Phase 4 — Cars Module

#### Task 6: Implement CarsModule with PostGIS geolocation

**Files to create:**

- `backend/src/cars/entities/car.entity.ts`
- `backend/src/cars/dto/create-car.dto.ts`
- `backend/src/cars/dto/update-car.dto.ts`
- `backend/src/cars/dto/find-nearby.dto.ts`
- `backend/src/cars/cars.service.ts`
- `backend/src/cars/cars.controller.ts`
- `backend/src/cars/cars.module.ts`

**`car.entity.ts`:**

```typescript
@Entity("cars")
export class Car {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() brand: string;
  @Column() model: string;
  @Column() year: number;
  @Column({ name: "price_per_day", type: "decimal", precision: 10, scale: 2 })
  pricePerDay: number;
  @Column({ name: "is_available", default: true }) isAvailable: boolean;
  @Column({ nullable: true }) description: string;
  @Column({ name: "image_url", nullable: true }) imageUrl: string;
  // PostGIS geography column — stored as WKT internally, accessed via raw query
  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  location: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt: Date;
}
```

**`find-nearby.dto.ts`:** `latitude` (IsNumber, -90..90), `longitude` (IsNumber, -180..180), `radius` (IsIn([5, 10, 15]) in km)

**`create-car.dto.ts`:** `brand`, `model`, `year`, `pricePerDay`, `description?`, `imageUrl?`, `latitude?`, `longitude?`

**`cars.service.ts`** methods:

- `create(dto, adminId)`: build Car entity; if lat/lng provided, call `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` via raw query or TypeORM `geometry`; save; `INFO` log `[CarsService] car created id=<id> by admin=<adminId>`
- `findAll()`: return all cars; `DEBUG` log count
- `findAvailable()`: `where: { isAvailable: true }`; `DEBUG` log count
- `findNearby(dto: FindNearbyDto)`: raw TypeORM query using `ST_DWithin`:
  ```sql
  SELECT *, ST_Distance(location::geography, ST_MakePoint(:lng, :lat)::geography) AS distance_meters
  FROM cars
  WHERE is_available = true
    AND ST_DWithin(location::geography, ST_MakePoint(:lng, :lat)::geography, :radiusMeters)
  ORDER BY distance_meters ASC
  ```
  Convert `dto.radius` (km) to meters (×1000); `DEBUG` log `[CarsService] findNearby lat=X lng=Y radius=Xkm found N cars`
- `findOne(id)`: find by UUID; throw `NotFoundException` if not found
- `update(id, dto)`: partial update; `INFO` log `[CarsService] car updated id=<id>`
- `remove(id)`: hard delete; `INFO` log `[CarsService] car deleted id=<id>`
- `setAvailability(id, available)`: `DEBUG` log

**`cars.controller.ts`** — `@Controller('cars')`:

- `POST /cars` — `@Roles([admin, superadmin])` — create car
- `GET /cars` — all authenticated — get all cars
- `GET /cars/available` — all authenticated — available cars
- `GET /cars/nearby` — all authenticated — `@Query() dto: FindNearbyDto`
- `GET /cars/:id` — all authenticated
- `PATCH /cars/:id` — `@Roles([admin, superadmin])`
- `DELETE /cars/:id` — `@Roles([admin, superadmin])`

**Logging requirements:**

- `INFO` on create, update, delete
- `DEBUG` on every read with result count
- `DEBUG` on `findNearby` with input params and result count
- `WARN` on not found (before throwing NotFoundException)

---

### Phase 5 — Rentals Module

#### Task 7: Implement RentalsModule with booking logic

**Files to create:**

- `backend/src/rentals/entities/rental.entity.ts`
- `backend/src/rentals/dto/create-rental.dto.ts`
- `backend/src/rentals/dto/update-rental.dto.ts`
- `backend/src/rentals/rentals.service.ts`
- `backend/src/rentals/rentals.controller.ts`
- `backend/src/rentals/rentals.module.ts`

**`rental.entity.ts`:**

```typescript
export enum RentalStatus {
  PENDING = "pending",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("rentals")
export class Rental {
  @PrimaryGeneratedColumn("uuid") id: string;
  @ManyToOne(() => User) @JoinColumn({ name: "user_id" }) user: User;
  @Column({ name: "user_id" }) userId: string;
  @ManyToOne(() => Car) @JoinColumn({ name: "car_id" }) car: Car;
  @Column({ name: "car_id" }) carId: string;
  @Column({ name: "start_date", type: "date" }) startDate: string;
  @Column({ name: "end_date", type: "date" }) endDate: string;
  @Column({ name: "daily_rate", type: "decimal", precision: 10, scale: 2 })
  dailyRate: number;
  @Column({ name: "total_cost", type: "decimal", precision: 10, scale: 2 })
  totalCost: number;
  @Column({ type: "enum", enum: RentalStatus, default: RentalStatus.PENDING })
  status: RentalStatus;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt: Date;
}
```

**`create-rental.dto.ts`:** `carId` (IsUUID), `startDate` (IsDateString), `endDate` (IsDateString)

**`rentals.service.ts`** methods:

- `create(userId, dto)`:
  1. `DEBUG` log `[RentalsService] createRental userId=<id> carId=<id> start=<date> end=<date>`
  2. Fetch car via `carsService.findOne(carId)` — throw `NotFoundException` if missing
  3. Check `car.isAvailable` — throw `BadRequestException` if false
  4. Check date overlap — query for conflicting rentals:
     ```typescript
     // Conflict: existing [s,e] overlaps with new [start,end]
     // when NOT (e < start OR s > end)
     WHERE car_id = :carId
       AND status IN ('pending', 'active')
       AND NOT (end_date < :start OR start_date > :end)
     ```
  5. If conflict found → throw `ConflictException('Car already booked for selected dates')`
  6. Calculate `totalCost = dailyRate × days`
  7. Set `car.isAvailable = false` via `carsService.setAvailability(carId, false)`
  8. Save rental; `INFO` log `[RentalsService] rental created id=<id>`
- `findByUser(userId)`: user's rentals with car relation; `DEBUG` log count
- `findAll()`: all rentals with user+car relations (admin); `DEBUG` log count
- `findActive()`: `where: { status: In([PENDING, ACTIVE]) }` with user+car; used by admin dashboard
- `complete(id, adminId)`: set status → `COMPLETED`, set `car.isAvailable = true`; `INFO` log
- `cancel(id, requesterId, requesterRole)`:
  - User can cancel own pending rental; admin can cancel any
  - If user tries to cancel non-own rental → `ForbiddenException`, `WARN` log
  - If status is not `pending` → `BadRequestException`
  - Set `car.isAvailable = true`; `INFO` log

**`rentals.controller.ts`** — `@Controller('rentals')`:

- `POST /rentals` — all authenticated users — create rental
- `GET /rentals` — `@Roles([admin, superadmin])` — all rentals
- `GET /rentals/active` — `@Roles([admin, superadmin])` — active rentals with user/car details
- `GET /rentals/my` — all authenticated — current user's rentals
- `PATCH /rentals/:id/complete` — `@Roles([admin, superadmin])`
- `PATCH /rentals/:id/cancel` — all authenticated (service enforces ownership)

**`rentals.module.ts`** — imports `CarsModule` and `UsersModule`.

**Logging requirements:**

- `DEBUG` on every service method entry with key params
- `INFO` on rental create, complete, cancel
- `WARN` on availability conflict (before throwing)
- `WARN` on forbidden cancel attempt (non-owner)
- `WARN` on date overlap found

---

#### Task 8: Wire all modules into AppModule + final configuration

**Files to modify:**

- `backend/src/app.module.ts` — import all feature modules
- `backend/src/main.ts` — finalize bootstrap

**`app.module.ts`** final shape:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    UsersModule,
    AuthModule,
    CarsModule,
    RentalsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
```

**`main.ts`** final shape:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ["debug", "log", "warn", "error"],
});
app.setGlobalPrefix("api");
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
);

// Swagger
const config = new DocumentBuilder()
  .setTitle("Car Rental API")
  .setVersion("1.0")
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api/docs", app, document);

await app.listen(configService.get("PORT") ?? 3000);
```

Also create `backend/.env.example` with all required environment variables documented:

```
DATABASE_URL=postgresql://user:password@localhost:5432/car_rental
JWT_SECRET=change-me-32-chars-minimum
JWT_REFRESH_SECRET=change-me-32-chars-minimum
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
PORT=3000
LOG_LEVEL=debug
```

**Logging:** `INFO` log on bootstrap with port + environment.

---

### 🔖 Commit Checkpoint 3 (after Task 8 — Final)

```
feat(backend): add CarsModule, RentalsModule, wire AppModule

- CarsModule: Car entity with PostGIS geography(Point,4326), CRUD + ST_DWithin radius search
- RentalsModule: Rental entity, booking with overlap detection, status management
- AppModule: all modules wired, global guards/interceptors/filters registered
- main.ts: global prefix /api, ValidationPipe, Swagger at /api/docs
- .env.example with all required environment variables
```

---

## Post-Implementation Tasks

#### Task 9: Update documentation

**Files to update:**

- `docs/api.md` — verify/update all endpoint descriptions, request/response shapes, authentication requirements
- `docs/getting-started.md` — update backend setup steps: install deps, run migrations, start dev server

**Scope:** Review generated endpoint list against `docs/api.md` table and correct any discrepancies. Add Swagger docs URL to getting-started.

---

## Commit Plan Summary

| Checkpoint | After Task | Commit Message                                                          |
| ---------- | ---------- | ----------------------------------------------------------------------- |
| 1          | Task 3     | `feat(backend): setup infrastructure, TypeORM config and DB migrations` |
| 2          | Task 5     | `feat(backend): add UsersModule and AuthModule with JWT + RBAC`         |
| 3          | Task 8     | `feat(backend): add CarsModule, RentalsModule, wire AppModule`          |
| Final      | Task 9     | `docs: update api.md and getting-started.md for backend implementation` |

---

## Dependencies Between Tasks

```
Task 1 (deps) → Task 2 (infra) → Task 3 (migrations)
Task 3 → Task 4 (users)
Task 4 → Task 5 (auth, needs UsersService)
Task 5 → Task 6 (cars, needs JwtAuthGuard/RolesGuard)
Task 6 → Task 7 (rentals, needs CarsService)
Task 7 → Task 8 (wire everything)
Task 8 → Task 9 (docs)
```

All tasks must be executed sequentially in the order above.
