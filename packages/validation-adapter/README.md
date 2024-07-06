<h1 align="center">
    <img src="https://raw.githubusercontent.com/inbeta-group/monorepo/develop/packages/validation-adapter/.github/banner.svg" alt="validation-adapter banner">
</h1>

<p align="left">
    <a href="https://github.com/inbeta-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/inbeta-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=F0E81A" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/validation-adapter">
        <img src="https://img.shields.io/bundlephobia/minzip/validation-adapter.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=F0E81A" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/validation-adapter">
        <img src="https://img.shields.io/npm/dt/validation-adapter.svg?label=downloads&style=flat&colorA=293140&colorB=F0E81A" alt="NPM total downloads"/>
    </a>
    <a href="https://dyn.art/s/discord/?source=inbeta-group-readme">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=F0E81A" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`validation-adapter` is a universal validation adapter that integrates different validators like Zod, Valibot, Yup, and more.

- **Universal Integration**: Combine multiple validation libraries seamlessly
- **Flexible**: Easily append and extend validation rules
- **Typesafe**: Build with TypeScript for strong type safety

### Motivation

Provide a universal validation adapter that generalizes different validation libraries like Zod, Valibot, etc. for use in libraries & applications requiring diverse validation strategies like [`feature-form`](https://github.com/inbeta-group/monorepo/tree/develop/packages/feature-form).

## 📖 Usage

```ts
import { zodAdapter } from 'validation-adapters/zod';
import { valibotAdapter } from 'validation-adapters/valibot';
import { createValidationAdapter } from 'validation-adapter';
import * as z from 'zod';
import * as v from 'valibot';

const zodNameValidator = zodAdapter(
    z.string().min(2).max(10).regex(/^([^0-9]*)$/)
);

const valibotNameValidator = valibotAdapter(
    v.pipe(v.string(), v.minLength(2), v.maxLength(10), v.regex(/^([^0-9]*)$/))
);

const customValidator = createValidationAdapter([
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