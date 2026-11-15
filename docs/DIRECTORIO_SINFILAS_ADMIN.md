# Directorio Sarchí — superadministrador con cuenta de Sin Filas

## Propósito
Permitir que el usuario activo de Sin Filas `angora88@gmail.com` inicie sesión en Directorio Sarchí con su contraseña actual, sin duplicar hashes ni compartir roles de administración con otros restaurantes.

## Diseño de seguridad
- El endpoint `POST /api/directory/admin/login` **primero** busca una cuenta habilitada expresamente en `directory.admin_accounts`.
- Si `auth_provider = 'SinFilas'`, verifica el usuario activo y contraseña BCrypt con `RestaurantHubContext.Usuarios`, utilizando la base actual de Sin Filas.
- Solo después de ambas verificaciones emite JWT corto (30 minutos) con claim `directory_admin`.
- El token normal de Sin Filas **no es suficiente** para entrar al panel: no contiene el claim exclusivo.
- El historial de moderación sigue enlazado al ID de `directory.admin_accounts`.
- Las cuentas locales anteriores conservan `auth_provider='Local'` como valor predeterminado.
- No se copian contraseñas ni hashes de Sin Filas.

## Secuencia de activación (revisar antes de desplegar)
1. Confirmar respaldo y que `angora88@gmail.com` exista y esté activo en `public."Usuarios"` en **SarchiHub / production**.
2. Revisar y ejecutar solo una vez el script `database/directory/004_sinfilas_admin_auth.sql` mediante el editor SQL de Neon, usando la rama **production** y la base **neondb**. El script agrega la columna `auth_provider` y autoriza únicamente la cuenta verificada.
3. Confirmar de forma **no sensible**: `SELECT email, auth_provider, is_active FROM directory.admin_accounts;` (no consultar `password_hash`).
4. Tras aprobar el PR y pasar las comprobaciones de CI, fusionarlo a `main` para desplegar en Azure y Vercel.
5. Abrir `https://directoriosarchi.vercel.app/admin`, introducir el correo y contraseña **de Sin Filas** en la página; **no** proporcionar la contraseña por el chat.
6. Verificar listado vacío de solicitudes, registrar un negocio propio para prueba, aprobarlo, y verificar que aparezca en el buscador.

## Reversión
En caso de problema de despliegue, revertir el commit de aplicación desde GitHub y verificar el estado de la API. La columna y fila añadidas al esquema del directorio son compatibles con el código previo si no se altera su uso. No tocar tablas de pedidos o restaurantes.
