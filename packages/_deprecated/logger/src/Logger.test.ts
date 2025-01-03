import { afterEach, beforeEach, describe, expect, it, vi, type SpyInstance } from 'vitest';
import { LOG_LEVEL, Logger } from './Logger';

describe('Logger class tests', () => {
	const consoleSpyKeys = ['log', 'debug', 'info', 'warn', 'error'] as const;
	const consoleSpies: ConsoleSpies<typeof consoleSpyKeys> = {} as any;

	const setupConsoleSpies = (consoleTypes: typeof consoleSpyKeys): void => {
		consoleTypes.forEach((type) => {
			consoleSpies[type] = vi.spyOn(console, type);
		});
	};

	const restoreConsoleSpies = () => {
		Object.values(consoleSpies).forEach((spy) => {
			spy.mockRestore();
		});
	};

	beforeEach(() => {
		setupConsoleSpies(consoleSpyKeys);
	});

	afterEach(() => {
		restoreConsoleSpies();
	});

	it('should set default values correctly in the constructor', () => {
		// Act
		const logger = new Logger();

		// Assert
		expect(logger.config.allowCustomStyling).toBe(false);
		expect(logger.config.level).toBe(LOG_LEVEL.WARN);
		expect(logger.config.prefix).toBeUndefined();
		expect(logger.config.showTimestamp).toBe(false);
	});

	it('should call default logs correctly', () => {
		// Arrange
		const logger = new Logger({ level: LOG_LEVEL.DEBUG });

		// Act & Assert
		logger.log('test log');
		expect(consoleSpies.log).toHaveBeenCalledWith('test log');

		logger.debug('test debug');
		expect(consoleSpies.debug).toHaveBeenCalledWith('(Debug) test debug');

		logger.info('test info');
		expect(consoleSpies.info).toHaveBeenCalledWith('(Info) test info');

		logger.success('test success');
		expect(consoleSpies.log).toHaveBeenCalledWith('(Success) test success');

		logger.warn('test warn');
		expect(consoleSpies.warn).toHaveBeenCalledWith('(Warn) test warn');

		logger.error('test error');
		expect(consoleSpies.error).toHaveBeenCalledWith('(Error) test error');
	});

	it('should call custom logs correctly', () => {
		// Arrange
		const logger = new Logger({ level: LOG_LEVEL.DEBUG });
		logger.createLoggerCategory({
			key: 'custom',
			level: LOG_LEVEL.DEBUG,
			logVariant: 'log',
			prefix: 'Custom'
		});

		// Act
		logger.custom('custom', 'test custom');

		// Assert
		expect(consoleSpies.log).toHaveBeenCalledWith('(Custom) test custom');
	});

	it('should call the callback correctly', () => {
		// Arrange
		const logger = new Logger({ level: LOG_LEVEL.DEBUG });
		const callback = vi.fn();
		logger.registerCallback(callback, { level: LOG_LEVEL.DEBUG });

		// Act
		logger.debug('test debug');

		// Assert
		expect(callback).toHaveBeenCalledWith(['(Debug) test debug'], {
			customStyle: undefined,
			level: LOG_LEVEL.DEBUG,
			logVariant: 'debug',
			prefix: 'Debug'
		});
	});

	it('should set the level correctly', () => {
		// Arrange
		const logger = new Logger({ level: LOG_LEVEL.DEBUG });

		// Act
		logger.setLevel(LOG_LEVEL.ERROR);
		logger.debug('test debug');

		// Assert
		expect(consoleSpies.debug).not.toHaveBeenCalled();
	});

	it('should set the active state correctly', () => {
		// Arrange
		const logger = new Logger({ level: LOG_LEVEL.DEBUG });

		// Act
		logger.setActive(false);
		logger.debug('test debug');

		// Assert
		expect(consoleSpies.debug).not.toHaveBeenCalled();
	});

	it('should show timestamp correctly', () => {
		// Arrange
		const mockTimestamp = 1628749130000; // Arbitrary timestamp value
		const mockDate = new Date(mockTimestamp).toLocaleString();
		const originalDateNow = Date.now;
		vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

		const logger = new Logger({ level: LOG_LEVEL.DEBUG, showTimestamp: true });

		// Act
		logger.debug('test debug with timestamp');

		// Assert
		expect(console.debug).toHaveBeenCalledWith(`[${mockDate}] (Debug) test debug with timestamp`);

		// Restore the original Date.now function
		Date.now = originalDateNow;
	});
});

type ConsoleSpies<T extends readonly string[]> = {
	[K in T[number]]: SpyInstance;
};
