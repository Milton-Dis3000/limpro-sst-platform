# API LIMPRO

Base local: `http://localhost:5000/api`

## Autenticación

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## Empresas

- `GET /companies`
- `POST /companies`
- `GET /companies/:id`
- `PATCH /companies/:id`
- `POST /companies/:id/logo`

## Perfil del evaluador

- `GET /evaluator/profile`
- `PUT /evaluator/profile`
- `POST /evaluator/profile/firma`
- `POST /evaluator/profile/logo`

## Cuestionarios

- `GET /questionnaires`
- `GET /questionnaires/:id`

## Evaluaciones

- `GET /assessments`
- `POST /assessments`
- `GET /assessments/:id`
- `PATCH /assessments/:id`
- `POST /assessments/:id/recalculate`
- `GET /assessments/public/:token`
- `POST /assessments/public/:token/responses`

## Reportes

- `GET /reports`
- `POST /reports/:assessmentId/pdf`
- `POST /reports/:assessmentId/excel`
