import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokensDto } from './dto/tokens.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokensDto> {
    this.logger.debug(`[AuthService] register email=${dto.email}`);

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.USER,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`[AuthService] register success userId=${user.id}`);
    return tokens;
  }

  async login(dto: LoginDto): Promise<TokensDto> {
    this.logger.debug(`[AuthService] login email=${dto.email}`);

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`[AuthService] login failed — user not found email=${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      this.logger.warn(`[AuthService] login failed — wrong password userId=${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`[AuthService] login success userId=${user.id}`);
    return tokens;
  }

  async refresh(userId: string, role: string, email: string): Promise<TokensDto> {
    this.logger.debug(`[AuthService] refresh userId=${userId}`);

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.debug(`[AuthService] refresh success userId=${userId}`);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    this.logger.debug(`[AuthService] logout userId=${userId}`);
    await this.usersService.updateRefreshToken(userId, null);
    this.logger.log(`[AuthService] logout userId=${userId}`);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<TokensDto> {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES', '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES', '7d') as any,
      }),
    ]);

    this.logger.debug(`[AuthService] tokens generated for userId=${userId}`);
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    rawToken: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(rawToken, 10);
    await this.usersService.updateRefreshToken(userId, hashed);
  }
}
