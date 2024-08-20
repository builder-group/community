import { type TStringMatch } from './types';

export function matchString(value: string, config: TStringMatch): boolean {
	// Default case for simple string input; uses "EXACT" match strategy
	if (typeof config === 'string') {
		return value === config;
	}

	switch (config.matchStrategy) {
		case 'ANY':
			return true;
		case 'EXACT':
			return value === config.value;
		case 'CONTAINS':
			return value.includes(config.value);
		case 'STARTS_WITH':
			return value.startsWith(config.value);
		case 'ENDS_WITH':
			return value.endsWith(config.value);
	}
}
