import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { withLogMethodPrefix } from './with-log-method-prefix';

describe('withLogMethodPrefix function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['trace', 'debug', 'log', 'info', 'warn', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	it('should add methodPrefix middleware correctly', () => {
		const logger = createLogger();
		const methodPrefixedLogger = withLogMethodPrefix(logger);

		expect(methodPrefixedLogger._features.includes('log-method-prefix')).toBe(true);
		expect(methodPrefixedLogger.middlewares.length).toBe(1);
	});

	it('should prepend method prefix to log messages', () => {
		const logger = createLogger();
		const methodPrefixedLogger = withLogMethodPrefix(logger);

		methodPrefixedLogger.trace('trace message');
		expect(consoleSpies.trace).toHaveBeenCalledWith('Trace: trace message');

		methodPrefixedLogger.debug('debug message');
		expect(consoleSpies.debug).toHaveBeenCalledWith('Debug: debug message');

		methodPrefixedLogger.log('log message');
		expect(consoleSpies.log).toHaveBeenCalledWith('Log: log message');

		methodPrefixedLogger.info('info message');
		expect(consoleSpies.info).toHaveBeenCalledWith('Info: info message');

		methodPrefixedLogger.warn('warn message');
		expect(consoleSpies.warn).toHaveBeenCalledWith('Warn: warn message');

		methodPrefixedLogger.error('error message');
		expect(consoleSpies.error).toHaveBeenCalledWith('Error: error message');
	});
});
