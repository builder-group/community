<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/openapi-ts-router/.github/banner.svg" alt="openapi-ts-router banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/openapi-ts-router">
        <img src="https://img.shields.io/bundlephobia/minzip/openapi-ts-router.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/openapi-ts-router">
        <img src="https://img.shields.io/npm/dt/openapi-ts-router.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`openapi-ts-router` turns generated OpenAPI `paths` into typed Express and Hono route methods. You keep native routers, handlers, and middleware, while OpenAPI controls which paths compile, which request schemas are required, and what JSON success bodies handlers can return.

- Keep OpenAPI path syntax in route code while the wrapper registers framework routes
- Catch wrong paths, wrong methods, missing required schemas, and wrong JSON success responses in TypeScript
- Validate path params, query params, and JSON bodies with any [Standard Schema](https://standardschema.dev/) library
- Read parsed and validated values from `req.valid` in Express or `c.req.valid()` in Hono
- Add OpenAPI-backed routes without replacing your existing Express or Hono app

Express:

```ts
import { Router } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router/express';
import * as z from 'zod';
import type { paths } from './gen/openapi';

const router = Router();
const openApiRouter = createExpressOpenApiRouter<paths>(router);

openApiRouter.get('/pet/{petId}', {
  pathSchema: z.object({
    petId: z.number()
  }),
  handler: (req, res) => {
    const { petId } = req.valid.path;
    res.json({ name: `Pet ${petId}`, photoUrls: [] });
  }
});
```

Hono:

```ts
import { Hono } from 'hono';
import { createHonoOpenApiRouter } from 'openapi-ts-router/hono';
import * as v from 'valibot';
import type { paths } from './gen/openapi';

const app = new Hono();
const openApiRouter = createHonoOpenApiRouter<paths>(app);

openApiRouter.get('/pet/{petId}', {
  pathSchema: v.object({
    petId: v.number()
  }),
  handler: (c) => {
    const { petId } = c.req.valid('param');
    return c.json({ name: `Pet ${petId}`, photoUrls: [] });
  }
});
```

## Install

Install the router package and the OpenAPI type generator:

```sh
npm install openapi-ts-router
npm install -D openapi-typescript
```

Install the framework and validator you use:

```sh
# Express
npm install express
npm install -D @types/express

# Hono
npm install hono

# Standard Schema validator
npm install zod
# or
npm install valibot
```

Generate TypeScript types from your OpenAPI document:

```sh
npx openapi-typescript ./openapi.yaml -o ./src/gen/openapi.ts
```

The generated file must export the `paths` type from `openapi-typescript`.

## Usage

Create a router wrapper with your generated `paths` type. The wrapper keeps your framework router, but narrows each route method to paths that exist in your OpenAPI schema.

Pass OpenAPI path strings such as `/pet/{petId}` to `openApiRouter`. The wrapper registers the framework route as `/pet/:petId` for Express and Hono. Do not use framework `:param` syntax in `openApiRouter` calls.

### Express

```ts
import express, { Router } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router/express';
import * as z from 'zod';
import type { paths } from './gen/openapi';

const app = express();
const router = Router();
const openApiRouter = createExpressOpenApiRouter<paths>(router);

app.use(express.json());
app.use(router);

openApiRouter.get('/pet/{petId}', {
  pathSchema: z.object({
    petId: z.number()
  }),
  handler: (req, res) => {
    const { petId } = req.valid.path;
    res.json({ name: `Pet ${petId}`, photoUrls: [] });
  }
});

openApiRouter.post('/pet', {
  bodySchema: z.object({
    name: z.string(),
    photoUrls: z.array(z.string())
  }),
  handler: (req, res) => {
    const { name, photoUrls } = req.valid.body;
    res.json({ name, photoUrls });
  }
});
```

Express body validation reads `req.body`, so mount `express.json()` or an equivalent body parser before the router.

### Hono

```ts
import { Hono } from 'hono';
import { createHonoOpenApiRouter } from 'openapi-ts-router/hono';
import * as v from 'valibot';
import type { paths } from './gen/openapi';

const app = new Hono();
const openApiRouter = createHonoOpenApiRouter<paths>(app);

openApiRouter.get('/pet/{petId}', {
  pathSchema: v.object({
    petId: v.number()
  }),
  handler: (c) => {
    const { petId } = c.req.valid('param');
    return c.json({ name: `Pet ${petId}`, photoUrls: [] });
  }
});

openApiRouter.post('/pet', {
  bodySchema: v.object({
    name: v.string(),
    photoUrls: v.array(v.string())
  }),
  handler: (c) => {
    const { name, photoUrls } = c.req.valid('json');
    return c.json({ name, photoUrls });
  }
});
```

## What TypeScript Checks

`openapi-ts-router` ties route registration to one OpenAPI operation.

```ts
openApiRouter.get('/pet/{petId}', {
  pathSchema: z.object({ petId: z.number() }),
  handler: (req, res) => {
    req.valid.path.petId; // number
    res.json({ name: 'Falko', photoUrls: [] }); // checked against the 2xx JSON response
  }
});
```

These mistakes fail before runtime:

```ts
// The OpenAPI path has no POST operation.
openApiRouter.post('/store/inventory', {
  handler: () => undefined
});

// The OpenAPI path has required path params, so pathSchema is required.
openApiRouter.get('/pet/{petId}', {
  handler: (_req, res) => {
    res.json({ name: 'Falko', photoUrls: [] });
  }
});

// The success response must match the OpenAPI 2xx JSON response body.
openApiRouter.get('/pet/{petId}', {
  pathSchema: z.object({ petId: z.number() }),
  handler: (_req, res) => {
    res.json('not a pet');
  }
});
```

## Route Config

| Option             | Description                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `handler`          | Native Express or Hono handler called after parsing, validation, and route middleware                                |
| `middleware`       | Native Express or Hono middleware for this route. Runs after validation and before `handler`                         |
| `pathSchema`       | Standard Schema validator for OpenAPI path params. Required when the OpenAPI operation has required path params      |
| `querySchema`      | Standard Schema validator for OpenAPI query params. Required when the OpenAPI operation has required query params    |
| `bodySchema`       | Standard Schema validator for the JSON request body. Required when the OpenAPI operation has a required request body |
| `pathParamParser`  | Route-level path param parser override. Set to `false` to validate raw router strings                                |
| `queryParamParser` | Route-level query param parser override. Set to `false` to validate raw router query values                          |

Required OpenAPI request parts require matching schemas at compile time. Optional request parts may omit their schemas.

## Validated Data

Parsed values, and validated values when a schema runs, are stored separately from the raw framework request data:

| Request part | Express           | Hono                   |
| ------------ | ----------------- | ---------------------- |
| Path params  | `req.valid.path`  | `c.req.valid('param')` |
| Query params | `req.valid.query` | `c.req.valid('query')` |
| JSON body    | `req.valid.body`  | `c.req.valid('json')`  |

This keeps handlers honest: `req.params`, `req.query`, and `req.body` may still contain raw framework values, while the `valid` slots contain parser output and schema output for the request parts you validated.

## Param Parsing

Path and query params start as strings in web frameworks. By default, `openapi-ts-router` runs `parseParams()` before validation:

- `'123'` becomes `123`
- `'true'` and `'false'` become booleans
- `'null'` becomes `null`
- repeated query params stay arrays
- nested query objects and arrays are parsed recursively

Set parser defaults on the router:

```ts
const openApiRouter = createExpressOpenApiRouter<paths>(router, {
  pathParamParser: false,
  queryParamParser: false
});
```

Override parsing for one route when a value should stay raw:

```ts
import { parseParams } from 'openapi-ts-router';

openApiRouter.get('/items/{sku}', {
  pathParamParser: (params) => ({
    ...parseParams(params),
    sku: params['sku']
  }),
  pathSchema: z.object({
    sku: z.string()
  }),
  handler: (req, res) => {
    res.json({ sku: req.valid.path.sku });
  }
});
```

## Middleware

Use native middleware exactly where your framework expects it. Route-level middleware receives the same typed validated data as the final handler.

```ts
openApiRouter.get('/pet/{petId}', {
  pathSchema: z.object({ petId: z.number() }),
  middleware: [
    (req, _res, next) => {
      auditPetRead(req.valid.path.petId);
      next();
    }
  ],
  handler: (req, res) => {
    res.json({ name: `Pet ${req.valid.path.petId}`, photoUrls: [] });
  }
});
```

Global Express middleware and Hono middleware still work normally around the wrapped router.

## Errors

Validation failures throw `OpenApiValidationError` with `status: 400` and an `issues` array.

```ts
import type { ErrorRequestHandler } from 'express';
import { OpenApiValidationError } from 'openapi-ts-router';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof OpenApiValidationError) {
    res.status(error.status).json({ issues: error.issues });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};
```

Hono can handle the same error through `app.onError()`:

```ts
import { OpenApiValidationError } from 'openapi-ts-router';

app.onError((error, c) => {
  if (error instanceof OpenApiValidationError) {
    return c.json({ issues: error.issues }, error.status);
  }

  return c.json({ message: 'Internal server error' }, 500);
});
```

Request body parse failures and unexpected validator failures throw `OpenApiRouterError`. Request-level errors can include `status`, while internal schema failures expose `code`, `message`, and `cause`.

## Examples

- [Express Petstore](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/express/petstore)
- [Hono Petstore](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/hono/petstore)

## FAQ

### Why do I still write schemas when OpenAPI already has types?

OpenAPI types only exist at compile time. A schema validates real requests at runtime. `openapi-ts-router` connects the two: if the OpenAPI operation requires a path param, query param, or body, TypeScript requires a matching schema before the route can compile.

### Which validators can I use?

Any validator that implements [Standard Schema](https://standardschema.dev/) works. Valibot and Zod are the common choices. No package-specific validation adapter is required.

### Does this generate OpenAPI specs?

No. Your OpenAPI document stays the source of truth. Generate TypeScript with `openapi-typescript`, then pass the generated `paths` type to the router wrapper.

### Does this validate responses at runtime?

No. JSON success responses are checked by TypeScript in handlers, but the package does not run response validators at runtime. Keep response runtime checks in tests or framework middleware if your app needs them.

### What happens when I omit an optional schema?

TypeScript still infers the OpenAPI request shape, but runtime validation does not run for that request part. Use a schema when handlers need trusted parsed and validated values.

### Why are error responses not typed on handlers?

Error responses usually come from shared error handling, not the happy-path route handler. Throw domain errors or `OpenApiRouterError` values from routes, then map them to your API error shape in Express error middleware or Hono `app.onError()`.

### What request parts are supported?

The router validates path params, query params, and JSON request bodies. Keep auth, headers, cookies, multipart uploads, and framework-specific request concerns in native Express or Hono middleware.

### Which HTTP methods are supported?

`get`, `post`, `put`, `patch`, and `delete` are supported.

### Which framework versions are supported?

The package targets Express 5 and Hono 4 through peer dependencies.

### Can I migrate one route at a time?

Yes. Wrap an existing Express router or Hono app, then register OpenAPI-backed routes through `openApiRouter`. Existing framework routes and middleware can keep running next to it while you migrate.
