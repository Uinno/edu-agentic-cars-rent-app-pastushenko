import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRentals1740000004 implements MigrationInterface {
  name = 'CreateRentals1740000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."rental_status" AS ENUM('pending', 'active', 'completed', 'cancelled')`,
    );

    await queryRunner.query(`
      CREATE TABLE "rentals" (
        "id"          UUID            NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     UUID            NOT NULL,
        "car_id"      UUID            NOT NULL,
        "start_date"  DATE            NOT NULL,
        "end_date"    DATE            NOT NULL,
        "daily_rate"  DECIMAL(10, 2)  NOT NULL,
        "total_cost"  DECIMAL(10, 2)  NOT NULL,
        "status"      "public"."rental_status" NOT NULL DEFAULT 'pending',
        "created_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_rentals_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rentals_user" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_rentals_car"  FOREIGN KEY ("car_id")  REFERENCES "cars"("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_rentals_user" ON "rentals" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rentals_car" ON "rentals" ("car_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rentals_status" ON "rentals" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rentals_dates" ON "rentals" ("start_date", "end_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_rentals_dates"`);
    await queryRunner.query(`DROP INDEX "idx_rentals_status"`);
    await queryRunner.query(`DROP INDEX "idx_rentals_car"`);
    await queryRunner.query(`DROP INDEX "idx_rentals_user"`);
    await queryRunner.query(`DROP TABLE "rentals"`);
    await queryRunner.query(`DROP TYPE "public"."rental_status"`);
  }
}
