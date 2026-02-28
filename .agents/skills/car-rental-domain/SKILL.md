---
name: car-rental-domain
description: >-
  Car rental business logic patterns for booking, availability management, rental tracking, and conflict resolution. Use when implementing rental creation, checking car availability, managing active rentals, calculating rental periods, or handling rental workflows.
license: MIT
metadata:
  author: custom-generated
  version: "1.0.0"
  category: business-logic
---

# Car Rental Domain Patterns

Comprehensive guide for implementing car rental business logic, including booking workflows, availability checks, rental management, and conflict resolution.

## When to Use

- Creating rental bookings
- Checking car availability
- Managing active rentals
- Tracking which cars are rented by whom
- Calculating rental periods and costs
- Handling rental returns and cancellations

## Domain Models

### Rental Entity

```typescript
// src/rentals/entities/rental.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Car } from "../../cars/entities/car.entity";

export enum RentalStatus {
  PENDING = "pending", // Rental requested but not confirmed
  ACTIVE = "active", // Car is currently rented
  COMPLETED = "completed", // Rental finished, car returned
  CANCELLED = "cancelled", // Rental was cancelled
}

@Entity("rentals")
@Index(["carId", "status"]) // Optimize status-based queries
@Index(["userId", "status"])
export class Rental {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Car, { eager: true })
  @JoinColumn({ name: "carId" })
  car: Car;

  @Column()
  carId: string;

  @Column({
    type: "enum",
    enum: RentalStatus,
    default: RentalStatus.PENDING,
  })
  status: RentalStatus;

  @Column("timestamp")
  startDate: Date;

  @Column("timestamp", { nullable: true })
  endDate: Date; // Nullable for open-ended rentals

  @Column("timestamp", { nullable: true })
  returnedAt: Date; // Actual return time

  @Column("decimal", { precision: 10, scale: 2 })
  totalCost: number;

  @Column("decimal", { precision: 10, scale: 2 })
  dailyRate: number; // Store rate at time of rental

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Core Business Logic

### 1. Check Car Availability

```typescript
// src/rentals/rentals.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, In } from "typeorm";
import { Rental, RentalStatus } from "./entities/rental.entity";
import { Car } from "../cars/entities/car.entity";

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private rentalsRepository: Repository<Rental>,
    @InjectRepository(Car)
    private carsRepository: Repository<Car>,
  ) {}

  /**
   * Check if a car is available for the specified period
   */
  async isCarAvailable(
    carId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const conflictingRentals = await this.rentalsRepository
      .createQueryBuilder("rental")
      .where("rental.carId = :carId", { carId })
      .andWhere("rental.status IN (:...statuses)", {
        statuses: [RentalStatus.ACTIVE, RentalStatus.PENDING],
      })
      .andWhere(
        `(
          (rental.startDate <= :endDate AND rental.endDate >= :startDate) OR
          (rental.startDate <= :startDate AND rental.endDate >= :endDate) OR
          (rental.startDate >= :startDate AND rental.endDate <= :endDate)
        )`,
      )
      .setParameters({ startDate, endDate })
      .getCount();

    return conflictingRentals === 0;
  }

  /**
   * Get all cars available for a specific period
   */
  async getAvailableCars(startDate: Date, endDate?: Date): Promise<Car[]> {
    // Get IDs of cars that are currently rented
    const rentedCarIds = await this.rentalsRepository
      .createQueryBuilder("rental")
      .select("rental.carId")
      .where("rental.status = :status", { status: RentalStatus.ACTIVE })
      .andWhere(
        endDate
          ? `(rental.startDate <= :endDate AND (rental.endDate >= :startDate OR rental.endDate IS NULL))`
          : "rental.endDate IS NULL OR rental.endDate >= :startDate",
      )
      .setParameters({ startDate, endDate })
      .getRawMany();

    const rentedIds = rentedCarIds.map((r) => r.rental_carId);

    // Get all cars except rented ones
    const query = this.carsRepository
      .createQueryBuilder("car")
      .where("car.isAvailable = :isAvailable", { isAvailable: true });

    if (rentedIds.length > 0) {
      query.andWhere("car.id NOT IN (:...rentedIds)", { rentedIds });
    }

    return query.getMany();
  }
}
```

### 2. Create Rental Booking

```typescript
async createRental(
  userId: string,
  carId: string,
  startDate: Date,
  endDate: Date,
): Promise<Rental> {
  // Validation: Check dates
  const now = new Date();
  if (startDate < now) {
    throw new BadRequestException('Start date cannot be in the past');
  }

  if (endDate <= startDate) {
    throw new BadRequestException('End date must be after start date');
  }

  // Check if car exists and is available
  const car = await this.carsRepository.findOne({ where: { id: carId } });
  if (!car) {
    throw new NotFoundException('Car not found');
  }

  if (!car.isAvailable) {
    throw new BadRequestException('Car is not available for rental');
  }

  // Check for date conflicts
  const isAvailable = await this.isCarAvailable(carId, startDate, endDate);
  if (!isAvailable) {
    throw new BadRequestException(
      'Car is already booked for the selected period',
    );
  }

  // Calculate rental cost
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const totalCost = car.pricePerDay * days;

  // Create rental
  const rental = this.rentalsRepository.create({
    userId,
    carId,
    startDate,
    endDate,
    dailyRate: car.pricePerDay,
    totalCost,
    status: RentalStatus.ACTIVE,
  });

  return this.rentalsRepository.save(rental);
}
```

### 3. Admin Dashboard Queries

```typescript
/**
 * Get all active rentals (admin view)
 */
