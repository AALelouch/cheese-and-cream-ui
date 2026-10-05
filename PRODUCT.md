# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cheese & Cream staff use the application to keep the business's daily customer, supplier, inventory, sales, payment, purchase, and operating-cost records in one place. This is inferred from the implemented routes and workflows; named roles and permissions remain an open product decision.

## Product Purpose

The product is an operational ledger for a cheese-and-cream business. It gives staff a consistent way to maintain counterparties and stock, record financial operations, and read revenue, profit, and outstanding balances.

## Operating Context

The primary workflow moves between a financial overview and detailed CRUD records for clients, providers, products, financial operations, and operating costs. Currency is presented in Colombian pesos, and the interface language is Spanish.

## Capabilities and Constraints

- Angular web application backed by a Spring Boot REST API.
- Authenticated routes use an API key stored for the browser session.
- Financial operations distinguish sales, purchases, and payments.
- Lists support search, pagination, loading, empty, and API-error states.
- The interface must retain the existing service contracts and Spanish terminology.

## Brand Commitments

The product name is Cheese & Cream. Preserve the logo at `src/assets/img/logo.png`, the “Libro de bodega” descriptor, and the established cream-and-gold-on-blue-black identity unless the user explicitly requests a rebrand.

## Evidence on Hand

The repository contains the production logo, implemented workflows, domain models, API services, and dashboard metrics. It contains no testimonials, benchmarks, public marketing claims, or named customer evidence; future work must not fabricate them.

## Product Principles

- Make the financial state scannable before exposing record-level detail.
- Keep operational actions explicit, reversible where possible, and paired with clear recovery copy.
- Distinguish unavailable data from legitimate zero values.
- Preserve consistent Spanish terminology across navigation, forms, and feedback.
- Favor dependable task completion over decorative complexity.

## Accessibility & Inclusion

Maintain keyboard-visible focus, semantic landmarks and table headers, labelled form controls, 44px touch targets, reduced-motion behavior, and WCAG AA contrast.
