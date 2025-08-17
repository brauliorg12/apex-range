# Use a Node.js 20 LTS image as the base for building
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

# Use a smaller Node.js image for the final production image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Copy the bot-state.json if it's part of the runtime
COPY bot-state.json ./

# Command to run the application
CMD ["node", "dist/index.js"]

# Expose the port if your bot runs a web server (e.g., for webhooks or health checks)
# If your bot doesn't run a web server, you can remove this line.
# EXPOSE 3000
