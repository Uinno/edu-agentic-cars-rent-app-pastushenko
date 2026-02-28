import { IsIn, IsNumber, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FindNearbyDto {
  @ApiProperty({ example: 48.8566 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ example: 2.3522 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude: number;

  @ApiProperty({ enum: [5, 10, 15], description: 'Radius in kilometers' })
  @IsIn([5, 10, 15])
  @Type(() => Number)
  radius: 5 | 10 | 15;
}
