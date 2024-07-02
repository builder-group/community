import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { withMethodPrefix } from './with-method-prefix';
import { withTimestamp } from './with-timestamp';

describe('withMethodPrefix function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log', 'trace', 'info', 'warn', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	it('should add methodPrefix middleware correctly', () => {
		const logger = createLogger();
		const methodPrefixedLogger = withMethodPrefix(logger);

		expect(methodPrefixedLogger._features.includes('methodPrefix')).toBe(true);
		expect(methodPrefixedLogger._config.middlewares.length).toBe(1);
	});

	it('should prepend method prefix to log messages', () => {
		const logger = createLogger();
		const methodPrefixedLogger = withMethodPrefix(logger);

		methodPrefixedLogger.log('log message');
		expect(consoleSpies.log).toHaveBeenCalledWith('Log:', 'log message');

		methodPrefixedLogger.info('info message');
		expect(consoleSpies.info).toHaveBeenCalledWith('Info:', 'info message');

		methodPrefixedLogger.warn('warn message');
		expect(consoleSpies.warn).toHaveBeenCalledWith('Warn:', 'warn message');

		methodPrefixedLogger.error('error message');
		expect(consoleSpies.error).toHaveBeenCalledWith('Error:', 'error message');

		methodPrefixedLogger.trace('trace message');
		expect(consoleSpies.trace).toHaveBeenCalledWith('Trace:', 'trace message');
	});

	it('should prepend method prefix after timestamp if timestamp feature is present', () => {
		const logger = createLogger();
		const timestampedLogger = withTimestamp(logger);
		const methodPrefixedLogger = withMethodPrefix(timestampedLogger);
		const mockDate = new Date(1628749130000); // Arbitrary fixed timestamp value for testing
		vi.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

		methodPrefixedLogger.log('log message');
		expect(consoleSpies.log).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'Log:',
			'log message'
		);

		methodPrefixedLogger.info('info message');
		expect(consoleSpies.info).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'Info:',
			'info message'
		);

		methodPrefixedLogger.warn('warn message');
		expect(consoleSpies.warn).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'Warn:',
			'warn message'
		);

		methodPrefixedLogger.error('error message');
		expect(consoleSpies.error).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'Error:',
			'error message'
		);

		methodPrefixedLogger.trace('trace message');
		expect(consoleSpies.trace).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'Trace:',
			'trace message'
		);
	});
});
