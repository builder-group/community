import { TEnvMiddleware } from './types';

export const booleanMiddleware: TEnvMiddleware<boolean> = (input) => {
	if (input === undefined) {
		return undefined;
	}
	switch (input.toLowerCase()) {
		case 'true':
		case 't':
		case 'yes':
		case 'on':
		case '1':
			return true;
		case 'false':
		case 'f':
		case 'no':
		case 'off':
		case '0':
			return false;
		default:
			return undefined;
	}
};

export const numberMiddleware: TEnvMiddleware<number> = (input) => {
	if (input === undefined) {
		return undefined;
	}
	const num = parseFloat(input);
	return Number.isNaN(num) ? undefined : num;
};

export const nonEmptyMiddleware: TEnvMiddleware<string> = (input) => {
	if (input === undefined) {
		return undefined;
	}
	return input.trim() === '' ? undefined : input;
};
