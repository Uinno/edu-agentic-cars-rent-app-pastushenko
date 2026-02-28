# Architecture: Modular Monolith

## Overview

This project follows a **Modular Monolith** architecture leveraging NestJS's native module system. Each feature (users, cars, rentals, auth) is organized as a self-contained module with clear boundaries and minimal coupling. This approach provides the benefits of separation of concerns and testability while maintaining a single deployable unit for simplified operations.

This architecture was chosen because:

- The project has well-defined domains (authentication, cars, rentals, users) but doesn't require separate deployment
- NestJS's module system naturally supports modular architecture
- The team can iterate quickly without the overhead of microservices
- Migration to microservices is possible if needed in the future

## Decision Rationale

- **Project type:** Full-stack car rental platform with moderate complexity
- **Tech stack:** TypeScript, NestJS, React + Vite, PostgreSQL with PostGIS, TypeORM
- **Team size:** Small to medium (assumed)
- **Key factor:** Clear domain boundaries with shared infrastructure (database, authentication)
- **Scale:** Single-region deployment with moderate traffic expected

**Why not other patterns:**

- ❌ **Microservices:** Adds operational complexity without clear benefit for this scale
- ❌ **Clean Architecture:** Too rigid for this project's complexity level
- ❌ **Layered Architecture:** Modules provide better encapsulation than simple layers
- ❌ **DDD:** Domain complexity doesn't justify full DDD tactical patterns

## Folder Structure

### Backend (NestJS)

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module, imports all feature modules
│   │
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts         # Module definition, exports AuthService
│   │   ├── auth.controller.ts     # Login, register, refresh token endpoints
│   │   ├── auth.service.ts        # JWT generation, validation, token management
│   │   ├── strategies/            # Passport strategies
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/                # Authentication & authorization guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── dto/                   # Request/response DTOs
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── users/                     # Users module
│   │   ├── users.module.ts        # Exports UsersService for auth module
│   │   ├── users.controller.ts    # User management endpoints (admin only)
│   │   ├── users.service.ts       # User CRUD operations, soft delete
│   │   ├── entities/
│   │   │   └── user.entity.ts     # User entity with roles, soft delete
│   │   └── dto/
│   │       └── create-user.dto.ts
│   │
│   ├── cars/                      # Cars module
│   │   ├── cars.module.ts
│   │   ├── cars.controller.ts     # CRUD endpoints, geolocation search
│   │   ├── cars.service.ts        # Car management, PostGIS queries
│   │   ├── entities/
│   │   │   └── car.entity.ts      # Car entity with geolocation fields
│   │   └── dto/
│   │       ├── create-car.dto.ts
│   │       └── find-nearby.dto.ts
│   │
│   ├── rentals/                   # Rentals module
│   │   ├── rentals.module.ts      # Imports CarsModule and UsersModule
│   │   ├── rentals.controller.ts  # Rental endpoints
│   │   ├── rentals.service.ts     # Booking logic, availability checks
│   │   ├── entities/
│   │   │   └── rental.entity.ts   # Rental entity with relationships
│   │   └── dto/
│   │       ├── create-rental.dto.ts
│   │       └── update-rental.dto.ts
│   │
│   ├── common/                    # Shared utilities (not a module)
│   │   ├── filters/               # Global exception filters
│   │   ├── interceptors/          # Logging, response transformation
│   │   ├── decorators/            # Custom decorators (CurrentUser, etc.)
│   │   └── types/                 # Shared TypeScript types
│   │
│   └── config/                    # Configuration module
│       ├── config.module.ts       # ConfigModule setup
│       └── database.config.ts     # TypeORM configuration
│
├── migrations/                    # TypeORM migrations
│   ├── 1234567890-EnablePostgis.ts
│   ├── 1234567891-CreateUsers.ts
│   └── 1234567892-CreateCars.ts
│
├── test/                          # E2E tests
│   └── app.e2e-spec.ts
│
├── package.json
├── tsconfig.json
└── .env                           # Environment variables
```

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Root component with routing
│   │
│   ├── pages/                     # Page components (routes)
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx      # User dashboard
│   │   ├── CarsPage.tsx           # Available cars with map
│   │   ├── AdminCarsPage.tsx      # Admin car management
│   │   ├── AdminRentalsPage.tsx   # Admin rental dashboard
│   │   └── AdminUsersPage.tsx     # Admin user management
│   │
│   ├── components/                # Reusable components
│   │   ├── ui/                    # shadcn/ui primitives (auto-generated, committed)
│   │   │                          # Button, Card, Badge, Input, Label, Dialog,
│   │   │                          # Table, Alert, ToggleGroup, Separator, …
│   │   ├── auth/                  # Auth-related components
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── cars/                  # Car components
│   │   │   ├── CarCard.tsx
│   │   │   ├── CarList.tsx
│   │   │   ├── CarMap.tsx
│   │   │   └── RadiusFilter.tsx
│   │   ├── rentals/
│   │   │   ├── RentalCard.tsx
│   │   │   └── RentalsList.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── api/                       # API client
│   │   ├── client.ts              # Axios instance with interceptors
│   │   ├── auth.api.ts            # Auth endpoints
│   │   ├── cars.api.ts            # Cars endpoints
│   │   ├── rentals.api.ts         # Rentals endpoints
│   │   └── users.api.ts           # Users endpoints
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Auth context and state
│   │   ├── useCars.ts             # Cars data fetching
│   │   └── useGeolocation.ts      # Browser geolocation API
│   │
│   ├── contexts/                  # React contexts
│   │   └── AuthContext.tsx        # Auth state management
│   │
│   ├── types/                     # TypeScript types
│   │   ├── user.types.ts
│   │   ├── car.types.ts
│   │   └── rental.types.ts
│   │
│   ├── lib/                       # shadcn/ui utilities
│   │   └── utils.ts               # cn() helper (clsx + tailwind-merge)
│   │
│   └── utils/                     # Utility functions
│       ├── formatters.ts          # Date, currency formatters
│       └── validators.ts          # Form validation helpers
│
├── public/                        # Static assets
├── package.json
├── vite.config.ts
└── .env                           # Environment variables
```

