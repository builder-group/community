export function isValidAlpha(value: unknown): value is number {
	return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 1;
}
