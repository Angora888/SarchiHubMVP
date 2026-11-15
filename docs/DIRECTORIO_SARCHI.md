# Directorio Sarchí — módulo público (fase inicial)

Se implementa en una rama separada y comparte hosting con Sin Filas, **no** sus tablas de restaurantes.

## Arquitectura
- Dos frontends independientes (Sin Filas y futuro Directorio Sarchí).
- Una API: endpoints `GET /api/directory/categories`, `GET /api/directory/businesses` y `GET /api/directory/businesses/{slug}`.
- Contexto EF `DirectoryDbContext` usando la misma connection string `DefaultConnection`, con esquema PostgreSQL `directory`.
- Solo registros con `Status = Published` se muestran públicamente.
- No se agregan endpoints de escritura hasta diseñar autenticación y propiedad de fichas comerciales.

## Preparación y validaciones antes de desplegar
1. Probar compilación .NET 10 y pruebas de regresión de Sin Filas.
2. Ejecutar y verificar `database/directory/001_create_directory.sql` **solo en staging** tras respaldo; no se ejecuta desde el arranque de la API.
3. Agregar categorías y registros de prueba a staging (solo con consentimiento para publicar).
4. Probar GET de categorías, paginación, búsquedas, filtros y ocultación de negocios Pending.
5. Agregar el origen exacto del nuevo frontend a `Cors:AllowedOrigins` (sin comodines).
6. Validar métricas CPU/memoria y conexión Neon del App Service compartido.
7. Revisar seguridad existente de endpoints de restaurantes antes de habilitar administración del directorio.

## Pendiente
- Frontend independiente.
- Modelo de propietarios y autorización por ficha (no depender del claim RestaurantId).
- Horarios, múltiples categorías, fotos en Blob Storage, revisión y aprobación.
- SEO de fichas con renderizado/pre-renderizado.
- Migraciones EF Core o consolidación formal del script SQL en el pipeline.
