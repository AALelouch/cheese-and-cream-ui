# Cheese & Cream UI

Aplicación web para la gestión operativa y financiera de un negocio de quesos y cremas. El proyecto centraliza la administración de agentes, productos, categorías y operaciones financieras en una interfaz oscura, responsive y orientada al trabajo diario.

Este repositorio forma parte de mi portafolio como ejemplo de una aplicación Angular conectada a una API REST, con flujos CRUD, formularios, modales, filtros por agente y un dashboard financiero.

## Funcionalidades

- **Dashboard financiero:** consulta de ingresos, ganancias y saldos pendientes por mes.
- **Gestión de agentes:** creación, edición y eliminación de clientes/agentes, incluyendo tipos de identificación.
- **Gestión de productos:** productos asociados a agentes y categorías, con operaciones CRUD.
- **Gestión de categorías:** creación, edición y eliminación desde el módulo de productos.
- **Operaciones financieras:** registro de ventas, compras y pagos por agente, mediante importes o selección de productos.
- **Consulta de saldos:** visualización del saldo pendiente total, mensual y por agente.
- **Diseño responsive:** navegación lateral adaptable a pantallas pequeñas y componentes preparados para distintos tamaños de viewport.

## Stack tecnológico

- Angular 21
- TypeScript 5.9
- RxJS
- Bootstrap 5.3
- ngx-bootstrap para modales
- Angular SSR con Express
- Vitest mediante el builder de pruebas de Angular
- CSS con variables globales, Manrope y Space Grotesk

## Arquitectura

La aplicación utiliza componentes por dominio dentro de `src/app/`. Cada módulo mantiene sus modelos, componentes, estilos y servicios HTTP cerca de la funcionalidad que implementa.

```text
src/
├── app/
│   ├── agents/                # Agentes, identificaciones y CRUD
│   ├── dashboard/             # Métricas financieras y saldos
│   ├── financial-operations/  # Ventas, compras y pagos
│   ├── invoices/              # Vista de facturas en evolución
│   └── products/              # Productos, categorías y CRUD
├── assets/                    # Recursos estáticos
├── main.ts                    # Bootstrap de la aplicación
└── styles.css                 # Tokens y estilos globales
```

La navegación principal se define en `src/app/app-routing.module.ts`. Los servicios de dominio usan `HttpClient` y están registrados como singletons con `providedIn: 'root'`.

## Integración con la API

El host y las rutas de la API se centralizan en `src/environments/`. El build de
desarrollo usa:

```text
http://localhost:8080
```

El build de producción usa rutas relativas (`/api/...`) por defecto. La variable
de entorno `API_BASE_URL` permite indicar otro host en tiempo de ejecución, sin
volver a compilar la imagen. Angular sustituye `environment.ts` por
`environment.development.ts` al ejecutar `npm start`, donde se conserva
`http://localhost:8080` como valor predeterminado.

Rutas principales utilizadas:

| Área | Base de API |
| --- | --- |
| Agentes | `/api/agents` |
| Productos | `/api/products` |
| Categorías | `/api/categories` |
| Operaciones | `/api/financial-operations` |
| Dashboard | `/api/dashboard` |

Las rutas compartidas, la clave de almacenamiento de autenticación y el esquema
del encabezado se definen una sola vez en `environment.config.ts`.

La documentación específica del dashboard está disponible en `.ai/guides/DashBoard/`, incluyendo contratos, respuestas y ejemplos de integración.

## Instalación y uso

### Requisitos

- Node.js compatible con Angular 21
- npm 11.11.0 o compatible
- Backend ejecutándose en el puerto `8080` para cargar datos reales

### Instalación

```bash
npm install
```

### Servidor de desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200/`.

### Build de producción

```bash
npm run build
```

### Docker Compose

Copia `.env.example` como `.env` si necesitas cambiar el host de la API o el
puerto publicado. Después inicia el frontend con:

```bash
docker compose up --build
```

La aplicación estará disponible en `http://localhost:4200/`. Las variables
admitidas son `API_BASE_URL` y `FRONTEND_PORT`.

### Tests

```bash
npm test
```

### SSR

Después de generar el build:

```bash
npm run serve:ssr:cheese-and-cream-ui
```

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm run watch` | Compila continuamente en modo desarrollo |
| `npm test` | Ejecuta las pruebas unitarias |
| `npm run serve:ssr:cheese-and-cream-ui` | Sirve la salida SSR compilada |

## Estado del proyecto

La aplicación cuenta con los flujos principales de gestión y con el dashboard financiero conectado a la API. La vista de facturas y algunos tests de creación de componentes permanecen en evolución.

