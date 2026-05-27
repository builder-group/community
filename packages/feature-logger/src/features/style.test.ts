import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { styleFeature } from './style';

describe('styleFeature function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log', 'info'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	describe('formatting', () => {
		it('should apply default console styles to string messages', () => {
			// Prepare
			const logger = createLogger().with(styleFeature());

			// Act
			logger.log('log message');
			logger.info('info message');

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith('%clog message', 'color: #333');
			expect(consoleSpies.info).toHaveBeenCalledWith('%cinfo message', 'color: #0066cc');
		});

		it('should prefer custom styles over default styles', () => {
			// Prepare
			const logger = createLogger().with(styleFeature({ log: 'color: red' }));

			// Act
			logger.log('log message');

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith('%clog message', 'color: red');
		});

		it('should ignore non-string messages', () => {
			// Prepare
			const logger = createLogger().with(styleFeature());
			const data = { count: 1 };

			// Act
			logger.log(data);

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith(data);
		});
	});
});
