<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/openapi-router/.github/banner.svg" alt="@blgc/openapi-router banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/@blgc/openapi-router">
        <img src="https://img.shields.io/bundlephobia/minzip/@blgc/openapi-router.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/@blgc/openapi-router">
        <img src="https://img.shields.io/npm/dt/@blgc/openapi-router.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`@blgc/openapi-router` is a thin wrapper around the router of web frameworks like Express and Hono, offering OpenAPI typesafety and seamless integration with validation libraries such as Valibot and Zod.

- **Typesafe**: Build with TypeScript for strong type safety and support for [`openapi-typescript`](https://github.com/drwpow/openapi-typescript) types
- **Framework Agnostic**: Compatible with Express, Hono, and other popular web frameworks
- **Validation-First**: Integrates with Valibot, Zod, and other validators to ensure requests adhere to expected types
- **Modular & Extendable**: Easily extendable with features like `withExpress()`, ..

### 📚 Examples

- [Express Petstore](https://github.com/builder-group/monorepo/tree/develop/examples/openapi-router/express/petstore)
- [Hono Petstore](https://github.com/builder-group/monorepo/tree/develop/examples/openapi-router/hono/petstore)

### 🌟 Motivation

Create a typesafe and straightforward wrapper around web framework routers, seamlessly integrating with OpenAPI schemas using `openapi-typescript` and ensuring type validation with libraries like Zod and Valibot.

## 📖 Usage

### [ExpressJs](https://expressjs.com/)

[`@blgc/openapi-router`](https://github.com/builder-group/community/tree/develop/packages/openapi-router) wraps around the [Express router](https://expressjs.com/en/5x/api.html#router) to deliver full typesafety and enforce your OpenAPI-Schema with validators.

> While TypeScript types ensure compile-time safety, they don't enforce runtime schema validation. For runtime compliance, you need to integrate with validation libraries like Zod or Valibot. Although you must define the validation rules manually, they are type-safe to ensure these rules are correctly defined.

```ts
import { createExpressOpenApiRouter } from '@blgc/openapi-router';
import { Router } from 'express';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { paths } from './gen/v1'; // OpenAPI-generated types
import { PetSchema } from './schemas'; // Custom reusable Zod schema for validation

export const router: Router = Router();
export const openApiRouter = createExpressOpenApiRouter<paths>(router);

// GET /pet/{petId}
openApiRouter.get('/pet/{petId}', {
	pathValidator: vValidator(
		v.object({
			petId: v.number() // Validate that petId is a number
		})
	),
	handler: (req, res) => {
		const { petId } = req.params; // Access validated params
		res.send({ name: 'Falko', photoUrls: [] });
	}
});

// POST /pet
openApiRouter.post('/pet', {
	bodyValidator: vValidator(PetSchema), // Validate request body using PetSchema
	handler: (req, res) => {
		const { name, photoUrls } = req.body; // Access validated body data
		res.send({ name, photoUrls });
	}
});
```

[Full example](https://github.com/builder-group/community/tree/develop/examples/openapi-router/express/petstore)

### [Hono](https://hono.dev/)

[`@blgc/openapi-router`](https://github.com/builder-group/community/tree/develop/packages/openapi-router) wraps around the [Hono router](https://hono.dev/docs/api/routing) to deliver full typesafety and enforce your OpenAPI-Schema with validators.

> While TypeScript types ensure compile-time safety, they don't enforce runtime schema validation. For runtime compliance, you need to integrate with validation libraries like Zod or Valibot. Although you must define the validation rules manually, they are type-safe to ensure these rules are correctly defined.

> Hono's TypeScript integration provides type suggestions for `c.json()` based on generically defined response types, but doesn't enforce these types at compile-time. For example, `c.json('')` won't raise a type error even if the expected type is `{someType: string}`. This is due to Hono's internal use of `TypedResponse<T>`, which infers but doesn't strictly enforce the passed generic type. [Hono Discussion](https://github.com/orgs/honojs/discussions/3331)

```ts
import { createHonoOpenApiRouter } from '@blgc/openapi-router';
import { Hono } from 'hono';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';
import { paths } from './gen/v1'; // OpenAPI-generated types
import { PetSchema } from './schemas'; // Custom reusable Zod schema for validation

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
```

[Full example](https://github.com/builder-group/community/tree/develop/examples/openapi-router/hono/petstore)
