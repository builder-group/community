import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { withTimestamp } from './with-timestamp';

describe('createLogger function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log', 'trace', 'info', 'warn', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	it('should add timestamp middleware correctly', () => {
		const logger = createLogger();
		const timestampedLogger = withTimestamp(logger);

		expect(timestampedLogger._features.includes('timestamp')).toBe(true);
		expect(timestampedLogger._config.middlewares.length).toBe(1);
	});

	it('should prepend timestamp to log messages', () => {
		const logger = createLogger();
		const timestampedLogger = withTimestamp(logger);
		const mockDate = new Date(1628749130000); // Arbitrary fixed timestamp value for testing
		vi.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

		timestampedLogger.log('log message');
		expect(consoleSpies.log).toHaveBeenCalledWith(`[${mockDate.toLocaleString()}]`, 'log message');

		timestampedLogger.info('info message');
		expect(consoleSpies.info).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'info message'
		);

		timestampedLogger.warn('warn message');
		expect(consoleSpies.warn).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'warn message'
		);

		timestampedLogger.error('error message');
		expect(consoleSpies.error).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'error message'
		);

		timestampedLogger.trace('trace message');
		expect(consoleSpies.trace).toHaveBeenCalledWith(
			`[${mockDate.toLocaleString()}]`,
			'trace message'
		);
	});
});
