# Migration Guide

## 0.3.x to 0.4.0

`openapi-ts-router` now exposes adapter-specific entrypoints and uses Standard Schema validators directly. The router is still a thin Express and Hono integration backed by OpenAPI path types, but imports, route config names, validated request data, and errors changed.

### Import From Adapter Subpaths

Express and Hono factories moved out of the root export.

```ts
// old
import { createExpressOpenApiRouter } from 'openapi-ts-router';
// new
import { createExpressOpenApiRouter } from 'openapi-ts-router/express';
```

```ts
// old
import { createHonoOpenApiRouter } from 'openapi-ts-router';
// new
import { createHonoOpenApiRouter } from 'openapi-ts-router/hono';
```

The package now defines an `exports` map. Undocumented deep imports are blocked.

### Use Direct Factories

The feature-composition layer was removed. Do not use `createOpenApiRouter`, `withExpress`, or `withHono`.

```ts
import { Router } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router/express';

const router = Router();
const openApiRouter = createExpressOpenApiRouter<paths>(router);
```

Express factories wrap the router you pass and return `{ router, get, post, put, patch, delete }`.

Hono factories wrap the app you pass and return `{ hono, get, post, put, patch, delete }`.

`del` was renamed to `delete`.

### Rename Route Config Fields

Validator fields were renamed from adapter wrappers to schema fields.

| Old field                                      | New field          |
| ---------------------------------------------- | ------------------ |
| `pathValidator`                                | `pathSchema`       |
| `queryValidator`                               | `querySchema`      |
| `bodyValidator`                                | `bodySchema`       |
| `middlewares`                                  | `middleware`       |
| `parsePathParams` or blacklist parser options  | `pathParamParser`  |
| `parseQueryParams` or blacklist parser options | `queryParamParser` |

### Pass Schemas Directly

Validation adapters are no longer required.

```ts
import { Router } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router/express';
import { z } from 'zod';

const router = Router();
const openApiRouter = createExpressOpenApiRouter<paths>(router);

openApiRouter.get('/pets/{petId}', {
  pathSchema: z.object({
    petId: z.coerce.number()
  }),
  handler: (req, res) => {
    res.json({ id: req.valid.path.petId });
  }
});
```

Old code like `pathValidator: zValidator(z.object(...))` should become `pathSchema: z.object(...)`.

### Read Validated Values From New Slots

Express path params moved from `req.valid.params` to `req.valid.path`.

Validated request body output is now available on `req.valid.body`:

```ts
openApiRouter.post('/pets', {
  bodySchema: PetSchema,
  handler: (req, res) => {
    const pet = req.valid.body;
    res.status(201).json(pet);
  }
});
```

Hono stores validated values in the normal Hono validation slots:

```ts
openApiRouter.post('/pets', {
  bodySchema: PetSchema,
  handler: (c) => {
    const pet = c.req.valid('json');
    return c.json(pet, 201);
  }
});
```

Schema output is stored, so transforms and coercions are reflected in the validated values.

### Update Error Handling

`AppError` and `ValidationError` were removed.

Use `OpenApiRouterError` and `OpenApiValidationError`:

```ts
import { OpenApiValidationError } from 'openapi-ts-router';

if (error instanceof OpenApiValidationError) {
  console.error(error.issues);
}
```

Validation details are on `issues`. The validation code is now `#ERR_OPENAPI_VALIDATION`.

Hono JSON parse failures are wrapped as `OpenApiRouterError` with code `#ERR_OPENAPI_PARSE_BODY` and status `400`.

### Review Parser Behavior

`parseParams(params, blacklist)` is now `parseParams(params)`.

Use a custom `pathParamParser` or `queryParamParser` when a route needs custom parsing behavior.

Parser edge cases changed:

- `"undefined"` stays the string `"undefined"`.
- Whitespace stays a string.
- `Infinity` no longer parses to a number.
- Hono repeated query params are preserved as arrays before validation.

`formatPath` was renamed to `formatOpenApiPath`.

### Express 5

The package now targets Express 5. Async handler errors rely on Express 5 behavior instead of the old explicit `next(error)` wrapper.
