import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCars1740000003 implements MigrationInterface {
  name = 'CreateCars1740000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cars" (
        "id"            UUID            NOT NULL DEFAULT gen_random_uuid(),
        "brand"         VARCHAR(100)    NOT NULL,
        "model"         VARCHAR(100)    NOT NULL,
        "year"          INTEGER         NOT NULL,
        "price_per_day" DECIMAL(10, 2)  NOT NULL,
        "is_available"  BOOLEAN         NOT NULL DEFAULT true,
        "description"   TEXT,
        "image_url"     VARCHAR(500),
        "location"      GEOGRAPHY(Point, 4326),
        "created_at"    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_cars_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_cars_location" ON "cars" USING GIST ("location")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_cars_available" ON "cars" ("is_available")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_cars_available"`);
    await queryRunner.query(`DROP INDEX "idx_cars_location"`);
    await queryRunner.query(`DROP TABLE "cars"`);
  }
}
