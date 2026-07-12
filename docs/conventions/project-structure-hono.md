# Hono API Structure

How Hono API code should be organized across builder.group projects.

## Structure

Keep API code split by responsibility:

```txt
src/
├── app/          # Hono construction, middleware, routes, transport composition
├── environment/  # App-wide initialized values and runtime setup
├── modules/      # Bounded product, system, or integration behavior
├── lib/          # Thin shared helpers
└── openapi/      # Generated consumer-facing API contract, when published
```

Only create the folders the API needs. Small APIs can stay small.

## Folder Roles

`app/` owns `createApi`, global middleware, route registration, and other HTTP transport composition.

`environment/` owns values initialized once for the whole API, such as app config, shared client setup, generated bindings, and runtime services.

`modules/` owns bounded product, system, or integration behavior.

`lib/` owns helpers that are shared across multiple modules and do not belong to one specific module.

`openapi/` owns a generated API contract when the API exposes one to consumers through a separate package entrypoint. Route-level OpenAPI definitions remain beside their routes.

## Example

```txt
src/
├── app/
│   ├── app.ts
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

For example, app config or a database pool initialized once and intentionally shared across the API belongs in `environment/`. State and values scoped to a request or flow, or used only by one module, remain with the behavior that owns them. Account routes remain transport adapters for account behavior.

## Guidance

- Keep routes focused on HTTP validation, module calls, and response serialization
- Keep route-specific OpenAPI schemas beside their routes
- Keep app-wide initialized values and runtime setup in `environment/`
- Keep state and setup scoped to a request, flow, or module in their owning module
- Do not use `environment/` as a generic home for constants
- Keep behavior close to the module that owns it
- Keep `lib/` thin and move helpers into a module when they are only used there
- Keep dependency direction clear: modules must not depend on routes or app assembly
