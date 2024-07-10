<h1 align="center">
    <img src="https://raw.githubusercontent.com/inbeta-group/monorepo/develop/packages/openapi-router/.github/banner.svg" alt="@igb/openapi-router banner">
</h1>

<p align="left">
    <a href="https://github.com/inbeta-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/inbeta-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=F0E81A" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/@igb/openapi-router">
        <img src="https://img.shields.io/bundlephobia/minzip/@igb/openapi-router.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=F0E81A" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/@igb/openapi-router">
        <img src="https://img.shields.io/npm/dt/@igb/openapi-router.svg?label=downloads&style=flat&colorA=293140&colorB=F0E81A" alt="NPM total downloads"/>
    </a>
    <a href="https://dyn.art/s/discord/?source=inbeta-group-readme">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=F0E81A" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`@ibg/openapi-router` is a thin wrapper around the router of web frameworks like Express and Hono, offering OpenAPI typesafety and seamless integration with validation libraries such as Valibot and Zod.

- **Typesafe**: Build with TypeScript for strong type safety and support for [`openapi-typescript`](https://github.com/drwpow/openapi-typescript) types
- **Framework Agnostic**: Compatible with Express, Hono, and other popular web frameworks
- **Validation-First**: Integrates with Valibot, Zod, and other validators to ensure requests adhere to expected types
- **Modular & Extendable**: Easily extendable with features like `withExpress()`, ..

### 📚 Examples

- [Express Petstore](https://github.com/inbeta-group/monorepo/tree/develop/examples/openapi-router/express/petstore)
- [Hono Petstore](https://github.com/inbeta-group/monorepo/tree/develop/examples/openapi-router/hono/petstore)

### 🌟 Motivation

The goal is to provide a typesafe and straightforward wrapper around web framework routers, seamlessly integrating with OpenAPI schemas using `openapi-typescript` and ensuring type validation with libraries like Zod and Valibot.

## 📖 Usage

### ExpressJs

```ts
import express, { Router } from 'express';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { createExpressOpenApiRouter } from '@ibg/openapi-router';
import { paths } from './path/to/openapi/types';

const app = express();

app.use(express.json());

const router = Router();
const openapiRouter = createExpressOpenApiRouter<paths>(router);

openapiRouter.get('/pet/{petId}', {
    pathValidator: vValidator(
        v.object({
            petId: v.number()
        })
    ),
    handler: async (req, res, next) => {}
});

openapiRouter.get('/pet/findByTags', {
    queryValidator: vValidator(
        v.object({
            tags: v.optional(v.array(v.string()))
        })
    ),
    handler: (req, res, next) => {}
});

app.use('/*', router);
```

### Hono

```ts
import { Hono } from 'hono';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { createHonoOpenApiRouter } from '@ibg/openapi-router';
import { paths } from './path/to/openapi/types';

export const app = new Hono();

const router = new Hono();
const openapiRouter = createHonoOpenApiRouter<paths>(router);

openapiRouter.get('/pet/{petId}', {
    pathValidator: vValidator(
        v.object({
            petId: v.number()
        })
    ),
    handler: async (c) => {}
});

openapiRouter.get('/pet/findByTags', {
    queryValidator: vValidator(
        v.object({
            tags: v.optional(v.array(v.string()))
        })
    ),
    handler: (c) => {}
});

// Application endpoint
app.route('/', router);
```