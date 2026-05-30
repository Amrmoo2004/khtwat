# Use official Node.js Alpine image for a lightweight footprint
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production
RUN npm install pm2 -g

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 3000

# Start the Node.js application with pm2
CMD ["pm2-runtime", "src/index.js"]
