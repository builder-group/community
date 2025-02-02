import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { shortId } from '@blgc/utils';
import { LOG_LEVEL } from '../create-logger';
import { TLoggerCategory, TLogIdFeature, type TLogger } from '../types';

export function withLogId<GFeatures extends TFeatureDefinition[]>(
	baseLogger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>,
	options: TWithLogIdOptions = {}
): TLogger<[TLogIdFeature, ...GFeatures]> {
	const { generateId = shortId, formatId = defaultFormatId } = options;

	const logIdFeature: TLogIdFeature['api'] = {
		_baseLogWithId(this: TLogger<[TLogIdFeature]>, category, data) {
			const id = generateId();
			this._baseLog(category, [formatId(id, category), ...data]);
			return id;
		},
		logWithId(this: TLogger<[TLogIdFeature]>, message, ...optionalParams) {
			return this._baseLogWithId({ logMethod: 'log', level: LOG_LEVEL.LOG }, [
				message,
				...optionalParams
			]);
		},
		traceWithId(this: TLogger<[TLogIdFeature]>, message, ...optionalParams) {
			return this._baseLogWithId({ logMethod: 'trace', level: LOG_LEVEL.TRACE }, [
				message,
				...optionalParams
			]);
		},
		infoWithId(this: TLogger<[TLogIdFeature]>, message, ...optionalParams) {
			return this._baseLogWithId({ logMethod: 'info', level: LOG_LEVEL.INFO }, [
				message,
				...optionalParams
			]);
		},
		warnWithId(this: TLogger<[TLogIdFeature]>, message, ...optionalParams) {
			return this._baseLogWithId({ logMethod: 'warn', level: LOG_LEVEL.WARN }, [
				message,
				...optionalParams
			]);
		},
		errorWithId(this: TLogger<[TLogIdFeature]>, message, ...optionalParams) {
			return this._baseLogWithId({ logMethod: 'error', level: LOG_LEVEL.ERROR }, [
				message,
				...optionalParams
			]);
		}
	};

	// Extend the base logger with the logId feature
	const extendedLogger = Object.assign(baseLogger, logIdFeature) as TLogger<[TLogIdFeature]>;
	extendedLogger._features.push('logId');

	return extendedLogger as unknown as TLogger<[TLogIdFeature, ...GFeatures]>;
}

export type TWithLogIdOptions = {
	generateId?: () => string;
	formatId?: (id: string, category: TLoggerCategory) => string;
};

const defaultFormatId = (id: string) => `[${id}]`;
