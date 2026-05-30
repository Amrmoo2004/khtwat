# Use official Node.js Alpine image for a lightweight footprint
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 3000

# Start the Node.js application
CMD ["npm", "start"]
