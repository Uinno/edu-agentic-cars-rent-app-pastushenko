---
name: postgis-geolocation
description: >-
  PostgreSQL PostGIS extension patterns for geospatial queries, radius filtering, and distance calculations. Use when implementing location-based search, finding nearby items within radius (5km, 10km, 15km), or working with latitude/longitude coordinates in PostgreSQL with TypeORM.
license: MIT
metadata:
  author: custom-generated
  version: "1.0.0"
  category: database
---

# PostGIS Geolocation for PostgreSQL

Comprehensive guide for implementing geospatial queries using PostgreSQL's PostGIS extension with TypeORM in NestJS applications.

## When to Use

- Finding cars/items within a radius (5km, 10km, 15km)
- Calculating distances between coordinates
- Storing and querying latitude/longitude data
- Building location-based search features
- Filtering results by geographic proximity

## Setup

### 1. Enable PostGIS Extension

```sql
-- Run this migration first
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. TypeORM Migration

```typescript
// migrations/XXXXXX-enable-postgis.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePostgis1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("CREATE EXTENSION IF NOT EXISTS postgis");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP EXTENSION IF EXISTS postgis");
  }
}
```

## Entity Definition

### Car Entity with Geolocation

```typescript
// src/cars/entities/car.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("cars")
export class Car {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column("decimal", { precision: 10, scale: 2 })
  pricePerDay: number;

  @Column({ default: true })
  isAvailable: boolean;

  // Store location as POINT geography type
  @Index({ spatial: true }) // Create spatial index for performance
  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326, // WGS 84 coordinate system
    nullable: true,
  })
  location: string; // Will be stored as geography(Point, 4326)

  // Optional: Store as separate columns for easier access
  @Column("decimal", { precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column("decimal", { precision: 11, scale: 8, nullable: true })
  longitude: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Core Queries

### 1. Find Cars Within Radius

```typescript
// src/cars/cars.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Car } from "./entities/car.entity";

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private carsRepository: Repository<Car>,
  ) {}

  /**
   * Find available cars within radius from a location
   * @param latitude User's latitude
   * @param longitude User's longitude
   * @param radiusKm Radius in kilometers (5, 10, or 15)
   */
  async findCarsWithinRadius(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Array<Car & { distance: number }>> {
    const radiusMeters = radiusKm * 1000;

    const query = this.carsRepository
      .createQueryBuilder("car")
      .select([
        "car.id",
        "car.brand",
        "car.model",
        "car.year",
        "car.pricePerDay",
        "car.latitude",
        "car.longitude",
      ])
      .addSelect(
        `ST_Distance(
          car.location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        ) / 1000`, // Convert meters to km
        "distance",
      )
      .where("car.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere(
        `ST_DWithin(
          car.location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
      )
      .orderBy("distance", "ASC")
      .setParameters({
        latitude,
        longitude,
        radius: radiusMeters,
      });

    const results = await query.getRawAndEntities();

    return results.entities.map((car, index) => ({
      ...car,
      distance: parseFloat(results.raw[index].distance),
    }));
  }
}
```

### 2. Create/Update Car with Location

```typescript
async createCar(createCarDto: CreateCarDto): Promise<Car> {
  const { latitude, longitude, ...carData } = createCarDto;

  const car = this.carsRepository.create({
    ...carData,
    latitude,
    longitude,
    // Convert lat/lng to PostGIS Point
    location: () => `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
  });

  return this.carsRepository.save(car);
}

async updateCarLocation(
  carId: string,
  latitude: number,
  longitude: number,
): Promise<Car> {
  await this.carsRepository
    .createQueryBuilder()
    .update(Car)
    .set({
      latitude,
      longitude,
      location: () => `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
    })
    .where('id = :carId', { carId })
    .execute();

  return this.carsRepository.findOne({ where: { id: carId } });
}
```

### 3. Calculate Distance Between Two Points

```typescript
async getDistanceBetweenCars(carId1: string, carId2: string): Promise<number> {
  const result = await this.carsRepository
    .createQueryBuilder('car1')
    .select(
      `ST_Distance(
        car1.location,
        (SELECT location FROM cars WHERE id = :carId2)
      ) / 1000`, // Meters to km
      'distance',
    )
    .where('car1.id = :carId1', { carId1 })
    .setParameter('carId2', carId2)
    .getRawOne();

  return parseFloat(result.distance);
}
```

## Controller Implementation

```typescript
// src/cars/cars.controller.ts
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CarsService } from "./cars.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

class FindNearbyDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsEnum([5, 10, 15])
  @Type(() => Number)
  radius: number; // Only 5, 10, or 15 km
}

@Controller("cars")
@UseGuards(JwtAuthGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get("nearby")
  async findNearbyCars(@Query() query: FindNearbyDto) {
    const { latitude, longitude, radius } = query;

    const cars = await this.carsService.findCarsWithinRadius(
      latitude,
      longitude,
      radius,
    );

    return {
      total: cars.length,
      radius: `${radius}km`,
      cars: cars.map((car) => ({
        ...car,
        distance: `${car.distance.toFixed(2)}km`,
      })),
    };
  }
}
```

## Performance Optimization

### 1. Create Spatial Index

```sql
-- In your migration
CREATE INDEX idx_cars_location ON cars USING GIST (location);
```

### 2. Index in TypeORM Entity

```typescript
@Index({ spatial: true })
@Column({
  type: 'geography',
  spatialFeatureType: 'Point',
  srid: 4326,
})
location: string;
```

### 3. Use ST_DWithin Instead of ST_Distance for Filtering

`ST_DWithin` uses the spatial index efficiently, while `ST_Distance` with WHERE clause may not.

```sql
-- EFFICIENT (uses index)
WHERE ST_DWithin(location, point, radius)

-- LESS EFFICIENT (may not use index)
WHERE ST_Distance(location, point) < radius
```

## Best Practices

### Coordinate System

- **Always use SRID 4326** (WGS 84) - standard for GPS coordinates
- **Latitude range**: -90 to 90
- **Longitude range**: -180 to 180

### Data Validation

```typescript
import { Min, Max } from "class-validator";

class LocationDto {
  @Min(-90)
  @Max(90)
  latitude: number;

  @Min(-180)
  @Max(180)
  longitude: number;
}
```

### Storage Format

- Use `geography` type for real-world distances (meters/km)
- Use `geometry` type for flat-plane calculations (faster, less accurate)

### Query Optimization

- Create spatial indexes on location columns
- Use `ST_DWithin` for radius filtering (index-optimized)
- Add `LIMIT` to large result sets
- Consider pagination for mobile apps

## Common Patterns

### Filter Available Cars by Multiple Criteria

```typescript
async searchCars(
  latitude: number,
  longitude: number,
  radiusKm: number,
  filters: {
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
  },
) {
  const query = this.carsRepository.createQueryBuilder('car');

  // Add distance calculation
  query.addSelect(
    `ST_Distance(
      car.location,
      ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
    ) / 1000`,
    'distance',
  );

  // Base filters
  query
    .where('car.isAvailable = :isAvailable', { isAvailable: true })
    .andWhere(
      `ST_DWithin(
        car.location,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
        :radius
      )`,
    );

  // Optional filters
  if (filters.minPrice) {
    query.andWhere('car.pricePerDay >= :minPrice', {
      minPrice: filters.minPrice,
    });
  }

  if (filters.maxPrice) {
    query.andWhere('car.pricePerDay <= :maxPrice', {
      maxPrice: filters.maxPrice,
    });
  }

  if (filters.brand) {
    query.andWhere('car.brand = :brand', { brand: filters.brand });
  }

  query
    .orderBy('distance', 'ASC')
    .setParameters({
      latitude,
      longitude,
      radius: radiusKm * 1000,
    });

  return query.getRawAndEntities();
}
```

## Troubleshooting

### Extension Not Available

```bash
# Install PostGIS on Ubuntu/Debian
sudo apt-get install postgresql-14-postgis-3

# Install on macOS
brew install postgis
```

### Spatial Index Not Used

- Ensure `SRID` is consistent (4326)
- Use `ST_DWithin` instead of `ST_Distance` in WHERE
- Check index exists: `\d+ cars` in psql

### Distance Calculation Issues

- geography type returns meters (divide by 1000 for km)
- geometry type uses units of the coordinate system
- Verify coordinates are (longitude, latitude) order in ST_MakePoint
