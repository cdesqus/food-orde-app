# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production Stage
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Non-root user for security
USER node

EXPOSE 3000
CMD ["node", "dist/index.js"]
