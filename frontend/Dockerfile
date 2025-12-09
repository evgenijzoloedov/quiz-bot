# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Build arguments
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

# Build application
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

# Create startup script
RUN cat > /start.sh << 'EOF'
#!/bin/sh
set -e

# Set defaults for environment variables
export PORT=${PORT:-80}
export BACKEND_URL=${BACKEND_URL:-http://localhost:5000}

echo "Starting nginx with:"
echo "  PORT=$PORT"
echo "  BACKEND_URL=$BACKEND_URL"

# Replace variables in nginx config
envsubst '${PORT},${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Show generated config for debugging
echo "=== Generated nginx config ==="
head -20 /etc/nginx/conf.d/default.conf
echo "=============================="

# Start nginx
exec nginx -g 'daemon off;'
EOF

RUN chmod +x /start.sh

# Run with startup script
CMD ["/start.sh"]