async getActiveRentals(): Promise<Rental[]> {
  return this.rentalsRepository.find({
    where: { status: RentalStatus.ACTIVE },
    relations: ['user', 'car'],
    order: { startDate: 'DESC' },
  });
}

/**
 * Get rentals by specific user
 */
async getUserRentals(userId: string): Promise<Rental[]> {
  return this.rentalsRepository.find({
    where: { userId },
    relations: ['car'],
    order: { createdAt: 'DESC' },
  });
}

/**
 * Get rental history for a specific car
 */
async getCarRentalHistory(carId: string): Promise<Rental[]> {
  return this.rentalsRepository.find({
    where: { carId },
    relations: ['user'],
    order: { startDate: 'DESC' },
  });
}

/**
 * Get currently rented cars with renter info
 */
async getCurrentlyRentedCars() {
  return this.rentalsRepository
    .createQueryBuilder('rental')
    .leftJoinAndSelect('rental.car', 'car')
    .leftJoinAndSelect('rental.user', 'user')
    .where('rental.status = :status', { status: RentalStatus.ACTIVE })
    .select([
      'rental.id',
      'rental.startDate',
      'rental.endDate',
      'rental.totalCost',
      'car.id',
      'car.brand',
      'car.model',
      'car.year',
      'user.id',
      'user.email',
    ])
    .getMany();
}
```

### 4. Complete Rental (Return Car)

```typescript
async completeRental(rentalId: string): Promise<Rental> {
  const rental = await this.rentalsRepository.findOne({
    where: { id: rentalId },
  });

  if (!rental) {
    throw new NotFoundException('Rental not found');
  }

  if (rental.status !== RentalStatus.ACTIVE) {
    throw new BadRequestException('Only active rentals can be completed');
  }

  // Mark as completed
  rental.status = RentalStatus.COMPLETED;
  rental.returnedAt = new Date();

  // Calculate additional charges if returned late
  if (rental.endDate && rental.returnedAt > rental.endDate) {
    const lateDays = Math.ceil(
      (rental.returnedAt.getTime() - rental.endDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const lateCharge = lateDays * rental.dailyRate * 1.5; // 1.5x rate for late returns
    rental.totalCost = rental.totalCost + lateCharge;
  }

  return this.rentalsRepository.save(rental);
}
```

### 5. Cancel Rental

```typescript
async cancelRental(rentalId: string, userId: string): Promise<Rental> {
  const rental = await this.rentalsRepository.findOne({
    where: { id: rentalId, userId },
  });

  if (!rental) {
    throw new NotFoundException('Rental not found');
  }

  if (rental.status === RentalStatus.COMPLETED) {
    throw new BadRequestException('Cannot cancel completed rental');
  }

  if (rental.status === RentalStatus.CANCELLED) {
    throw new BadRequestException('Rental is already cancelled');
  }

  // Apply cancellation policy
  const now = new Date();
  const hoursUntilStart =
    (rental.startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundPercentage = 1.0; // 100% refund

  if (hoursUntilStart < 24) {
    refundPercentage = 0; // No refund if cancelled within 24 hours
  } else if (hoursUntilStart < 72) {
    refundPercentage = 0.5; // 50% refund if cancelled within 72 hours
  }

  rental.status = RentalStatus.CANCELLED;
  rental.totalCost = rental.totalCost * refundPercentage;

  return this.rentalsRepository.save(rental);
}
```

## Controller Implementation

```typescript
// src/rentals/rentals.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RentalsService } from "./rentals.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard, Roles, UserRole } from "../auth/guards/roles.guard";

@Controller("rentals")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  // User can create a rental
  @Post()
  @Roles([UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN])
  async createRental(@Request() req, @Body() createRentalDto: CreateRentalDto) {
    return this.rentalsService.createRental(
      req.user.id,
      createRentalDto.carId,
      new Date(createRentalDto.startDate),
      new Date(createRentalDto.endDate),
    );
  }

  // Admin can see all active rentals
  @Get("active")
  @Roles([UserRole.ADMIN, UserRole.SUPERADMIN])
  async getActiveRentals() {
    return this.rentalsService.getActiveRentals();
  }

  // User can see their own rentals
  @Get("my-rentals")
  @Roles([UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN])
  async getMyRentals(@Request() req) {
    return this.rentalsService.getUserRentals(req.user.id);
  }

  // Admin can complete a rental (car returned)
  @Patch(":id/complete")
  @Roles([UserRole.ADMIN, UserRole.SUPERADMIN])
  async completeRental(@Param("id") id: string) {
    return this.rentalsService.completeRental(id);
  }

  // User can cancel their own rental
  @Patch(":id/cancel")
  @Roles([UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN])
  async cancelRental(@Request() req, @Param("id") id: string) {
    return this.rentalsService.cancelRental(id, req.user.id);
  }
}
```

## Best Practices

### Date Handling

- Store all dates in UTC
- Use TypeORM's `@Column('timestamp')` for timezone support
- Validate date ranges on both client and server
- Consider time zones for pickup/return times

### Availability Checking

- Always check availability before creating a rental
- Use database transactions to prevent race conditions
- Consider buffer time between rentals (cleaning, maintenance)

### Status Management

- Use enum for rental statuses (type-safe, clear states)
- Define clear state transitions (PENDING → ACTIVE → COMPLETED)
- Log status changes for audit trail

### Cost Calculation

- Store `dailyRate` at time of rental (price may change later)
- Calculate total upfront to avoid surprises
- Consider dynamic pricing (season, demand, car type)
- Implement late return penalties

### Performance

- Index `carId` and `status` columns together
- Use `eager: false` for large relations
- Paginate rental history queries
- Cache frequently accessed availability data

### Security

- Users can only see/cancel their own rentals
- Admins can see all rentals and complete them
- Validate user owns the rental before cancellation
- Soft delete instead of hard delete for audit trail

## Advanced Patterns

### Conflict Detection Algorithm

```typescript
function hasDateOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 <= end2 && end1 >= start2;
}
```

### Rental Extensions

```typescript
async extend Rental(
  rentalId: string,
  newEndDate: Date,
): Promise<Rental> {
  const rental = await this.rentalsRepository.findOne({
    where: { id: rentalId, status: RentalStatus.ACTIVE },
  });

  if (!rental) {
    throw new NotFoundException('Active rental not found');
  }

  // Check if car is available for extended period
  const isAvailable = await this.isCarAvailable(
    rental.carId,
    rental.endDate,
    newEndDate,
  );

  if (!isAvailable) {
    throw new BadRequestException(
      'Car is booked by someone else after your current end date',
    );
  }

  // Calculate additional cost
  const additionalDays = Math.ceil(
    (newEndDate.getTime() - rental.endDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  rental.totalCost += additionalDays * rental.dailyRate;
  rental.endDate = newEndDate;

  return this.rentalsRepository.save(rental);
}
```

### Rental Statistics

```typescript
async getRentalStatistics() {
  const stats = await this.rentalsRepository
    .createQueryBuilder('rental')
    .select('rental.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .addSelect('SUM(rental.totalCost)', 'revenue')
    .groupBy('rental.status')
    .getRawMany();

  return stats;
}
```
