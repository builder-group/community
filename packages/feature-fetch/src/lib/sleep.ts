export function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
	if (ms <= 0) {
		return Promise.resolve();
	}

	if (signal == null) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	if (signal.aborted) {
		return Promise.reject(getAbortReason(signal));
	}

	// Note: Capture the narrowed signal for callbacks that run after this scope
	const abortSignal = signal;
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			abortSignal.removeEventListener('abort', abort);
			resolve();
		}, ms);

		function abort(): void {
			clearTimeout(timeout);
			reject(getAbortReason(abortSignal));
		}

		abortSignal.addEventListener('abort', abort, { once: true });
	});
}

export function getAbortReason(signal: AbortSignal): unknown {
	return signal.reason ?? new Error('The operation was aborted');
}
