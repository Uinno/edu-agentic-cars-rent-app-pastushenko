import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePostgis1740000001 implements MigrationInterface {
  name = 'EnablePostgis1740000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: dropping PostGIS may affect other data; skipped intentionally
  }
}
