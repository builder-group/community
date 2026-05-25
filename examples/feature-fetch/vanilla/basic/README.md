# feature-fetch Vanilla Basic

Vanilla TypeScript example for `feature-fetch`. It shows REST helpers, OpenAPI-generated types, and GraphQL documents using the same tuple-result client model.

- REST calls with `createApiFetchClient`
- OpenAPI-typed calls with `createOpenApiFetchClient`
- GraphQL calls with `createGraphQLFetchClient`
- tuple-result success and error branches
- generated OpenAPI and GraphQL types
- real requests logged to the browser console

## Run

```sh
pnpm dev
```

## Refresh Generated Types

Generated OpenAPI and GraphQL types are committed. Refresh them when upstream schemas change:

```sh
pnpm openapi:generate
pnpm graphql:generate
```

Use `pnpm graphql:schema` first to refresh the committed Countries GraphQL schema.

## API Sources

- Open-Meteo OpenAPI schema: [openapi.yml](https://github.com/open-meteo/open-meteo/blob/main/openapi.yml)
- Countries GraphQL API: [countries.trevorblades.com/graphql](https://countries.trevorblades.com/graphql)
