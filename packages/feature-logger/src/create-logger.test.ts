import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from './__tests__/mock-console';
import { createLogger, LOG_LEVEL } from './create-logger';
import { type TLoggerMiddleware } from './types';

describe('createLogger function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['log', 'trace', 'info', 'warn', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	it('should log messages based on default log levels', () => {
		const logger = createLogger();

		logger.trace('trace message');
		expect(consoleSpies.trace).toHaveBeenCalledWith('trace message');

		logger.log('log message');
		expect(consoleSpies.log).toHaveBeenCalledWith('log message');

		logger.info('info message');
		expect(consoleSpies.info).toHaveBeenCalledWith('info message');

		logger.warn('warn message');
		expect(consoleSpies.warn).toHaveBeenCalledWith('warn message');

		logger.error('error message');
		expect(consoleSpies.error).toHaveBeenCalledWith('error message');
	});

	it('should not log messages below the set log level', () => {
		const logger = createLogger({ level: LOG_LEVEL.WARN });

		logger.trace('trace message');
		expect(consoleSpies.trace).not.toHaveBeenCalled();

		logger.log('log message');
		expect(consoleSpies.log).not.toHaveBeenCalled();

		logger.info('info message');
		expect(consoleSpies.info).not.toHaveBeenCalled();

		logger.warn('warn message');
		expect(consoleSpies.warn).toHaveBeenCalledWith('warn message');

		logger.error('error message');
		expect(consoleSpies.error).toHaveBeenCalledWith('error message');
	});

	it('should respect the active flag', () => {
		const logger = createLogger({ active: false });

		logger.trace('trace message');
		expect(consoleSpies.trace).not.toHaveBeenCalled();

		logger.log('log message');
		expect(consoleSpies.log).not.toHaveBeenCalled();

		logger.info('info message');
		expect(consoleSpies.info).not.toHaveBeenCalled();

		logger.warn('warn message');
		expect(consoleSpies.warn).not.toHaveBeenCalled();

		logger.error('error message');
		expect(consoleSpies.error).not.toHaveBeenCalled();
	});

	it('should apply middlewares correctly', () => {
		const middleware: TLoggerMiddleware = vi.fn((next: Function) => next) as any;
		const logger = createLogger({ middlewares: [middleware] });

		logger.log('log message');
		expect(middleware).toHaveBeenCalled();
	});

	it('should invoke custom invokeConsole if provided', () => {
		const customInvokeConsole = vi.fn();
		const logger = createLogger({ invokeConsole: customInvokeConsole });

		logger.log('log message');
		expect(customInvokeConsole).toHaveBeenCalledWith('log', ['log message']);
	});

	it('should call the baseLog method correctly', () => {
		const logger = createLogger({ level: LOG_LEVEL.LOG });
		const baseLogSpy = vi.spyOn(logger, '_baseLog' as any);

		logger.log('log message');
		expect(baseLogSpy).toHaveBeenCalledWith({ logMethod: 'log', level: LOG_LEVEL.LOG }, [
			'log message'
		]);
	});

	it('should handle custom category middlewares correctly', () => {
		const categoryMiddleware: TLoggerMiddleware = vi.fn((next: Function) => next) as any;
		const logger = createLogger();
		(logger as any)._baseLog = vi.fn(logger._baseLog.bind(logger));

		logger._baseLog({ logMethod: 'log', level: LOG_LEVEL.LOG, middlewares: [categoryMiddleware] }, [
			'log message'
		]);

		expect(categoryMiddleware).toHaveBeenCalled();
	});
});
