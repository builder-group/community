export class Logger {
	public readonly config: TLoggerConfig;
	private _isActive: boolean;

	private _loggerCategories = new Map<string, TLoggerCategory>();

	private _callbacks: TLoggerCallbackObject[] = [];

	constructor(config: TLoggerConstructorConfig = {}) {
		const {
			active = true,
			allowCustomStyling = false,
			level = LOG_LEVEL.WARN,
			prefix,
			showTimestamp = false
		} = config;
		this.config = {
			allowCustomStyling,
			level,
			prefix,
			showTimestamp
		};
		this._isActive = active;
		this.createDefaultLoggerCategories();
	}

	// ============================================================================
	// Default Logs
	// ============================================================================

	public log(...data: unknown[]): void {
		this.invokeConsole('log', data);
	}

	public debug(...data: unknown[]): void {
		this.invokeConsole('debug', data);
	}

	public info(...data: unknown[]): void {
		this.invokeConsole('info', data);
	}

	public success(...data: unknown[]): void {
		this.invokeConsole('success', data);
	}

	public warn(...data: unknown[]): void {
		this.invokeConsole('warn', data);
	}

	public error(...data: unknown[]): void {
		this.invokeConsole('error', data);
	}

	public custom(loggerCategoryKey: string, ...data: any[]): void {
		this.invokeConsole(loggerCategoryKey, data);
	}

	// ============================================================================
	// Other
	// ============================================================================

	public createLoggerCategory(category: TCreateLoggerCategory): void {
		const { key, customStyle, level = 0, prefix, logVariant = 'log' } = category;
		this._loggerCategories.set(key, { level, prefix, customStyle, logVariant });
	}

	public registerCallback(callback: TLoggerCallback, config: TRegisterLoggerCallbackConfig): void {
		const { level = 0 } = config;
		this._callbacks.push({ callback, level });
	}

	public setLevel(level: number): void {
		this.config.level = level;
	}

	public setActive(isActive: boolean): void {
		this._isActive = isActive;
	}

	// ============================================================================
	// Helper
	// ============================================================================

	private invokeConsole(categoryKey: string, data: unknown[]): void {
		if (!this._isActive) {
			return;
		}

		const toLogData = data;
		const loggerCategory = this._loggerCategories.get(categoryKey);

		if (loggerCategory == null || loggerCategory.level < this.config.level) {
			return;
		}

		// Concat prefix to first data string
		const prefix = this.buildLogPrefix(loggerCategory);
		if (typeof toLogData[0] === 'string') {
			toLogData[0] = `${prefix}${prefix !== '' ? ' ' : ''}${toLogData[0]}`;
		} else {
			toLogData.unshift(prefix);
		}

		// Call watcher callbacks
		this._callbacks.forEach((callbackProps) => {
			if (callbackProps.level >= loggerCategory.level) {
				callbackProps.callback(toLogData, loggerCategory);
			}
		});

		// Invoke custom styling if provided (Note: Only works with one string element)
		if (
			this.config.allowCustomStyling &&
			loggerCategory.customStyle != null &&
			typeof toLogData[0] === 'string'
		) {
			toLogData[0] = `%c${toLogData[0]}`;
			toLogData.splice(1, 0, loggerCategory.customStyle);
		}

		// Handle log
		// @ts-expect-error
		console[loggerCategory.logVariant](...toLogData);
	}

	private buildLogPrefix(loggerCategory: TLoggerCategory): string {
		let currentPrefix = '';

		// Concat timestamp
		if (this.config.showTimestamp) {
			currentPrefix = `${currentPrefix}[${new Date(Date.now()).toLocaleString()}]`;
		}

		// Concat custom prefix
		if (this.config.prefix != null || loggerCategory.prefix != null) {
			let customPrefix = '';
			if (this.config.prefix != null) {
				customPrefix = `${customPrefix}${this.config.prefix}`;
			}
			if (loggerCategory.prefix != null) {
				customPrefix = `${customPrefix}${this.config.prefix != null ? ' | ' : ''}${
					loggerCategory.prefix
				}`;
			}
			currentPrefix = `${currentPrefix} (${customPrefix})`;
		}

		return currentPrefix.trim();
	}

	private createDefaultLoggerCategories(): void {
		this.createLoggerCategory({
			key: 'debug',
			level: LOG_LEVEL.DEBUG,
			logVariant: typeof console.debug !== 'undefined' ? 'debug' : 'log',
			prefix: 'Debug'
		});
		this.createLoggerCategory({
			key: 'log',
			level: LOG_LEVEL.INFO,
			logVariant: 'log'
		});
		this.createLoggerCategory({
			key: 'info',
			level: LOG_LEVEL.INFO,
			logVariant: typeof console.info !== 'undefined' ? 'info' : 'log',
			prefix: 'Info'
		});
		this.createLoggerCategory({
			key: 'success',
			level: LOG_LEVEL.SUCCESS,
			logVariant: 'log',
			prefix: 'Success'
		});
		this.createLoggerCategory({
			key: 'warn',
			level: LOG_LEVEL.WARN,
			logVariant: typeof console.warn !== 'undefined' ? 'warn' : 'log',
			prefix: 'Warn'
		});
		this.createLoggerCategory({
			key: 'error',
			level: LOG_LEVEL.ERROR,
			logVariant: typeof console.error !== 'undefined' ? 'error' : 'log',
			prefix: 'Error'
		});
	}
}

type TLoggerConstructorConfig = {
	active?: boolean;
} & Partial<TLoggerConfig>;

interface TLoggerConfig {
	prefix?: string;
	allowCustomStyling: boolean;
	level: LOG_LEVEL | number;
	showTimestamp: boolean;
}

type TCreateLoggerCategory = { key: string } & Partial<TLoggerCategory>;

interface TLoggerCategory {
	customStyle?: string;
	prefix?: string;
	level: LOG_LEVEL | number;
	logVariant: TLogVariants;
}

type TRegisterLoggerCallbackConfig = Omit<Partial<TLoggerCallbackObject>, 'callback'>;

interface TLoggerCallbackObject {
	level: LOG_LEVEL | number;
	callback: TLoggerCallback;
}

type TLoggerCallback = (data: unknown[], loggerCategory: TLoggerCategory) => void;

export enum LOG_LEVEL {
	DEBUG = 2,
	LOG = 5,
	INFO = 10,
	SUCCESS = 15,
	WARN = 20,
	ERROR = 50
}

export type TLogVariants = 'log' | 'warn' | 'error' | 'table' | 'info' | 'debug';
