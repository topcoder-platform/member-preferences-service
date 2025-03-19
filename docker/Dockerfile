# Use the base image with Node.js 10.15.3-alpine
FROM node:10.24.1-alpine

# Add dependencies
RUN apk update && apk add --no-cache bash git openssh python make gcc g++

# Copy the current directory into the Docker image
COPY . /member-preferences-service

# Set working directory for future use
WORKDIR /member-preferences-service

# Install the dependencies from package.json
RUN rm -rf node_modules && npm install
ENTRYPOINT npm start