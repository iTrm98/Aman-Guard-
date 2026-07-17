# AmanGuard "core" monolith — the Vite SPA baked into the Spring Boot jar
# (classpath:/static), so ONE container serves both the UI and the API on 8080.
# Build context: the repo ROOT (the vite build zips extention/src into the
# /extension-download asset, so the extension source must be in the context).
#   docker build -f docker/Core.Dockerfile -t amanguard-core .
#
# The SPA is built with VITE_API_BASE_URL=/api — same origin as the API, so no
# CORS and no nginx needed. SecurityConfig permits GET on the static paths.

# ---- Stage 1: build the React frontend ----
FROM node:22-alpine AS build-frontend
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
COPY extention ./extention

ENV VITE_API_BASE_URL=/api
RUN npm run build

# ---- Stage 2: build Spring Boot with the SPA embedded ----
FROM maven:3.9-eclipse-temurin-17 AS build-backend
WORKDIR /app

COPY backend/pom.xml .
RUN mvn -q -B dependency:go-offline

COPY backend/src ./src
COPY --from=build-frontend /app/dist ./src/main/resources/static

RUN mvn -q -B package -DskipTests

# ---- Stage 3: slim runtime ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build-backend /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
