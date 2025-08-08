# frontend/Dockerfile
# Build stage
FROM node:20-alpine3.22 AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Runtime stage
FROM node:20-alpine3.22
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY frontend/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
