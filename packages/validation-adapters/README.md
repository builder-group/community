<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/validation-adapters/.github/banner.svg" alt="validation-adapters banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/validation-adapters">
        <img src="https://img.shields.io/bundlephobia/minzip/validation-adapters.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/validation-adapters">
        <img src="https://img.shields.io/npm/dt/validation-adapters.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`validation-adapters` is a collection of pre-made adapters for popular validation libraries like Zod and Valibot, allowing for easy integration with the [`validation-adapter`](https://github.com/builder-group/monorepo/tree/develop/packages/validation-adapter) library.

## 📖 Usage

```ts
import { zValidator } from 'validation-adapters/zod';
import { vValidator } from 'validation-adapters/valibot';
import { createValidator } from 'validation-adapter';
import * as z from 'zod';
import * as v from 'valibot';

const zodNameValidator = zValidator(
    z.string().min(2).max(10).regex(/^([^0-9]*)$/)
);

const valibotNameValidator = vValidator(
    v.pipe(v.string(), v.minLength(2), v.maxLength(10), v.regex(/^([^0-9]*)$/))
);

const customValidator = createValidator([
    {
        key: 'custom',
        validate: (cx) => {
            if (cx.value !== 'CustomValue') {
                cx.registerError({
                    code: 'custom-error',
                    message: 'Value must be CustomValue.'
                });
            }
        }
    }
]);

const combinedValidator = valibotNameValidator.clone().append(customValidator);
```

### Zod Adapter

```ts
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';

const zodNameValidator = zValidator(
    z.string().min(2).max(10).regex(/^([^0-9]*)$/)
);
```

### Valibot Adapter

```ts
import { vValidator } from 'validation-adapters/valibot';
import * as v from 'valibot';

const valibotNameValidator = vValidator(
    v.pipe(v.string(), v.minLength(2), v.maxLength(10), v.regex(/^([^0-9]*)$/))
);
```