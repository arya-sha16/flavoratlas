FROM node:20-alpine

# Install openssl for Prisma query engine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy server package details
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

# Copy database schema and backend code
COPY prisma /app/prisma
COPY server /app/server

# Generate Prisma Client using the root-level schema
RUN npx prisma generate --schema=/app/prisma/schema.prisma

EXPOSE 5000

# Start server
CMD ["npm", "run", "start"]
