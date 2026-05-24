export function getCauseMessage(cause: unknown): string | undefined {
	if (cause instanceof Error) {
		return cause.message;
	}
	if (typeof cause === 'string') {
		return cause;
	}
	return undefined;
}
