# openapi-ts-router Hono Petstore

Minimal TypeScript Hono example for `openapi-ts-router/hono`. It uses the Petstore OpenAPI schema, generated operation types, and Valibot validators.

## What It Shows

- Hono app with `createHonoOpenApiRouter`
- typed route handlers from generated OpenAPI paths
- runtime validation with Standard Schema-compatible Valibot schemas
- parsed and validated values through `c.req.valid(...)`
- `tsx watch` development server

## Run

```sh
pnpm dev
```

The server runs on `http://localhost:3000`.

## Try It

```sh
curl http://localhost:3000/pet/123
curl -X POST http://localhost:3000/pet \
  -H 'content-type: application/json' \
  -d '{"name":"Falko","photoUrls":[]}'
```

## Refresh Generated Types

Generated OpenAPI types are committed. Refresh them when the schema changes:

```sh
pnpm openapi:generate
```

## API Source

- Swagger Petstore OpenAPI schema: [swagger-petstore](https://github.com/swagger-api/swagger-petstore)
