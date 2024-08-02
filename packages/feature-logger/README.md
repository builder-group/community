<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/feature-logger/.github/banner.svg" alt="feature-logger banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-logger">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-logger.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-logger">
        <img src="https://img.shields.io/npm/dt/feature-logger.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`feature-logger` is a straightforward, typesafe, and feature-based logging library.

- **Lightweight & Tree Shakable**: Function-based and modular design (< 1KB minified)
- **Fast**: Minimal code ensures high performance
- **Modular & Extendable**: Easily extendable with features like `withTimestamp()`, `withPrefix()`, ..
- **Typesafe**: Build with TypeScript for strong type safety
- **Standalone**: Zero dependencies, ensuring ease of use in various environments

### 🌟 Motivation

Provide a typesafe, straightforward, and lightweight logging library designed to be modular and extendable with features like `withTimestamp()`, `withPrefix()`, ..

### ⚖️ Alternatives
- [winston](https://github.com/winstonjs/winston)
- [pino](https://github.com/pinojs/pino)

## 📖 Usage

```ts
import { createLogger } from 'feature-logger';

export const logger = createLogger();

logger.trace("I'm a trace message!");
logger.log("I'm a log message!");
logger.info("I'm a info message!");
logger.warn("I'm a warn message!");
logger.error("I'm a error message!");
```

## 📙 Features

### `withPrefix()`

Adds a static prefix to all log messages, allowing for consistent and easily identifiable log entries.

```ts
import { createLogger, withPrefix } from 'feature-logger';

const logger = withPrefix(createLogger(), 'PREFIX');

logger.log('This is a log message.');
// Output: "PREFIX This is a log message."
```

### `withTimestamp()`

Adds a timestamp to all log messages, enabling you to track when each log entry was created.

```ts
import { createLogger, withTimestamp } from 'feature-logger';

const logger = withTimestamp(createLogger());

logger.log('This is a log message.');
// Output: "[MM/DD/YYYY, HH:MM:SS AM/PM] This is a log message."
```

### `withMethodPrefix()`

Adds the log method name as a prefix to all log messages, allowing you to easily identify the log level or method used.

```ts
import { createLogger, withMethodPrefix } from 'feature-logger';

const logger = withMethodPrefix(createLogger());

logger.log('This is a log message.');
// Output: "Log: This is a log message."

logger.error('This is an error message.');
// Output: "Error: This is an error message."
```