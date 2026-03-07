# syntax=docker/dockerfile:1

# Build stage (Debian-based to avoid Alpine musl issues with swc)
FROM node:20-slim AS build
WORKDIR /app

# Install pnpm compatible with lockfile v9
RUN npm i -g pnpm@9.12.3

# Copy manifest and lock first for better layer caching
COPY pnpm-lock.yaml package.json ./

# Install dependencies (dev deps included for build)
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .

# Build arg para URL do backend (embarcado no bundle JS)
ARG VITE_API_BASE_URL=http://127.0.0.1:5000
ENV VITE_API_BASE_URL=http://127.0.0.1:5000

ENV VITE_SYSTEM_ID="0f7d734a-a964-4693-ae0d-bad8dd05fe15"

RUN pnpm run build

# Runtime stage (Nginx)
FROM nginx:1.25-alpine AS runtime

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
