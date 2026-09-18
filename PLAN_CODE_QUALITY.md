# Plan de mejora de calidad y datos

## Alcance

Ejecutar los puntos 1 y 3 al 8 de la revisión. El punto 2 (paginación y búsqueda
en selectores) se reserva para una historia futura; esta ejecución no agregará
controles de búsqueda ni cambiará contratos del backend para ello.

## Plan

1. Corregir la edición de productos para que el cuerpo de `PUT /api/products/{id}`
   incluya el `categoryId` correspondiente a `categoryName`. El ID del producto se
   mantiene en el path; categoría y agente se mantienen en el body.
2. Eliminar la precarga N+1 de productos en operaciones financieras. Cargar el
   inventario solo cuando el formulario de operación lo necesite y reutilizarlo
   mientras siga vigente.
3. Evitar que respuestas HTTP antiguas reemplacen la selección actual de agentes,
   páginas, saldos o inventarios mediante identificadores de solicitud.
4. Extraer el estado y las mutaciones de paginación a `shared/pagination.ts` y
   reutilizarlos en agentes, productos y operaciones.
5. Extraer las mutaciones locales repetidas de catálogos (reemplazo y eliminación
   por ID) a una utilidad compartida y aplicarla a categorías y tipos de
   identificación.
6. Declarar `OperationType` y sus etiquetas en el modelo de operaciones para no
   duplicar el union type ni ocultar tipos desconocidos con una etiqueta errónea.
7. Corregir la recarga de página después de guardar/eliminar agentes: guardar
   conserva la página; eliminar el último registro de una página vuelve a la
   anterior cuando corresponde.

## Criterios de aceptación

- Ningún componente restablece `categoryId` a cero al editar un producto cuya
  categoría existe en el catálogo cargado.
- Abrir operaciones no genera una petición de productos por cada agente.
- Las tres vistas paginadas usan el mismo modelo de paginación compartido.
- Una respuesta tardía no puede mostrar datos de una selección anterior.
- El proyecto compila con `npm run build`.
