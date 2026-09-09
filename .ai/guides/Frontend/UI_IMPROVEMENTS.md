# Guía de mejora frontend/UI

## Propósito

Esta guía describe el sistema visual y las decisiones de interfaz aplicadas a Cheese & Cream. Está dirigida a quien mantenga la aplicación Angular y debe usarse para extender las pantallas de agentes, productos, operaciones y dashboard sin volver a duplicar estilos ni cambiar contratos de API.

La identidad es **cámara fría y libro de bodega**: una herramienta de trabajo sobria, legible y cálida en los momentos importantes. No usa fotografía ni decoración gratuita; la jerarquía proviene de la información, el espaciado y el contraste.

## Sistema visual

| Rol | Token | Uso |
| --- | --- | --- |
| Fondo principal | `--ink` `#101923` | Lienzo de la aplicación |
| Superficie operativa | `--ink-raised` `#15212e` | Paneles, modales y navegación |
| Superficie interactiva | `--ink-hover` `#1c2b3a` | Hover y selección secundaria |
| Límites | `--line` / `--line-strong` | Tablas, campos y contenedores |
| Contraste cálido | `--cream` `#f4ecd9` | Títulos y datos de máxima prioridad |
| Acción principal | `--butter` `#e1b85d` | Guardar, crear y foco visible |
| Estados | `--success`, `--info`, `--danger` | Venta/resultado positivo, información y error |

- `Manrope` se usa para lectura, formularios y navegación. `Space Grotesk` se reserva para encabezados y cifras importantes.
- Usar `--radius` en paneles y `--radius-sm` en controles. No añadir degradados a tarjetas ni sombras como sustituto de jerarquía.
- Las cifras monetarias deben usar `currency:'COP':'symbol-narrow':'1.0-0':'es-CO'`; `LOCALE_ID` ya está configurado como `es-CO` en `src/main.ts`.
- Las acciones primarias usan `.btn-primary`; las secundarias `.btn-ghost`; las acciones de edición `.btn-outline`; las destructivas `.btn-danger`.

## Base compartida

`src/styles.css` es la única fuente para las clases generales:

- Estructura: `.page`, `.page-header`, `.card`, `.card-header`, `.actions`, `.pill` y `.empty-state`.
- Formularios: `.form-grid`, `.form-group`, `.form-control`, `.field-note`, `.field-error` y `.form-actions`.
- Datos: `.table-wrap`, `.table`, `.amount` y `.row-actions`.
- Feedback: `.inline-alert`, estados de botón deshabilitado y foco visible global.
- Modales: `.modal-header`, `.modal-body`, `.modal-content`, `.modal-title` y `.close`.

Los CSS de dominio solo deben contener reglas que no se puedan expresar con esa base, como el detalle de una operación, la cuadrícula de métricas o una lista de categorías. Al crear una pantalla, empezar con la estructura compartida antes de añadir una clase local.

## Iconos

La aplicación usa `@lucide/angular`, no Font Awesome remoto. Para incluir un icono:

1. Importar el componente concreto desde `@lucide/angular` en el componente standalone, por ejemplo `LucidePackage`.
2. Declararlo en `imports` del decorador `@Component`.
3. Renderizarlo como `<svg lucidePackage size="19"></svg>`.
4. Dejarlo sin título si es decorativo: Lucide lo marcará como oculto para lectores de pantalla. Si el icono es el único contenido de un botón, el botón necesita un `aria-label` descriptivo.

Evitar importar un módulo de iconos completo: cada icono importado se incluye en el bundle. Los iconos deben apoyar una etiqueta visible, no reemplazarla en navegación, acciones principales o formularios.

## Navegación y responsive

- La navegación de escritorio permanece fija a la izquierda con texto, icono y estado activo.
- Bajo `760px`, usar la barra superior con marca y un botón de menú de 44 px. El menú se abre mediante `isNavigationOpen` y se cierra al navegar.
- No ocultar el nombre de una ruta en móvil. La navegación debe conservar texto legible incluso con iconos disponibles.
- Usar `max-width: 1420px` para el contenido, `clamp()` para los márgenes de escritorio y una sola columna para formularios y encabezados estrechos.
- Las tablas siguen teniendo scroll horizontal para no perder columnas financieras. Los valores numéricos usan `.amount`, alineación a la derecha y `font-variant-numeric: tabular-nums` donde corresponda.

## Patrones de interacción

### Carga, vacío y error

- Cada estado de carga debe informar qué se está cargando mediante `aria-live="polite"`.
- Un estado vacío nombra la causa y la siguiente acción. Ejemplo: “Este agente aún no tiene operaciones. Usa Crear operación para registrar el primer movimiento.”
- Los errores conservan `role="alert"` cuando el mensaje requiera atención inmediata. Deben explicar la acción de recuperación, no solo que algo falló.
- No mostrar una tabla vacía cuando todavía no se ha elegido un agente; mostrar un estado guiado en su lugar.

### Formularios y modales

- Las etiquetas deben estar en sentence case y asociarse con `for`/`id`.
- Validar al enviar y presentar el mensaje debajo del campo; no eliminar el valor escrito tras un error del servidor.
- Usar `.btn-primary` solo para la confirmación. Cancelar debe ser `.btn-ghost`.
- Al añadir un modal nuevo, enfocar el primer campo útil al abrirlo y devolver el foco al disparador al cerrarlo. Mantener el bloqueo de doble envío ya existente (`isSaving...`).
- Las eliminaciones deben conservar una confirmación explícita y señalar visualmente la acción destructiva con `.btn-danger`.

### Listados grandes

- Los chips de agente están permitidos únicamente para conjuntos pequeños. Si la lista supera aproximadamente 12 agentes, reemplazarlos por un `select` con búsqueda local o un panel filtrable; no cargar todos los productos hasta que se seleccione una persona.
- Añadir búsqueda local, ordenamiento o paginación solo cuando el endpoint o el requisito de negocio lo justifique. No cambiar los servicios HTTP para resolver una necesidad exclusivamente visual.

## Checklist para nuevas pantallas

1. Mantener servicios, modelos y rutas existentes; la capa de UI no debe alterar contratos API.
2. Componer la pantalla con las clases globales antes de agregar CSS local.
3. Usar color semántico solo para estado, no para decorar texto.
4. Aplicar foco visible, controles de al menos 44 px y orden de tabulación lógico.
5. Probar a 320 px, 768 px y escritorio; además, teclado, carga, error, vacío, formulario inválido y guardado en curso.
6. Ejecutar `npm run build` y `npm test`. Si npm informa un conflicto de pares de `ngx-bootstrap`, no actualizar Angular o Bootstrap durante una tarea de UI sin aprobar esa actualización por separado.

## Mantenimiento

La dependencia de iconos fue instalada con `npm install @lucide/angular --legacy-peer-deps` porque el proyecto tiene un conflicto de pares preexistente entre `ngx-bootstrap` y `@angular/animations`. Resolver ese conflicto es una tarea de dependencias separada. Antes de actualizar paquetes, registrar la versión actual, comprobar compatibilidad Angular 21 y ejecutar build, tests y una revisión manual de modales.
