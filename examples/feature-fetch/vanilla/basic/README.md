# feature-fetch Vanilla basic

Basic Vanilla TypeScript example for `feature-fetch`.

Created from the Vite Vanilla TypeScript template with `pnpm create vite -t vanilla-ts`.

## Run

```sh
pnpm dev
```

## What It Shows

- `createApiFetchClient`
- `createOpenApiFetchClient`
- `createGraphQLFetchClient`
- generated OpenAPI types from `openapi-typescript`
- generated GraphQL schema types from `gql.tada`
- grouped API/OpenAPI/GraphQL example files
- `queryParams`
- tuple-result destructuring
- handling success and error branches
- logging Open-Meteo weather and Countries GraphQL data in the browser console

## Refresh Generated Types

Generated OpenAPI and GraphQL types are committed. Refresh them when the upstream schemas change:

```sh
pnpm openapi:generate
pnpm graphql:generate
```

Use `pnpm graphql:schema` first to refresh the committed Countries GraphQL schema.

## API Sources

- Open-Meteo OpenAPI schema: [openapi.yml](https://github.com/open-meteo/open-meteo/blob/main/openapi.yml)
- Countries GraphQL API: [countries.trevorblades.com/graphql](https://countries.trevorblades.com/graphql)
