# Stage 1: Build React app
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only production)
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

EXPOSE 3000

# Copy nginx config из контекста сборки (корень проекта)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app из builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
