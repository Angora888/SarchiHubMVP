# Directorio Sarchí — operaciones y acceso administrativo

## Verificación automática de conectividad
Workflow `.github/workflows/directorio-live-smoke.yml`:
- Llama a la API de Azure desde un runner externo con Origin `https://directoriosarchi.vercel.app`.
- Exige HTTP 200, al menos 8 categorías y encabezado CORS correcto.
- No crea, modifica ni elimina comercios o restaurantes.
- Se puede ejecutar manualmente desde GitHub Actions.

## Activación del primer superadministrador
No existe administrador predeterminado. Para crear el primer usuario, ejecutar el script **en una computadora confiable**, después de verificar el proyecto y la base de Neon:

1. En Neon, abrir el proyecto **SarchiHub**, rama **production**, base **neondb**, y copiar localmente la cadena de conexión de forma privada.
2. Instalar Python 3 y:
   `python -m pip install "psycopg[binary]>=3.2,<4" "bcrypt>=4,<6"`
3. Definir `DIRECTORY_DATABASE_URL` en una variable de entorno de la consola. No guardarla en el repositorio ni enviarla por chat.
4. Ejecutar `python scripts/provision_directory_admin.py`.
5. Introducir el correo del administrador y una contraseña robusta cuando el script los solicite. El script usa `getpass` y genera BCrypt; no escribe contraseñas en la consola, archivos ni commits.
6. Abrir `https://directoriosarchi.vercel.app/admin` e iniciar sesión. La sesión JWT caduca después de 30 minutos.
7. Probar registro de un negocio propio con consentimiento, confirmar el estado Pending, aprobarlo desde el panel y comprobar que sea visible públicamente.

**No usar** el rol de administrador de restaurantes de Sin Filas para acceder al directorio. Son identidades separadas.

## Estado
La prueba de categorías verifica lecturas y CORS, no comprueba un POST de registro ni la aprobación de una ficha. Esos flujos requieren pruebas funcionales autenticadas. Mantener las contraseñas y cadenas de conexión fuera de GitHub Actions salvo si se configuran como secretos protegidos.

## Cuidado operativo
Una rama de respaldo de Neon fue creada antes de incorporar el esquema del directorio. Nunca eliminar datos de restaurantes ni ejecutar migraciones globales solo para este módulo.
