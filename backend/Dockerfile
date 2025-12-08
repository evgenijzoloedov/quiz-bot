FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create upload directories
RUN mkdir -p uploads/images uploads/pdfs uploads/temp

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "src/index.js"]

