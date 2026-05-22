import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger, ELogLevel } from '../create-logger';
import type { TLogContext } from '../types';
import { logIdFeature, type TLogIdFeature } from './log-id';

describe('logIdFeature function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	describe('types', () => {
		it('should override log methods with id-returning methods', () => {
			// Act
			const logger = createLogger().with(logIdFeature());

			// Assert
			expectTypeOf(logger.log).toEqualTypeOf<(...data: unknown[]) => string>();
			expectTypeOf(logger._baseLogWithId).toEqualTypeOf<
				(data: unknown[], context: TLogContext) => string
			>();
			expectTypeOf(logger._features).toEqualTypeOf<readonly TLogIdFeature['key'][]>();
		});
	});

	describe('_baseLogWithId method', () => {
		it('should prefix a generated id and return it', () => {
			// Prepare
			const logger = createLogger().with(logIdFeature({ generateId: () => 'test-id' }));

			// Act
			const id = logger._baseLogWithId(['log message'], {
				logMethod: 'log',
				level: ELogLevel.LOG
			});

			// Assert
			expect(id).toBe('test-id');
			expect(consoleSpies.log).toHaveBeenCalledWith('[test-id] log message');
		});
	});

	describe('log methods', () => {
		it('should prefix a generated id and return it', () => {
			// Prepare
			const generateId = vi.fn(() => 'test-id');
			const logger = createLogger().with(logIdFeature({ generateId }));

			// Act
			const id = logger.log('log message', 'details');

			// Assert
			expect(id).toBe('test-id');
			expect(generateId).toHaveBeenCalledTimes(1);
			expect(consoleSpies.log).toHaveBeenCalledWith('[test-id] log message', 'details');
		});

		it('should prefix a generated id as a separate argument for non-string messages', () => {
			// Prepare
			const logger = createLogger().with(logIdFeature({ generateId: () => 'test-id' }));
			const error = new Error('test');

			// Act
			const id = logger.error(error, { context: 'test' });

			// Assert
			expect(id).toBe('test-id');
			expect(consoleSpies.error).toHaveBeenCalledWith('[test-id]', error, { context: 'test' });
		});

		it('should support custom id formatting', () => {
			// Prepare
			const logger = createLogger().with(
				logIdFeature({
					generateId: () => 'test-id',
					formatId: (id) => `(ID:${id})`
				})
			);

			// Act
			const id = logger.log('log message');

			// Assert
			expect(id).toBe('test-id');
			expect(consoleSpies.log).toHaveBeenCalledWith('(ID:test-id) log message');
		});
	});
});
