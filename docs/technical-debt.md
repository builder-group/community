# Technical Debt

## OpenAPI TypeScript Peer Warning

The OpenAPI examples still get an `openapi-typescript` peer warning for TypeScript 6.

### Current state

- Build passes
- `pnpm peers check` still reports the peer because `openapi-typescript` declares a TypeScript 5 range
- Affected examples:
  - [examples/feature-fetch/vanilla/basic/package.json](/Users/benno/Documents/workspace/projects/builder-group/b_product-development/code/community/examples/feature-fetch/vanilla/basic/package.json)
  - [examples/openapi-ts-router/express/petstore/package.json](/Users/benno/Documents/workspace/projects/builder-group/b_product-development/code/community/examples/openapi-ts-router/express/petstore/package.json)
  - [examples/openapi-ts-router/hono/petstore/package.json](/Users/benno/Documents/workspace/projects/builder-group/b_product-development/code/community/examples/openapi-ts-router/hono/petstore/package.json)

### When to revisit

- When `openapi-typescript` officially supports TypeScript 6

## Tailwind Typography Peer Warning

[apps/web/package.json](/Users/benno/Documents/workspace/projects/builder-group/b_product-development/code/community/apps/web/package.json) still gets an `@tailwindcss/typography` peer warning with Tailwind 4.

### Current state

- Build passes
- `@tailwindcss/typography` is still used by [apps/web/src/styles.css](/Users/benno/Documents/workspace/projects/builder-group/b_product-development/code/community/apps/web/src/styles.css)
- `pnpm peers check` still reports the peer even though the package declares a Tailwind 4-compatible range

### When to revisit

- When `@tailwindcss/typography` resolves the peer warning with Tailwind 4
