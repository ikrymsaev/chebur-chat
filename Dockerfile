# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Peer path обязателен при прокси через nginx. Host/port/secure берутся из window.location при пустых значениях.
ARG VITE_PEER_PATH=/peer
ENV VITE_PEER_PATH=$VITE_PEER_PATH

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
