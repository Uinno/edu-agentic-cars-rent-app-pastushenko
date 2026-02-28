# Project: Car Rental Service

## Overview

A web-based car rental platform that enables users to browse, filter, and rent cars based on geolocation. The platform features role-based access control with three user types: superadmin, admin, and regular users. Users can register, login, and rent available cars. Admins manage the car inventory and monitor active rentals, while a superadmin oversees admin accounts.

## Core Features

- **User Authentication** - Registration and login system for all users
- **Role-Based Access Control** - Three-tier access system (superadmin, admin, user)
- **Car Management** - Admins can add, edit, and delete cars from the inventory
- **Car Rental** - Users can rent available cars through the platform
- **Geolocation Filtering** - Users can search for cars within 5km, 10km, or 15km radius
- **Rental Dashboard** - Admins can view active rentals and associated users
- **User Management** - Admins can view all registered users and perform soft deletes
- **Availability View** - Both users and admins can view available cars for rent

## Tech Stack

- **Language:** TypeScript/Node.js
- **Backend Framework:** NestJS
- **Frontend Framework:** React + Vite
- **UI Library:** shadcn/ui (Radix UI primitives + Tailwind CSS v4)
- **Database:** PostgreSQL (with PostGIS extension for geolocation)
- **ORM:** TypeORM
- **Key Integrations:**
  - JWT for authentication
  - PostGIS for geospatial queries
  - Role-based guards and decorators

## Architecture

See `.ai-factory/ARCHITECTURE.md` for detailed architecture guidelines.
Pattern: **Modular Monolith**

- **Monorepo Structure:** Separate `/backend` and `/frontend` directories
- **Authentication Strategy:** JWT tokens with refresh token rotation
- **Authorization:** Guard-based role checking at endpoint level
- **Geolocation:** PostgreSQL PostGIS extension for efficient radius queries
- **Data Model:** Soft delete pattern for user records
- **API Design:** RESTful API with NestJS controllers and services

## Non-Functional Requirements

- **Logging:** Configurable via LOG_LEVEL environment variable
- **Error Handling:** Structured error responses with proper HTTP status codes
- **Security:**
  - Password hashing with bcrypt
  - JWT token validation
  - Role-based authorization middleware
  - Input validation and sanitization
  - SQL injection prevention via ORM
- **Performance:**
  - Spatial indexing for geolocation queries
  - Pagination for large result sets
- **Data Integrity:**
  - Soft delete for user records (audit trail)
  - Referential integrity via foreign keys
