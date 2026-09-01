# Gym Control v4

PWA personal para registrar rutinas, pesos, repeticiones, piscina y peso corporal.

## Novedades v4

- Editor de rutinas dentro de la propia app.
- Cambiar nombre de ejercicios sin perder la relación con el historial.
- Cambiar series y rango de repeticiones.
- Cambiar un ejercicio entre peso/repeticiones y tiempo.
- Añadir ejercicios.
- Eliminar ejercicios sin borrar el historial anterior.
- Reordenar ejercicios.
- Crear nuevas rutinas.
- Eliminar y reordenar rutinas.
- Editar duración y plan de piscina.
- Rutinas independientes por perfil (Gus / Tam).
- Restablecer las rutinas originales sin borrar el historial.
- La copia de seguridad incluye rutinas personalizadas.

## Actualizar desde una versión anterior

Sustituye en GitHub los archivos del proyecto por los de esta versión y haz Commit.
NO hace falta borrar el repositorio ni cambiar GitHub Pages.

La app mantiene la misma clave local (`gymControlV1`), por lo que los entrenamientos y pesos
ya guardados en el mismo iPhone y bajo la misma URL de GitHub Pages se conservan.

Al abrir v4 por primera vez, si un perfil todavía no tenía rutinas personalizadas, la app copia
las rutinas originales a ese perfil automáticamente.

## Editar rutinas

En la app:

Ajustes > Editar rutinas

Cada perfil tiene sus propias rutinas locales.

## Publicar con GitHub Pages

1. Sube `index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js`, `README.md` y `icons/`.
2. Settings > Pages.
3. Deploy from a branch.
4. `main` y `/ (root)`.

## Copias de seguridad

Ajustes > Exportar datos.

El JSON exportado contiene perfiles, entrenamientos, peso corporal y rutinas personalizadas.
