# AGENTS.md

## Project Overview
- This is an Angular 21 application for managing agents, products, categories, and financial operations for a cheese-and-cream business.
- The app is bootstrapped from `src/main.ts` with `bootstrapApplication`, `provideRouter(routes)`, `provideHttpClient()`, and the global `BsModalService`.
- Routing is centralized in `src/app/app-routing.module.ts`: `/dashboard`, `/agents`, `/financial-operations`, and `/products`; the empty path redirects to `/dashboard`.
- `AppComponent` owns the persistent sidebar and `<router-outlet>` in `src/app/app.component.html`. Add new top-level navigation here as well as to the route table.

## Architecture and Data Flow
- Domain folders under `src/app/` contain a component, template, stylesheet, model interfaces, and (where needed) an HTTP service. Keep new domain behavior in its domain folder.
- `AgentService`, `ProductService`, `CategoryService`, and `FinancialOperationService` are root-provided wrappers around `HttpClient`. Components subscribe to their observables and update local arrays/state.
- The backend is expected at `http://localhost:8080`; current service bases are `/api/agents`, `/api/products`, `/api/categories`, and `/api/financial-operations`.
- Product and financial-operation screens depend on agents: products loads agents/categories first, while financial operations loads agents and then fetches products per agent with `forkJoin`.
- List endpoints may return either a plain array or a paged object with `content`; preserve the existing normalization pattern: `Array.isArray(data) ? data : (data?.content ?? [])`.
- Financial operation requests map the UI value `PAGO` to the API value `PAYMENT`; API operation types are `SALE`, `PURCHASE`, and `PAYMENT`.
- Dashboard API documentation is in `.ai/guides/DashBoard/`; `DashboardService` is not implemented yet, so dashboard API work should start from those specs.

## Angular Conventions
- The root component is standalone, but generated components default to `standalone: false` in `angular.json`. Existing feature components for agents, products, and financial operations explicitly opt into standalone and import `CommonModule`, `FormsModule`, and `HttpClientModule`.
- Use the existing class-based Angular components and `OnInit` lifecycle style. Do not introduce a different state-management library for local CRUD state.
- Forms use `[(ngModel)]` through `FormsModule`, explicit `*Invalid()` helpers, submitted flags, and Spanish user-facing error strings.
- Modal workflows use `BsModalService` and `BsModalRef`; saving flags prevent duplicate requests, and `finalize` clears them.
- Some HTTP callbacks call `NgZone.run()` and `ChangeDetectorRef.detectChanges()` after updating state. Preserve this when changing those existing async flows unless the component is deliberately migrated as a whole.
- Use `trackBy...Id` methods for repeated agent, product, and category rows, following the existing component patterns.

## Styling and Assets
- Bootstrap 5.3 is loaded globally before `src/styles.css`; ngx-bootstrap supplies modal behavior.
- Global visual tokens, fonts, colors, and the dark radial background live in `src/styles.css`. Component-specific layout belongs in the matching `*.component.css` file.
- Use the existing `Manrope`/`Space Grotesk` typography and CSS variables rather than adding a competing global theme.

## Developer Workflow
- Install dependencies with `npm install` (the repository declares `npm@11.11.0`).
- Start the development server with `npm start` and open the displayed Angular URL. The frontend requires the backend on port `8080` for HTTP-backed screens.
- Create a production build with `npm run build`; use `npm run watch` for development rebuilds.
- Run unit tests with `npm test`. Tests use Angular's unit-test builder with Vitest, and current specs are basic component-creation smoke tests.
- For SSR output, build first and run `npm run serve:ssr:cheese-and-cream-ui`; avoid browser-only APIs in code that can execute during server rendering.
- Before changing a service contract, check the matching model in the same domain folder and the dashboard/API notes under `.ai/guides/`.