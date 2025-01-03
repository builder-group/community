export async function bench(
	name: string,
	fn: () => Promise<void>,
	runs: number = 1000,
	logEachTime: boolean = false
): Promise<{
	name: string;
	averageTimeMs: number;
	medianTimeMs: number;
	totalTimeMs: number;
	minTimeMs: number;
	maxTimeMs: number;
	runs: number;
	success: boolean;
}> {
	const times: number[] = [];
	const start = performance.now();

	for (let i = 0; i < runs; i++) {
		const runStart = performance.now();
		try {
			await fn();
		} catch (e) {
			break;
		}
		const runTime = performance.now() - runStart;
		times.push(runTime);

		if (logEachTime) {
			console.log(`[${name}] Run ${i + 1}: ${runTime.toFixed(4)} ms`);
		}
	}

	const totalTimeMs = performance.now() - start;
	const averageTimeMs = totalTimeMs / runs;
	const medianTimeMs = calculateMedian(times);
	const maxTimeMs = Math.max(...times);
	const minTimeMs = Math.min(...times);

	return {
		name,
		averageTimeMs,
		medianTimeMs,
		totalTimeMs,
		runs,
		minTimeMs,
		maxTimeMs,
		success: times.length > 0
	};
}

function calculateMedian(numbers: number[]): number {
	const sorted = numbers.slice().sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);

	if (sorted.length % 2 === 0) {
		return (sorted[middle - 1] + sorted[middle]) / 2;
	} else {
		return sorted[middle];
	}
}
