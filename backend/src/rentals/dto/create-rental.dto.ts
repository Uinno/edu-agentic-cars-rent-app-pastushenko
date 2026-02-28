import { IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRentalDto {
  @ApiProperty({ description: 'UUID of the car to rent' })
  @IsUUID()
  carId: string;

  @ApiProperty({ example: '2026-03-01', description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-07', description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;
}
