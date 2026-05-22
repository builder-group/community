import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from './__tests__/mock-console';
import { createLogger, ELogLevel } from './create-logger';
import { logIdFeature, prefixFeature } from './features';
import type { TLoggerMiddleware } from './types';

describe('createLogger function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['trace', 'debug', 'log', 'info', 'warn', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	describe('types', () => {
		it('should infer installed feature APIs through the feature-core chain', () => {
			// Act
			const logger = createLogger().with(prefixFeature('[App]'), logIdFeature());

			// Assert
			expectTypeOf(logger.log).toEqualTypeOf<(...data: unknown[]) => string>();
			expectTypeOf(logger._features).toEqualTypeOf<readonly ('prefix' | 'log-id')[]>();
		});
	});

	describe('log methods', () => {
		it('should call console methods at the default level', () => {
			// Prepare
			const logger = createLogger();

			// Act
			logger.trace('trace message');
			logger.debug('debug message');
			logger.log('log message');
			logger.info('info message');
			logger.warn('warn message');
			logger.error('error message');

			// Assert
			expect(consoleSpies.trace).toHaveBeenCalledWith('trace message');
			expect(consoleSpies.debug).toHaveBeenCalledWith('debug message');
			expect(consoleSpies.log).toHaveBeenCalledWith('log message');
			expect(consoleSpies.info).toHaveBeenCalledWith('info message');
			expect(consoleSpies.warn).toHaveBeenCalledWith('warn message');
			expect(consoleSpies.error).toHaveBeenCalledWith('error message');
		});

		it('should skip messages below the configured level', () => {
			// Prepare
			const logger = createLogger({ level: ELogLevel.WARN });

			// Act
			logger.info('info message');
			logger.warn('warn message');
			logger.error('error message');

			// Assert
			expect(consoleSpies.info).not.toHaveBeenCalled();
			expect(consoleSpies.warn).toHaveBeenCalledWith('warn message');
			expect(consoleSpies.error).toHaveBeenCalledWith('error message');
		});

		it('should skip all messages when inactive', () => {
			// Prepare
			const logger = createLogger({ active: false });

			// Act
			logger.error('error message');

			// Assert
			expect(consoleSpies.error).not.toHaveBeenCalled();
		});
	});

	describe('_baseLog method', () => {
		it('should compose global and context middlewares from right to left', () => {
			// Prepare
			const calls: string[] = [];
			const globalMiddleware: TLoggerMiddleware = (next) => {
				return (data, context) => {
					calls.push('global');
					next([`global:${data[0]}`], context);
				};
			};
			const contextMiddleware: TLoggerMiddleware = (next) => {
				return (data, context) => {
					calls.push('context');
					next([`context:${data[0]}`], context);
				};
			};
			const invokeConsole = vi.fn();
			const logger = createLogger({ invokeConsole, middlewares: [globalMiddleware] });

			// Act
			logger._baseLog(['message'], {
				logMethod: 'log',
				level: ELogLevel.LOG,
				middlewares: [contextMiddleware]
			});

			// Assert
			expect(calls).toEqual(['global', 'context']);
			expect(invokeConsole).toHaveBeenCalledWith(
				['context:global:message'],
				expect.objectContaining({ logMethod: 'log' })
			);
		});
	});

	describe('invokeConsole option', () => {
		it('should use a custom console invoker when provided', () => {
			// Prepare
			const invokeConsole = vi.fn();
			const logger = createLogger({ invokeConsole });

			// Act
			logger.log('log message');

			// Assert
			expect(invokeConsole).toHaveBeenCalledWith(
				['log message'],
				expect.objectContaining({ logMethod: 'log' })
			);
		});

		it('should forward an empty data array when called without data', () => {
			// Prepare
			const invokeConsole = vi.fn();
			const logger = createLogger({ invokeConsole });

			// Act
			logger.log();

			// Assert
			expect(invokeConsole).toHaveBeenCalledWith([], expect.objectContaining({ logMethod: 'log' }));
		});
	});
});
