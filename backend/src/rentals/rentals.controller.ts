import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('rentals')
@ApiBearerAuth()
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a rental booking' })
  create(
    @Body() dto: CreateRentalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.rentalsService.create(user.id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all rentals (admin only)' })
  findAll() {
    return this.rentalsService.findAll();
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get active/pending rentals with user & car (admin only)' })
  findActive() {
    return this.rentalsService.findActive();
  }

  @Get('my')
  @ApiOperation({ summary: "Get current user's rentals" })
  findMy(@CurrentUser() user: CurrentUserPayload) {
    return this.rentalsService.findByUser(user.id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark rental as completed (admin only)' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.rentalsService.complete(id, user.id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a rental (own rental or admin)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.rentalsService.cancel(id, user.id, user.role);
  }
}
