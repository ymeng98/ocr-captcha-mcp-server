# Use Node.js LTS Alpine as base image
FROM node:18-alpine

# Install system dependencies for Sharp, Canvas and native modules
RUN apk add --no-cache \
    vips-dev \
    cairo-dev \
    pango-dev \
    giflib-dev \
    python3 \
    make \
    g++ \
    libc6-compat

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port (Smithery typically uses 8080)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check')" || exit 1

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ddddocr -u 1001

# Change ownership of the app directory
RUN chown -R ddddocr:nodejs /app
USER ddddocr

# Start the application
CMD ["npm", "start"]
