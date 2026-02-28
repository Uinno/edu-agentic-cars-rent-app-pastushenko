[← User Roles](roles.md) · [Back to README](../README.md) · [Architecture →](architecture.md)

# Geolocation Guide

How the car rental platform uses PostGIS for location-based car search.

## How It Works

Cars store their location as a PostGIS `POINT` in SRID 4326 (WGS 84 — the same coordinate system used by GPS). When a user searches for nearby cars, a single spatial query uses `ST_DWithin` to efficiently find all cars within the specified radius.

```
User GPS coords (lat, lng) → PostGIS query → Cars within radius (sorted by distance)
```

## Setup

### 1. Enable PostGIS

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

This is handled automatically by the first migration.

### 2. Car Location Fields

Each car stores:

| Field       | Type                  | Description                                  |
| ----------- | --------------------- | -------------------------------------------- |
| `latitude`  | DECIMAL(10,8)         | Decimal latitude (-90 to 90)                 |
| `longitude` | DECIMAL(11,8)         | Decimal longitude (-180 to 180)              |
| `location`  | geography(Point,4326) | PostGIS spatial column for efficient queries |

The `location` column is a derived field that is always kept in sync with the `latitude`/`longitude` columns.

## Radius Search

Users can search for available cars in three fixed radius options:

| Option | Radius |
| ------ | ------ |
| Near   | 5 km   |
| Medium | 10 km  |
| Far    | 15 km  |

### API Example

```http
GET /cars/nearby?latitude=50.4501&longitude=30.5234&radius=10
Authorization: Bearer <token>
```

**Response:**

```json
{
  "total": 3,
  "radius": "10km",
  "cars": [
    {
      "id": "uuid",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2022,
      "pricePerDay": 45.0,
      "latitude": 50.4489,
      "longitude": 30.5246,
      "distance": "0.73km"
    }
  ]
}
```

Results are sorted by distance (closest first).

## Frontend Integration

The browser's Geolocation API provides the user's current position:

```typescript
// hooks/useGeolocation.ts
const { latitude, longitude } = await new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(
    (pos) => resolve(pos.coords),
    reject,
  );
});
```

The user can also search from a manually entered address instead of their live position.

## Performance

Location queries are optimized via a spatial index:

```sql
CREATE INDEX idx_cars_location ON cars USING GIST (location);
```

This allows PostgreSQL to use an R-tree index (GIST) which makes `ST_DWithin` queries run in O(log n) time instead of O(n).

**Do not** use `ST_Distance(...) < radius` in WHERE clauses — it won't use the spatial index.

## Common Issues

### "PostGIS extension not found"

Enable it in your database:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Install PostGIS:

```bash
# macOS
brew install postgis

# Ubuntu
sudo apt-get install postgresql-14-postgis-3
```

### Coordinates vs WGS84

- **Latitude** comes first in most human-readable formats: `(lat, lng)`
- **PostGIS `ST_MakePoint`** expects `(longitude, latitude)` — longitude first

Always double-check argument order when writing spatial queries.

### Distance Units

- `geography` type (used here): returns distances in **meters**
- Divide by 1000 for kilometers: `ST_Distance(...) / 1000`
- `geometry` type: returns distances in the coordinate system's units (degrees for SRID 4326)

## See Also

- [API Reference](api.md) — `/cars/nearby` endpoint details
- [Architecture](architecture.md) — CarsModule implementation
- [Getting Started](getting-started.md) — PostGIS installation