## Dependency Rules

### Module Dependencies

Each feature module is self-contained but can import other modules when needed:

- ✅ **AuthModule → UsersModule** (to validate users during login)
- ✅ **RentalsModule → CarsModule, UsersModule** (to check availability and user details)
- ❌ **UsersModule → AuthModule** (users shouldn't depend on auth)
- ❌ **CarsModule → RentalsModule** (cars shouldn't know about rentals)
- ❌ **AuthModule → RentalsModule** (auth shouldn't know business domains)

### Layer Dependencies (within a module)

```
Controller → Service → Repository (TypeORM)
```

- ✅ **Controller imports Service** (business logic)
- ✅ **Service imports Repository** (data access)
- ✅ **Service imports other Services** (from other modules, if module is imported)
- ❌ **Service imports Controller** (never)
- ❌ **Repository imports Service** (never)

### Common/Shared Code

- ✅ **Any module → common/** (guards, filters, decorators, types)
- ❌ **common/ → feature modules** (never)

## Module Communication

### Direct Import (Preferred for Synchronous Operations)

When RentalsModule needs CarsModule:

```typescript
// rentals/rentals.module.ts
import { Module } from "@nestjs/common";
import { CarsModule } from "../cars/cars.module";
import { UsersModule } from "../users/users.module";
import { RentalsService } from "./rentals.service";
import { RentalsController } from "./rentals.controller";

@Module({
  imports: [
    CarsModule, // Import to use CarsService
    UsersModule, // Import to use UsersService
  ],
  providers: [RentalsService],
  controllers: [RentalsController],
})
export class RentalsModule {}
```

```typescript
// rentals/rentals.service.ts
import { Injectable } from "@nestjs/common";
import { CarsService } from "../cars/cars.service";

@Injectable()
export class RentalsService {
  constructor(
    private carsService: CarsService, // Injected from CarsModule
  ) {}

  async createRental(userId: string, carId: string) {
    // Use CarsService directly
    const car = await this.carsService.findOne(carId);
    // ...
  }
}
```

### Events (Preferred for Decoupling)

For actions that multiple modules care about:

```typescript
// common/events/rental.events.ts
export class RentalCreatedEvent {
  constructor(
    public readonly rentalId: string,
    public readonly carId: string,
    public readonly userId: string,
  ) {}
}
```

```typescript
// rentals/rentals.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RentalCreatedEvent } from '../common/events/rental.events';

@Injectable()
export class RentalsService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createRental(...) {
    const rental = await this.save(rental);

    // Emit event instead of calling other services directly
    this.eventEmitter.emit(
      'rental.created',
      new RentalCreatedEvent(rental.id, rental.carId, rental.userId),
    );

    return rental;
  }
}
```

```typescript
// cars/cars.service.ts - Listener
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class CarsService {
  @OnEvent("rental.created")
  async handleRentalCreated(event: RentalCreatedEvent) {
    // Update car availability without RentalsModule importing CarsModule
    await this.updateAvailability(event.carId, false);
  }
}
```

## Key Principles

### 1. Each Module Has a Single Responsibility

A module should represent one domain or technical capability:

- **UsersModule**: User management (CRUD, soft delete)
- **AuthModule**: Authentication only (JWT, tokens, guards)
- **CarsModule**: Car inventory (CRUD, geolocation)
- **RentalsModule**: Rental business logic (booking, availability)

Don't create "god modules" that handle multiple unrelated concerns.

### 2. Export Only What's Needed

```typescript
// users/users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Only export service, not repository or controller
})
export class UsersModule {}
```

### 3. Keep Module Coupling Low

- Prefer events over direct service calls when appropriate
- Use DTOs at module boundaries (don't expose entities directly)
- Avoid circular dependencies (use forwardRef() only as last resort)

### 4. Use Guards and Interceptors for Cross-Cutting Concerns

```typescript
// app.module.ts
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Applied globally
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // Applied globally
    },
  ],
})
export class AppModule {}
```

### 5. Database Migrations Over Synchronization

```typescript
// Never use in production
synchronize: false,

// Always use migrations
migrationsRun: true,
migrations: ['dist/migrations/*.js'],
```

## Code Examples

### Module Definition with Dependencies

```typescript
// rentals/rentals.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RentalsService } from "./rentals.service";
import { RentalsController } from "./rentals.controller";
import { Rental } from "./entities/rental.entity";
import { CarsModule } from "../cars/cars.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Rental]), // Register entity for this module
    CarsModule, // Import to use CarsService
    UsersModule, // Import to use UsersService
  ],
  providers: [RentalsService],
  controllers: [RentalsController],
  exports: [RentalsService], // Export if other modules need it
})
export class RentalsModule {}
```

### Service with Cross-Module Dependencies

```typescript
// rentals/rentals.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Rental } from "./entities/rental.entity";
import { CarsService } from "../cars/cars.service"; // External module
import { UsersService } from "../users/users.service"; // External module

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private rentalsRepository: Repository<Rental>,
    private carsService: CarsService, // Injected from CarsModule
    private usersService: UsersService, // Injected from UsersModule
  ) {}

  async createRental(
    userId: string,
    carId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Validate user exists (uses UsersService)
    const user = await this.usersService.findById(userId);
    if (!user || user.deletedAt) {
      throw new BadRequestException("User not found or deleted");
    }

    // Check car availability (uses CarsService)
    const car = await this.carsService.findOne(carId);
    if (!car || !car.isAvailable) {
      throw new BadRequestException("Car not available");
    }

    // Create rental (own responsibility)
    const rental = this.rentalsRepository.create({
      userId,
      carId,
      startDate,
      endDate,
      dailyRate: car.pricePerDay,
      totalCost: car.pricePerDay * this.calculateDays(startDate, endDate),
    });

    return this.rentalsRepository.save(rental);
  }

  private calculateDays(start: Date, end: Date): number {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

### Using Decorators for Authorization

```typescript
// cars/cars.controller.ts
import { Controller, Post, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard, Roles, UserRole } from "../auth/guards/roles.guard";

@Controller("cars")
@UseGuards(JwtAuthGuard, RolesGuard) // Apply to all routes in controller
export class CarsController {
  constructor(private carsService: CarsService) {}

  @Post()
  @Roles([UserRole.ADMIN, UserRole.SUPERADMIN]) // Only admins can create cars
  createCar(@Body() createCarDto: CreateCarDto) {
    return this.carsService.create(createCarDto);
  }

  @Get("available")
  @Roles([UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN]) // All authenticated users
  getAvailableCars() {
    return this.carsService.findAvailable();
  }
}
```

## Anti-Patterns

### ❌ Circular Dependencies

```typescript
// BAD: RentalsModule imports CarsModule, CarsModule imports RentalsModule
// rentals/rentals.module.ts
@Module({
  imports: [CarsModule], // RentalsModule needs CarsService
})
export class RentalsModule {}

// cars/cars.module.ts
@Module({
  imports: [RentalsModule], // CarsModule needs RentalsService - CIRCULAR!
})
export class CarsModule {}

// SOLUTION 1: Use events
// SOLUTION 2: Extract shared logic to a new module
// SOLUTION 3: Use forwardRef() only as last resort
```

### ❌ Bypassing Module Boundaries

```typescript
// BAD: Directly accessing repository from another module
@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Car) // DON'T import repositories from other modules
    private carsRepository: Repository<Car>,
  ) {}
}

// GOOD: Use the service exported by the module
@Injectable()
export class RentalsService {
  constructor(
    private carsService: CarsService, // Use CarsService instead
  ) {}
}
```

### ❌ God Modules

```typescript
// BAD: One module that does everything
@Module({
  imports: [
    /* everything */
  ],
  providers: [
    UsersService,
    CarsService,
    RentalsService,
    AuthService,
    // ... 20 more services
  ],
})
export class AppModule {} // Don't put all business logic in AppModule

