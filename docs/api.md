[← Getting Started](getting-started.md) · [Back to README](../README.md) · [User Roles →](roles.md)

# API Reference

All endpoints use JSON request/response bodies. Authenticated endpoints require a `Bearer` token.

## Base URL

```
http://localhost:3000/api
```

> **Interactive docs:** Swagger UI is available at `http://localhost:3000/api/docs` when the backend is running.

## Authentication

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response 201:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Refresh Token

```http
POST /api/auth/refresh
Authorization: Bearer <refreshToken>
```

**Response 200:** Same as login — new access and refresh tokens.

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

**Response 200:** Clears refresh token from database.

---

## Cars

### Get Available Cars

```http
GET /api/cars/available
Authorization: Bearer <accessToken>
```

**Response 200:**

```json
[
  {
    "id": "uuid",
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2022,
    "pricePerDay": "45.00",
    "isAvailable": true,
    "location": "0101000020E6100000...",
    "createdAt": "2026-02-28T12:00:00.000Z"
  }
]
```

### Find Cars Nearby (Geolocation)

```http
GET /api/cars/nearby?latitude=50.45&longitude=30.52&radius=10
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Required | Values            |
| --------- | ------ | -------- | ----------------- |
| latitude  | number | Yes      | -90 to 90         |
| longitude | number | Yes      | -180 to 180       |
| radius    | number | Yes      | 5, 10, or 15 (km) |

**Response 200:** Array of car objects ordered by distance, each including a `distance_meters` field:

```json
[
  {
    "id": "uuid",
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2022,
    "pricePerDay": "45.00",
    "isAvailable": true,
    "distance_meters": 2340.5
  }
]
```

### Get Car Details

```http
GET /api/cars/:id
Authorization: Bearer <accessToken>
```

### Create Car _(Admin only)_

```http
POST /api/cars
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2022,
  "pricePerDay": 45.00,
  "latitude": 50.4501,
  "longitude": 30.5234
}
```

**Response 201:** Created car object.

### Update Car _(Admin only)_

```http
PATCH /api/cars/:id
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "pricePerDay": 50.00
}
```

### Delete Car _(Admin only)_

```http
DELETE /api/cars/:id
Authorization: Bearer <adminToken>
```

**Response 204:** No content.

---

## Rentals

### Create Rental _(Authenticated users)_

```http
POST /api/rentals
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "carId": "uuid",
  "startDate": "2026-03-01",
  "endDate": "2026-03-05"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "carId": "uuid",
  "userId": "uuid",
  "status": "pending",
  "startDate": "2026-03-01",
  "endDate": "2026-03-05",
  "dailyRate": "45.00",
  "totalCost": "180.00",
  "car": { "id": "uuid", "brand": "Toyota", "model": "Corolla" },
  "createdAt": "2026-02-28T12:00:00.000Z"
}
```

**Errors:**

| Code | Reason                              |
| ---- | ----------------------------------- |
| 400  | Car not available or dates conflict |
| 404  | Car not found                       |

### Get My Rentals

```http
GET /api/rentals/my
Authorization: Bearer <accessToken>
```

### Get Active Rentals _(Admin only)_

```http
GET /api/rentals/active
Authorization: Bearer <adminToken>
```

**Response 200:** Array of active rentals with user and car details.

### Complete Rental _(Admin only)_

```http
PATCH /api/rentals/:id/complete
Authorization: Bearer <adminToken>
```

Marks rental as completed, records return time, applies late fees if applicable.

### Cancel Rental

```http
PATCH /api/rentals/:id/cancel
Authorization: Bearer <accessToken>
```

Cancellation policy:

- 72+ hours before start: 100% refund
- 24–72 hours before start: 50% refund
- < 24 hours before start: No refund

---

## Users _(Admin only)_

### List All Users

```http
GET /api/users
Authorization: Bearer <adminToken>
```

### Get User Details

```http
GET /api/users/:id
Authorization: Bearer <adminToken>
```

### Soft Delete User

```http
DELETE /api/users/:id
Authorization: Bearer <adminToken>
```

Sets `deletedAt` timestamp. User cannot login after deletion. Data is preserved.

---

## Admin Management _(Superadmin only)_

### Create Admin

Superadmin creates admin accounts by registering and then updating the user's role directly in the database (no dedicated endpoint — handled via seed or DB insert). The register endpoint creates `user` role only.

```bash
# Create via DB (example — run from psql)
INSERT INTO users (email, password, first_name, last_name, role)
VALUES ('admin@example.com', '<bcrypt-hash>', 'Admin', 'User', 'admin');
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Car is already booked for the selected period",
  "path": "/api/rentals",
  "timestamp": "2026-02-28T12:00:00.000Z"
}
```

| Status | Meaning                            |
| ------ | ---------------------------------- |
| 400    | Bad Request — invalid input        |
| 401    | Unauthorized — no or invalid token |
| 403    | Forbidden — insufficient role      |
| 404    | Not Found — resource doesn't exist |
| 409    | Conflict — availability conflict   |
| 500    | Internal Server Error              |

## See Also

- [User Roles & Permissions](roles.md)
- [Geolocation Guide](geolocation.md)
- [Getting Started](getting-started.md)
