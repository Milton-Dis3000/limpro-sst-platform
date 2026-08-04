# LIMPRO

Plataforma SaaS para evaluaciones SST. El MVP inicia con riesgo psicosocial y queda preparado para incorporar ruido, iluminación, riesgos físicos y ergonomía.

## Estructura

```text
sst-platform/
  backend/
  frontend/
  docs/
```

## Backend

Stack principal:

- Node.js 20+
- Express 5
- MongoDB Atlas con Mongoose 9
- JWT access y refresh tokens
- bcryptjs, Resend, Cloudinary, Multer, Winston, Helmet, Morgan, CORS y Dotenv

Primer arranque:

```bash
cd backend
cp .env.example .env
npm install
npm run seed:psychosocial
npm run dev
```

El seed crea el cuestionario psicosocial con las dimensiones y rangos replicados desde el Excel base.

## Frontend

Stack principal:

- React 19
- Vite 8
- React Router 7
- Axios
- Tailwind CSS 4
- Framer Motion preparado
- React Hot Toast
- Lucide React
- Lottie preparado

Primer arranque:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Flujo MVP

1. Consultor crea cuenta e inicia sesión.
2. Completa perfil profesional, logo y firma.
3. Registra una empresa cliente.
4. Crea evaluación psicosocial.
5. Copia el enlace público para trabajadores.
6. Trabajadores responden el formulario.
7. Backend calcula riesgo por dimensión y global.
8. Consultor revisa resultados.
9. Genera PDF y respaldo Excel.

## Deploy

- Backend: Render.
- Frontend: Vercel.
- Base de datos: MongoDB Atlas M0.
- Imágenes: Cloudinary.
- Emails: Resend.
- Monitoreo: UptimeRobot.

Guia paso a paso:

[docs/deploy.md](docs/deploy.md)
