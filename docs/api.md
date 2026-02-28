[← Getting Started](getting-started.md) · [Back to README](../README.md) · [User Roles →](roles.md)

# API Reference

All endpoints use JSON request/response bodies. Authenticated endpoints require a `Bearer` token.

## Base URL

```
http://localhost:3000
```

## Authentication

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user"
}
```

### Login

```http
POST /auth/login
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
POST /auth/refresh
Authorization: Bearer <refreshToken>
```

**Response 200:** Same as login — new access and refresh tokens.

### Logout

```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

**Response 200:** Clears refresh token from database.

---

## Cars

### Get Available Cars

```http
GET /cars/available
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
    "pricePerDay": 45.0,
    "latitude": 50.4501,
    "longitude": 30.5234
  }
]
```

### Find Cars Nearby (Geolocation)

```http
GET /cars/nearby?latitude=50.45&longitude=30.52&radius=10
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Required | Values            |
| --------- | ------ | -------- | ----------------- |
| latitude  | number | Yes      | -90 to 90         |
| longitude | number | Yes      | -180 to 180       |
| radius    | number | Yes      | 5, 10, or 15 (km) |

**Response 200:**

```json
{
  "total": 3,
  "radius": "10km",
  "cars": [
    {
      "id": "uuid",
      "brand": "Toyota",
      "model": "Corolla",
      "distance": "2.34km"
    }
  ]
}
```

### Get Car Details

```http
GET /cars/:id
Authorization: Bearer <accessToken>
```

### Create Car _(Admin only)_

```http
POST /cars
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
PATCH /cars/:id
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "pricePerDay": 50.00
}
```

### Delete Car _(Admin only)_

```http
DELETE /cars/:id
Authorization: Bearer <adminToken>
```

**Response 204:** No content.

---

## Rentals

### Create Rental _(Authenticated users)_

```http
POST /rentals
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "carId": "uuid",
  "startDate": "2026-03-01T10:00:00Z",
  "endDate": "2026-03-05T10:00:00Z"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "status": "active",
  "startDate": "2026-03-01T10:00:00Z",
  "endDate": "2026-03-05T10:00:00Z",
  "dailyRate": 45.0,
  "totalCost": 180.0
}
```

**Errors:**

| Code | Reason                              |
| ---- | ----------------------------------- |
| 400  | Car not available or dates conflict |
| 404  | Car not found                       |

### Get My Rentals

```http
GET /rentals/my-rentals
Authorization: Bearer <accessToken>
```

### Get Active Rentals _(Admin only)_

```http
GET /rentals/active
Authorization: Bearer <adminToken>
```

**Response 200:** Array of active rentals with user and car details.

### Complete Rental _(Admin only)_

```http
PATCH /rentals/:id/complete
Authorization: Bearer <adminToken>
```

Marks rental as completed, records return time, applies late fees if applicable.

### Cancel Rental

```http
PATCH /rentals/:id/cancel
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
GET /users
Authorization: Bearer <adminToken>
```

### Get User Details

```http
GET /users/:id
Authorization: Bearer <adminToken>
```

### Soft Delete User

```http
DELETE /users/:id
Authorization: Bearer <adminToken>
```

Sets `deletedAt` timestamp. User cannot login after deletion. Data is preserved.

---

## Admin Management _(Superadmin only)_

### Create Admin

```http
POST /auth/create-admin
Authorization: Bearer <superadminToken>
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

### Delete Admin

```http
DELETE /users/:id/admin
Authorization: Bearer <superadminToken>
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Car is already booked for the selected period",
  "error": "Bad Request"
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
