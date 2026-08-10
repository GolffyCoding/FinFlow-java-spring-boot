# FinFlow - Enterprise Payment & Transaction Processing Platform

> A simulated banking / payment-gateway backend for managing customers, accounts, transactions,
> money transfers, and AI-powered fraud detection.

## 🏗️ Architecture Overview

```
                    React Admin Dashboard (Port 3000)
                            │
                            ▼
                    API Gateway (Port 8080)
                    Spring Cloud Gateway
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
  Auth Service        Account Service      Transaction Service
  (Port 8081)         (Port 8082)          (Port 8083)
  Spring Security     @Transactional       Kafka Producer
  JWT + RBAC          Pessimistic Lock     Feign Client
  Rate Limiting       Idempotency Key      Event-Driven
  Refresh Token
       │                    │                    │
       └──────────────┬─────┴────────────────────┘
                      ▼
                    Apache Kafka
                      │
       ┌──────────────┼───────────────┐
       ▼              ▼               ▼
 Notification     Fraud Service    Audit Service
 Service          (Port 8084)      (Port 8086)
 (Port 8085)          │
    │                 ▼
    ▼             ML Model
 Redis            Python FastAPI
 (Cache)         (Port 8000)
                      │
       └──────────────┬───────────────┘
                      ▼
              Oracle 21c / SQL Server 2022
                      │
                      ▼
        Docker → Kubernetes (AWS EKS)
                      │
                      ▼
    Prometheus + Grafana + Jaeger (Observability)
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Java 21
- Node.js 20
- Maven 3.9+

### Run with Docker Compose
```bash
# Clone repository
git clone https://github.com/GolffyCoding/FinFlow-java-spring-boot.git
cd FinFlow-java-spring-boot

# Start all services
docker compose up -d

# Access services
# Frontend:    http://localhost:3000
# API Gateway: http://localhost:8080
# Eureka:      http://localhost:8761
# MailHog:     http://localhost:8025
# Grafana:     http://localhost:3001
# Prometheus:  http://localhost:9090
# Jaeger:      http://localhost:16686
```

### Run Locally (Development)
```bash
# 1. Start infrastructure
docker compose up -d redis kafka oracle mailhog

# 2. Build shared library
cd shared-lib && mvn clean install && cd ..

# 3. Start services (in separate terminals)
cd auth-service && mvn spring-boot:run
cd account-service && mvn spring-boot:run
cd transaction-service && mvn spring-boot:run
cd fraud-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
cd audit-service && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run

# 4. Start frontend
cd frontend && npm install && npm run dev

# 5. Start ML service
cd fraud-ml && pip install -r requirements.txt && python main.py
```

### Switch Database Backend: Oracle → SQL Server
By default the stack runs on Oracle. To run the same services against SQL Server instead:
```bash
docker compose -f docker-compose.yml -f docker-compose.sqlserver.yml --profile sqlserver up -d --build
```
This starts a SQL Server 2022 container, provisions the `finflow` database/login, and points
`auth-service`, `account-service`, `transaction-service`, `fraud-service`, `notification-service`,
and `audit-service` at it via `DB_VENDOR=sqlserver` (each service auto-selects its matching
Flyway migration set and Hibernate dialect). The `oracle` service keeps running alongside unless
stopped separately with `docker compose stop oracle`.

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout and revoke tokens |

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create new account |
| GET | `/api/accounts/{id}` | Get account by ID |
| GET | `/api/accounts/number/{accountNumber}` | Get account by account number |
| GET | `/api/accounts/{id}/balance` | Get account balance |
| POST | `/api/accounts/{id}/freeze` | Freeze account |
| POST | `/api/accounts/{id}/unfreeze` | Unfreeze account |
| POST | `/api/accounts/transfer` | Transfer money (idempotency key supported) |
| POST | `/api/accounts/deposit` | Deposit funds |
| POST | `/api/accounts/withdraw` | Withdraw funds |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions/transfer` | Process transfer between two accounts |
| POST | `/api/transactions/deposit` | Process deposit |
| POST | `/api/transactions/withdraw` | Process withdrawal |
| POST | `/api/transactions/payment` | Process payment to a merchant |
| POST | `/api/transactions/refund` | Process refund from a merchant |
| GET | `/api/transactions` | List all transactions (paginated, filter by `status`) |
| GET | `/api/transactions/{transactionId}` | Get transaction details |
| GET | `/api/transactions/account/{accountNumber}` | List transactions for an account |
| GET | `/api/transactions/stats/today` | Today's transaction statistics |
| GET | `/api/transactions/stats/daily?days=N` | Daily volume/count for the last N days |

