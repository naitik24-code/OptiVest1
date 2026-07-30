# Deployment Architecture & Infrastructure Guide
**Project:** OptiVest AI  
**Environment:** Docker Compose / Production Cloud Container Orchestration  

---

## Container Environment Architecture

OptiVest AI utilizes a multi-container Docker Compose deployment model:

```
                  [ Nginx Reverse Proxy / Load Balancer ]
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────┐                             ┌─────────────────────┐
│  Frontend Container │                             │  Backend Container  │
│  (React Build SPA)  │                             │  (FastAPI Uvicorn)  │
└─────────────────────┘                             └──────────┬──────────┘
                                                               │
                                                               ▼
                                                    ┌─────────────────────┐
                                                    │ PostgreSQL Database │
                                                    │ (Persistent Volume) │
                                                    └─────────────────────┘
```

---

## Docker Compose Configuration Blueprint

```yaml
version: '3.8'

services:
  database:
    image: postgres:16-alpine
    container_name: optivest_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pgdata_vol:/var/lib/postgresql/data
    networks:
      - optivest_net

  backend:
    build:
      context: ../
      dockerfile: docker/Dockerfile.backend
    container_name: optivest_backend
    restart: always
    environment:
      DATABASE_URL: ${DATABASE_URL}
      ENVIRONMENT: ${ENVIRONMENT}
      MODEL_PATH: ${MODEL_PATH}
    ports:
      - "8000:8000"
    depends_on:
      - database
    networks:
      - optivest_net

  frontend:
    build:
      context: ../
      dockerfile: docker/Dockerfile.frontend
    container_name: optivest_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - optivest_net

networks:
  optivest_net:
    driver: bridge

volumes:
  pgdata_vol:
    driver: local
```

---

## Production Deployment Checklist
1. SSL/TLS termination configured via Let's Encrypt / Certbot.
2. PostgreSQL database automated backups configured.
3. Model artifacts stored in secure S3/Blob storage or persistent volume.
4. CORS headers restricted strictly to production web domain.
