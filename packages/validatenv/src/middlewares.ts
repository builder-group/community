export function booleanMiddleware(input: string | undefined): boolean | undefined {
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
}

export function numberMiddleware(input: string | undefined): number | undefined {
	if (input === undefined) {
		return undefined;
	}
	const num = parseFloat(input);
	return Number.isNaN(num) ? undefined : num;
}

export function nonEmptyStringMiddleware(input: string | undefined): string | undefined {
	if (input === undefined) {
		return undefined;
	}
	return input.trim() === '' ? undefined : input;
}
