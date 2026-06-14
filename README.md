# SaaS Veterinaria

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

## 🐳 Cómo levantar el proyecto en local con Docker

Para facilitar el despliegue local y evitar problemas de compatibilidad (o los famosos "en mi máquina sí funciona"), el proyecto está dockerizado.

### Requisitos previos
*   Tener instalado [Docker](https://www.docker.com/products/docker-desktop/) y Docker Compose en tu máquina.

### Pasos para iniciar el entorno local

1. Asegúrate de estar en la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).
2. Ejecuta el siguiente comando en tu terminal para construir la imagen y levantar el contenedor en segundo plano:

```bash
docker compose up -d --build
```

3. ¡Listo! La aplicación frontend de Next.js estará disponible en tu navegador en:
   👉 **http://localhost:3000**

### Comandos útiles de Docker

*   **Para ver los logs del contenedor en tiempo real:**
    ```bash
    docker compose logs -f
    ```
*   **Para detener los contenedores (sin borrar los datos):**
    ```bash
    docker compose stop
    ```
*   **Para detener y eliminar los contenedores:**
    ```bash
    docker compose down
    ```
