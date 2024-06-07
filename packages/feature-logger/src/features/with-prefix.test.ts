import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { mockConsole, restoreConsoleMock, TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { withPrefix } from './with-prefix';

describe('withPrefix function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log', 'trace', 'info', 'warn', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	it('should add prefix middleware correctly', () => {
		const logger = createLogger();
		const prefixedLogger = withPrefix(logger, 'PREFIX');

		expect(prefixedLogger._features.includes('prefix')).toBe(true);
		expect(prefixedLogger._config.middlewares.length).toBe(1);
	});

	it('should prepend prefix to log messages', () => {
		const logger = createLogger();
		const prefixedLogger = withPrefix(logger, 'PREFIX');

		prefixedLogger.log('log message');
		expect(consoleSpies.log).toHaveBeenCalledWith('PREFIX', 'log message');

		prefixedLogger.info('info message');
		expect(consoleSpies.info).toHaveBeenCalledWith('PREFIX', 'info message');

		prefixedLogger.warn('warn message');
		expect(consoleSpies.warn).toHaveBeenCalledWith('PREFIX', 'warn message');

		prefixedLogger.error('error message');
		expect(consoleSpies.error).toHaveBeenCalledWith('PREFIX', 'error message');

		prefixedLogger.trace('trace message');
		expect(consoleSpies.trace).toHaveBeenCalledWith('PREFIX', 'trace message');
	});
});
