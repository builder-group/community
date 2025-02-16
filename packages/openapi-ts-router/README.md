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

> Status: Experimental

`openapi-ts-router` is a thin wrapper around the router of web frameworks like Express and Hono, offering OpenAPI typesafety and seamless integration with validation libraries such as Valibot and Zod.

- Full type safety for routes, methods, params, body and responses
- Runtime validation using Zod/Valibot
- Catches API spec mismatches at compile time
- Zero manual type definitions needed
- Seamless integration with existing Express/Hono applications
- Enforces OpenAPI schema compliance at both compile-time and runtime

### 📚 Examples

- [Express Petstore](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/express/petstore)
- [Hono Petstore](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/hono/petstore)

## 📖 Usage

### [ExpressJs](https://expressjs.com/)

[`openapi-ts-router`](https://github.com/builder-group/community/tree/develop/packages/openapi-ts-router) provides full type-safety and runtime validation for your Express API routes by wrapping a [Express router](https://expressjs.com/en/5x/api.html#router):

> **Good to Know**: While TypeScript ensures compile-time type safety, runtime validation is equally important. `openapi-ts-router` integrates with Zod/Valibot to provide both:
>
> - Types verify your code matches the OpenAPI spec during development
> - Validators ensure incoming requests match the spec at runtime

```ts
import { Router } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';
import { paths } from './gen/v1'; // OpenAPI-generated types
import { PetSchema } from './schemas'; // Custom reusable schema for validation

export const router: Router = Router();
export const openApiRouter = createExpressOpenApiRouter<paths>(router);

// GET /pet/{petId}
openApiRouter.get('/pet/{petId}', {
	pathValidator: zValidator(
		z.object({
			petId: z.number() // Validate that petId is a number
		})
	),
	handler: (req, res) => {
		const { petId } = req.params; // Access validated params
		res.send({ name: 'Falko', photoUrls: [] });
	}
});

// POST /pet
openApiRouter.post('/pet', {
	bodyValidator: zValidator(PetSchema), // Validate request body using PetSchema
	handler: (req, res) => {
		const { name, photoUrls } = req.body; // Access validated body data
		res.send({ name, photoUrls });
	}
});

// TypeScript will error if route/method doesn't exist in OpenAPI spec
// or if response doesn't match defined schema
```

[Full example](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/express/petstore)

### [Hono](https://hono.dev/)

[`openapi-ts-router`](https://github.com/builder-group/community/tree/develop/packages/openapi-ts-router) provides full type-safety and runtime validation for your HonoAPI routes by wrapping a [Hono router](https://hono.dev/docs/api/routing):

> **Good to Know**: While TypeScript ensures compile-time type safety, runtime validation is equally important. `openapi-ts-router` integrates with Zod/Valibot to provide both:
>
> - Types verify your code matches the OpenAPI spec during development
> - Validators ensure incoming requests match the spec at runtime

> **Note**: Hono's TypeScript integration provides type suggestions for `c.json()` based on generically defined response types, but it doesn't enforce these types at compile-time. For example, `c.json('')` won't raise a type error even if the expected type is `{ someType: string }`. This is due to Hono's internal use of `TypedResponse<T>`, which infers but doesn't strictly enforce the passed generic type. [Hono Discussion](https://github.com/orgs/honojs/discussions/3331)

```ts
import { Hono } from 'hono';
import { createHonoOpenApiRouter } from 'openapi-ts-router';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';
import { paths } from './gen/v1'; // OpenAPI-generated types
import { PetSchema } from './schemas'; // Custom reusable schema for validation

export const router = new Hono();
export const openApiRouter = createHonoOpenApiRouter<paths>(router);

// GET /pet/{petId}
openApiRouter.get('/pet/{petId}', {
	pathValidator: zValidator(
		z.object({
			petId: z.number() // Validate that petId is a number
		})
	),
	handler: (c) => {
		const { petId } = c.req.valid('param'); // Access validated params
		return c.json({ name: 'Falko', photoUrls: [] });
	}
});

// POST /pet
openApiRouter.post('/pet', {
	bodyValidator: zValidator(PetSchema), // Validate request body using PetSchema
	handler: (c) => {
		const { name, photoUrls } = c.req.valid('json'); // Access validated body data
		return c.json({ name, photoUrls });
	}
});

// TypeScript will error if route/method doesn't exist in OpenAPI spec
// or if response doesn't match defined schema
```

[Full example](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/hono/petstore)

## ❓ FAQ

### **Why are error types not supported in the response type?**

We intentionally **only type success responses (2xx)** while leaving error responses out. Here’s why:

**Errors should be handled via exceptions & middleware**  
Instead of typing every possible error response inline, we believe that handling errors globally in middleware provides **clearer, more maintainable code**.  
👉 Example: [Hono Example](https://github.com/builder-group/community/blob/develop/examples/openapi-ts-router/hono/petstore/src/handlers/error-handler.ts) ([Docs](https://hono.dev/docs/api/exception)) & [Express Example](https://github.com/builder-group/community/blob/develop/examples/openapi-ts-router/express/petstore/src/middlewares/error-middleware.ts) ([Docs](https://expressjs.com/en/guide/error-handling.html))

**Inline error responses require `as any`**  
Since `.send()` only expects success types, **explicit casting** is required to enforce an error response:

```ts
res.status(500).send({
	code: '#ERR_XYZ',
	message: 'Error Message'
} satisfies TOperationResponseContent<paths['/pet/{petId}']['get'], 500> as any);
```

### **Why is the Status Code not inferred?**

**Express and Hono don't infer status codes for `res.send()` / `c.json()`**  
Since we can’t infer the value of the `res.status()` / `c.json()` method call, `res.send()` / `c.json()` is typed as a union of success response types. For example, it could be:

```ts
{ message: 'Success Body of 200' } | { message: 'Success Body of 201' }
```

**To enforce a specific success type, use `satisfies`**  
Example of explicitly enforcing a **201 response type**:

```ts
res.status(201).send({
	id: 123
} satisfies TOperationResponseContent<paths['/pet/{petId}']['get'], 201>);
```

### **Hono `c.json()` not typesafe?**

Hono's TypeScript integration provides type suggestions for `c.json()` based on generically defined response types, but it doesn't enforce these types at compile-time. For example, `c.json('')` won't raise a type error even if the expected type is `{ someType: string }`. This is due to Hono's internal use of `TypedResponse<T>`, which infers but doesn't strictly enforce the passed generic type. [Hono Discussion](https://github.com/orgs/honojs/discussions/3331)

**To enforce a specific success type, use `satisfies`**  
Example of explicitly enforcing a **201 response type**:

```ts
c.json(
	{
		id: 123
	} satisfies TOperationResponseContent<paths['/pet/{petId}']['get'], 201>,
	201
);
```
