import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { prefixFeature } from './prefix';

describe('prefixFeature function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	describe('formatting', () => {
		it('should prepend a prefix to string messages', () => {
			// Prepare
			const logger = createLogger().with(prefixFeature('PREFIX'));

			// Act
			logger.log('log message', 'details');

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith('PREFIX log message', 'details');
		});

		it('should prepend a prefix as a separate argument for non-string messages', () => {
			// Prepare
			const logger = createLogger().with(prefixFeature('PREFIX'));
			const data = { count: 1 };

			// Act
			logger.log(data);

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith('PREFIX', data);
		});

		it('should indent multiline messages by default', () => {
			// Prepare
			const logger = createLogger().with(prefixFeature('[Test]'));

			// Act
			logger.log('first line\nsecond line\nthird line');

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith(
				'[Test] first line\n       second line\n       third line'
			);
		});

		it('should support prefixing every multiline row', () => {
			// Prepare
			const logger = createLogger().with(prefixFeature('[Test]', { newLineBehavior: 'prefix' }));

			// Act
			logger.log('first line\nsecond line');

			// Assert
			expect(consoleSpies.log).toHaveBeenCalledWith('[Test] first line\n[Test] second line');
		});
	});
});
