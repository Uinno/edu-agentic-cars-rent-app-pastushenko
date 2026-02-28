import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ name: 'price_per_day', type: 'decimal', precision: 10, scale: 2 })
  pricePerDay: number;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string | null;

  /**
   * PostGIS geography(Point, 4326) column.
   * Stored as WKT; populated and queried via raw SQL.
   * Access coordinates through ST_X/ST_Y in queries.
   */
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
