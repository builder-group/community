# Hono API Structure

How Hono API code should be organized across builder.group projects.

## Structure

Keep API code split by responsibility:

```txt
src/
├── app/          # Hono construction, middleware, routes, transport composition
├── environment/  # App-wide config, bindings, and runtime resources
├── modules/      # Bounded product, system, or integration behavior
├── lib/          # Thin shared helpers
└── openapi/      # Generated consumer-facing API contract, when published
```

Only create the folders the API needs. Small APIs can stay small.

## Folder Roles

### `app/`

Owns `createApi`, global middleware, route registration, and other HTTP transport composition.

- Keep routes focused on HTTP validation, module calls, and response serialization
- Keep transport registration and ordering in `app/`

### `environment/`

Owns app-wide configuration, generated bindings, initialized resources, and runtime setup.

Keep one top-level `environment/`. Organize its contents by app-wide infrastructure concern. Keep `modules/` organized by bounded behavior:

- Put declarative app-wide configuration in `environment/configs/`
- Put each app-wide runtime resource or set of generated bindings in a descriptive folder, such as `environment/database/` or `environment/generated/`
- Keep request-, flow-, or module-scoped configuration and setup directly in its owning module
- Do not use `environment/` as a generic home for constants

### `modules/`

Owns bounded product, system, or integration behavior.

- Keep setup specific to a behavior inside its owning module
- Keep workflows that coordinate operations or resources in their owning module
- Use the module entry point across module boundaries, and use direct imports within a module
- Do not depend on routes or app assembly

### `lib/`

Owns helpers that are shared across multiple modules and do not belong to one specific module.

- Keep `lib/` thin, and move helpers into a module when they are only used there

### `openapi/`

Owns a generated API contract when the API exposes one to consumers through a separate package entrypoint.

- Keep route-specific OpenAPI schemas beside their routes

## Example

```txt
src/
├── app/
│   ├── app.ts
│   ├── middleware/
│   └── routes/
│       ├── index.ts
│       ├── v1.accounts/
│       │   ├── index.ts
│       │   └── schema.ts
│       └── v1.health/
│           ├── index.ts
│           └── schema.ts
├── environment/
│   ├── configs/
│   ├── database/
│   └── generated/
├── modules/
│   ├── account/
│   ├── error/
│   └── notification/
├── lib/
└── openapi/
```

App config or a database pool intentionally shared across the API belongs in `environment/`. State, configuration, clients, repositories, and caches scoped to one module remain with that module. A validation helper used by several unrelated modules can remain in `lib/`.
