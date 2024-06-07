<h1 align="center">
    <img src="./.github/banner.svg" alt="openapi-express banner">
</h1>

<p align="left">
    <a href="https://github.com/inbeta-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/inbeta-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=F0E81A" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/openapi-express">
        <img src="https://img.shields.io/bundlephobia/minzip/openapi-express.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=F0E81A" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/openapi-express">
        <img src="https://img.shields.io/npm/dt/openapi-express.svg?label=downloads&style=flat&colorA=293140&colorB=F0E81A" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/T9GzreAwPH">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=F0E81A" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`openapi-express` is a typesafe [Express](https://expressjs.com/) Router wrapper supporting [OpenAPI](https://www.openapis.org/) types.

- **Typesafe**: Build with TypeScript for strong type safety and support for [`openapi-typescript`](https://github.com/drwpow/openapi-typescript) types
- **Validation**: Ensures request validation against defined schemas using [`zod`](https://zod.dev/)

### Motivation

Provide a typesafe, straightforward, and lightweight wrapper for the [Express](https://expressjs.com/) Router that seamlessly integrates with OpenAPI schemas using `openapi-typescript`. It aims to simplify error handling and request validation.

## 📖 Usage

### 1. Generate TypeScript Definitions

Use `openapi-typescript` to generate TypeScript definitions from your OpenAPI schema.

```bash
npx openapi-typescript ./path/to/my/schema.yaml -o ./path/to/my/schema.d.ts
```
[More info](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-typescript)

### 2. Create an OpenAPI Router

Import the generated `paths` and use `createOpenApiRouter()` to create an OpenAPI router.

`router.ts`
```ts
import { createOpenApiRouter } from 'openapi-express';
import { paths } from './openapi-paths'; // Import generated paths

export const router: Router = Router();
export const openApiRouter = createOpenApiRouter<paths>(router);
```

### 3. Use the Router in an Express App

Integrate the OpenAPI router into your Express application to handle requests. Use `express.json()` middleware to parse incoming JSON requests.

`app.ts`
```ts
import express from 'express';
import { router } from './router';

const app = express();

app.use(express.json()); // For parsing application/json

app.use('/', router);
```

### 4. Define the Endpoints with Full Type Safety

Define your API endpoints with full type safety and request validation using Zod. TypeScript provides type safety at compile time, but runtime validation is necessary to ensure incoming requests meet the expected structure and types. Zod helps with this by providing a schema-based validation mechanism. If a schema is invalid, a `ValidationError` is thrown.

`routes/posts.ts`
```ts
import { Router } from 'express';
import { z } from 'zod';
import { openApiRouter } from '../router';

const posts = [
    { id: '1', title: 'First Post', content: 'This is the first post.' },
    { id: '2', title: 'Second Post', content: 'This is the second post.' }
];

// Get all posts
openApiRouter.get(
    '/posts',
    {},
    async (req, res) => {
        res.json(posts);
    }
);

// Get a post by ID
openApiRouter.get(
    '/posts/{id}',
    {
        pathSchema: {
            id: z.string()
        }
    },
    async (req, res) => {
        const post = posts.find(p => p.id === req.params.id);
        if (post) {
            res.json(post);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    }
);

// Create a new post
openApiRouter.post(
    '/posts',
    {
        bodySchema: z.object({
            title: z.string(),
            content: z.string()
        })
    },
    async (req, res) => {
        const newPost = {
            id: (posts.length + 1).toString(),
            ...req.body
        };
        posts.push(newPost);
        res.status(201).json(newPost);
    }
);
```