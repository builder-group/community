<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/validatenv/.github/banner.svg" alt="validatenv banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/validatenv">
        <img src="https://img.shields.io/bundlephobia/minzip/validatenv.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/validatenv">
        <img src="https://img.shields.io/npm/dt/validatenv.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`validatenv` is a typesafe library for validating environment variables.

### 🌟 Motivation

Create a type-safe, straightforward, and lightweight library for validating environment variables using existing validation libraries like [Valibot](https://valibot.dev/) or [Zod](https://zod.dev/).
Additionally, I didn't trust existing libraries, as reading environment variables is a particularly vulnerable task.

### ⚖️ Alternatives

- [envalid](https://github.com/af/envalid)

## 📖 Usage

```ts
import { validateEnv, portValidator, urlValidator, booleanMiddleware, devDefault, localDefault } from 'validatenv';
// Third-party validators
import * as z from 'zod';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { zValidator } from 'validation-adapters/zod';

// Load environment variables
import 'dotenv/config';

const env = validateEnv(process.env, {
  // Built-in validator with custom env key
  port: {
    envKey: 'SERVER_PORT', // Read from SERVER_PORT instead of port
    validator: portValidator,
    defaultValue: devDefault(3000),
    description: 'Server port number',
    example: '8080'
  },

  // Valibot validation
  API_KEY: {
    validator: vValidator(v.string([v.minLength(10)])),
    description: 'API authentication key'
  },

  // Zod validation with local development default
  DATABASE_URL: {
    validator: zValidator(z.string().url()),
    defaultValue: devDefault('postgres://localhost:5432/myapp')
  },

  // Boolean with middleware for type conversion
  DEBUG: {
    validator: zValidator(z.boolean()),
    middlewares: [booleanMiddleware], // Converts 'true', 'yes', '1', etc.
    defaultValue: false
  },

  // URL validation with built-in validator
  API_URL: {
    validator: urlValidator,
    description: 'External API endpoint',
    example: 'https://api.example.com/v1'
  },

  // Static value
  staticValue: 'static-value'
});

// env is now fully typed with all validated values
console.log(env.PORT); // number
console.log(env.API_URL); // string
console.log(env.DEBUG); // boolean
```
