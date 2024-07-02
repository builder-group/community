<h1 align="center">
    <img src="https://raw.githubusercontent.com/inbeta-group/monorepo/develop/packages/feature-form/.github/banner.svg" alt="feature-form banner">
</h1>

<p align="left">
    <a href="https://github.com/inbeta-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/inbeta-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=F0E81A" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-form">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-form.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=F0E81A" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-form">
        <img src="https://img.shields.io/npm/dt/feature-form.svg?label=downloads&style=flat&colorA=293140&colorB=F0E81A" alt="NPM total downloads"/>
    </a>
    <a href="https://dyn.art/s/discord/?source=inbeta-group-readme">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=F0E81A" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`feature-form` is a straightforward, typesafe, and feature-based form library.

- **Lightweight & Tree Shakable**: Function-based and modular design
- **Fast**: Optimized for speed and efficiency, ensuring smooth user experience
- **Modular & Extendable**: Easily extendable with features
- **Typesafe**: Build with TypeScript for strong type safety
- **Standalone**: Zero external dependencies, ensuring ease of use in various environments

### 🏖️ Code Sandbox
- [ReactJs Basic](https://codesandbox.io/p/sandbox/basic-c4gd3t)

### Motivation

Provide a typesafe, straightforward, and lightweight form library designed to be modular and extendable with features.

### Alternatives
- [react-hook-form](https://github.com/react-hook-form/react-hook-form)

## 📖 Usage

```tsx
import { createForm, zodValidator } from 'feature-form';
import { useForm } from 'feature-react/form';
import * as z from 'zod';

const $form = createForm({
    fields: {
        firstName: {
            validator: zodValidator(z.string().min(2).max(10)),
            defaultValue: ''
        }
    },
    onValidSubmit: (data) => console.log('ValidSubmit', data),
    onInvalidSubmit: (errors) => console.log('InvalidSubmit', errors)
});

export const Component: React.FC = () => {
    const { handleSubmit, register, status } = useForm($form);

    return (
        <form onSubmit={handleSubmit()}>
            <input {...register('firstName')} />
            <ErrorMessage status={status('firstName')} />
            <button type="submit">Submit</button>
        </form>
    );
}
```

### Validators

Supports various validators such as [Zod](https://github.com/colinhacks/zod), [Yup](https://github.com/jquense/yup), [Valibot](https://github.com/fabian-hiller/valibot) and more.

```ts
import { zodValidator, valibotValidator } from 'feature-form';
import * as z from 'zod';
import * as v from 'valibot';

const zodNameValidator = zodValidator(
    z.string().min(2).max(10).regex(/^([^0-9]*)$/)
);

const valibotNameValidator = valibotValidator(
    v.pipe(v.string(), v.minLength(2), v.maxLength(10), v.regex(/^([^0-9]*)$/))
);
```