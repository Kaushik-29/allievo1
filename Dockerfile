FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Install frontend dependencies and build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build to backend static serving
RUN cp -r frontend/dist backend/public

EXPOSE 3001

WORKDIR /app/backend
CMD ["node", "src/server.js"]
