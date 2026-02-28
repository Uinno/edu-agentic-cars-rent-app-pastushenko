---
name: nestjs-jwt-auth-rbac
description: >-
  NestJS JWT authentication and role-based access control (RBAC) patterns for implementing secure user authentication with refresh tokens and three-tier authorization (superadmin, admin, user). Use when implementing login, registration, JWT strategies, role guards, or protecting routes based on user roles.
license: MIT
metadata:
  author: custom-generated
  version: "1.0.0"
  category: security
---

# NestJS JWT Authentication & RBAC

Comprehensive guide for implementing secure JWT-based authentication and role-based access control in NestJS applications with multiple user roles.

## When to Use

- Implementing user registration and login endpoints
- Setting up JWT token generation and validation
- Creating role-based guards (superadmin, admin, user)
- Protecting routes with authentication and authorization
- Implementing refresh token rotation
- Managing user sessions

## Core Principles

### 1. JWT Strategy with Passport

```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException("User not found or deleted");
    }
    return { id: payload.sub, email: payload.email, role: user.role };
  }
}
```

### 2. Role-Based Guards

```typescript
// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  USER = "user",
}

export const Roles = Reflector.createDecorator<UserRole[]>();

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    if (!requiredRoles) {
      return true; // No roles required
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### 3. Protect Routes with Roles

```typescript
// src/cars/cars.controller.ts
import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard, Roles, UserRole } from "../auth/guards/roles.guard";

@Controller("cars")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarsController {
  // Only superadmin can create other admins
  @Post("admin")
  @Roles([UserRole.SUPERADMIN])
  createAdmin() {
    return "Create admin";
  }

  // Admins and superadmin can manage cars
  @Post()
  @Roles([UserRole.ADMIN, UserRole.SUPERADMIN])
  createCar() {
    return "Create car";
  }

  // All authenticated users can view available cars
  @Get("available")
  @Roles([UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN])
  getAvailableCars() {
    return "Available cars";
  }
}
```

### 4. Refresh Token Pattern

```typescript
// src/auth/auth.service.ts
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("JWT_SECRET"),
        expiresIn: "15m",
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
        expiresIn: "7d",
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    // Verify refresh token, validate user, generate new tokens
    // Store hashed refresh token in database for security
  }
}
```

### 5. User Entity with Soft Delete

```typescript
// src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { UserRole } from "../../auth/guards/roles.guard";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // Soft delete support
}
```

## Best Practices

### Security

- **Hash passwords** with bcrypt (minimum 10 rounds)
- **Store hashed refresh tokens** in database, never plain text
- **Validate token expiration** on every request
- **Revoke tokens** on logout by clearing refresh token in database
- **Check soft delete** status (`deletedAt`) in JWT validation

### Role Hierarchy

- **Superadmin**: Can create/delete admins, full system access
- **Admin**: Can manage cars, view users, see rentals
- **User**: Can register, login, search cars, rent cars

### Error Handling

- Return 401 for authentication failures
- Return 403 for authorization failures (valid token, insufficient role)
- Never expose user existence in error messages

### Token Management

- **Access tokens**: Short-lived (15 minutes)
- **Refresh tokens**: Long-lived (7 days), rotated on use
- Store refresh tokens hashed in database
- Implement token revocation on password change

## Module Setup

```typescript
// src/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "15m" },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

## Environment Variables

Required in `.env`:

```
JWT_SECRET=your-access-token-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
```

Generate secure secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
