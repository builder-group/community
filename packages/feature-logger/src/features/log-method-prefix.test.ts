import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { logMethodPrefixFeature } from './log-method-prefix';

describe('logMethodPrefixFeature function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	describe('formatting', () => {
		it('should prepend the log method to string messages', () => {
			// Prepare
			const logger = createLogger().with(logMethodPrefixFeature());

			// Act
			logger.log('log message');
			logger.error('error message');

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith('Log: log message');
			expect(consoleSpies.error).toHaveBeenCalledWith('Error: error message');
		});

		it('should prepend the log method as a separate argument for non-string messages', () => {
			// Prepare
			const logger = createLogger().with(logMethodPrefixFeature());
			const data = { count: 1 };

			// Act
			logger.log(data);

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith('Log:', data);
		});

		it('should support custom log method formatting', () => {
			// Prepare
			const logger = createLogger().with(
				logMethodPrefixFeature({
					formatLogMethod: (logMethod) => `[${logMethod.toUpperCase()}]`
				})
			);

			// Act
			logger.error('error message');

			// Assert
			expect(consoleSpies.error).toHaveBeenCalledWith('[ERROR] error message');
		});
	});
});
