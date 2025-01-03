<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/validatenv/.github/banner.svg" alt="validatenv banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
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
import {
	devDefault,
	numberMiddleware,
	portValidator,
	validateEnv,
	validateEnvVar
} from 'validatenv';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';
// Load environment variables
import 'dotenv/config';

// Validate multiple environment variables
const env = validateEnv(process.env, {
	// Built-in validator
	port: {
		envKey: 'SERVER_PORT', // Read from SERVER_PORT instead of port
		validator: portValidator,
		defaultValue: devDefault(3000) // Uses default only in development environment
	},

	// Zod validator with middleware
	MAX_CONNECTIONS: {
		validator: zValidator(z.number().min(1).max(100)),
		middlewares: [numberMiddleware], // Converts string input to number
		defaultValue: 10
	},

	// Static value
	NODE_ENV: 'development'
});

// Validate single environment variable
const apiKey = validateEnvVar(
	'API_KEY',
	{
		validator: zValidator(z.string().min(10)),
		description: 'API authentication key', // Shown in validation error messages for better debugging
		example: 'abc123xyz789' // Provides usage example in error messages
	},
	process.env
);

// Type-safe access
console.log(env.port); // number
console.log(env.MAX_CONNECTIONS); // number
console.log(apiKey); // string
```
