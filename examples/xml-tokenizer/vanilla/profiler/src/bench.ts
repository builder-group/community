export async function bench(
	name: string,
	fn: () => Promise<void>,
	runs: number = 1000,
	logEachTime: boolean = false
): Promise<{ averageTimeMs: number; medianTimeMs: number; totalTimeMs: number; runs: number }> {
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

	if (runs === times.length) {
		console.info(
			`[${name}] Total Time: ${totalTimeMs.toFixed(4)} ms | Average Time per Run: ${averageTimeMs.toFixed(4)} ms | Median Time: ${medianTimeMs.toFixed(4)} ms | Runs: ${runs}`
		);
	} else {
		console.error(
			`[${name}] Total Time: ${totalTimeMs.toFixed(4)} ms | Average Time per Run: ${averageTimeMs.toFixed(4)} ms | Median Time: ${medianTimeMs.toFixed(4)} ms | Runs: ${runs} | Failed at: ${times.length}`
		);
	}

	return {
		averageTimeMs,
		medianTimeMs,
		totalTimeMs,
		runs
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
