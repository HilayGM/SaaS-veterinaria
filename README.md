# SaaS Veterinaria

🚀 **URL de Producción:** [https://saa-s-veterinaria.vercel.app/](https://saa-s-veterinaria.vercel.app/)

Este repositorio contiene el código fuente para el proyecto SaaS Veterinaria.

## 🌿 Estrategia de Ramas (Branching)

Para mantener un entorno de desarrollo organizado y libre de conflictos, utilizamos el siguiente flujo de trabajo con las ramas:

*   **`main`**: Es la rama principal y estable del proyecto. Contiene el código listo para producción. **No se debe desarrollar directamente en esta rama.**
*   **`dev`**: Es la rama de desarrollo principal. Actúa como un entorno de integración donde se fusionan y prueban todas las nuevas características antes de su paso a producción.
*   **`feature/*`**: Ramas destinadas al desarrollo de nuevas funcionalidades o tareas específicas.
*   **`docs/*`**: Ramas destinadas exclusivamente a actualizaciones o creación de documentación.

### Flujo de Integración

1.  **De `feature` a `dev`**: Todo desarrollo de una nueva funcionalidad debe realizarse en una rama `feature/nombre-de-la-tarea`. Una vez finalizado y probado, se debe realizar un Pull Request (PR) o Merge hacia la rama `dev`.
2.  **De `dev` a `main`**: Cuando la rama `dev` ha acumulado suficientes características nuevas, está estable y lista para un lanzamiento (release), se realiza un Merge desde `dev` hacia `main`.
3.  **De `docs` a `main`**: Dado que los cambios en documentación no afectan el funcionamiento de la aplicación, las ramas `docs/nombre-del-documento` pueden ser fusionadas directamente hacia la rama `main` (o `dev` si es documentación interna de desarrollo) para mantenerla actualizada rápidamente.

---

## 💻 Cómo correr localmente

Sigue estos pasos para levantar el entorno de desarrollo localmente:

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd SaaS-veterinaria
   ```

2. **Crear el archivo de entorno:**
   Crea un archivo llamado `.env.local` y añade las variables de entorno necesarias.

3. **Instalar dependencias:**
   ```bash
   npm install
   ```

4. **Correr el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

### 🗄️ Configurar la Base de Datos con Supabase CLI (Recomendado)

Para conectarte al proyecto en línea, descargar la versión más reciente de la base de datos y montar un entorno local para pruebas sin afectar producción:

1. **Inicia sesión en Supabase CLI:**
   ```bash
   npx supabase login
   ```
   *(Te pedirá un Access Token, puedes generarlo en la configuración de tu cuenta de Supabase en el navegador).*

2. **Vincula el proyecto con la nube:**
   ```bash
   npx supabase link --project-ref <TU_PROJECT_ID>
   ```
   *(El `<TU_PROJECT_ID>` lo encuentras en la URL de tu proyecto en Supabase o en los Settings Generales de tu proyecto. Te pedirá la contraseña de la base de datos).*

3. **Descarga el esquema más reciente (Pull):**
   ```bash
   npx supabase db pull
   ```
   *(Esto descargará la estructura de la base de datos a tu carpeta `supabase/migrations` para que la tengas sincronizada).*

4. **Levanta Supabase localmente para pruebas:**
   ```bash
   npx supabase start
   ```
   *(Este comando usará Docker para montar una réplica de Supabase en tu máquina. Al finalizar te dará las credenciales locales como la API URL, la anon key y la URL del Studio local, útil para que cambies tu archivo `.env` o `.env.local` y apunte ahí en lugar de a producción).*

**Nota:** Si vas a probar localmente, asegúrate de tener Docker instalado y ejecutándose antes de hacer `npx supabase start`.

---

## 🐳 Cómo levantar todo el proyecto en local con Docker (Full Stack)

El proyecto completo (Frontend + Base de Datos Supabase) está dockerizado para que no haya problemas de compatibilidad. 

### Requisitos previos
*   Tener instalado [Docker Desktop](https://www.docker.com/products/docker-desktop/) corriendo en tu máquina.

### Paso 1: Levantar el Backend (Supabase Local con Migraciones)
El CLI de Supabase administra automáticamente todos sus propios contenedores de Docker (Base de datos, Autenticación, API, etc.). 

**Nota importante sobre la Base de Datos:**
Al iniciar el entorno, Supabase aplicará automáticamente toda la estructura de la base de datos (tablas, relaciones y políticas de seguridad RLS). Toda esta estructura física y funcional se encuentra guardada en la carpeta `supabase/migrations/`. El archivo con la fecha más reciente dentro de esa carpeta representa el estado actual de la base de datos.

1. En la raíz del proyecto, ejecuta:
```bash
npx supabase start
```
*(Cuando termine, te dará una URL de Studio Local, y las credenciales locales de la API para que las pongas en tu archivo `.env`).*

### Paso 2: Levantar el Frontend (Next.js)
Una vez que Supabase está corriendo, puedes levantar la aplicación web.

1. Asegúrate de estar en la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).
2. Ejecuta el siguiente comando para construir la imagen y levantar el frontend:
```bash
docker compose up -d --build
```
3. ¡Listo! La aplicación frontend de Next.js estará disponible en tu navegador en: 👉 **http://localhost:3000**

### Comandos útiles para apagar el entorno

*   **Para apagar Supabase:**
    ```bash
    npx supabase stop
    ```
*   **Para apagar el Frontend:**
    ```bash
    docker compose down
    ```
