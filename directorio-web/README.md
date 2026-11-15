# Directorio Sarchí — frontend independiente

Sitio React + Vite + TypeScript. Vive en `directorio-web/`, separado del frontend de Sin Filas, y consume la **misma API** ASP.NET Core alojada en Azure.

## Ejecutar localmente

```bash
cd directorio-web
npm install
cp .env.example .env.local
# Editar VITE_API_URL con la URL real de la API (sin barra final).
npm run dev
npm run build
```

## Publicar en Vercel
- Importar `Angora888/SarchiHubMVP` como **otro proyecto Vercel**, diferente de Sin Filas.
- Root Directory: `directorio-web`.
- Framework: Vite; Build Command: `npm run build`; Output Directory: `dist`.
- Variable: `VITE_API_URL=https://<api-real>`.
- Agregar el dominio exacto del frontend a `Cors:AllowedOrigins` en Azure.
- Antes de publicar: ejecutar `database/directory/001_create_directory.sql` en staging y comprobar endpoints. Nunca correrlo en producción sin respaldo ni revisión.

## Estado
Vista pública, búsqueda, filtros por distrito/categoría, paginación y ficha individual. No se muestran negocios ficticios: los datos se leen exclusivamente de la API. Registro de comercios y panel admin se implementarán posteriormente.

## SEO
Esta versión es SPA, con metadatos globales. Antes de lanzamiento público se recomienda prerenderizar o SSR las fichas individuales para indexación social y buscadores.
