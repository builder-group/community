<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/feature-logger/.github/banner.svg" alt="feature-logger banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
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

A lightweight, typesafe console logger. Start minimal and compose formatting, prefixes, and id tracking with `.with()`.

- Six log methods with level filtering and an on/off switch
- Compose formatting with features: prefixes, timestamps, log-level labels, CSS styles
- Swap the console invoker to capture output in tests without patching `console`
- Zero dependencies, tree-shakable, works in any JS environment

```ts
import { createLogger, logIdFeature, prefixFeature } from 'feature-logger';

const logger = createLogger().with(prefixFeature('[App]'), logIdFeature());

logger.info('Started');
const id = logger.error('Request failed', { status: 500 });
```

## Install

```bash
npm install feature-logger
```

## Usage

Create a logger and write messages. Set a level to suppress lower-priority output:

```ts
import { createLogger, ELogLevel } from 'feature-logger';

const logger = createLogger({ level: ELogLevel.INFO });

logger.debug('hidden'); // below INFO, not emitted
logger.info('server started');
logger.error('request failed', { status: 500 });
```

Add `logMethodPrefixFeature` to label each line with its log level, and `styleFeature` to apply color in browser consoles:

```ts
import { logMethodPrefixFeature, styleFeature } from 'feature-logger';

const logger = createLogger().with(logMethodPrefixFeature(), styleFeature());

logger.error('connection lost'); // "Error: connection lost" in red
logger.warn('retrying'); // "Warn: retrying" in orange
```

Swap the console invoker to capture output in tests without patching `console`:

```ts
const logs: Array<[string, unknown[]]> = [];
const logger = createLogger({
	invokeConsole: (data, context) => {
		logs.push([context.logMethod, data]);
	}
});

logger.warn('something happened');
// logs → [['warn', ['something happened']]]
```

## Logger

### `createLogger(options?)`

```ts
import { createLogger, ELogLevel } from 'feature-logger';

const logger = createLogger({
	active: true,
	level: ELogLevel.INFO
});

logger.debug('hidden');
logger.info('visible');
```

| Option          | Default         | Description                                      |
| --------------- | --------------- | ------------------------------------------------ |
| `active`        | `true`          | When false, all log calls are skipped.           |
| `level`         | `ELogLevel.ALL` | Minimum level that should be emitted.            |
| `middlewares`   | `[]`            | Logger middlewares applied to every log call.    |
| `invokeConsole` | `console.*`     | Custom console invoker, useful for tests or I/O. |

Custom invokers and middlewares receive `(data, context)`. `data` is the array passed to the log method, and `context` contains the `logMethod`, `level`, and optional per-call middlewares.

`ELogLevel` uses ordered threshold values: `ALL = 0`, `TRACE = 100`, `DEBUG = 200`, `LOG = 300`, `INFO = 400`, `WARN = 500`, and `ERROR = 600`.

### Log Methods

Logger methods accept the same data arguments as the matching `console.*` method.

```ts
logger.trace('trace');
logger.debug('debug');
logger.log('log');
logger.info('info');
logger.warn('warn');
logger.error('error');
```

## Built-in Features

Features are installed via `.with()` and can add formatting, override methods, or add extra methods.

### `prefixFeature(prefix, options?)`

Adds a static prefix to each log call.

```ts
const logger = createLogger().with(prefixFeature('[API]'));

logger.log('ready'); // "[API] ready"
```

`newLineBehavior` controls multiline string messages:

| Value      | Description                                            |
| ---------- | ------------------------------------------------------ |
| `'indent'` | Prefixes the first line and indents following lines.   |
| `'prefix'` | Prefixes every line.                                   |
| `'ignore'` | Treats the message as one string and prefixes it once. |

### `timestampPrefixFeature(options?)`

Adds the current local timestamp to each log call.

```ts
const logger = createLogger().with(
	timestampPrefixFeature({
		formatTimestamp: (date) => `[${date.toISOString()}]`
	})
);

logger.info('ready');
```

| Option            | Default                   | Description                                    |
| ----------------- | ------------------------- | ---------------------------------------------- |
| `formatTimestamp` | `[date.toLocaleString()]` | Formats the timestamp prefix for each log call. |

### `logMethodPrefixFeature(options?)`

Adds the console method name to each log call.

```ts
const logger = createLogger().with(
	logMethodPrefixFeature({
		formatLogMethod: (method) => `[${method.toUpperCase()}]`
	})
);

logger.error('failed'); // "[ERROR] failed"
```

| Option            | Default      | Description                                  |
| ----------------- | ------------ | -------------------------------------------- |
| `formatLogMethod` | `LogMethod:` | Formats the log method prefix for each call. |

### `styleFeature(styles?)`

Applies browser console CSS styles to string messages. Custom styles override the defaults by log method.

```ts
const logger = createLogger().with(
	styleFeature({
		info: 'color: dodgerblue; font-weight: bold'
	})
);

logger.info('styled');
```

### `logIdFeature(options?)`

Prefixes every log call with a generated id and makes each log method return it.

```ts
const logger = createLogger().with(logIdFeature());

const id = logger.log('created');
```

The existing `trace`, `debug`, `log`, `info`, `warn`, and `error` methods keep their console-like arguments, but return the generated id.

| Option       | Default        | Description                                   |
| ------------ | -------------- | --------------------------------------------- |
| `generateId` | 16-char hex id | Creates the id returned by each log call.     |
| `formatId`   | `[id]`         | Formats the id before it is prefixed.         |

## Extending with features

Loggers are `feature-core` feature hosts. A custom feature can add middleware, add methods, or both.

```ts
import { defineFeature, type TFeature } from 'feature-core';
import type { TLoggerBase } from 'feature-logger';

export function labelFeature(label: string): TLabelFeature {
	return defineFeature<TLabelFeature>({
		key: 'label',
		install(logger: TLoggerBase) {
			logger.middlewares.push((next) => {
				return (data, context) => {
					if (typeof data[0] === 'string') {
						next([`${label}: ${data[0]}`, ...data.slice(1)], context);
						return;
					}

					next([label, ...data], context);
				};
			});

			return {};
		}
	});
}

export type TLabelFeature = TFeature<'label', object>;
```

## Alternatives

- [winston](https://github.com/winstonjs/winston)
- [pino](https://github.com/pinojs/pino)

## FAQ

### What is the difference between `invokeConsole` and middlewares?

`invokeConsole` is the final step that writes to the console. It receives the fully processed data after all middlewares have run. Middlewares transform data before it reaches `invokeConsole`. Use middlewares to modify or annotate log output; use `invokeConsole` to redirect it entirely.

### When should I use `active: false` instead of setting a high `level`?

Use `active: false` to silence everything without changing the level threshold. This is useful for toggling a logger on and off at runtime while preserving the configured level for when it is re-enabled.

### Can I use this in Node.js?

Yes. The logger calls `console.*` methods directly and works in any environment that provides a standard `console` object. `styleFeature` uses `%c` CSS directives, which Node ignores silently, so it is safe to install in shared code.

### Can I compose multiple features?

Yes. Call `.with()` once with multiple features or chain multiple `.with()` calls. Features are installed in order and each can add middleware, methods, or both.
