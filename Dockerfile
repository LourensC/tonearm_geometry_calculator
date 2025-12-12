FROM node:20-alpine

WORKDIR /app

# Install a simple static file server
RUN npm install -g http-server

EXPOSE 8000
CMD ["http-server", ".", "-p", "8000", "-a", "0.0.0.0"]
