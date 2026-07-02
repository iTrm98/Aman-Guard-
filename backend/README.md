# AmanGuard Backend

Spring Boot 3 API for the AmanGuard fraud-prevention app. Java 17, Maven, H2 in-memory database.

## Running

```bash
./mvnw spring-boot:run
```

Starts on `http://localhost:8080`, all endpoints under `/api/**`. CORS is open for `http://localhost:5173` (the Vite dev server) in `common/config/CorsConfig.java`.

Demo data is seeded automatically on boot by a `CommandLineRunner` in each feature's `config/` package (`AccountDataInitializer`, `NotificationDataInitializer`, `CallVerificationDataInitializer`, `DashboardDataInitializer` — the latter seeds the initial `FraudCase`/`FreezeRequest` rows). Each seeder checks `repository.count() > 0` first, so restarting with a fresh H2 instance always reproduces the same demo state; nothing re-seeds on top of existing data.

The H2 web console is available at `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:amanguard`, user `sa`, empty password) — useful for inspecting seeded/created rows during development.

```bash
./mvnw test        # run backend tests
./mvnw compile      # compile only
```

## Package layout

Feature-based, not layer-based: `feature/<name>/{model,repository,config,dto/response,service,service/impl,controller}`. Copy `feature/callverification` as a template for a new feature — it's the smallest complete example.

## Switching from H2 to MySQL/PostgreSQL

H2 is in-memory only — all data is lost on restart, which is fine for a demo but not for anything real. To switch:

1. Add the driver dependency to `pom.xml` (remove the `h2` dependency, or leave it for tests):
   ```xml
   <!-- PostgreSQL -->
   <dependency>
     <groupId>org.postgresql</groupId>
     <artifactId>postgresql</artifactId>
     <scope>runtime</scope>
   </dependency>
   <!-- or MySQL -->
   <dependency>
     <groupId>com.mysql</groupId>
     <artifactId>mysql-connector-j</artifactId>
     <scope>runtime</scope>
   </dependency>
   ```
2. Update `src/main/resources/application.yaml`'s `spring.datasource` block:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/amanguard   # or jdbc:mysql://...
       driver-class-name: org.postgresql.Driver           # or com.mysql.cj.jdbc.Driver
       username: ${DB_USER}
       password: ${DB_PASSWORD}
     jpa:
       hibernate:
         ddl-auto: validate   # switch from `update` to `validate` once you have real migrations
   ```
3. Remove or disable `spring.h2.console` in the same file.
4. For a real deployment, replace `ddl-auto: update` with a migration tool (Flyway or Liquibase) instead of letting Hibernate auto-manage the schema.
5. The `CommandLineRunner` seed data initializers are dev/demo conveniences — you'll likely want to disable them (e.g. gate behind a `@Profile("demo")`) once there's a real database with real data.

## Connecting a future AI engine

`feature/fraudanalysis/service/impl/FraudAnalysisServiceImpl.java` currently does deterministic rule-based scoring — keyword matching against known fraud phrasing (OTP requests, urgency language, suspicious links, remote-access-tool mentions, etc.), not a trained model. It's real, working analysis, just not machine-learned.

To plug in a Python AI engine later:

- Keep the same `analyze(String text)` method signature and the same `AnalyzeFraudResponse` shape (`riskScore`, `riskLevel`, `riskLabel`, `findings`, `recommendation`, `interruptionQuestions`, `caseId`) — the frontend contract doesn't need to change.
- Inside `FraudAnalysisServiceImpl`, replace (or augment) the keyword-matching block with an HTTP call to the Python service (e.g. `RestClient`/`WebClient` to `POST http://ai-engine/predict` with the raw text), map its response into the same `RiskFindingResponse`/`InterruptionQuestionResponse` records, and persist the resulting `FraudCase` exactly as it does today.
- If the AI service can be slow or unavailable, decide on a fallback (e.g. fall back to the existing rule-based scoring rather than failing the request) — the rule-based engine is a reasonable degradation path since it's already implemented and tested.
