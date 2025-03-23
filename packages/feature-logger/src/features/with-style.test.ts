import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockConsole, restoreConsoleMock, type TConsoleSpies } from '../__tests__/mock-console';
import { createLogger } from '../create-logger';
import { withStyle } from './with-style';

describe('withStyle function', () => {
	const consoleSpies: TConsoleSpies = {};

	beforeEach(() => {
		mockConsole(['trace', 'debug', 'log', 'info', 'warn', 'error'], consoleSpies);
	});

	afterEach(() => {
		restoreConsoleMock(consoleSpies);
	});

	it('should add style middleware correctly', () => {
		const logger = createLogger();
		const styledLogger = withStyle(logger);

		expect(styledLogger._features.includes('style')).toBe(true);
		expect(styledLogger.middlewares.length).toBe(1);
	});

	it('should apply default styles to log messages', () => {
		const logger = createLogger();
		const styledLogger = withStyle(logger);

		styledLogger.trace('trace message');
		expect(consoleSpies.trace).toHaveBeenCalledWith('%ctrace message', 'color: #aaa');

		styledLogger.debug('debug message');
		expect(consoleSpies.debug).toHaveBeenCalledWith('%cdebug message', 'color: #888');

		styledLogger.log('log message');
		expect(consoleSpies.log).toHaveBeenCalledWith('%clog message', 'color: #333');

		styledLogger.info('info message');
		expect(consoleSpies.info).toHaveBeenCalledWith('%cinfo message', 'color: #0066cc');

		styledLogger.warn('warn message');
		expect(consoleSpies.warn).toHaveBeenCalledWith('%cwarn message', 'color: #f90');

		styledLogger.error('error message');
		expect(consoleSpies.error).toHaveBeenCalledWith('%cerror message', 'color: #f33');
	});

	it('should apply custom styles when provided', () => {
		const logger = createLogger();
		const customStyles = {
			log: 'color: red',
			info: 'color: blue'
		};
		const styledLogger = withStyle(logger, customStyles);

		styledLogger.log('log message');
		expect(consoleSpies.log).toHaveBeenCalledWith('%clog message', 'color: red');

		styledLogger.info('info message');
		expect(consoleSpies.info).toHaveBeenCalledWith('%cinfo message', 'color: blue');
	});

	it('should handle non-string first arguments', () => {
		const logger = createLogger();
		const styledLogger = withStyle(logger);
		const obj = { test: 'value' };

		styledLogger.log(obj);
		expect(consoleSpies.log).toHaveBeenCalledWith(obj);
	});
});
