import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1740000002 implements MigrationInterface {
  name = 'CreateUsers1740000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'admin', 'user')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
        "email"         VARCHAR(255)  NOT NULL,
        "password"      VARCHAR(255)  NOT NULL,
        "first_name"    VARCHAR(100)  NOT NULL,
        "last_name"     VARCHAR(100)  NOT NULL,
        "role"          "public"."user_role" NOT NULL DEFAULT 'user',
        "refresh_token" VARCHAR(500),
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "deleted_at"    TIMESTAMPTZ,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_role" ON "users" ("role")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_users_role"`);
    await queryRunner.query(`DROP INDEX "idx_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
  }
}
