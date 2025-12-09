# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:5000
ARG VITE_APP_NAME=Quiz Bot

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Copy package files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build application with environment variables
RUN npm run build

# Production stage
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template

# Expose port
EXPOSE 80

# Entrypoint script for dynamic configuration
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'export PORT=${PORT:-80}' >> /docker-entrypoint.sh && \
    echo 'export BACKEND_URL=${BACKEND_URL:-http://localhost:5000}' >> /docker-entrypoint.sh && \
    echo 'envsubst '\''${PORT} ${BACKEND_URL}'\'' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'nginx -g '\''daemon off;'\''' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Run with proper entrypoint
CMD ["/docker-entrypoint.sh"]
