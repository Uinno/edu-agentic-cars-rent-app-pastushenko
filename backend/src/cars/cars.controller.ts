import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('cars')
@ApiBearerAuth()
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a car (admin only)' })
  create(
    @Body() dto: CreateCarDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.carsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cars' })
  findAll() {
    return this.carsService.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available cars' })
  findAvailable() {
    return this.carsService.findAvailable();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find cars within radius (5/10/15 km)' })
  findNearby(@Query() dto: FindNearbyDto) {
    return this.carsService.findNearby(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a car by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a car (admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.carsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a car (admin only)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.carsService.remove(id, user.id);
  }
}
