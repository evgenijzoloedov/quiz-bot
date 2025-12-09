# Stage 1: Build React app
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

EXPOSE 3000

# Copy nginx config как template
COPY frontend/nginx.conf /etc/nginx/nginx.conf.template

# Создай entrypoint скрипт
RUN echo '#!/bin/sh\n\
envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf\n\
nginx -g "daemon off;"\n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Start with entrypoint
ENTRYPOINT ["/entrypoint.sh"]
