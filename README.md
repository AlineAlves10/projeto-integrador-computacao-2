# Babá Premium

Acompanhamento da rotina e da saúde de bebês, compartilhado entre responsáveis e babás.

| Pasta | Conteúdo |
|---|---|
| `backend/` | API REST Spring Boot (Java 21) com PostgreSQL |
| `frontend-angular/` | Front-end oficial em Angular 19 (TypeScript, CSS por componente) |
| `database/` | Scripts SQL de referência |
| `ml/` | Modelo de previsão de sono (scikit-learn) |

## Como executar

1. **Banco e front-end** (Docker Compose):

   ```bash
   docker compose up -d --build
   ```

   - PostgreSQL em `localhost:5433`
   - Front-end em http://localhost:3000 (build de produção do Angular servido por nginx)

2. **API** (porta 8080):

   ```bash
   cd backend
   mvn spring-boot:run
   ```

   Defina `JWT_SECRET` (mínimo 32 caracteres) para que os tokens continuem válidos entre reinícios.

### Desenvolvimento do front-end

```bash
cd frontend-angular
npm install
npm start                    # http://localhost:4200, com proxy /api -> localhost:8080
```

Detalhes da organização do front em [`frontend-angular/README.md`](frontend-angular/README.md).

## Testes

```bash
cd backend && mvn test       # testes de integração da API (H2 em memória, não usa o PostgreSQL)
cd frontend-angular && npm run build   # build de produção com checagem de tipos e templates
```
