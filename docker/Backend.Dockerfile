# AmanGuard backend — Maven build stage + slim JRE runtime.
# Build context: the backend/ folder.
#   docker build -f docker/Backend.Dockerfile -t amanguard-backend backend
#
# Uses the maven image (not ./mvnw) so Windows checkouts with CRLF or missing
# exec bits on the wrapper script can't break the build.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Resolve dependencies first so they cache independently of source changes.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# DB/AI/JWT settings come from env vars (SPRING_DATASOURCE_URL,
# SPRING_DATASOURCE_USERNAME/PASSWORD, AI_ENGINE_URL, AMANGUARD_JWT_SECRET) —
# see docker/docker-compose.yml; application.yaml keeps the local-dev defaults.
ENTRYPOINT ["java", "-jar", "app.jar"]
