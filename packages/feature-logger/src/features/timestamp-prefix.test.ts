import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { timestampPrefixFeature } from './timestamp-prefix';

describe('timestampPrefixFeature function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
		vi.restoreAllMocks();
	});

	describe('formatting', () => {
		it('should prepend the current timestamp to string messages', () => {
			// Prepare
			const date = new Date(1628749130000);
			vi.spyOn(Date, 'now').mockReturnValue(date.getTime());
			const logger = createLogger().with(timestampPrefixFeature());

			// Act
			logger.log('log message');

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith(`[${date.toLocaleString()}] log message`);
		});

		it('should prepend the current timestamp as a separate argument for non-string messages', () => {
			// Prepare
			const date = new Date(1628749130000);
			vi.spyOn(Date, 'now').mockReturnValue(date.getTime());
			const logger = createLogger().with(timestampPrefixFeature());
			const data = { count: 1 };

			// Act
			logger.log(data);

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith(`[${date.toLocaleString()}]`, data);
		});

		it('should support custom timestamp formatting', () => {
			// Prepare
			const date = new Date(1628749130000);
			vi.spyOn(Date, 'now').mockReturnValue(date.getTime());
			const logger = createLogger().with(
				timestampPrefixFeature({
					formatTimestamp: (timestamp) => `[${timestamp.toISOString()}]`
				})
			);

			// Act
			logger.log('log message');

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith(`[${date.toISOString()}] log message`);
		});
	});
});
