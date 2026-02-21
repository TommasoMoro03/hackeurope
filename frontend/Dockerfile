# Multi-stage build for React app

# Stage 1: Build
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL

# Set as environment variables for the build process
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL

# Debug: Print variables to build logs (remove in production if desired)
RUN echo "Building with VITE_GOOGLE_CLIENT_ID: $VITE_GOOGLE_CLIENT_ID"
RUN echo "Building with VITE_API_URL: $VITE_API_URL"

# Build the app (environment variables are now available)
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
