/**
 * Extracts the error message and error object from a given error input.
 *
 * @param error - The error to extract data from.
 * @returns An object containing the error (if applicable) and its message.
 */
export function extractErrorData(error: unknown) {
	if (error instanceof Error) {
		return { error, message: error.message };
	}

	if (typeof error === 'string') {
		return { error: null, message: error };
	}

	// For all other cases, return a generic "Unknown error" message
	return { error: null, message: 'Unknown error' };
}
