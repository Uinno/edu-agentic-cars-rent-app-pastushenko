import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    this.logger.debug('[UsersService] findAll');
    const users = await this.usersRepository.find();
    this.logger.debug(`[UsersService] findAll - found ${users.length} users`);
    return users;
  }

  async findById(id: string): Promise<User | null> {
    this.logger.debug(`[UsersService] findById id=${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.debug(`[UsersService] findById - not found id=${id}`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`[UsersService] findByEmail email=${email}`);
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.debug(`[UsersService] findByEmail - not found email=${email}`);
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    this.logger.debug(`[UsersService] create email=${dto.email} role=${dto.role ?? UserRole.USER}`);
    const user = this.usersRepository.create({
      ...dto,
      role: dto.role ?? UserRole.USER,
    });
    const saved = await this.usersRepository.save(user);
    this.logger.log(`[UsersService] user created id=${saved.id} role=${saved.role}`);
    return saved;
  }

  async updateRefreshToken(id: string, hashedToken: string | null): Promise<void> {
    this.logger.debug(`[UsersService] updateRefreshToken id=${id} hasToken=${hashedToken !== null}`);
    await this.usersRepository.update(id, { refreshToken: hashedToken });
  }

  async softDelete(id: string): Promise<void> {
    this.logger.debug(`[UsersService] softDelete id=${id}`);
    const result = await this.usersRepository.softDelete(id);
    if (!result.affected || result.affected === 0) {
      this.logger.warn(`[UsersService] softDelete - user not found id=${id}`);
      throw new NotFoundException(`User ${id} not found`);
    }
    this.logger.log(`[UsersService] user soft-deleted id=${id}`);
  }

  async restore(id: string): Promise<void> {
    this.logger.debug(`[UsersService] restore id=${id}`);
    await this.usersRepository.restore(id);
    this.logger.log(`[UsersService] user restored id=${id}`);
  }
}
