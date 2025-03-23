import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { withLogId } from './with-log-id';

describe('withLogId function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['trace', 'debug', 'log', 'info', 'warn', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	it('should have correct types', () => {
		const logger = createLogger();
		const loggerWithId = withLogId(logger);
		expect(loggerWithId._features).toContain('log-id');
	});

	it('should return an id when logging with different methods', () => {
		// Prepare
		const mockId = 'test-id-123';
		const mockGenerateId = vi.fn().mockReturnValue(mockId);
		const logger = withLogId(createLogger(), { generateId: mockGenerateId });

		// Act & Assert
		const traceId = logger.traceWithId('trace message');
		expect(traceId).toBe(mockId);
		expect(consoleSpies.trace).toHaveBeenCalledWith(`[${mockId}] trace message`);

		const debugId = logger.debugWithId('debug message');
		expect(debugId).toBe(mockId);
		expect(consoleSpies.debug).toHaveBeenCalledWith(`[${mockId}] debug message`);

		const logId = logger.logWithId('log message');
		expect(logId).toBe(mockId);
		expect(consoleSpies.log).toHaveBeenCalledWith(`[${mockId}] log message`);

		const infoId = logger.infoWithId('info message');
		expect(infoId).toBe(mockId);
		expect(consoleSpies.info).toHaveBeenCalledWith(`[${mockId}] info message`);

		const warnId = logger.warnWithId('warn message');
		expect(warnId).toBe(mockId);
		expect(consoleSpies.warn).toHaveBeenCalledWith(`[${mockId}] warn message`);

		const errorId = logger.errorWithId('error message');
		expect(errorId).toBe(mockId);
		expect(consoleSpies.error).toHaveBeenCalledWith(`[${mockId}] error message`);

		expect(mockGenerateId).toHaveBeenCalledTimes(6);
	});

	it('should include the id and additional parameters in the log message', () => {
		// Prepare
		const mockId = 'test-id-123';
		const logger = withLogId(createLogger(), {
			generateId: () => mockId
		});

		// Act & Assert
		logger.logWithId('Test message', 'additional', 123);
		expect(consoleSpies.log).toHaveBeenCalledWith(`[${mockId}] Test message`, 'additional', 123);

		logger.errorWithId(new Error('test'), { context: 'test' });
		expect(consoleSpies.error).toHaveBeenCalledWith(`[${mockId}]`, new Error('test'), {
			context: 'test'
		});
	});

	it('should use shortId as default id generator', () => {
		// Prepare
		const logger = withLogId(createLogger());

		// Act
		const id = logger.logWithId('Test message');

		// Assert
		expect(typeof id).toBe('string');
		expect(id.length).toBeGreaterThan(0);
		expect(consoleSpies.log).toHaveBeenCalledWith(`[${id}] Test message`);
	});

	it('should allow custom id formatting', () => {
		// Prepare
		const mockId = 'test-id-123';
		const logger = withLogId(createLogger(), {
			generateId: () => mockId,
			formatId: (id) => `(ID:${id})`
		});

		// Act
		const id = logger.logWithId('Test message');

		// Assert
		expect(id).toBe(mockId);
		expect(consoleSpies.log).toHaveBeenCalledWith('(ID:test-id-123) Test message');
	});
});
