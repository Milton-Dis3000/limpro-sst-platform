# Deploy LIMPRO

## Orden recomendado

1. Subir el repositorio a GitHub.
2. Publicar `backend` en Render.
3. Sembrar/verificar cuestionario psicosocial.
4. Publicar `frontend` en Vercel.
5. Actualizar `CORS_ORIGIN` en Render con la URL final de Vercel.

## Backend en Render

Render puede usar el archivo `render.yaml` ubicado en la raiz `sst-platform/`.

Configuracion esperada:

- Root directory: `backend`
- Build command: `npm install`
- Pre-deploy command: `npm run seed:psychosocial`
- Start command: `npm start`
- Health check path: `/health`

Variables requeridas en Render:

```env
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=https://TU-FRONTEND.vercel.app
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
```

Render define `PORT` automaticamente. No es necesario fijarlo.

## Frontend en Vercel

Crear un proyecto Vercel apuntando a:

- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Variable requerida en Vercel:

```env
VITE_API_URL=https://TU-BACKEND.onrender.com/api
```

## MongoDB Atlas

Para que Render pueda conectarse a MongoDB Atlas, la base debe permitir conexiones desde Render. Para una prueba rapida se puede usar:

```text
0.0.0.0/0
```

Para produccion conviene restringir el acceso segun la estrategia de red disponible.

## Prueba final

Backend:

```text
https://TU-BACKEND.onrender.com/health
```

Frontend:

```text
https://TU-FRONTEND.vercel.app
```

Flujo minimo:

1. Registro/login.
2. Crear empresa.
3. Crear evaluacion.
4. Responder cuestionario publico.
5. Revisar resultados.
6. Generar PDF, Word editable y Excel.