// GOOD: Separate feature modules
@Module({
  imports: [UsersModule, CarsModule, RentalsModule, AuthModule],
})
export class AppModule {} // AppModule only wires modules together
```

### ❌ Exposing Entities Directly

```typescript
// BAD: Return entity directly from controller
@Get(':id')
getCar(@Param('id') id: string): Promise<Car> {
  return this.carsService.findOne(id); // Exposes all entity fields
}

// GOOD: Use DTOs for responses
@Get(':id')
async getCar(@Param('id') id: string): Promise<CarResponseDto> {
  const car = await this.carsService.findOne(id);
  return plainToInstance(CarResponseDto, car); // Control what's exposed
}
```

### ❌ Business Logic in Controllers

```typescript
// BAD: Business logic leaks into controller
@Post()
async createRental(@Body() dto: CreateRentalDto) {
  const car = await this.carsService.findOne(dto.carId);
  if (!car.isAvailable) {
    throw new BadRequestException('Car not available');
  }
  const days = Math.ceil((dto.endDate.getTime() - dto.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const cost = car.pricePerDay * days;
  // ... more logic
}

// GOOD: Controllers are thin, delegate to services
@Post()
createRental(@Body() dto: CreateRentalDto) {
  return this.rentalsService.createRental(
    dto.userId,
    dto.carId,
    dto.startDate,
    dto.endDate,
  ); // All logic in service
}
```

---

## Module Dependency Graph

```
┌─────────────┐
│  AppModule  │  (Root module, imports all feature modules)
└──────┬──────┘
       │
       ├──────────────┬───────────────┬──────────────┐
       │              │               │              │
┌──────▼──────┐ ┌────▼─────┐  ┌──────▼──────┐ ┌────▼──────┐
│ AuthModule  │ │UsersModule│  │ CarsModule  │ │RentalsModule│
│(depends on  │ │(no deps)  │  │(no deps)    │ │(depends on │
│UsersModule) │ │           │  │             │ │Cars+Users) │
└─────────────┘ └───────────┘  └─────────────┘ └────────────┘
       │                                             │
       └─────────────────────────────────────────────┘
                        Common/
              (guards, filters, decorators)
```

**Key takeaway:** Dependency flow should be acyclic. UsersModule has no dependencies, AuthModule depends on Users, RentalsModule depends on Cars and Users. No circular dependencies.

---

## Testing Strategy

### Unit Tests

Test each service in isolation by mocking dependencies:

```typescript
// rentals/rentals.service.spec.ts
describe("RentalsService", () => {
  let service: RentalsService;
  let carsService: CarsService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        {
          provide: CarsService,
          useValue: { findOne: jest.fn() }, // Mock
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() }, // Mock
        },
        {
          provide: getRepositoryToken(Rental),
          useValue: mockRepository, // Mock
        },
      ],
    }).compile();

    service = module.get<RentalsService>(RentalsService);
    carsService = module.get<CarsService>(CarsService);
  });

  it("should create rental when car is available", async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test module interactions:

```typescript
// test/rentals.e2e-spec.ts
describe("Rentals (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Full app with all modules
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/rentals (POST) - creates rental", () => {
    return request(app.getHttpServer())
      .post("/rentals")
      .send({ carId: "...", startDate: "...", endDate: "..." })
      .expect(201);
  });
});
```

---

_This architecture document should be updated as the project evolves. Significant changes to module structure or dependencies should be reflected here._
