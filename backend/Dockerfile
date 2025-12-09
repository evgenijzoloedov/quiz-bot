FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create upload directories (добавьте fail-images)
RUN mkdir -p uploads/images uploads/pdfs uploads/temp uploads/videos uploads/fail-images

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "src/index.js"]
