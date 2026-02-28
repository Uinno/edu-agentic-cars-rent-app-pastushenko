[← Architecture](architecture.md) · [Back to README](../README.md)

# Deployment

Instructions for deploying the Car Rental Service using Docker.

## Docker Setup

The project includes Docker containers for the backend, frontend, and PostgreSQL with PostGIS.

### Prerequisites

- Docker 24+
- Docker Compose 2.20+

## Development with Docker Compose

```bash
docker-compose up -d
```

Services:

- **backend** → http://localhost:3000
- **frontend** → http://localhost:5173
- **postgres** → localhost:5432

### `docker-compose.yml` Overview

```yaml
services:
  postgres:
    image: postgis/postgis:14-3.3
    environment:
      POSTGRES_DB: car_rental
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/car_rental
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    environment:
      VITE_API_URL: http://localhost:3000

volumes:
  pgdata:
```

## Environment Variables for Production

Create a `.env` file in the project root:

```env
# Database
POSTGRES_PASSWORD=your-secure-password

# JWT (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret

# MCP (optional)
GITHUB_TOKEN=your-github-token
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/car_rental
```

## Production Build

### Backend

```bash
cd backend
npm run build            # Compiles TypeScript to dist/
npm run migration:run    # Run migrations
node dist/main.js        # Start production server
```

### Frontend

```bash
cd frontend
npm run build   # Outputs to dist/
# Serve dist/ with nginx or a static host
```

## Health Check

After deployment verify:

```bash
curl http://localhost:3000/health
# Expected: { "status": "ok" }
```

## Nginx Configuration (Frontend Proxy)

For serving the React SPA with nginx:

```nginx
server {
    listen 80;
    root /var/www/frontend/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
    }
}
```

## Database Backups

```bash
# Backup
pg_dump -U postgres car_rental > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres car_rental < backup_20260227.sql
```

## Monitoring

Recommended tools:

- **Logs**: NestJS structured logging with `LOG_LEVEL=info`
- **Health**: NestJS `@nestjs/terminus` health endpoints
- **APM**: Optional — integrate with Datadog, New Relic, or Sentry

## See Also

- [Getting Started](getting-started.md) — Local development setup
- [Architecture](architecture.md) — System design
- [API Reference](api.md) — Endpoint documentation
