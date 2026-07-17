# AmanGuard frontend — Vite build served by nginx.
# Build context: the repo ROOT (the vite build zips extention/src into the
# /extension-download asset, so the extension source must be in the context).
#   docker build -f docker/Frontend.Dockerfile -t amanguard-frontend .
#
# VITE_API_BASE_URL is baked into the bundle at BUILD time (Vite env) — the
# default "/api" is same-origin and proxied to the backend by docker/nginx.conf.

FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first so they cache independently of source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
