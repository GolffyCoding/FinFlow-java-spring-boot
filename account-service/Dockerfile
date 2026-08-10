FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY pom.xml .
COPY shared-lib ./shared-lib
COPY api-gateway ./api-gateway
COPY auth-service ./auth-service
COPY account-service ./account-service
COPY transaction-service ./transaction-service
COPY fraud-service ./fraud-service
COPY notification-service ./notification-service
COPY audit-service ./audit-service
RUN apk add --no-cache maven && mvn -pl account-service -am clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/account-service/target/*.jar app.jar
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Duser.timezone=UTC", "-Doracle.jdbc.timezoneAsRegion=false", "-jar", "app.jar"]
