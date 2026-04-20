# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev for building)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the project (client and server)
RUN pnpm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Set node environment to production
ENV NODE_ENV=production
# The application expects PORT from environment or defaults to a value. We explicitly set it here.
ENV PORT=3000

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs
USER nodejs

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
