# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# ─── Stage 2: Dependencies ────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules prod_node_modules
RUN npm ci

# ─── Stage 3: Build ───────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Stage 4: Development ─────────────────────────────────────────────────────
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "start:dev"]

# ─── Stage 5: Production ──────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
USER node
COPY --from=deps /app/prod_node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["dumb-init", "node", "dist/main.js"]
