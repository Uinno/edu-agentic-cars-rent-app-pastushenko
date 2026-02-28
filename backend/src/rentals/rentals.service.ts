import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Rental, RentalStatus } from './entities/rental.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { CarsService } from '../cars/cars.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class RentalsService {
  private readonly logger = new Logger(RentalsService.name);

  constructor(
    @InjectRepository(Rental)
    private readonly rentalsRepository: Repository<Rental>,
    private readonly carsService: CarsService,
  ) {}

  async create(userId: string, dto: CreateRentalDto): Promise<Rental> {
    this.logger.debug(
      `[RentalsService] create userId=${userId} carId=${dto.carId} start=${dto.startDate} end=${dto.endDate}`,
    );

    // Validate dates
    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Fetch car
    const car = await this.carsService.findOne(dto.carId);

    // Check car availability flag
    if (!car.isAvailable) {
      this.logger.warn(
        `[RentalsService] car not available carId=${dto.carId}`,
      );
      throw new BadRequestException('Car is not available for renting');
    }

    // Check date overlap
    const conflicting = await this.rentalsRepository
      .createQueryBuilder('rental')
      .where('rental.car_id = :carId', { carId: dto.carId })
      .andWhere('rental.status IN (:...statuses)', {
        statuses: [RentalStatus.PENDING, RentalStatus.ACTIVE],
      })
      .andWhere(
        'NOT (rental.end_date < :start OR rental.start_date > :end)',
        { start: dto.startDate, end: dto.endDate },
      )
      .getOne();

    if (conflicting) {
      this.logger.warn(
        `[RentalsService] date conflict carId=${dto.carId} conflictingRentalId=${conflicting.id}`,
      );
      throw new ConflictException('Car already booked for the selected dates');
    }

    // Calculate cost
    const days = this.calculateDays(dto.startDate, dto.endDate);
    const dailyRate = Number(car.pricePerDay);
    const totalCost = dailyRate * days;

    this.logger.debug(
      `[RentalsService] cost calculation days=${days} dailyRate=${dailyRate} totalCost=${totalCost}`,
    );

    // Mark car unavailable
    await this.carsService.setAvailability(dto.carId, false);

    // Save rental
    const rental = this.rentalsRepository.create({
      userId,
      carId: dto.carId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      dailyRate,
      totalCost,
      status: RentalStatus.PENDING,
    });

    const saved = await this.rentalsRepository.save(rental);
    this.logger.log(`[RentalsService] rental created id=${saved.id} userId=${userId}`);
    return this.findOne(saved.id);
  }

  async findByUser(userId: string): Promise<Rental[]> {
    this.logger.debug(`[RentalsService] findByUser userId=${userId}`);
    const rentals = await this.rentalsRepository.find({
      where: { userId },
      relations: ['car'],
      order: { createdAt: 'DESC' },
    });
    this.logger.debug(`[RentalsService] findByUser - found ${rentals.length} rentals`);
    return rentals;
  }

  async findAll(): Promise<Rental[]> {
    this.logger.debug('[RentalsService] findAll');
    const rentals = await this.rentalsRepository.find({
      relations: ['user', 'car'],
      order: { createdAt: 'DESC' },
    });
    this.logger.debug(`[RentalsService] findAll - found ${rentals.length} rentals`);
    return rentals;
  }

  async findActive(): Promise<Rental[]> {
    this.logger.debug('[RentalsService] findActive');
    const rentals = await this.rentalsRepository.find({
      where: {
        status: In([RentalStatus.PENDING, RentalStatus.ACTIVE]),
      },
      relations: ['user', 'car'],
      order: { createdAt: 'DESC' },
    });
    this.logger.debug(`[RentalsService] findActive - found ${rentals.length} active rentals`);
    return rentals;
  }

  async findOne(id: string): Promise<Rental> {
    this.logger.debug(`[RentalsService] findOne id=${id}`);
    const rental = await this.rentalsRepository.findOne({
      where: { id },
      relations: ['user', 'car'],
    });
    if (!rental) {
      this.logger.warn(`[RentalsService] findOne - not found id=${id}`);
      throw new NotFoundException(`Rental ${id} not found`);
    }
    return rental;
  }

  async complete(id: string, adminId: string): Promise<Rental> {
    this.logger.debug(`[RentalsService] complete id=${id} adminId=${adminId}`);
    const rental = await this.findOne(id);

    if (rental.status === RentalStatus.COMPLETED) {
      throw new BadRequestException('Rental is already completed');
    }
    if (rental.status === RentalStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled rental');
    }

    await this.rentalsRepository.update(id, { status: RentalStatus.COMPLETED });
    await this.carsService.setAvailability(rental.carId, true);

    this.logger.log(`[RentalsService] rental completed id=${id} adminId=${adminId}`);
    return this.findOne(id);
  }

  async cancel(
    id: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<Rental> {
    this.logger.debug(
      `[RentalsService] cancel id=${id} requesterId=${requesterId} role=${requesterRole}`,
    );
    const rental = await this.findOne(id);

    // Authorization: user can only cancel their own, admin can cancel any
    const isAdmin =
      requesterRole === UserRole.ADMIN ||
      requesterRole === UserRole.SUPERADMIN;
    const isOwner = rental.userId === requesterId;

    if (!isAdmin && !isOwner) {
      this.logger.warn(
        `[RentalsService] cancel forbidden requesterId=${requesterId} rentalId=${id}`,
      );
      throw new ForbiddenException('You can only cancel your own rentals');
    }

    if (rental.status !== RentalStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel rental with status: ${rental.status}`,
      );
    }

    await this.rentalsRepository.update(id, { status: RentalStatus.CANCELLED });
    await this.carsService.setAvailability(rental.carId, true);

    this.logger.log(`[RentalsService] rental cancelled id=${id} by requesterId=${requesterId}`);
    return this.findOne(id);
  }

  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
}
