import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';

export interface CarWithDistance extends Car {
  distance_meters: number;
}

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  constructor(
    @InjectRepository(Car)
    private readonly carsRepository: Repository<Car>,
  ) {}

  async create(dto: CreateCarDto, adminId: string): Promise<Car> {
    this.logger.debug(`[CarsService] create brand=${dto.brand} model=${dto.model} adminId=${adminId}`);

    const car = this.carsRepository.create({
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      pricePerDay: dto.pricePerDay,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      isAvailable: dto.isAvailable ?? true,
    });

    const saved = await this.carsRepository.save(car);

    // Set location via raw query if coordinates provided
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      await this.carsRepository.query(
        `UPDATE cars SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        [dto.longitude, dto.latitude, saved.id],
      );
      this.logger.debug(
        `[CarsService] location set lat=${dto.latitude} lng=${dto.longitude} carId=${saved.id}`,
      );
    }

    this.logger.log(`[CarsService] car created id=${saved.id} by adminId=${adminId}`);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<Car[]> {
    this.logger.debug('[CarsService] findAll');
    const cars = await this.carsRepository.find();
    this.logger.debug(`[CarsService] findAll - found ${cars.length} cars`);
    return cars;
  }

  async findAvailable(): Promise<Car[]> {
    this.logger.debug('[CarsService] findAvailable');
    const cars = await this.carsRepository.find({ where: { isAvailable: true } });
    this.logger.debug(`[CarsService] findAvailable - found ${cars.length} cars`);
    return cars;
  }

  async findNearby(dto: FindNearbyDto): Promise<CarWithDistance[]> {
    const radiusMeters = dto.radius * 1000;
    this.logger.debug(
      `[CarsService] findNearby lat=${dto.latitude} lng=${dto.longitude} radius=${dto.radius}km (${radiusMeters}m)`,
    );

    const results = await this.carsRepository.query<CarWithDistance[]>(
      `
      SELECT
        c.*,
        ST_Distance(
          c.location::geography,
          ST_MakePoint($2, $1)::geography
        ) AS distance_meters
      FROM cars c
      WHERE c.is_available = true
        AND c.location IS NOT NULL
        AND ST_DWithin(
          c.location::geography,
          ST_MakePoint($2, $1)::geography,
          $3
        )
      ORDER BY distance_meters ASC
      `,
      [dto.latitude, dto.longitude, radiusMeters],
    );

    this.logger.debug(
      `[CarsService] findNearby - found ${results.length} cars within ${dto.radius}km`,
    );
    return results;
  }

  async findOne(id: string): Promise<Car> {
    this.logger.debug(`[CarsService] findOne id=${id}`);
    const car = await this.carsRepository.findOne({ where: { id } });
    if (!car) {
      this.logger.warn(`[CarsService] findOne - car not found id=${id}`);
      throw new NotFoundException(`Car ${id} not found`);
    }
    return car;
  }

  async update(id: string, dto: UpdateCarDto, adminId: string): Promise<Car> {
    this.logger.debug(`[CarsService] update id=${id} adminId=${adminId}`);
    await this.findOne(id); // throws if not found

    const { latitude, longitude, ...rest } = dto;

    await this.carsRepository.update(id, rest);

    if (latitude !== undefined && longitude !== undefined) {
      await this.carsRepository.query(
        `UPDATE cars SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        [longitude, latitude, id],
      );
    }

    this.logger.log(`[CarsService] car updated id=${id} adminId=${adminId}`);
    return this.findOne(id);
  }

  async remove(id: string, adminId: string): Promise<void> {
    this.logger.debug(`[CarsService] remove id=${id} adminId=${adminId}`);
    await this.findOne(id); // throws if not found
    await this.carsRepository.delete(id);
    this.logger.log(`[CarsService] car deleted id=${id} adminId=${adminId}`);
  }

  async setAvailability(id: string, available: boolean): Promise<void> {
    this.logger.debug(`[CarsService] setAvailability id=${id} available=${available}`);
    await this.carsRepository.update(id, { isAvailable: available });
  }
}