### Fraud Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fraud/alerts` | List fraud alerts (paginated, filter by `status`) |
| GET | `/api/fraud/alerts/{id}` | Get a single fraud alert |
| POST | `/api/fraud/alerts/{id}/resolve` | Resolve an alert (RESOLVED / CONFIRMED_FRAUD / INVESTIGATING) |
| GET | `/api/fraud/stats` | Fraud dashboard stats (open alerts, severity breakdown) |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/logs` | List audit log entries (paginated, filter by `eventType`) |
| GET | `/api/audit/logs/transaction/{transactionId}` | Full audit trail for a specific transaction |

## 🔐 Default Credentials
```
Username: admin
Password: admin123
Roles: ADMIN, OPERATOR
```

## 🖥️ Frontend

Built with React 18 + TypeScript + Vite, using shadcn/ui and Tailwind CSS. All pages are wired
to real backend data (no mock/hardcoded content) and route-level code-split with `React.lazy`.

| Page | Route | Highlights |
|------|-------|------------|
| Executive Dashboard | `/` | Live KPIs, 7-day volume trend, fraud severity distribution, recent activity |
| Transaction Explorer | `/transactions` | Quick status filters, search by transaction ID, Deposit/Withdraw/Payment/Refund actions |
| Transaction Detail | `/transactions/:id` | Hero status card + audit-log-driven timeline |
| Transfer | `/transfer` | 4-step guided flow: Recipient → Amount → Review → Success |
| Accounts | `/accounts` | Account list, creation, freeze/unfreeze |
| Fraud Center | `/fraud-alerts` | Severity breakdown cards (Critical/High/Medium/Low), alert list |
| Fraud Investigation | `/fraud-alerts/:id` | Transaction / Risk Analysis / Account columns with Approve, Keep Blocked, and Escalate actions |
| Audit Logs | `/audit-logs` | Full audit trail, searchable by transaction ID |

## 🧪 Key Features Demonstrated

### 1. Distributed Transactions & Concurrency Correctness
- `@Transactional` combined with Pessimistic Locking (`SELECT ... FOR UPDATE`) for balance updates
- Idempotency keys via Redis to make transfer/deposit/withdraw safe to retry
- Verified under real concurrent load (100 simultaneous transfers against a fixed balance produce
  exactly the correct success/reject split with the final balance never going negative)

### 2. Security
- JWT Access Token (15 min) + Refresh Token (7 days)
- RBAC: ADMIN, OPERATOR, AUDITOR, CUSTOMER
- BCrypt password hashing (strength 12)
- Rate limiting with Redis (100 req/min per IP)
- Account lockout after repeated failed attempts

### 3. Event-Driven Architecture
- Kafka for async communication (`transaction-events` topic)
- `TransactionCreatedEvent` → Fraud Detection + Notification + Audit consumers
- Event sourcing pattern for the audit trail

### 4. AI/ML Integration
- Python FastAPI service with XGBoost (rule-based fallback when the ML service is unavailable)
- Fraud scoring: LOW / MEDIUM / HIGH / CRITICAL
- Real-time fraud alert dashboard and per-transaction investigation workspace

### 5. Microservices Patterns
- API Gateway with Spring Cloud Gateway (routes for auth, account, transaction, fraud, and audit services)
- Service discovery with Eureka
- Inter-service communication with OpenFeign
- Shared exception-handling and DTO library (`shared-lib`) across all services

### 6. Database
- Oracle 21c (primary) and SQL Server 2022 (switchable via Compose profile)
- Flyway migrations, with a matching migration set per database vendor
- Connection pooling (HikariCP)

### 7. Caching & Session
- Redis for session storage
- Rate limiting counters
- Idempotency keys

### 8. Containerization & Orchestration
- Docker multi-stage builds
- Docker Compose for local development
- Kubernetes manifests (Namespace, ConfigMap, Secret, HPA, Ingress)
- Health checks (liveness + readiness probes)

### 9. CI/CD
- GitHub Actions: Build → Test → SonarQube → Docker → Deploy to K8s
- OWASP Dependency Check
- Trivy vulnerability scanning
- Automated deployment to AWS EKS

### 10. Observability
- Prometheus metrics
- Grafana dashboards
- Jaeger distributed tracing
- Spring Boot Actuator
- OpenTelemetry

## 📁 Project Structure
```
finflow/
├── api-gateway/           # Spring Cloud Gateway + JWT Filter + Rate Limiting
├── auth-service/          # Authentication + Authorization + RBAC
├── account-service/       # Account management + balance operations
├── transaction-service/   # Transaction processing + Kafka Producer
├── fraud-service/         # Fraud detection + Kafka Consumer + ML Client
├── notification-service/  # Email notifications + Kafka Consumer
├── audit-service/         # Immutable audit trail + Kafka Consumer
├── fraud-ml/              # Python FastAPI + XGBoost model
├── frontend/               # React 18 + TypeScript + shadcn/ui + Recharts
├── shared-lib/             # Common DTOs, events, exception handling
├── k8s/                    # Kubernetes manifests
├── monitoring/              # Prometheus + Grafana configs
├── .github/workflows/       # CI/CD pipelines
└── docker-compose.yml       # Full stack orchestration
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3, Spring Security |
| API | REST, OpenFeign |
| Microservices | Spring Cloud Gateway, Eureka |
| Database | Oracle 21c, SQL Server 2022 |
| ORM | Hibernate / JPA |
| Migration | Flyway |
| Messaging | Apache Kafka |
| Cache | Redis |
| Frontend | React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query, Recharts |
| AI/ML | Python, FastAPI, XGBoost |
| Container | Docker, Kubernetes |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus, Grafana, Jaeger |
| Cloud | AWS EKS |

## 📝 License
MIT License - For educational and portfolio purposes.

---

> **Note:** This project was built to demonstrate the ability to design and implement an
> enterprise banking platform on Java Spring Boot microservices — covering system architecture,
> concurrency handling, distributed systems, AI integration, and DevOps practices.
