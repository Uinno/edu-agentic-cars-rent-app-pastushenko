import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const url = configService.get<string>('DATABASE_URL');

  return {
    type: 'postgres',
    ...(url
      ? { url }
      : {
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USER', 'postgres'),
          password: configService.get<string>('DB_PASS', 'password'),
          database: configService.get<string>('DB_NAME', 'car_rental'),
        }),
    synchronize: false,
    migrationsRun: true,
    migrations: ['dist/migrations/*.js'],
    entities: ['dist/**/*.entity.js'],
    logging: ['error'],
    maxQueryExecutionTime: 1000, // warn on queries slower than 1s
    extra: {
      max: 20,
    },
  };
};
