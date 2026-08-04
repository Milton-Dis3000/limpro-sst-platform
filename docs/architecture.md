# Arquitectura LIMPRO

## Principios

- Backend y frontend separados.
- Cálculos críticos en backend.
- Cuestionarios versionados por módulo, país y versión.
- Evaluaciones vinculadas a empresa, evaluador y cuestionario.
- Respuestas guardadas con puntajes y resultado calculado para trazabilidad.

## Módulo psicosocial

El servicio `backend/src/services/scoring.service.js` calcula:

- puntaje por dimensión,
- riesgo por dimensión,
- puntaje global,
- riesgo global,
- agregación porcentual para reportes.

Rangos iniciales tomados de la hoja de tabulación:

| Dimensión | Alto | Medio | Bajo |
| --- | ---: | ---: | ---: |
| Carga y ritmo de trabajo | 4-7 | 8-12 | 13-16 |
| Desarrollo de competencias | 4-7 | 8-12 | 13-16 |
| Liderazgo | 6-11 | 12-17 | 18-24 |
| Margen de acción y control | 4-7 | 8-12 | 13-16 |
| Organización del trabajo | 6-11 | 12-17 | 18-24 |
| Recuperación | 5-9 | 10-15 | 16-20 |
| Soporte y apoyo | 5-9 | 10-15 | 16-20 |
| Otros puntos importantes | 24-48 | 49-72 | 73-96 |
| Global | 58-116 | 117-174 | 175-232 |

## Siguientes módulos SST

Para agregar ruido, iluminación o ergonomía:

1. Crear cuestionario con `modulo` propio.
2. Definir preguntas, dimensiones y reglas de puntuación.
3. Reutilizar `Assessment`, `Response`, `Report` y `scoring.service.js`.
4. Añadir vistas específicas si el módulo requiere captura distinta a preguntas cerradas.
