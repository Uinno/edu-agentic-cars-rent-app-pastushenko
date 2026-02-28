# Project Roadmap

> A geolocation-based car rental platform with role-based access control, enabling users to rent cars nearby while admins manage inventory and track active rentals.

## Milestones

- [ ] **Project Foundation** — Initialize NestJS backend and React + Vite frontend with project structure, environment config, and shared tooling (ESLint, TypeScript, Prettier)

- [ ] **Database Schema** — Design and implement TypeORM entities (User, Car, Rental) with migrations; enable PostGIS extension; set up spatial indexes for geolocation

- [ ] **Authentication System** — Implement user registration and login with JWT access + refresh tokens, bcrypt password hashing, and token rotation on refresh

- [ ] **Role-Based Access Control** — Implement three-tier RBAC (superadmin, admin, user) with NestJS guards and decorators; superadmin can create/delete admins

- [ ] **Car Management API** — CRUD endpoints for cars (admin only); car entity with geolocation fields; car availability status toggle

- [ ] **Geolocation Search** — PostGIS radius filtering with ST_DWithin (5km, 10km, 15km options); distance calculation; spatial index optimization

- [ ] **Rental System** — Car booking logic with availability conflict detection; rental status management (active, completed, cancelled); cancellation policy

- [ ] **Admin Dashboard API** — Endpoints for viewing active rentals with renter details; user management (list all users, soft delete); car rental history

- [ ] **Frontend: Authentication** — Login and registration pages with form validation; JWT token storage and refresh; protected route implementation

- [ ] **Frontend: Car Browsing** — Available cars listing with geolocation search; radius filter (5/10/15km); car detail view; rent button for authenticated users

- [ ] **Frontend: Admin Dashboard** — Admin UI for managing cars (CRUD); view active rentals with renter info; user list with soft delete; admin-only navigation

- [ ] **Production Readiness** — Environment configuration validation; structured logging; rate limiting; security headers; Docker setup for deployment

## Completed

| Milestone        | Date       |
| ---------------- | ---------- |
| AI Factory Setup | 2026-02-27 |
